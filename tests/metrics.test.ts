import { describe, expect, it } from "vitest";
import { orderPrice, summarizeOrders } from "@/studio/metrics";
import { makeOrder } from "./helpers";

describe("metrics budget parser", () => {
  it("rejects valid comma budget 15,000 when averaging order price", () => {
    const order = makeOrder({
      leadText: "Тип: Сайт\nБюджет: 15,000 ₽",
    });
    expect(orderPrice(order)).toBe(15_000);
  });

  it("fails when a hunter guess of 15 from a comma budget poisons avgPrice", () => {
    const orders = [
      makeOrder({
        hunter: { fit: true, reason: "ok", budgetGuess: 15, stackGuess: ["сайт"], stopHits: [] },
        leadText: "Бюджет: 15,000 ₽",
      }),
    ];
    expect(summarizeOrders(orders).avgPrice).toBe(15_000);
  });

  it("does not treat a 12-digit name/phone blob as a studio price", () => {
    const order = makeOrder({
      client: { name: "123412341234" },
      leadText: "Тип: Сайт\nЦель: лендинг\nБюджет: 123412341234",
    });
    expect(orderPrice(order)).toBeUndefined();
    expect(summarizeOrders([order]).sumPrice).toBe(0);
  });
});
