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
    expect(helpers.formatPhone("79991234567")).toBe("+7 (999) 123-45-67");
    expect(helpers.formatPhone("89991234567")).toBe("+7 (999) 123-45-67");
  });

  it("lets you delete a digit from a complete number without injecting another 7", () => {
    expect(helpers.formatPhone("+7 (999) 123-45-6")).toBe("+7 (999) 123-45-6");
    expect(helpers.formatPhone("7999123456")).toBe("+7 (999) 123-45-6");
    expect(helpers.formatPhone("+7")).toBe("+7");
    expect(helpers.formatPhone("+")).toBe("");
  });

  it("deletes the area code even when the caret is outside the parentheses", () => {
    const full = "+7 (999) 123-45-67";
    const afterParen = full.indexOf(")") + 1;
    const removed = helpers.applyPhoneEdit(full, afterParen, afterParen, "", "back");
    expect(removed.phone).toBe("+7 (991) 234-56-7");
    const onlyCode = "+7 (999)";
    const end = onlyCode.length;
    const trimmed = helpers.applyPhoneEdit(onlyCode, end, end, "", "back");
    expect(trimmed.phone).toBe("+7 (99");
  });

  it("deletes a digit after the ruble sign instead of restoring ₽", () => {
    const value = helpers.formatBudget("2312312");
    expect(value).toBe("2.312.312 ₽");
    const next = helpers.applyBudgetEdit(value, value.length, value.length, "", "back");
    expect(next.budget).toBe("231.231 ₽");
  });

  it("keeps the phone placeholder", () => {
    const src = readSrc("components", "apply", "ApplyHero.tsx");
    expect(src).toContain('placeholder="Телефон. Например: +7 (999) 123-45-67"');
    expect(src).toContain("inputType ??");
  });

  it("has a personal-data consent control", () => {
    const src = readSrc("components", "apply", "ApplyHero.tsx");
    expect(src.toLowerCase()).toMatch(/соглас|consent|пдн|политик/);
    expect(src).toContain("aria-pressed");
    expect(src).not.toMatch(/type="checkbox"/);
  });

  it("does not wipe the draft back to step 1 on submit error", () => {
    const src = readSrc("components", "apply", "ApplyHero.tsx");
    expect(src).not.toContain("setStep(1)");
  });

  it("accepts t.me/username without https", () => {
    expect(helpers.isMessengerOrEmail("t.me/zenvyro_lead")).toBe(true);
  });
});
