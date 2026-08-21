import { describe, expect, it } from "vitest";
import nextConfig from "../next.config.ts";
import { readSrc } from "./helpers";

describe("routing / persistence / mobile CTA", () => {
  it("keeps /contacts as a requisites shortcut", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    expect(redirects).toContainEqual(
      expect.objectContaining({ source: "/contacts", destination: "/requisites" }),
    );
  });

  it("refuses to treat corrupt order JSON as an empty database", () => {
    const store = readSrc("studio", "store.ts");
    expect(store).toMatch(/ENOENT/);
    expect(store).toMatch(/throw error/);
  });

  it("shows the mobile CardNav CTA", () => {
    const css = readSrc("styles", "card-nav.css");
    expect(css).not.toMatch(/\.card-nav-cta-button\s*\{[^}]*display:\s*none/);
  });

  it("does not claim /price succeeded when confirm_price was a no-op", () => {
    const bot = readSrc("studio", "bot", "index.ts");
    const priceCmd = bot.slice(bot.indexOf('bot.command("price"'), bot.indexOf('bot.command("prepay"'));
    expect(priceCmd).toMatch(/status/);
    expect(priceCmd).toMatch(/не утвердил/);
  });

  it("guards ApplyHero submit against double-click", () => {
    const apply = readSrc("components", "apply", "ApplyHero.tsx");
    expect(apply).toMatch(/if \(status === "loading"\) return/);
  });
});
