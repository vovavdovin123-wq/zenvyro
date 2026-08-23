import { beforeEach, describe, expect, it, vi } from "vitest";
import { studioSessionToken } from "@/studio/session";

const cookiesGet = vi.fn();
const listOrders = vi.fn(async () => []);
const listStats = vi.fn(async () => []);
const applyHumanAction = vi.fn();
const createOrder = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookiesGet }),
}));

vi.mock("@/studio/orders", () => ({
  listOrders: (...args: unknown[]) => listOrders(...args),
  applyHumanAction: (...args: unknown[]) => applyHumanAction(...args),
  createOrder: (...args: unknown[]) => createOrder(...args),
}));

vi.mock("@/studio/stats", () => ({
  listStats: (...args: unknown[]) => listStats(...args),
  recordStat: vi.fn(),
}));

import { GET, POST } from "@/app/api/studio/route";

const PASSWORD = "unit-test-studio-password";

describe("/api/studio auth", () => {
  beforeEach(() => {
    cookiesGet.mockReset();
    listOrders.mockReset();
    listStats.mockReset();
    applyHumanAction.mockReset();
    createOrder.mockReset();
    listOrders.mockResolvedValue([]);
    listStats.mockResolvedValue([]);
  });

  it("stores a session token instead of the raw studio password", async () => {
    const res = await POST(
      new Request("http://zenvyro.example.test/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: PASSWORD }),
      }),
    );
    const cookie = res.cookies.get("zenvyro_studio");
    expect(cookie?.value).not.toBe(PASSWORD);
    expect(cookie?.value).toBe(studioSessionToken(PASSWORD));
  });

  it("marks the session cookie Secure outside development", async () => {
    const res = await POST(
      new Request("http://zenvyro.example.test/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: PASSWORD }),
      }),
    );
    const cookie = res.cookies.get("zenvyro_studio");
    expect(cookie?.secure).toBe(true);
  });

  it("keeps cookie path / so /api/studio receives it", async () => {
    const res = await POST(
      new Request("http://zenvyro.example.test/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: PASSWORD }),
      }),
    );
    const cookie = res.cookies.get("zenvyro_studio");
    expect(cookie?.path).toBe("/");
  });

  it("returns 404 when a missing order is acted on", async () => {
    cookiesGet.mockReturnValue({ value: studioSessionToken(PASSWORD) });
    applyHumanAction.mockRejectedValue(new Error("Заявка не найдена"));
    const res = await POST(
      new Request("http://zenvyro.example.test/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "nope0000", action: "skip_reply" }),
      }),
    ).catch((error: unknown) => error);
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(404);
  });

  it("rejects NaN price instead of forwarding it into createOrder", async () => {
    cookiesGet.mockReturnValue({ value: studioSessionToken(PASSWORD) });
    createOrder.mockResolvedValue({ id: "aabbccdd", status: "briefing" });
    const res = await POST(
      new Request("http://zenvyro.example.test/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          create: true,
          leadText: "Нужен лендинг на Next для клиники",
          priceRub: "не число",
        }),
      }),
    );
    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });
});

describe("/api/studio session probe", () => {
  it("returns 200 + needAuth when GET has no session", async () => {
    cookiesGet.mockReturnValue(undefined);
    const res = await GET(new Request("http://zenvyro.example.test/api/studio"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ needAuth: true });
  });
});

describe("/api/studio password oracle", () => {
  it("still answers 401 vs 200 because a login form must reject a wrong password", async () => {
    const wrong = await POST(
      new Request("http://zenvyro.example.test/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "wrong-password-placeholder" }),
      }),
    );
    const right = await POST(
      new Request("http://zenvyro.example.test/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: PASSWORD }),
      }),
    );
    expect(wrong.status).toBe(401);
    expect(right.status).toBe(200);
  });
});
