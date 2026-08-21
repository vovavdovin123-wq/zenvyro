import { describe, expect, it, vi } from "vitest";

vi.mock("@/studio/agents/llm", () => ({
  runJsonAgent: async () => ({
    fit: "false",
    reason: "no",
    budgetGuess: null,
    stackGuess: [],
    stopHits: ["бесплатно"],
  }),
}));

import { runHunter } from "@/studio/agents/hunter";
import { makeOrder, readSrc } from "./helpers";

describe("LLM JSON is not a typed contract", () => {
  it("fails when fit:\"false\" (string) is treated as a passing lead", async () => {
    const result = await runHunter(makeOrder({ leadText: "бесплатный лендинг за отзыв" }));
    expect(result.fit).toBe(false);
  });

  it("fails when runJsonAgent trusts JSON.parse as T with no schema", () => {
    const src = readSrc("studio", "agents", "llm.ts");
    expect(src).not.toContain("JSON.parse(text) as T");
  });
});
