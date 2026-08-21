import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

const token = "PLACEHOLDER_TOKEN";

describe("Telegram Bot API proxy path", () => {
  it("rejects .. so the proxy cannot leave /bot<token>/", async () => {
    const { GET } = await import("@/app/api/telegram/tg/[...path]/route");
    const request = new NextRequest(`http://zenvyro.example.test/api/telegram/tg/bot${token}/../file/botEVIL`);
    const response = await GET(request, {
      params: Promise.resolve({ path: [`bot${token}`, "..", "file", "botEVIL"] }),
    } as never);
    expect(response.status).toBe(403);
  });
});
