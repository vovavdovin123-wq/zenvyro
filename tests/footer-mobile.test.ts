import { describe, expect, it } from "vitest";
import { readSrc } from "./helpers";

describe("compact footer", () => {
  it("does not dump legal and studio lists into the footer", () => {
    const footer = readSrc("components", "layout", "Footer.tsx");
    expect(footer).toContain('href="/requisites"');
    expect(footer).toContain("Документы и контакты");
    expect(footer).not.toContain("legalDocs.map");
    expect(footer).not.toContain("Пользовательское соглашение");
  });

  it("keeps documents and contacts on the requisites page", () => {
    const page = readSrc("components", "legal", "ContactsView.tsx");
    expect(page).toContain("legalDocs.map");
    expect(page).toContain("legalEntity.email");
  });
});

describe("mobile background keeps animating while scrolling", () => {
  it("does not pause HeroBand rAF on touch scroll", () => {
    const src = readSrc("components", "effects", "HeroBand.tsx");
    expect(src).not.toContain("onCoarseScroll");
    expect(src).not.toContain("scrollPause");
  });
});
