import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const TELEGRAM_ORIGIN = "https://api.telegram.org";

const ALLOWED_METHODS = new Set([
  "sendMessage",
  "getUpdates",
  "getMe",
  "deleteWebhook",
  "getWebhookInfo",
  "answerCallbackQuery",
  "editMessageText",
  "sendChatAction",
  "forwardMessage",
  "copyMessage",
  "deleteMessage",
  "getChat",
]);

function proxyMethod(path: string[]) {
  if (path.length !== 2) return null;
  if (path[1].includes("..") || path[1].includes("/") || path[1].includes("\\")) return null;
  if (!/^[A-Za-z]{3,40}$/.test(path[1])) return null;
  if (!ALLOWED_METHODS.has(path[1])) return null;
  return path[1];
}

async function proxy(request: NextRequest, path: string[]) {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!token || path.length < 2 || path[0] !== `bot${token}`) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const method = proxyMethod(path);
  if (!method) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const search = request.nextUrl.search;
  const target = `${TELEGRAM_ORIGIN}/bot${token}/${method}${search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const payload = await upstream.arrayBuffer();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("[zenvyro] telegram proxy", error);
    return NextResponse.json({ ok: false, error: "telegram unreachable" }, { status: 502 });
  }
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/telegram/tg/[...path]">) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/telegram/tg/[...path]">) {
  const { path } = await ctx.params;
  return proxy(request, path);
}
