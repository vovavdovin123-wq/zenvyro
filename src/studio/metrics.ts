import type { Order } from "./types";
import { MAX_MONEY_RUB, parseMoney } from "./money";

export function orderPrice(order: Order): number | undefined {
  if (order.status === "rejected" || order.status === "skipped" || order.status === "kp_archived") {
    return undefined;
  }
  if (order.pricing?.priceRub && order.pricing.priceRub > 0 && order.pricing.priceRub <= MAX_MONEY_RUB) {
    return order.pricing.priceRub;
  }
  const fromLead = parseMoney(
    order.brief?.budget ||
      order.leadText
        .split(/\r?\n/)
        .find((line) => /^\s*бюджет(?:\s|:|$)/i.test(line.trim()))
        ?.replace(/^\s*бюджет\s*:?/i, ""),
  );
  if (fromLead) return fromLead;
  if (order.hunter?.fit && order.hunter.budgetGuess && order.hunter.budgetGuess > 0 && order.hunter.budgetGuess <= MAX_MONEY_RUB) {
    return order.hunter.budgetGuess;
  }
  return undefined;
}

export function summarizeOrders(orders: Order[]) {
  const prices = orders
    .map(orderPrice)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const sum = prices.reduce((acc, value) => acc + value, 0);
  const closed = orders.filter((order) => order.status === "closed");
  const closedPrices = closed
    .map(orderPrice)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const bySource = {
    web: orders.filter((order) => order.source === "web").length,
    hunt: orders.filter((order) => order.source === "hunt").length,
    telegram: orders.filter((order) => order.source === "telegram").length,
  };

  return {
    total: orders.length,
    priced: prices.length,
    avgPrice: prices.length ? Math.round(sum / prices.length) : 0,
    sumPrice: sum,
    closed: closed.length,
    closedRevenue: closedPrices.reduce((acc, value) => acc + value, 0),
    bySource,
    inWork: orders.filter(
      (order) => !["rejected", "skipped", "closed", "kp_archived"].includes(order.status),
    ).length,
  };
}
