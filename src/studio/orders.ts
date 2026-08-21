import { runDevStage } from "./agents/dev";
import { runHunter } from "./agents/hunter";
import { estimatePrice } from "./agents/pricing";
import { runQa } from "./agents/qa";
import { draftReply } from "./agents/reply";
import { buildSpec } from "./agents/spec";
import { studio } from "./config";
import { createId, nowIso } from "./id";
import { notifyOrderBot } from "./orderBot";
import { recordStat } from "./stats";
import { notifyAdmins, sendTelegram } from "./telegram";
import { templates, htmlParse, replyApprovalMarkup } from "./templates";
import { STATUS_LABEL, type Actor, type Brief, type HumanAction, type Order, type OrderSource } from "./types";
import { findOrderByTelegram, getOrder, listOrders, upsertOrder } from "./store";

function emptyBrief(): Brief {
  return { goal: "", deadline: "", budget: "", references: "", step: "goal" };
}

function log(order: Order, actor: Actor, type: string, detail: string) {
  order.events.push({ at: nowIso(), actor, type, detail });
  order.updatedAt = nowIso();
}

function canStartCode(order: Order) {
  return order.prepaymentReceived && Boolean(order.spec);
}

async function save(order: Order) {
  return upsertOrder(order);
}

function pickLeadField(leadText: string, label: string) {
  const prefix = `${label}:`;
  const line = leadText.split("\n").find((item) => item.trim().toLowerCase().startsWith(prefix.toLowerCase()));
  return line ? line.slice(line.indexOf(":") + 1).trim() : "";
}

function fillBriefFromLead(order: Order) {
  const goal = pickLeadField(order.leadText, "Цель");
  const deadline = pickLeadField(order.leadText, "Срок");
  const budget = pickLeadField(order.leadText, "Бюджет");
  const references = pickLeadField(order.leadText, "Ориентиры");
  if (goal) order.brief.goal = goal;
  if (deadline) order.brief.deadline = deadline;
  if (budget) order.brief.budget = budget;
  if (references) order.brief.references = references;
  if (order.brief.goal && order.brief.deadline && order.brief.budget) {
    order.brief.step = "done";
  }
}

export async function createOrder(input: {
  source: OrderSource;
  leadText: string;
  client: Order["client"];
  skipHunter?: boolean;
  pricing?: { priceRub: number; timelineDays?: number; rationale?: string };
}) {
  const order: Order = {
    id: createId(),
    status: "new",
    source: input.source,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    client: input.client,
    leadText: input.leadText.trim(),
    brief: emptyBrief(),
    prepaymentReceived: false,
    development: { currentStageId: 1, reworkCount: 0, runs: [] },
    events: [],
  };
  log(order, "system", "created", `Источник: ${input.source}`);
  if (order.source === "web") fillBriefFromLead(order);
  if (input.pricing?.priceRub) {
    order.pricing = {
      priceRub: input.pricing.priceRub,
      timelineDays: input.pricing.timelineDays ?? 21,
      rationale: input.pricing.rationale ?? "Внесено вручную",
      confirmed: false,
    };
  }
  await save(order);
  if (order.source === "web") {
    try {
      await recordStat("apply_submit");
    } catch (error) {
      console.error("[zenvyro] stats apply_submit", error);
    }
    const notified = await notifyAdmins(templates.adminReview(order), htmlParse).catch((error) => {
      console.error("[zenvyro] web lead saved but Telegram notify failed", order.id, error);
      return false;
    });
    if (!notified) {
      console.error("[zenvyro] web lead saved but Telegram notify failed", order.id);
    }
    await notifyOrderBot(order).catch((error) => {
      console.error("[zenvyro] order-bot webhook", error);
    });
  }
  if (input.skipHunter) {
    if (order.pricing) order.status = "awaiting_price_approval";
    else order.status = "briefing";
    log(order, "human", "manual", "Заявка внесена вручную, Охотник не вызывался");
    await save(order);
    return order;
  }
  try {
    return await runHunterOnOrder(order);
  } catch (error) {
    console.error("[zenvyro] hunter", error);
    await notifyAdmins(templates.adminReview(order), htmlParse);
    return order;
  }
}

