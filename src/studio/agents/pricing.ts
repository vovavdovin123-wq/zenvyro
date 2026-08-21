import { studio } from "../config";
import type { Order } from "../types";
import { runJsonAgent } from "./llm";

export async function estimatePrice(order: Order) {
  const fallbackPrice =
    order.hunter?.budgetGuess && order.hunter.budgetGuess >= studio.minBudgetRub
      ? order.hunter.budgetGuess
      : studio.minBudgetRub * 2;

  return runJsonAgent<{ priceRub: number; timelineDays: number; rationale: string }>({
    name: "pricing",
    system: `Ты считаешь цену и срок для студии ${studio.name}.
Цифры клиенту НЕ отправляются — только человеку студии.
Минимум ${studio.minBudgetRub} ₽. Реалистичный срок в рабочих днях.
JSON: { "priceRub": number, "timelineDays": number, "rationale": string }`,
    user: JSON.stringify(
      {
        lead: order.leadText,
        brief: order.brief,
        hunter: order.hunter,
      },
      null,
      2,
    ),
    fallback: {
      priceRub: fallbackPrice,
      timelineDays: 21,
      rationale:
        "Оценка по брифу: лендинг/сайт средней сложности. Финальные цифры подтверждает человек.",
    },
  });
}
