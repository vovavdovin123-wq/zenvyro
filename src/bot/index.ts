import { config as loadEnv } from "dotenv";
import { Bot, type Context } from "grammy";
import { studio, telegram } from "../lib/config";
import {
  applyHumanAction,
  attachClient,
  createOrder,
  findOrderByTelegram,
  getOrder,
  handleSilence,
  ingestBriefAnswer,
  listOrders,
} from "../lib/orders";
import { isAdmin } from "../lib/telegram";
import { templates } from "../lib/templates";
import { producerName } from "../lib/site";
import { STATUS_LABEL, type HumanAction } from "../lib/types";

loadEnv({ path: ".env.local" });
loadEnv();

if (!telegram.token) {
  console.error("Нет TELEGRAM_BOT_TOKEN в .env.local");
  process.exit(1);
}

const bot = new Bot(telegram.token);
const pendingNotes = new Map<number, { orderId: string; kind: "spec" | "rework" | "demo" }>();

const ACTION_MAP: Record<string, HumanAction> = {
  ar: "approve_reply",
  sr: "skip_reply",
  cp: "confirm_price",
  mp: "mark_prepayment",
  ak: "archive_kp",
  as: "approve_spec",
  rs: "revise_spec",
  ok: "accept_stage",
  rk: "reject_stage",
  od: "open_demo",
};

function adminOnly(ctx: Context) {
  const id = ctx.from?.id;
  return Boolean(id && isAdmin(id));
}

