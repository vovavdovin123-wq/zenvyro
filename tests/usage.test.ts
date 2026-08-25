import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listUsage, recordUsage, summarizeUsage } from "@/studio/usage";
import { readSrc } from "./helpers";

describe("agent token usage", () => {
  it("sums llm and fallback calls separately", () => {
    const summary = summarizeUsage([
      {
        at: "2026-08-25T00:00:00.000Z",
        agent: "hunter",
        model: "gpt-4o-mini",
        promptTokens: 100,
        completionTokens: 20,
        totalTokens: 120,
        mode: "llm",
      },
      {
        at: "2026-08-25T00:00:01.000Z",
        agent: "spec",
        model: "gpt-4o-mini",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        mode: "fallback",
      },
    ]);
    expect(summary.calls).toBe(2);
    expect(summary.llmCalls).toBe(1);
    expect(summary.fallbackCalls).toBe(1);
    expect(summary.totalTokens).toBe(120);
    expect(summary.byAgent.hunter).toEqual({ calls: 1, llmCalls: 1, totalTokens: 120 });
    expect(summary.byAgent.spec).toEqual({ calls: 1, llmCalls: 0, totalTokens: 0 });
  });

  it("writes usage events into data/usage.json", async () => {
    const prev = process.cwd();
    const dir = mkdtempSync(path.join(os.tmpdir(), "zn-usage-"));
    try {
      process.chdir(dir);
      await recordUsage({
        agent: "qa",
        model: "gpt-4o-mini",
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
        mode: "llm",
      });
      const summary = await listUsage();
      expect(summary.totalTokens).toBe(15);
      expect(summary.byAgent.qa?.calls).toBe(1);
    } finally {
      process.chdir(prev);
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("demo spec landing", () => {
  it("ships three lots and an order form", () => {
    const src = readSrc("components", "demo", "RoasterView.tsx");
    expect(src).toContain("Эфиопия Гуджи");
    expect(src).toContain("Кения Ньери");
    expect(src).toContain("Бразилия Серрадо");
    expect(src).toContain("onSubmit");
    expect(src).toContain("Заявка принята");
  });

  it("keeps the demo out of the public chrome", () => {
    const chrome = readSrc("components", "layout", "SiteChrome.tsx");
    expect(chrome).toContain('path.startsWith("/demo")');
  });
});
