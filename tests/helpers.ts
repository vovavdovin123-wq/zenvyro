import { readFileSync } from "node:fs";
import path from "node:path";
import type { Order } from "@/studio/types";

export function readSrc(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), "src", ...parts), "utf8");
}

export function makeOrder(over: Partial<Order> = {}): Order {
  const base: Order = {
    id: "aabbccdd",
    status: "new",
    source: "web",
    createdAt: "2026-08-21T00:00:00.000Z",
    updatedAt: "2026-08-21T00:00:00.000Z",
    client: { name: "Тест", phone: "+7 (999) 123-45-67" },
    leadText: "Тип: Сайт\nЦель: собрать заявки с лендинга для курса в Telegram",
    brief: { goal: "", deadline: "", budget: "", references: "", step: "goal" },
    prepaymentReceived: false,
    development: { currentStageId: 1, reworkCount: 0, runs: [] },
    events: [],
  };
  return {
    ...base,
    ...over,
    client: { ...base.client, ...over.client },
    brief: { ...base.brief, ...over.brief },
    development: { ...base.development, ...over.development },
  };
}

export function loadApplyHelpers(): {
  budgetDigits: (value: string) => string;
  formatBudget: (value: string) => string;
  phoneDigits: (value: string) => string;
  formatPhone: (value: string) => string;
  isMessengerOrEmail: (value: string) => boolean;
  applyPhoneEdit: (
    value: string,
    start?: number,
    end?: number,
    insert?: string,
    del?: string,
  ) => { phone: string; caret: number };
  applyBudgetEdit: (
    value: string,
    start?: number,
    end?: number,
    insert?: string,
    del?: string,
  ) => { budget: string; caret: number };
} {
  const src = readSrc("components", "apply", "ApplyHero.tsx");
  const start = src.indexOf("function budgetDigits");
  const end = src.indexOf("type Draft");
  if (start < 0 || end < 0) {
    throw new Error("ApplyHero helpers not found");
  }
  const chunk = src.slice(start, end).replace(/: string/g, "");
  return new Function(
    `${chunk}; return { budgetDigits, formatBudget, phoneDigits, formatPhone, isMessengerOrEmail, applyPhoneEdit, applyBudgetEdit };`,
  )() as ReturnType<typeof loadApplyHelpers>;
}
