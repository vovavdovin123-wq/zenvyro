import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { studioAuth } from "@/lib/config";
import { applyHumanAction, listOrders } from "@/lib/orders";
import type { HumanAction } from "@/lib/types";

async function authorized() {
  if (!studioAuth.password) return true;
  const jar = await cookies();
  return jar.get("zenvyro_studio")?.value === studioAuth.password;
}

export async function GET() {
  if (!(await authorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const orders = await listOrders();
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    id?: string;
    action?: HumanAction;
    notes?: string;
    demoUrl?: string;
    password?: string;
  };

  if (body.password !== undefined) {
    if (!studioAuth.password || body.password !== studioAuth.password) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set("zenvyro_studio", body.password, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  }

  if (!body.id || !body.action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  const order = await applyHumanAction(body.id, body.action, {
    notes: body.notes,
    demoUrl: body.demoUrl,
  });
  return NextResponse.json({ order });
}
