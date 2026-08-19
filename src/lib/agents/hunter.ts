import { studio } from "../config";
import type { Order } from "../types";
import { runJsonAgent } from "./llm";

function digitsBudget(text: string): number | undefined {
  const match = text.replace(/\s/g, "").match(/(\d[\d.]{3,})/);
  if (!match) return undefined;
  const value = Number(match[1].replace(/\./g, ""));
  return Number.isFinite(value) ? value : undefined;
}

export async function runHunter(order: Order) {
  const lower = order.leadText.toLowerCase();
  const stopHits = studio.stopWords.filter((word) => lower.includes(word));
  const stackGuess = studio.acceptedStacks.filter((item) => lower.includes(item));
  const budgetGuess = digitsBudget(order.leadText);

  const heuristicFit =
    stopHits.length === 0 &&
    (budgetGuess === undefined || budgetGuess >= studio.minBudgetRub) &&
    (stackGuess.length > 0 || order.leadText.length > 40);

  return runJsonAgent({
    name: "hunter",
    system: `Ты Охотник студии ${studio.name}.
Фильтруй заявки по бюджету, стеку и стоп-словам.
Минимальный бюджет: ${studio.minBudgetRub} ₽.
Подходящий стек: ${studio.acceptedStacks.join(", ")}.
Стоп-слова: ${studio.stopWords.join(", ")}.
Если не подходит — fit=false. Клиенту в этом случае НЕ пишем.
JSON: { "fit": boolean, "reason": string, "budgetGuess": number | null, "stackGuess": string[], "stopHits": string[] }`,
    user: `Имя: ${order.client.name}\nЗаявка:\n${order.leadText}`,
    fallback: {
      fit: heuristicFit,
      reason: !heuristicFit
        ? stopHits.length
          ? `Стоп-слова: ${stopHits.join(", ")}`
          : budgetGuess !== undefined && budgetGuess < studio.minBudgetRub
            ? `Бюджет ниже ${studio.minBudgetRub} ₽`
            : "Слабый сигнал по стеку или бюджету"
        : "Проходит фильтр бюджета и стека. Нужно ваше подтверждение отклика.",
      budgetGuess: budgetGuess ?? null,
      stackGuess,
      stopHits,
    },
  });
}
