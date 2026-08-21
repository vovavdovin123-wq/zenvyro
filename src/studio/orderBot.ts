import { orderBot } from "./config";
import type { Order } from "./types";

function contactParts(order: Order) {
  const email = order.client.email?.trim() || "";
  const telegram = order.client.telegramUsername?.replace(/^@/, "").trim() || "";
  const phone = order.client.phone?.trim() || "";
  return { email, telegram, phone };
}

export async function notifyOrderBot(order: Order): Promise<boolean> {
  if (!orderBot.webhookUrl || !orderBot.webhookSecret) {
    throw new Error("ORDER_BOT_WEBHOOK_URL or ORDER_BOT_WEBHOOK_SECRET is not configured");
  }
  try {
    const host = new URL(orderBot.webhookUrl).hostname;
    if (process.env.VERCEL && (host === "127.0.0.1" || host === "localhost")) {
      return false;
    }
  } catch {
    return false;
  }

  const { email, telegram, phone } = contactParts(order);
  const comment = [
    order.leadText,
    telegram ? `Telegram: @${telegram}` : "",
    phone ? `Телефон: ${phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch(orderBot.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": orderBot.webhookSecret,
      },
      body: JSON.stringify({
        source: "сайт Zenvyro",
        title: "Заявка с сайта",
        customer: {
          name: order.client.name,
          email: email || undefined,
          phone: phone || undefined,
        },
        comment,
        external_id: order.id,
      }),
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) {
      console.error("[zenvyro] order-bot webhook:", response.status, await response.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[zenvyro] order-bot webhook failed:", error);
    return false;
  }
}