export async function runHunterOnOrder(order: Order) {
  const hunter = await runHunter(order);
  order.hunter = {
    fit: hunter.fit,
    reason: hunter.reason,
    budgetGuess: hunter.budgetGuess ?? undefined,
    stackGuess: hunter.stackGuess ?? [],
    stopHits: hunter.stopHits ?? [],
  };
  log(order, "hunter", "qualify", hunter.reason);

  if (!hunter.fit) {
    order.status = "rejected";
    log(order, "hunter", "reject", "Клиенту не пишем, в архив");
    await save(order);
    await notifyAdmins(templates.adminReview(order), htmlParse);
    return order;
  }

  order.replyDraft =
    order.source === "web"
      ? [
          "Бриф уже заполнен на сайте.",
          "Клиенту этот текст не уходит — свяжитесь сами: Telegram, почта или телефон из карточки.",
        ].join(" ")
      : await draftReply(order);
  order.status = "awaiting_reply_approval";
  log(
    order,
    "communicator",
    "draft_reply",
    order.source === "web" ? "Сайт: бриф готов, ждём решение взять в работу" : "Черновик отклика для площадки",
  );
  await save(order);
  await notifyAdmins(templates.adminReview(order), replyApprovalMarkup(order.id));
  return order;
}

export async function applyHumanAction(
  id: string,
  action: HumanAction,
  extra?: { notes?: string; priceRub?: number; timelineDays?: number; demoUrl?: string },
) {
  const order = await getOrder(id);
  if (!order) throw new Error("Заявка не найдена");

  switch (action) {
    case "approve_reply": {
      if (order.status !== "awaiting_reply_approval") break;
      fillBriefFromLead(order);
      log(order, "human", "approve_reply", "Берём в работу. Клиенту пишет человек или агент, не бот.");
      if (order.source === "web" || order.brief.step === "done") {
        const pricing = await estimatePrice(order);
        order.pricing = { ...pricing, confirmed: false };
        order.status = "awaiting_price_approval";
        log(order, "pricing", "estimate", `${pricing.priceRub} ₽ / ${pricing.timelineDays} дн`);
        await save(order);
        await notifyAdmins(
          [
            `В работу ${order.id}. Клиенту ничего не ушло.`,
            `Свяжитесь: ${[
              order.client.telegramUsername ? `@${order.client.telegramUsername.replace(/^@/, "")}` : "",
              order.client.email,
              order.client.phone,
            ]
              .filter(Boolean)
              .join(" · ") || "контакт не указан"}`,
            `Оценка агента: ${pricing.priceRub.toLocaleString("ru-RU")} ₽ / ${pricing.timelineDays} дн.`,
          ].join("\n"),
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "Подтвердить цену", callback_data: `cp:${order.id}` },
                  { text: "Архив КП", callback_data: `ak:${order.id}` },
                ],
              ],
            },
          },
        );
      } else {
        order.status = "briefing";
        await save(order);
        await notifyAdmins(
          `Отклик ${order.id} согласован. Скопируйте черновик на фриланс-площадку. В Telegram клиенту ничего не уходит.`,
        );
      }
      break;
    }
    case "skip_reply": {
      if (order.status !== "awaiting_reply_approval") break;
      order.status = "skipped";
      log(order, "human", "skip", "Не уговариваем на всякий случай");
      await save(order);
      break;
    }
    case "confirm_price": {
      if (order.status !== "awaiting_price_approval" || !order.pricing) break;
      if (extra?.priceRub) order.pricing.priceRub = extra.priceRub;
      if (extra?.timelineDays) order.pricing.timelineDays = extra.timelineDays;
      order.pricing.confirmed = true;
      order.status = "awaiting_prepayment";
      log(order, "human", "confirm_price", `${order.pricing.priceRub} ₽ / ${order.pricing.timelineDays} дн`);
      await save(order);
      if (order.client.telegramId) {
        await sendTelegram(order.client.telegramId, templates.kp(order));
      }
      await notifyAdmins(
        `Цена утверждена ${order.id}: ${order.pricing.priceRub} ₽. Отметьте предоплату. Кода нет, пока денег нет.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Предоплата получена", callback_data: `mp:${order.id}` },
                { text: "Архив КП", callback_data: `ak:${order.id}` },
              ],
            ],
          },
        },
      );
      break;
    }
    case "mark_prepayment": {
      if (order.status !== "awaiting_prepayment") break;
      order.prepaymentReceived = true;
      log(order, "human", "prepayment", "Деньги есть, код ещё нельзя");
      order.spec = await buildSpec(order);
      order.status = "awaiting_spec_approval";
      log(order, "spec", "spec.json", `v${order.spec.version}`);
      await save(order);
      await notifyAdmins(templates.specForHuman(order), {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Фиксировать ТЗ", callback_data: `as:${order.id}` },
              { text: "Правки ТЗ", callback_data: `rs:${order.id}` },
            ],
          ],
        },
      });
      break;
    }
    case "archive_kp": {
      if (order.status !== "awaiting_price_approval" && order.status !== "awaiting_prepayment") break;
      order.status = "kp_archived";
      log(order, "human", "archive_kp", "Кода нет");
      await save(order);
      break;
    }
    case "revise_spec": {
      if (order.status !== "awaiting_spec_approval") break;
      order.specNotes = extra?.notes ?? order.specNotes;
      order.spec = await buildSpec(order, extra?.notes);
      order.status = "awaiting_spec_approval";
      log(order, "spec", "spec_revision", `v${order.spec.version}`);
      await save(order);
      await notifyAdmins(templates.specForHuman(order), {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Фиксировать ТЗ", callback_data: `as:${order.id}` },
              { text: "Правки ТЗ", callback_data: `rs:${order.id}` },
            ],
          ],
        },
      });
      break;
    }
    case "approve_spec": {
      if (order.status !== "awaiting_spec_approval" || !order.spec) break;
      if (!order.prepaymentReceived) {
        throw new Error("Код нельзя начинать без предоплаты и фиксации ТЗ");
      }
      order.development.currentStageId = order.spec.stages[0]?.id ?? 1;
      order.status = "developing";
      log(order, "human", "fix_spec", `ТЗ v${order.spec.version} зафиксировано. Можно писать код`);
      await save(order);
      await startStage(order);
      break;
    }
    case "accept_stage": {
      if (order.status !== "awaiting_stage_review") break;
      const run = order.development.runs.at(-1);
      if (run) run.accepted = true;
      log(order, "human", "accept_stage", `Этап ${order.development.currentStageId}`);
      const spec = order.spec;
      const hasNext = spec?.stages.some((stage) => stage.id > order.development.currentStageId);
      if (hasNext) {
        order.development.currentStageId += 1;
        order.status = "developing";
        await save(order);
        await startStage(order);
      } else {
        order.status = "qa";
        await save(order);
        await finishQa(order);
      }
      break;
    }
    case "reject_stage": {
      if (order.status !== "awaiting_stage_review") break;
      if (!canStartCode(order)) break;
      if (order.development.reworkCount >= studio.maxReworkCycles) {
        log(order, "human", "rework_limit", "Лимит 3. Решает человек, не агент");
        await save(order);
        await notifyAdmins(
          `Заявка ${order.id}: лимит доработок исчерпан. Решаете вы, не агент.`,
        );
        break;
      }
      order.development.reworkCount += 1;
      order.status = "developing";
      log(order, "human", "rework", extra?.notes ?? "Доработка этапа");
      await save(order);
      await startStage(order);
      break;
    }
    case "open_demo": {
      if (order.status !== "awaiting_demo") break;
      order.demoOpenedAt = nowIso();
      order.status = "closed";
      log(order, "human", "open_demo", extra?.demoUrl ?? "Демо открыто человеком");
      log(order, "communicator", "delivery", "Шаблон сдачи");
      await save(order);
      if (order.client.telegramId) {
        await sendTelegram(order.client.telegramId, templates.delivery(order, extra?.demoUrl));
      }
      break;
    }
  }

  return getOrder(id);
}

async function startStage(order: Order) {
  if (!canStartCode(order)) {
    throw new Error("Код нельзя начинать без предоплаты и фиксации ТЗ");
  }
  const run = await runDevStage(order);
  order.development.runs.push(run);
  order.status = "awaiting_stage_review";
  log(order, "dev", "stage", run.report.slice(0, 400));
  await save(order);
  await notifyAdmins(templates.stageReport(order, run.report, run.prUrl), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Этап принят", callback_data: `ok:${order.id}` },
          { text: "Доработка", callback_data: `rk:${order.id}` },
        ],
      ],
    },
  });
}

async function finishQa(order: Order) {
  const qa = await runQa(order);
  order.qa = qa;
  log(order, "qa", "check", qa.report.slice(0, 400));
  if (!qa.pass) {
    if (order.development.reworkCount >= studio.maxReworkCycles) {
      order.status = "awaiting_stage_review";
      await save(order);
      await notifyAdmins(`QA не принял ${order.id}. Лимит 3. Решаете вы.`);
      return;
    }
    order.development.reworkCount += 1;
    order.status = "developing";
    await save(order);
    await startStage(order);
    return;
  }
  order.status = "awaiting_demo";
  await save(order);
  await notifyAdmins(`QA ок по ТЗ ${order.id}. Демо клиенту не уходит, пока вы сами его не откроете.`, {
    reply_markup: {
      inline_keyboard: [[{ text: "Открыть демо / сдать", callback_data: `od:${order.id}` }]],
    },
  });
}

export async function ingestBriefAnswer(orderId: string, text: string) {
  const order = await getOrder(orderId);
  if (!order || (order.status !== "briefing" && order.status !== "paused")) {
    return { order, reply: templates.status(order ?? ({ id: orderId, status: "new" } as Order)) };
  }

  if (order.status === "paused") {
    order.status = "briefing";
    order.brief.step = order.brief.goal ? "deadline" : "goal";
  }

  const value = text.trim();
  if (order.brief.step === "goal") {
    order.brief.goal = value;
    order.brief.step = "deadline";
  } else if (order.brief.step === "deadline") {
    order.brief.deadline = value;
    order.brief.step = "budget";
  } else if (order.brief.step === "budget") {
    order.brief.budget = value;
    order.brief.step = "references";
  } else {
    order.brief.references = value;
    order.brief.step = "done";
  }

  log(order, "client", "brief", order.brief.step);

  if (order.brief.step !== "done") {
    await save(order);
    return { order, reply: templates.briefAsk(order.brief.step) };
  }

  const pricing = await estimatePrice(order);
  order.pricing = { ...pricing, confirmed: false };
  order.status = "awaiting_price_approval";
  log(order, "pricing", "estimate", `${pricing.priceRub} ₽ / ${pricing.timelineDays} дн`);
  await save(order);
  await notifyAdmins(templates.briefReady(order), {
    ...htmlParse,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Подтвердить цену", callback_data: `cp:${order.id}` },
          { text: "Архив КП", callback_data: `ak:${order.id}` },
        ],
      ],
    },
  });
  return { order, reply: templates.briefReceived() };
}

export async function attachClient(orderId: string, telegramId: number, username?: string, name?: string) {
  const order = await getOrder(orderId);
  if (!order) return undefined;
  if (order.client.telegramId && order.client.telegramId !== telegramId) return undefined;
  const claimed = username?.replace(/^@/, "").trim().toLowerCase();
  const listed = order.client.telegramUsername?.replace(/^@/, "").trim().toLowerCase();
  if (!listed || !claimed || claimed !== listed) return undefined;
  order.client.telegramId = telegramId;
  order.client.telegramUsername = listed;
  if (name && !order.client.name) order.client.name = name;
  await save(order);
  return order;
}

export async function handleSilence(order: Order) {
  if (order.status !== "briefing") return order;
  if (!order.reminderSentAt) {
    order.reminderSentAt = nowIso();
    await save(order);
    if (order.client.telegramId) await sendTelegram(order.client.telegramId, templates.reminder());
    return order;
  }
  order.status = "paused";
  order.pausedAt = nowIso();
  log(order, "communicator", "pause", "Одно напоминание уже было");
  await save(order);
  if (order.client.telegramId) await sendTelegram(order.client.telegramId, templates.paused());
  return order;
}

export { findOrderByTelegram, getOrder, listOrders, STATUS_LABEL };
