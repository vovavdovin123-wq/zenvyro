import { studio } from "../config";
import type { Order } from "../types";
import { runJsonAgent } from "./llm";

export async function draftReply(order: Order) {
  const fallback = [
    `Здравствуйте${order.client.name ? `, ${order.client.name}` : ""}.`,
    `Это ${studio.name}. Посмотрели задачу — формат похож на наш.`,
    `Пришлите цель, срок, бюджет и один-два ориентира. По этому брифу скажем, берём ли в работу.`,
  ].join("\n\n");

  const result = await runJsonAgent<{ text: string }>({
    name: "reply",
    system: `Ты готовишь отклик клиенту по шаблону студии ${studio.name}.
Жёстко: есть контакты и приглашение к брифу. НЕТ цены. НЕТ срока. НЕТ свободного торга.
Тон спокойный, короткий, как у живого продюсера. Без канцелярита и без «давайте обсудим».
JSON: { "text": string }`,
    user: `Клиент: ${order.client.name}\nЗаявка:\n${order.leadText}\nВывод охотника: ${order.hunter?.reason ?? ""}`,
    fallback: { text: fallback },
  });

  return result.text.trim();
}
