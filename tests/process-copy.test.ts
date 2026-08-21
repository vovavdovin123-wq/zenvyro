import { describe, expect, it } from "vitest";
import { processSteps } from "@/content/site";
import { readSrc } from "./helpers";

describe("process / home copy", () => {
  it("keeps home step count in sync with processSteps", () => {
    const home = readSrc("components", "home", "HomeBelowHero.tsx");
    expect(home).not.toMatch(/Семь шагов/);
    expect(home).toContain("CountUp value={processSteps.length}");
    expect(processSteps.length).toBeGreaterThanOrEqual(5);
  });

  it("controls LineSidebar tabs on /process", () => {
    const src = readSrc("components", "process", "ProcessJourney.tsx");
    expect(src).toMatch(/active=\{active\}/);
    expect(src).not.toContain("defaultActive={active}");
  });
});
