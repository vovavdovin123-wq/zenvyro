import { describe, expect, it } from "vitest";
import { orderMatchesFilter, orderMatchesQuery } from "@/studio/helpers";
import { makeOrder, readSrc } from "./helpers";

describe("studio orders search", () => {
  it("finds by name, status label, contact and lead words", () => {
    const order = makeOrder({
      id: "cafe12ab34cd56ef",
      client: { name: "Марина", email: "marina@example.test" },
      leadText: "Нужен лендинг для курса",
    });
    expect(orderMatchesQuery(order, "марина")).toBe(true);
    expect(orderMatchesQuery(order, "новая заявка")).toBe(true);
    expect(orderMatchesQuery(order, "marina@example.test")).toBe(true);
    expect(orderMatchesQuery(order, "лендинг")).toBe(true);
    expect(orderMatchesQuery(order, "cafe12")).toBe(true);
    expect(orderMatchesQuery(order, "фриланс")).toBe(false);
  });

  it("keeps closed orders out of the in-work filter", () => {
    const live = makeOrder({ status: "developing" });
    const closed = makeOrder({ status: "closed" });
    expect(orderMatchesFilter(live, "work")).toBe(true);
    expect(orderMatchesFilter(closed, "work")).toBe(false);
    expect(orderMatchesFilter(closed, "closed")).toBe(true);
  });
});

describe("studio shell", () => {
  it("locks the studio viewport and scrolls orders inside the table", () => {
    const css = readSrc("styles", "studio.css");
    expect(css).toContain("height: 100dvh");
    expect(css).toContain(".zn-dash-table-scroll");
    expect(css).toContain("overflow-y: auto");
    expect(css).toContain("background: var(--bg-primary)");
    expect(css).not.toContain("--vision-navy");
    const chrome = readSrc("components", "layout", "SiteChrome.tsx");
    expect(chrome).toContain("h-dvh overflow-hidden");
    const orders = readSrc("studio", "StudioOrders.tsx");
    expect(orders).toContain("Поиск заказов");
    expect(orders).toContain("zn-dash-table-scroll");
    const shell = readSrc("studio", "StudioShell.tsx");
    expect(shell).toContain("HeroBackdrop");
    expect(shell).not.toContain("AnimatePresence");
  });
});
