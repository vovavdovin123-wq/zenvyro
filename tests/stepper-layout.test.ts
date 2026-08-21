import { describe, expect, it } from "vitest";
import { readSrc } from "./helpers";

describe("layout / mobile", () => {
  it("fails when stepper height only grows and never shrinks", () => {
    const src = readSrc("components", "bits", "Stepper.tsx");
    expect(src).not.toContain("Math.max(prev, height)");
  });

  it("fails when the apply card clips overflowing step content", () => {
    const css = readSrc("styles", "apply.css");
    expect(css).not.toMatch(/\.zn-apply-inner\s*\{[^}]*overflow:\s*hidden/);
  });

  it("fails when /process board clips the LineSidebar markers (overflow hidden + 60px ticks)", () => {
    const processCss = readSrc("styles", "process.css");
    const sidebarCss = readSrc("components", "ui", "LineSidebar.css");
    expect(processCss).not.toMatch(/\.zn-how\s*\{[^}]*overflow:\s*hidden/);
    expect(sidebarCss).toMatch(/--marker-length:\s*60px/);
  });
});
