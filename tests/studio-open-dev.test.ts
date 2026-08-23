import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("@/studio/orders", () => ({
  listOrders: async () => [],
  applyHumanAction: vi.fn(),
  createOrder: vi.fn(),
}));

vi.mock("@/studio/stats", () => ({
  listStats: async () => [],
  recordStat: vi.fn(),
}));

describe("studio lock when password env is empty", () => {
  it("locks /api/studio without a password even outside production", async () => {
    vi.resetModules();
    process.env.STUDIO_PASSWORD = "";
    process.env.NODE_ENV = "development";
    const { GET } = await import("@/app/api/studio/route");
    const res = await GET(new Request("http://zenvyro.example.test/api/studio"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ needAuth: true });
  });
});
