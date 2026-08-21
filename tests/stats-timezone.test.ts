import { describe, expect, it } from "vitest";
import { calendarDate } from "@/studio/stats";
import { readSrc } from "./helpers";

describe("stats calendar", () => {
  it("uses Moscow so 02:00 MSK is still that calendar day", () => {
    const now = new Date("2026-08-21T02:00:00+03:00");
    expect(calendarDate(now)).toBe("2026-08-21");
  });

  it("does not mix local setDate with UTC ISO keys", () => {
    const src = readSrc("studio", "stats.ts");
    expect(src).not.toContain("toISOString().slice(0, 10)");
    expect(src).toMatch(/date-fns|Intl\.DateTimeFormat|Europe\/Moscow/);
  });
});
