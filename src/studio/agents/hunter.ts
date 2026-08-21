import { studio } from "../config";
import type { Order } from "../types";
import { hasPhrase, hasStopPhrase, parseMoney } from "../money";
import { runJsonAgent } from "./llm";

type HunterResult = {
  fit: boolean;
  reason: string;
  budgetGuess: number | null;
  stackGuess: string[];
  stopHits: string[];
};

function budgetField(order: Order): string | undefined {
  const fromBrief = order.brief?.budget?.trim();
  if (fromBrief) return fromBrief;
  const line = order.leadText.split(/\r?\n/).find((item) => /^\s*бюджет(?:\s|:|$)/i.test(item.trim()));
  if (!line) return undefined;
  const colon = line.indexOf(":");
  const raw = colon >= 0 ? line.slice(colon + 1) : line.replace(/^\s*бюджет(?:\s|:|$)/i, "");
  const value = raw.trim();
  return value || undefined;
}

function digitsBudget(order: Order): number | undefined {
  return parseMoney(budgetField(order));
}

function normalizeHunter(raw: unknown, fallback: HunterResult): HunterResult {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;
  const fitRaw = data.fit;
  const fit = fitRaw === true || fitRaw === "true" || fitRaw === 1;
  return {
    fit,
    reason: typeof data.reason === "string" ? data.reason : fallback.reason,
    budgetGuess:
      typeof data.budgetGuess === "number" && Number.isFinite(data.budgetGuess)
        ? data.budgetGuess
        : fallback.budgetGuess,
    stackGuess: Array.isArray(data.stackGuess)
      ? data.stackGuess.filter((item): item is string => typeof item === "string")
      : fallback.stackGuess,
    stopHits: Array.isArray(data.stopHits)
      ? data.stopHits.filter((item): item is string => typeof item === "string")
      : fallback.stopHits,
  };
}

export async function runHunter(order: Order) {
  const lower = order.leadText.toLowerCase();
  const stopHits = studio.stopWords.filter((word) => hasStopPhrase(lower, word));
  const stackGuess = studio.acceptedStacks.filter((item) => hasPhrase(lower, item));
  const budgetGuess = digitsBudget(order);

  const heuristicFit =
    stopHits.length === 0 &&
    (budgetGuess === undefined || budgetGuess >= studio.minBudgetRub) &&
    stackGuess.length > 0;

  const fallback: HunterResult = {
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
  };

  const raw = await runJsonAgent({
    name: "hunter",
    system: `Ты Охотник студии ${studio.name}.
Фильтруй заявки по стеку и стоп-словам. Бюджет — только из поля/строки «Бюджет» в заявке, не из имени, цели и прочих цифр.
Точки и запятые в сумме — разряды тысяч (12.341.234 и 15,000 = тысячи). «к»/«тыс» = тысячи.
Минимальный бюджет: ${studio.minBudgetRub} ₽.
Отклоняй по бюджету только если бюджет указан и он строго меньше ${studio.minBudgetRub} ₽. Если строки «Бюджет» нет — по бюджету не отклоняй.
Подходящий стек: ${studio.acceptedStacks.join(", ")}.
Стоп-слова: ${studio.stopWords.join(", ")}. Слово «бесплатно» после «не» — не стоп-слово.
Если не подходит — fit=false (boolean, не строка). Клиенту в этом случае НЕ пишем.
JSON: { "fit": boolean, "reason": string, "budgetGuess": number | null, "stackGuess": string[], "stopHits": string[] }`,
    user: `Имя: ${order.client.name}\nЗаявка:\n${order.leadText}`,
    fallback,
  });

  const result = normalizeHunter(raw, fallback);
  if (stopHits.length > 0) {
    result.fit = false;
    result.stopHits = stopHits;
    result.reason = `Стоп-слова: ${stopHits.join(", ")}`;
  }
  if (budgetGuess !== undefined && budgetGuess < studio.minBudgetRub) {
    result.fit = false;
    result.budgetGuess = budgetGuess;
    result.reason = `Бюджет ниже ${studio.minBudgetRub} ₽`;
  }
  return result;
}
