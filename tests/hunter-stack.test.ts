import { describe, expect, it, vi } from "vitest";

vi.mock("@/studio/agents/llm", () => ({
  runJsonAgent: async ({ fallback }: { fallback: unknown }) => fallback,
}));

import { runHunter } from "@/studio/agents/hunter";
import { makeOrder } from "./helpers";

describe("hunter substring stack false positives", () => {
  it("fails when Russian «работа» is classified as Telegram-bot stack", async () => {
    const result = await runHunter(
      makeOrder({
        source: "hunt",
        leadText: "Это про работу, сроки гибкие, оплата есть",
      }),
    );
    expect(result.stackGuess).not.toContain("бот");
    expect(result.fit).toBe(false);
  });

  it("fails when English «required» is classified as UI stack", async () => {
    const result = await runHunter(
      makeOrder({
        source: "hunt",
        leadText: "A brochure site is required in June",
      }),
    );
    expect(result.stackGuess).not.toContain("ui");
  });

  it("fails when «200к» from the bot's own /hunt example is parsed as 200 ₽", async () => {
    const result = await runHunter(
      makeOrder({
        source: "hunt",
        leadText: "бюджет 200к, нужен лендинг на Next под заявки",
      }),
    );
    expect(result.budgetGuess).toBe(200_000);
    expect(result.fit).toBe(true);
  });
});
