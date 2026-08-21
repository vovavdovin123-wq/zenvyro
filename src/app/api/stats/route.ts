import { NextResponse } from "next/server";
import { recordStat } from "@/studio/stats";

const publicEvents = new Set(["pageview", "session", "apply_start"]);

function sameOrigin(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === url.host;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === url.host;
    } catch {
      return false;
    }
  }
  const site = request.headers.get("sec-fetch-site");
  return site === "same-origin";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { event?: string } | null;
  const event = body?.event;
  if (!event || !publicEvents.has(event)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const site = request.headers.get("sec-fetch-site");
  if (site !== "same-origin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await recordStat(event as "pageview" | "session" | "apply_start");
  return NextResponse.json({ ok: true });
}
