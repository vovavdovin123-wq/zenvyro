export const studio = {
  name: "Zenvyro",
  tagline: "Веб-студия",
  minBudgetRub: Number(process.env.STUDIO_MIN_BUDGET ?? 5_000),
  acceptedStacks: [
    "сайт",
    "лендинг",
    "web",
    "next",
    "react",
    "vue",
    "node",
    "telegram",
    "бот",
    "агент",
    "магазин",
    "сервис",
    "приложение",
    "ui",
    "дизайн",
  ],
  stopWords: [
    "бесплатно",
    "за отзыв",
    "за экспозицию",
    "тестовое без оплаты",
    "в кредит",
    "процент с продаж вместо оплаты",
  ],
  maxReworkCycles: 3,
  warrantyDays: 7,
  callMinutes: 15,
  pauseHours: 48,
  prepaymentHint: "Реквизиты пришлёт продюсер отдельным письмом.",
};

export const llm = {
  apiKey: process.env.OPENAI_API_KEY ?? "",
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
};

export const telegram = {
  token: process.env.TELEGRAM_BOT_TOKEN ?? "",
  botUsername: process.env.TELEGRAM_BOT_USERNAME ?? "",
  apiRoot: (
    process.env.VERCEL
      ? "https://api.telegram.org"
      : process.env.TELEGRAM_API_ROOT || "https://api.telegram.org"
  ).replace(/\/$/, ""),
  adminChatIds: (process.env.TELEGRAM_ADMIN_CHAT_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((id) => Number.isFinite(id)),
};

export const orderBot = {
  webhookUrl: (process.env.ORDER_BOT_WEBHOOK_URL ?? "").trim(),
  webhookSecret: (process.env.ORDER_BOT_WEBHOOK_SECRET ?? "").trim(),
};

export const publicSite = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://zenvyro.vercel.app").replace(/\/$/, ""),
  applyPath: "/contact",
};

export const studioAuth = {
  password: process.env.STUDIO_PASSWORD ?? "",
};

if (!studioAuth.password && process.env.VERCEL_ENV === "production") {
  console.error("[zenvyro] STUDIO_PASSWORD is empty. /studio and /api/studio stay locked.");
}

export function isStudioPasswordRequired() {
  return true;
}

export const cursorDev = {
  apiKey: process.env.CURSOR_API_KEY ?? "",
  model: process.env.CURSOR_MODEL ?? "composer-2.5",
  repo: process.env.CURSOR_REPO ?? "",
};

export function codebaseMemory() {
  const repo = (process.env.CODEBASE_MEMORY_REPO ?? "").trim();
  return {
    repo: repo || process.cwd(),
    bin: (process.env.CBM_BIN ?? "").trim(),
  };
}
