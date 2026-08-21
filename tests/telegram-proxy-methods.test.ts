import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const FAKE = "adversary-test-token";

describe("Telegram proxy method allowlist", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("fails when setWebhook is forwarded (public relay can hijack the bot)", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", FAKE);
    const fetched = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetched);

    const { GET } = await import("@/app/api/telegram/tg/[...path]/route");
    const request = new NextRequest(`http://zenvyro.example.test/api/telegram/tg/bot${FAKE}/setWebhook`);
    const response = await GET(request, {
      params: Promise.resolve({ path: [`bot${FAKE}`, "setWebhook"] }),
    } as never);

    expect(response.status).toBe(403);
    expect(fetched).not.toHaveBeenCalled();
  });
});
