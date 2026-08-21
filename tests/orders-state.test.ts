import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/studio/types";
import { makeOrder } from "./helpers";

let current: Order | undefined;

vi.mock("@/studio/store", () => ({
  getOrder: async () => current,
  upsertOrder: async (order: Order) => {
    current = order;
    return order;
  },
  listOrders: async () => (current ? [current] : []),
  findOrderByTelegram: async () => undefined,
}));

vi.mock("@/studio/telegram", () => ({
  notifyAdmins: vi.fn(async () => true),
  sendTelegram: vi.fn(async () => true),
  isAdmin: vi.fn(() => false),
}));

vi.mock("@/studio/stats", () => ({
  recordStat: vi.fn(),
  listStats: vi.fn(async () => []),
}));

vi.mock("@/studio/orderBot", () => ({
  notifyOrderBot: vi.fn(async () => false),
}));

import { applyHumanAction, attachClient } from "@/studio/orders";

describe("order state machine", () => {
  beforeEach(() => {
    current = makeOrder({ status: "closed" });
  });

  it("fails when skip_reply archives a closed order", async () => {
    const order = await applyHumanAction("aabbccdd", "skip_reply");
    expect(order?.status).toBe("closed");
  });

  it("fails when archive_kp can fire from status new", async () => {
    current = makeOrder({ status: "new" });
    const order = await applyHumanAction("aabbccdd", "archive_kp");
    expect(order?.status).toBe("new");
  });

  it("crashes if accept_stage is called on a new order without spec", async () => {
    current = makeOrder({ status: "new" });
    await expect(applyHumanAction("aabbccdd", "accept_stage")).resolves.toMatchObject({
      status: "new",
    });
  });

  it("does not run reject_stage from a closed order", async () => {
    current = makeOrder({ status: "closed", prepaymentReceived: true, spec: { version: 1, goal: "", stack: [], scope: [], outOfScope: [], acceptance: [], risks: [], stages: [{ id: 1, title: "x", doneWhen: "y" }], priceRub: 1, timelineDays: 1 } });
    const order = await applyHumanAction("aabbccdd", "reject_stage");
    expect(order?.status).toBe("closed");
  });

  it("does not revise spec from status new", async () => {
    current = makeOrder({ status: "new" });
    const order = await applyHumanAction("aabbccdd", "revise_spec", { notes: "x" });
    expect(order?.status).toBe("new");
  });
});

describe("attachClient IDOR", () => {
  it("does not bind a Telegram user who only knows the order id", async () => {
    current = makeOrder({
      client: { name: "Жертва", email: "victim@example.test" },
    });
    const order = await attachClient("aabbccdd", 999_888_777, "attacker");
    expect(order).toBeUndefined();
    expect(current.client.telegramId).toBeUndefined();
    expect(current.client.telegramUsername).not.toBe("attacker");
  });
});
