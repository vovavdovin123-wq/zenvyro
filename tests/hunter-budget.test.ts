import { describe, expect, it, vi } from "vitest";

vi.mock("@/studio/agents/llm", () => ({
  runJsonAgent: async ({ fallback }: { fallback: unknown }) => fallback,
}));

import { runHunter } from "@/studio/agents/hunter";
import { studio } from "@/studio/config";
import { makeOrder } from "./helpers";

describe("hunter budget / stack filter", () => {
  it("parses a «Бюджет:» line even when \\\\b would fail on Cyrillic", async () => {
    const result = await runHunter(
      makeOrder({
        leadText: ["Нужен сайт на Next для клиники", "Бюджет: 80.000 ₽"].join("\n"),
      }),
    );
    expect(result.budgetGuess).toBe(80_000);
  });

  it("parses comma-formatted brief budget 15,000 ₽", async () => {
    const result = await runHunter(
      makeOrder({
        brief: { goal: "", deadline: "", budget: "15,000 ₽", references: "", step: "goal" },
        leadText: "Тип: Сайт\nЦель: лендинг на Next для сбора заявок с рекламы",
      }),
    );
    expect(result.budgetGuess).toBe(15_000);
    expect(result.fit).toBe(true);
  });

  it("parses budget written as «150 тыс»", async () => {
    const result = await runHunter(
      makeOrder({
        brief: { goal: "", deadline: "", budget: "150 тыс", references: "", step: "goal" },
        leadText: "Тип: Сайт\nЦель: корпоративный сайт на React, срок два месяца",
      }),
    );
    expect(result.budgetGuess).toBe(150_000);
    expect(result.fit).toBe(true);
  });

  it("does not treat «не бесплатно» as a stop-word", async () => {
    const result = await runHunter(
      makeOrder({
        brief: { goal: "", deadline: "", budget: "80.000 ₽", references: "", step: "goal" },
        leadText: ["Нужен сайт на Next.", "Это не бесплатно — бюджет заложен.", "Бюджет: 80.000 ₽"].join("\n"),
      }),
    );
    expect(result.stopHits).toEqual([]);
    expect(result.fit).toBe(true);
  });

  it("keeps hunter minimum at 5000 so the form cannot accept 1000 ₽", () => {
    expect(studio.minBudgetRub).toBe(5000);
  });
});
