import { telegram } from "./config";

const api = () =>
  telegram.token ? `${telegram.apiRoot}/bot${telegram.token}` : "";

export async function sendTelegram(chatId: number, text: string, extra?: Record<string, unknown>) {
  if (!api()) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  const response = await fetch(`${api()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      ...extra,
    }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; description?: string }
    | null;
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.description ?? `Telegram sendMessage ${response.status}`);
  }
  return true;
}

export async function notifyAdmins(text: string, extra?: Record<string, unknown>) {
  if (!telegram.token || telegram.adminChatIds.length === 0) {
    throw new Error("TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_IDS is not configured");
  }
  const results = await Promise.all(
    telegram.adminChatIds.map((chatId) => sendTelegram(chatId, text, extra)),
  );
  return results.every(Boolean);
}

export function isAdmin(id: number) {
  return telegram.adminChatIds.includes(id);
}
