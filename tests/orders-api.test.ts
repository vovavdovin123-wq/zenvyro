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

async function post(body: unknown) {
  return POST(
    new Request("http://zenvyro.example.test/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("/api/orders validation", () => {
  beforeEach(() => {
    createOrder.mockReset();
    createOrder.mockResolvedValue({ id: "aabbccdd", status: "new" });
  });

  it("fails when a 10-letter fake phone is accepted", async () => {
    const res = await post({ ...valid, phone: "aaaaaaaaaa" });
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("fails when junk contact «xxx» is stored as a Telegram username", async () => {
    const res = await post({ ...valid, contact: "xxx" });
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("fails when a two-space name passes min(2) without trim", async () => {
    const res = await post({ ...valid, name: "  " });
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("fails when budget and deadline can be omitted while the form requires both", async () => {
    const res = await post({
      name: valid.name,
      contact: valid.contact,
      phone: valid.phone,
      leadText: valid.leadText,
    });
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("fails when a 100k-character lead is accepted (no max length)", async () => {
    const res = await post({ ...valid, leadText: "сайт ".repeat(20_000) });
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("fails when an email with quote breakout is accepted as a contact", async () => {
    const res = await post({ ...valid, contact: `a@b.c"onclick="x` });
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("rejects a phone made of repeated digits", async () => {
    const res = await post({ ...valid, phone: "0000000000" });
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("rejects a submit without personal-data consent", async () => {
    const res = await post({ ...valid, consent: false });
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });
});
