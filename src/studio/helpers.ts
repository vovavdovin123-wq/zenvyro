import { orderPrice } from "@/studio/metrics";
import { SOURCE_LABEL, STATUS_LABEL, type HumanAction, type Order } from "@/studio/types";

export const PERIODS = [7, 14, 30] as const;
export type Period = (typeof PERIODS)[number];

export type Summary = {
  total: number;
  priced: number;
  avgPrice: number;
  sumPrice: number;
  closed: number;
  closedRevenue: number;
  inWork: number;
  bySource: { web: number; hunt: number; telegram: number };
};

export type Funnel = {
  pageviews: number;
  sessions: number;
  applyStarts: number;
  applySubmits: number;
};

export type AgentUsage = {
  calls: number;
  llmCalls: number;
  fallbackCalls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  byAgent: Record<string, { calls: number; llmCalls: number; totalTokens: number }>;
};

export type Manual = {
  platform: string;
  name: string;
  leadText: string;
  telegram: string;
  email: string;
  phone: string;
  priceRub: string;
  timelineDays: string;
};

export const emptyManual: Manual = {
  platform: "Kwork",
  name: "",
  leadText: "",
  telegram: "",
  email: "",
  phone: "",
  priceRub: "",
  timelineDays: "",
};

export const actions: Array<{ action: HumanAction; label: string; statuses: Order["status"][] }> = [
  { action: "approve_reply", label: "В работу", statuses: ["awaiting_reply_approval"] },
  { action: "skip_reply", label: "Пропуск", statuses: ["awaiting_reply_approval"] },
  { action: "confirm_price", label: "Подтвердить цену", statuses: ["awaiting_price_approval"] },
  { action: "mark_prepayment", label: "Предоплата есть", statuses: ["awaiting_prepayment"] },
  { action: "archive_kp", label: "Архив КП", statuses: ["awaiting_prepayment", "awaiting_price_approval"] },
  { action: "approve_spec", label: "Фиксировать ТЗ", statuses: ["awaiting_spec_approval"] },
  { action: "revise_spec", label: "Правки ТЗ", statuses: ["awaiting_spec_approval"] },
  { action: "accept_stage", label: "Этап принят", statuses: ["awaiting_stage_review"] },
  { action: "reject_stage", label: "Доработка", statuses: ["awaiting_stage_review"] },
  { action: "open_demo", label: "Открыть демо", statuses: ["awaiting_demo"] },
];

export function money(value: number) {
  return value.toLocaleString("ru-RU");
}

export function pct(num: number, den: number) {
  return den ? Math.round((num / den) * 100) : 0;
}

export function shortDate(iso: string) {
  const parts = iso.split("-");
  return `${parts[2]}.${parts[1]}`;
}

export function contact(order: Order) {
  return [
    order.client.telegramUsername ? `@${order.client.telegramUsername.replace(/^@/, "")}` : "",
    order.client.email,
    order.client.phone,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function orderMoney(order: Order) {
  const price = orderPrice(order);
  return price ? money(price) : "";
}

export const CLOSED_ORDER_STATUSES: Order["status"][] = ["rejected", "skipped", "closed", "kp_archived"];

export function orderMatchesQuery(order: Order, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    order.id,
    order.client.name,
    contact(order),
    STATUS_LABEL[order.status],
    SOURCE_LABEL[order.source],
    order.leadText,
    order.hunter?.reason ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return needle.split(/\s+/).every((part) => hay.includes(part));
}

export function orderMatchesFilter(order: Order, filter: "all" | "work" | Order["status"]) {
  if (filter === "all") return true;
  if (filter === "work") return !CLOSED_ORDER_STATUSES.includes(order.status);
  return order.status === filter;
}
