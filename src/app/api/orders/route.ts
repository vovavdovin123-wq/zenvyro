import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/studio/orders";
import { studio } from "@/studio/config";
import { parseMoney } from "@/studio/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  contact: z.string().trim().min(3).max(120),
  phone: z
    .string()
    .trim()
    .min(10)
    .max(24)
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) return false;
      if (/^(\d)\1+$/.test(digits)) return false;
      return true;
    }, "phone"),
  leadText: z.string().trim().min(20).max(8000),
  budget: z.string().trim().min(1).max(40),
  deadline: z.string().trim().min(1).max(80),
  consent: z.literal(true),
});

function parseContact(contact: string) {
  const value = contact.trim();
  const isEmail = /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+$/.test(value) && !value.startsWith("@");
  if (isEmail) return { email: value };
  const telegramUsername = value
    .replace(/^@/, "")
    .replace(/^(https?:\/\/)?(t\.me|telegram\.me)\//i, "")
    .replace(/\/.*$/, "");
  if (!/^[A-Za-z0-9_]{5,32}$/.test(telegramUsername)) return null;
  return { telegramUsername };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Заполните все шаги: задача, цель, срок, бюджет, имя, связь и телефон." },
      { status: 400 },
    );
  }

  const money = parseMoney(parsed.data.budget);
  if (money === undefined || money < studio.minBudgetRub) {
    return NextResponse.json({ error: `Бюджет от ${studio.minBudgetRub.toLocaleString("ru-RU")} ₽` }, { status: 400 });
  }

  const contact = parseContact(parsed.data.contact);
  if (!contact) {
    return NextResponse.json({ error: "Укажите Telegram или email." }, { status: 400 });
  }

  const lead = [
    parsed.data.leadText,
    `Бюджет: ${parsed.data.budget}`,
    `Срок: ${parsed.data.deadline}`,
  ].join("\n");

  try {
    const order = await createOrder({
      source: "web",
      leadText: lead,
      client: {
        name: parsed.data.name,
        phone: parsed.data.phone.trim(),
        ...contact,
      },
    });

    return NextResponse.json({
      id: order.id,
      status: order.status,
    });
  } catch (error) {
    console.error("[zenvyro] orders POST", error);
    return NextResponse.json({ error: "Не отправилось. Попробуйте ещё раз через минуту." }, { status: 500 });
  }
}
