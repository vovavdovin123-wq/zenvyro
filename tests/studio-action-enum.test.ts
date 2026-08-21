import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesGet = vi.fn();
const applyHumanAction = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookiesGet }),
}));

vi.mock("@/studio/orders", () => ({
  listOrders: async () => [],
  applyHumanAction: (...args: unknown[]) => applyHumanAction(...args),
  createOrder: vi.fn(),
}));

vi.mock("@/studio/stats", () => ({
  listStats: async () => [],
  recordStat: vi.fn(),
}));

import { studioSessionToken } from "@/studio/session";
import { POST } from "@/app/api/studio/route";

const PASSWORD = "unit-test-studio-password";

describe("/api/studio action enum", () => {
  beforeEach(() => {
    cookiesGet.mockReset();
    applyHumanAction.mockReset();
    cookiesGet.mockReturnValue({ value: studioSessionToken(PASSWORD) });
  });

  it("fails when an unknown HumanAction is accepted", async () => {
    const res = await POST(
      new Request("http://zenvyro.example.test/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "aabbccdd", action: "drop_table" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(applyHumanAction).not.toHaveBeenCalled();
  });
});
