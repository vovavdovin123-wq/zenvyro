import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/orders";

const schema = z.object({
  name: z.string().min(2),
  contact: z.string().min(3),
  leadText: z.string().min(20),
  budget: z.string().optional(),
  deadline: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Заполните имя, контакт и задачу подробнее." }, { status: 400 });
  }

  const email = parsed.data.contact.includes("@") ? parsed.data.contact : undefined;
  const telegramUsername = parsed.data.contact.replace("@", "");
  const lead = [
    parsed.data.leadText,
    parsed.data.budget ? `Бюджет: ${parsed.data.budget}` : "",
    parsed.data.deadline ? `Срок: ${parsed.data.deadline}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const order = await createOrder({
    source: "web",
    leadText: lead,
    client: {
      name: parsed.data.name,
      email,
      telegramUsername: email ? undefined : telegramUsername,
    },
  });

  return NextResponse.json({
    id: order.id,
    status: order.status,
  });
}
