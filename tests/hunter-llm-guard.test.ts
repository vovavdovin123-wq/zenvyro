import { describe, expect, it, vi } from "vitest";

vi.mock("@/studio/agents/llm", () => ({
  runJsonAgent: async () => ({
    fit: true,
    reason: "LLM says yes",
    budgetGuess: 80_000,
    stackGuess: ["сайт"],
    stopHits: [],
  }),
}));

import { runHunter } from "@/studio/agents/hunter";
import { makeOrder } from "./helpers";

describe("hunter does not let LLM override hard filters", () => {
  it("keeps fit false when the lead contains a stop-word even if the model says yes", async () => {
    const result = await runHunter(
      makeOrder({
        brief: { goal: "", deadline: "", budget: "80.000 ₽", references: "", step: "goal" },
        leadText: "Нужен сайт бесплатно за отзыв на Next\nБюджет: 80.000 ₽",
      }),
    );
    expect(result.fit).toBe(false);
    expect(result.stopHits.length).toBeGreaterThan(0);
  });
});
