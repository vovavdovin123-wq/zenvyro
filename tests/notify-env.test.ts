import { describe, expect, it } from "vitest";
import { notifyAdmins } from "@/studio/telegram";
import { notifyOrderBot } from "@/studio/orderBot";
import { makeOrder } from "./helpers";

describe("missing env", () => {
  it("fails when admin Telegram notify silently returns false instead of throwing", async () => {
    await expect(notifyAdmins("ping")).rejects.toThrow();
  });

  it("fails when the order-bot webhook is skipped with empty env instead of surfacing a setup error", async () => {
    await expect(notifyOrderBot(makeOrder())).rejects.toThrow();
  });
});
