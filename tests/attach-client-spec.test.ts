import { describe, expect, it, vi } from "vitest";
import { makeOrder } from "./helpers";

let current = makeOrder({
  client: { name: "Жертва", email: "victim@example.test", phone: "+79990001122" },
});

vi.mock("@/studio/store", () => ({
  getOrder: async () => current,
  upsertOrder: async (order: typeof current) => {
    current = order;
    return order;
  },
  listOrders: async () => [current],
  findOrderByTelegram: async () => undefined,
}));

vi.mock("@/studio/telegram", () => ({
  notifyAdmins: vi.fn(async () => true),
  sendTelegram: vi.fn(async () => true),
  isAdmin: vi.fn(() => false),
}));

vi.mock("@/studio/stats", () => ({ recordStat: vi.fn(), listStats: vi.fn(async () => []) }));
vi.mock("@/studio/orderBot", () => ({ notifyOrderBot: vi.fn(async () => false) }));

import { attachClient } from "@/studio/orders";

describe("attachClient ownership", () => {
  it("fails when /start <id> binds a stranger's Telegram without matching the original contact", async () => {
    const order = await attachClient("aabbccdd", 111, "attacker");
    expect(order?.client.telegramId).toBeUndefined();
    expect(order?.client.telegramUsername).not.toBe("attacker");
  });
});