bot.command("start", async (ctx) => {
  const payload = ctx.match?.trim();
  const name = [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ");

  if (payload) {
    const order = await attachClient(
      payload,
      ctx.from!.id,
      ctx.from?.username,
      name,
    );
    if (!order) {
      await ctx.reply("Заявка не найдена. Напишите задачу текстом — Охотник её разберёт.");
      return;
    }
    if (order.status === "briefing") {
      await ctx.reply(templates.linked(order));
      await ctx.reply(templates.briefAsk(order.brief.step === "done" ? "goal" : order.brief.step));
      return;
    }
    await ctx.reply(templates.status(order));
    return;
  }

  await ctx.reply(templates.startClient(name));
});

bot.command("hunt", async (ctx) => {
  if (!adminOnly(ctx)) return;
  const text = ctx.match?.trim();
  if (!text) {
    await ctx.reply("Пришлите текст заявки: /hunt бюджет 200к, нужен лендинг на Next…");
    return;
  }
  const order = await createOrder({
    source: "hunt",
    leadText: text,
    client: { name: "Заявка с площадки" },
  });
  await ctx.reply(`Охотник разобрал ${order.id}. Статус: ${STATUS_LABEL[order.status]}`);
});

bot.command("price", async (ctx) => {
  if (!adminOnly(ctx)) return;
  const [id, price, days] = (ctx.match ?? "").trim().split(/\s+/);
  if (!id || !price) {
    await ctx.reply("Формат: /price ID 150000 21");
    return;
  }
  await applyHumanAction(id, "confirm_price", {
    priceRub: Number(price),
    timelineDays: days ? Number(days) : undefined,
  });
  await ctx.reply(`Цена по ${id} утверждена.`);
});

bot.command("prepay", async (ctx) => {
  if (!adminOnly(ctx)) return;
  const id = ctx.match?.trim();
  if (!id) {
    await ctx.reply("Формат: /prepay ID");
    return;
  }
  await applyHumanAction(id, "mark_prepayment");
  await ctx.reply(`Предоплата ${id} отмечена. Код ещё нельзя — сначала фиксация ТЗ.`);
});

bot.command("orders", async (ctx) => {
  if (!adminOnly(ctx)) return;
  const orders = (await listOrders()).slice(0, 15);
  if (!orders.length) {
    await ctx.reply("Заявок пока нет.");
    return;
  }
  await ctx.reply(
    orders
      .map((order) => `${order.id} · ${STATUS_LABEL[order.status]} · ${order.client.name}`)
      .join("\n"),
  );
});

bot.command("demo", async (ctx) => {
  if (!adminOnly(ctx)) return;
  const [id, ...rest] = (ctx.match ?? "").trim().split(/\s+/);
  if (!id) {
    await ctx.reply("Формат: /demo ID https://demo.example");
    return;
  }
  await applyHumanAction(id, "open_demo", { demoUrl: rest.join(" ") || undefined });
  await ctx.reply(`Сдача ${id} отправлена клиенту шаблоном.`);
});

bot.on("callback_query:data", async (ctx) => {
  if (!adminOnly(ctx)) {
    await ctx.answerCallbackQuery({ text: "Только человек студии" });
    return;
  }
  const [code, orderId] = (ctx.callbackQuery.data ?? "").split(":");
  const action = ACTION_MAP[code];
  if (!action || !orderId) {
    await ctx.answerCallbackQuery();
    return;
  }

  if (action === "revise_spec") {
    pendingNotes.set(ctx.from!.id, { orderId, kind: "spec" });
    await ctx.answerCallbackQuery({ text: "Пришлите правки ТЗ следующим сообщением" });
    await ctx.reply(`Правки для ${orderId}: напишите, что изменить в spec.json. Версия станет +1.`);
    return;
  }
  if (action === "reject_stage") {
    pendingNotes.set(ctx.from!.id, { orderId, kind: "rework" });
    await ctx.answerCallbackQuery({ text: "Что доработать?" });
    await ctx.reply(`Доработка ${orderId}. Коротко напишите замечание. Лимит ${studio.maxReworkCycles} цикла.`);
    return;
  }
  if (action === "open_demo") {
    pendingNotes.set(ctx.from!.id, { orderId, kind: "demo" });
    await ctx.answerCallbackQuery({ text: "Ссылка на демо" });
    await ctx.reply(`Откройте демо сами. Пришлите URL — коммуникатор отправит шаблон сдачи клиенту.`);
    return;
  }

  await applyHumanAction(orderId, action);
  await ctx.answerCallbackQuery({ text: "Ок" });
  const order = await getOrder(orderId);
  if (order) await ctx.reply(`${orderId}: ${STATUS_LABEL[order.status]}`);
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return;
  const userId = ctx.from.id;

  if (adminOnly(ctx) && pendingNotes.has(userId)) {
    const pending = pendingNotes.get(userId)!;
    pendingNotes.delete(userId);
    if (pending.kind === "spec") {
      await applyHumanAction(pending.orderId, "revise_spec", { notes: text });
      await ctx.reply(`Новая версия ТЗ по ${pending.orderId} на утверждении.`);
      return;
    }
    if (pending.kind === "rework") {
      await applyHumanAction(pending.orderId, "reject_stage", { notes: text });
      await ctx.reply(`Доработка ${pending.orderId} запущена.`);
      return;
    }
    await applyHumanAction(pending.orderId, "open_demo", { demoUrl: text });
    await ctx.reply("Шаблон сдачи ушёл клиенту. Заказ закрыт.");
    return;
  }

  if (adminOnly(ctx) && !text.startsWith("/")) {
    if (text.length > 80) {
      const order = await createOrder({
        source: "hunt",
        leadText: text,
        client: { name: ctx.from.username ? `@${ctx.from.username}` : "Админ" },
      });
      await ctx.reply(`Охотник: ${order.id} → ${STATUS_LABEL[order.status]}`);
      return;
    }
  }

  const existing = await findOrderByTelegram(userId);
  if (existing && (existing.status === "briefing" || existing.status === "paused")) {
    const { reply } = await ingestBriefAnswer(existing.id, text);
    await ctx.reply(reply);
    return;
  }
  if (existing) {
    await ctx.reply(templates.status(existing));
    return;
  }

  const order = await createOrder({
    source: "telegram",
    leadText: text,
    client: {
      name: [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ") || "Клиент",
      telegramId: userId,
      telegramUsername: ctx.from.username,
    },
  });

  if (order.status === "rejected") {
    return;
  }
  await ctx.reply(`Спасибо. Заявку получил ${producerName} — напишет сюда, если формат наш.`);
});

setInterval(() => {
  void (async () => {
    const orders = await listOrders();
    const threshold = Date.now() - studio.pauseHours * 60 * 60 * 1000;
    for (const order of orders) {
      if (order.status !== "briefing") continue;
      const updated = new Date(order.updatedAt).getTime();
      if (updated > threshold) continue;
      await handleSilence(order);
    }
  })();
}, 60 * 60 * 1000);

bot.catch((err) => {
  console.error(err);
});

void bot.start({
  onStart: (info) => {
    console.log(`Zenvyro bot @${info.username}`);
  },
});
