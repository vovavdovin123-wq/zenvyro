import { beforeEach, describe, expect, it, vi } from "vitest";

const createOrder = vi.fn();

vi.mock("@/studio/orders", () => ({
  createOrder: (...args: unknown[]) => createOrder(...args),
}));

import { POST } from "@/app/api/orders/route";

const valid = {
  name: "Анна",
  contact: "anna@example.test",
  phone: "+7 (999) 123-45-67",
  leadText: "Тип: Сайт\nЦель: лендинг для сбора заявок на курс в Telegram",
  budget: "80.000 ₽",
  deadline: "1–2 месяца",
  consent: true,
};

describe("/api/orders contact URL coercion", () => {
  beforeEach(() => {
    createOrder.mockReset();
    createOrder.mockResolvedValue({ id: "aabbccdd", status: "new" });
  });

  it("fails when a WhatsApp URL is stored as telegramUsername", async () => {
    const res = await POST(
      new Request("http://zenvyro.example.test/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...valid, contact: "https://wa.me/79991234567" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });
});
