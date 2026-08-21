export const STATUSES = [
  "new",
  "rejected",
  "awaiting_reply_approval",
  "skipped",
  "briefing",
  "paused",
  "awaiting_price_approval",
  "awaiting_prepayment",
  "kp_archived",
  "awaiting_spec_approval",
  "developing",
  "awaiting_stage_review",
  "qa",
  "awaiting_demo",
  "closed",
] as const;

export type OrderStatus = (typeof STATUSES)[number];

export type OrderSource = "web" | "telegram" | "hunt";

export const SOURCE_LABEL: Record<OrderSource, string> = {
  web: "с сайта",
  telegram: "из Telegram",
  hunt: "с фриланса",
};

export type Actor = "hunter" | "communicator" | "pricing" | "spec" | "dev" | "qa" | "human" | "client" | "system";

export type HumanAction =
  | "approve_reply"
  | "skip_reply"
  | "confirm_price"
  | "mark_prepayment"
  | "archive_kp"
  | "approve_spec"
  | "revise_spec"
  | "accept_stage"
  | "reject_stage"
  | "open_demo";

export const HUMAN_ACTIONS: HumanAction[] = [
  "approve_reply",
  "skip_reply",
  "confirm_price",
  "mark_prepayment",
  "archive_kp",
  "approve_spec",
  "revise_spec",
  "accept_stage",
  "reject_stage",
  "open_demo",
];

export function isHumanAction(value: unknown): value is HumanAction {
  return typeof value === "string" && (HUMAN_ACTIONS as string[]).includes(value);
}

export interface Brief {
  goal: string;
  deadline: string;
  budget: string;
  references: string;
  step: "goal" | "deadline" | "budget" | "references" | "done";
}

export interface SpecJson {
  version: number;
  goal: string;
  stack: string[];
  scope: string[];
  outOfScope: string[];
  acceptance: string[];
  risks: string[];
  stages: Array<{
    id: number;
    title: string;
    doneWhen: string;
  }>;
  priceRub: number;
  timelineDays: number;
}

export interface StageRun {
  stageId: number;
  title: string;
  report: string;
  prUrl?: string;
  cursorAgentId?: string;
  accepted: boolean;
}

export interface OrderEvent {
  at: string;
  actor: Actor;
  type: string;
  detail: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  source: OrderSource;
  createdAt: string;
  updatedAt: string;
  client: {
    name: string;
    telegramId?: number;
    telegramUsername?: string;
    email?: string;
    phone?: string;
  };
  leadText: string;
  hunter?: {
    fit: boolean;
    reason: string;
    budgetGuess?: number;
    stackGuess: string[];
    stopHits: string[];
  };
  replyDraft?: string;
  brief: Brief;
  pricing?: {
    priceRub: number;
    timelineDays: number;
    rationale: string;
    confirmed: boolean;
  };
  prepaymentReceived: boolean;
  spec?: SpecJson;
  specNotes?: string;
  reminderSentAt?: string;
  pausedAt?: string;
  development: {
    currentStageId: number;
    reworkCount: number;
    runs: StageRun[];
  };
  qa?: {
    pass: boolean;
    report: string;
  };
  demoOpenedAt?: string;
  events: OrderEvent[];
}

export interface Database {
  orders: Order[];
}

export type StatsDay = {
  date: string;
  pageviews: number;
  sessions: number;
  applyStarts: number;
  applySubmits: number;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Новая заявка",
  rejected: "Отказ",
  awaiting_reply_approval: "Черновик отклика",
  skipped: "Пропуск",
  briefing: "Бриф",
  paused: "Пауза 48 ч",
  awaiting_price_approval: "Цена на утверждении",
  awaiting_prepayment: "Ждём предоплату",
  kp_archived: "Архив КП",
  awaiting_spec_approval: "ТЗ на утверждении",
  developing: "Разработка этапа",
  awaiting_stage_review: "Смотрите прогресс",
  qa: "QA по ТЗ",
  awaiting_demo: "Откройте демо",
  closed: "Заказ закрыт",
};
