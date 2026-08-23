import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { studioAuth } from "@/studio/config";
import { summarizeOrders } from "@/studio/metrics";
import { applyHumanAction, createOrder, listOrders } from "@/studio/orders";
import { isStudioSession, studioCookie, studioSessionToken } from "@/studio/session";
import { listStats } from "@/studio/stats";
import { isHumanAction, type OrderSource } from "@/studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function passwordOk(value: string) {
  return Boolean(studioAuth.password) && value.trim() === studioAuth.password;
}

async function authorized() {
  if (!studioAuth.password) return false;
  const jar = await cookies();
  return isStudioSession(jar.get(studioCookie.name)?.value);
}

function setSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: studioCookie.name,
    value: studioSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    path: studioCookie.path,
    maxAge: 60 * 60 * 24 * 30,
  });
}

function periodDays(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get("days") ?? 14);
  return raw === 7 || raw === 30 ? raw : 14;
}

export async function GET(request: Request) {
  if (!(await authorized())) {
    return NextResponse.json({ needAuth: true });
  }
  try {
    const [orders, stats] = await Promise.all([listOrders(), listStats(periodDays(request))]);
    return NextResponse.json({
      orders,
      stats,
      summary: summarizeOrders(orders),
      funnel: {
        pageviews: stats.reduce((acc, day) => acc + day.pageviews, 0),
        sessions: stats.reduce((acc, day) => acc + day.sessions, 0),
        applyStarts: stats.reduce((acc, day) => acc + day.applyStarts, 0),
        applySubmits: stats.reduce((acc, day) => acc + day.applySubmits, 0),
      },
    });
  } catch (error) {
    console.error("[zenvyro] studio GET", error);
    return NextResponse.json({ error: "Не удалось загрузить студию" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    id?: string;
    action?: string;
    notes?: string;
    demoUrl?: string;
    password?: string;
    create?: boolean;
    source?: OrderSource;
    name?: string;
    leadText?: string;
    telegram?: string;
    email?: string;
    phone?: string;
    priceRub?: number | string;
    timelineDays?: number | string;
    platform?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  if (body.password !== undefined) {
    if (!passwordOk(body.password)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response);
    return response;
  }

  if (!(await authorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (body.create) {
    const lead = [body.platform ? `Площадка: ${body.platform}` : "", body.leadText?.trim() ?? ""]
      .filter(Boolean)
      .join("\n");
    if (lead.length < 8) {
      return NextResponse.json({ error: "Нужен текст заявки" }, { status: 400 });
    }
    const priceRub =
      body.priceRub === undefined || body.priceRub === null || body.priceRub === ""
        ? undefined
        : Number(body.priceRub);
    if (priceRub !== undefined && (!Number.isFinite(priceRub) || priceRub <= 0)) {
      return NextResponse.json({ error: "Цена должна быть числом" }, { status: 400 });
    }
    const timelineDays =
      body.timelineDays === undefined || body.timelineDays === null || body.timelineDays === ""
        ? undefined
        : Number(body.timelineDays);
    if (timelineDays !== undefined && !Number.isFinite(timelineDays)) {
      return NextResponse.json({ error: "Срок должен быть числом" }, { status: 400 });
    }
    const order = await createOrder({
      source: body.source ?? "hunt",
      leadText: lead,
      skipHunter: true,
      client: {
        name: body.name?.trim() || "Заявка с площадки",
        telegramUsername: body.telegram?.replace(/^@/, "").trim() || undefined,
        email: body.email?.trim() || undefined,
        phone: body.phone?.trim() || undefined,
      },
      pricing: priceRub
        ? {
            priceRub,
            timelineDays: timelineDays ?? 21,
            rationale: "Внесено агентом в студии",
          }
        : undefined,
    });
    return NextResponse.json({ order });
  }

  if (!body.id || !body.action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }
  if (!isHumanAction(body.action)) {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  try {
    const order = await applyHumanAction(body.id, body.action, {
      notes: body.notes,
      demoUrl: body.demoUrl,
    });
    if (!order) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("не найдена")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error("[zenvyro] studio action", error);
    return NextResponse.json({ error: "Не получилось выполнить действие" }, { status: 500 });
  }
}
