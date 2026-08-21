import { describe, expect, it } from "vitest";
import { studio } from "@/studio/config";
import { loadApplyHelpers, readSrc } from "./helpers";

const helpers = loadApplyHelpers();

describe("apply form contracts", () => {
  it("does not let 1000 ₽ proceed below hunter minimum", () => {
    const src = readSrc("components", "apply", "ApplyHero.tsx");
    expect(Number(helpers.budgetDigits("1000"))).toBeLessThan(studio.minBudgetRub);
    expect(src).toMatch(/>= 5000/);
    expect(studio.minBudgetRub).toBe(5000);
  });

  it("keeps Russian 11-digit numbers in +7 as the studio format", () => {
    expect(helpers.formatPhone("12025550123")).toMatch(/^\+7/);
  });

  it("has a personal-data consent control", () => {
    const src = readSrc("components", "apply", "ApplyHero.tsx");
    expect(src.toLowerCase()).toMatch(/соглас|consent|пдн|политик/);
  });

  it("does not wipe the draft back to step 1 on submit error", () => {
    const src = readSrc("components", "apply", "ApplyHero.tsx");
    expect(src).not.toContain("setStep(1)");
  });

  it("accepts t.me/username without https", () => {
    expect(helpers.isMessengerOrEmail("t.me/zenvyro_lead")).toBe(true);
  });
});
