import { telegram } from "./config";

const api = () =>
  telegram.token ? `https://api.telegram.org/bot${telegram.token}` : "";

export async function sendTelegram(chatId: number, text: string, extra?: Record<string, unknown>) {
  if (!api()) return;
  await fetch(`${api()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      ...extra,
    }),
  });
}

export async function notifyAdmins(text: string, extra?: Record<string, unknown>) {
  await Promise.all(telegram.adminChatIds.map((chatId) => sendTelegram(chatId, text, extra)));
}

export function isAdmin(id: number) {
  return telegram.adminChatIds.includes(id);
}
