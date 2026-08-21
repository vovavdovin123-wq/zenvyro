import { beforeEach, describe, expect, it, vi } from "vitest";

const recordStat = vi.fn();

vi.mock("@/studio/stats", () => ({
  recordStat: (...args: unknown[]) => recordStat(...args),
  listStats: vi.fn(),
}));

import { POST } from "@/app/api/stats/route";

describe("/api/stats", () => {
  beforeEach(() => {
    recordStat.mockReset();
    recordStat.mockResolvedValue({ date: "2026-08-21", pageviews: 1, sessions: 0, applyStarts: 0, applySubmits: 0 });
  });

  it("rejects unauthenticated apply_submit so the funnel cannot be inflated", async () => {
    const res = await POST(
      new Request("http://zenvyro.example.test/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "apply_submit" }),
      }),
    );
    expect(res.status).toBe(403);
    expect(recordStat).not.toHaveBeenCalled();
  });

  it("rejects session pings from another origin", async () => {
    const res = await POST(
      new Request("http://zenvyro.example.test/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
        body: JSON.stringify({ event: "session" }),
      }),
    );
    expect(res.status).toBe(403);
    expect(recordStat).not.toHaveBeenCalled();
  });

  it("rejects a spoofed same-host Origin without a browser Sec-Fetch-Site", async () => {
    const res = await POST(
      new Request("http://zenvyro.example.test/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://zenvyro.example.test" },
        body: JSON.stringify({ event: "pageview" }),
      }),
    );
    expect(res.status).toBe(403);
    expect(recordStat).not.toHaveBeenCalled();
  });
});
