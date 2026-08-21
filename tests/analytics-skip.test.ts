import { describe, expect, it } from "vitest";
import { orderPrice, summarizeOrders } from "@/studio/metrics";
import { makeOrder, readSrc } from "./helpers";

describe("funnel / metrics holes not covered elsewhere", () => {
  it("fails when a rejected 200₽ hunter guess still counts as priced revenue", () => {
    const order = makeOrder({
      status: "rejected",
      hunter: { fit: false, reason: "low", budgetGuess: 200, stackGuess: [], stopHits: [] },
      leadText: "Бюджет: 200к, нужен лендинг",
    });
    expect(orderPrice(order)).toBeUndefined();
    expect(summarizeOrders([order]).sumPrice).toBe(0);
    expect(summarizeOrders([order]).priced).toBe(0);
  });

  it("fails when ApplyHero never calls pingApplySubmit", () => {
    const apply = readSrc("components", "apply", "ApplyHero.tsx");
    const analytics = readSrc("components", "layout", "Analytics.tsx");
    expect(analytics).toContain("pingApplySubmit");
    expect(apply).toContain("pingApplySubmit");
  });
});
