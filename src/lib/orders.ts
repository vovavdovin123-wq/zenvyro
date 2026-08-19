import { runDevStage } from "./agents/dev";
import { runHunter } from "./agents/hunter";
import { estimatePrice } from "./agents/pricing";
import { runQa } from "./agents/qa";
import { draftReply } from "./agents/reply";
import { buildSpec } from "./agents/spec";
import { studio } from "./config";
import { createId, nowIso } from "./id";
import { notifyAdmins, sendTelegram } from "./telegram";
import { templates } from "./templates";
import type { Actor, Brief, HumanAction, Order, OrderSource } from "./types";
import { STATUS_LABEL } from "./types";
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

export async function createOrder(input: {
  source: OrderSource;
  leadText: string;
  client: Order["client"];
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
  await save(order);
  return runHunterOnOrder(order);
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
    await notifyAdmins(
      `Отказ ${order.id}\n${order.client.name}\n${hunter.reason}\n\nКлиенту не пишем.`,
    );
    return order;
  }

  order.replyDraft = await draftReply(order);
  order.status = "awaiting_reply_approval";
  log(order, "communicator", "draft_reply", "Черновик без цены и срока");
  await save(order);
  await notifyAdmins(
    [
      `Заявка ${order.id} прошла Охотника`,
      order.client.name,
      hunter.reason,
      "",
      "Черновик отклика (без цены и срока):",
      order.replyDraft,
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Отправить отклик", callback_data: `ar:${order.id}` },
            { text: "Пропуск", callback_data: `sr:${order.id}` },
          ],
        ],
      },
    },
  );
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
      order.status = "briefing";
      log(order, "human", "approve_reply", "Отклик можно слать");
      await save(order);
      if (order.client.telegramId && order.replyDraft) {
        await sendTelegram(order.client.telegramId, order.replyDraft);
        await sendTelegram(order.client.telegramId, templates.briefAsk("goal"));
      }
      break;
    }
    case "skip_reply": {
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
      order.status = "kp_archived";
      log(order, "human", "archive_kp", "Кода нет");
      await save(order);
      break;
    }
    case "revise_spec": {
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
  await notifyAdmins(
    [
      `Бриф готов: ${order.id}`,
      `Цель: ${order.brief.goal}`,
      `Срок клиента: ${order.brief.deadline}`,
      `Бюджет клиента: ${order.brief.budget}`,
      `Референсы: ${order.brief.references}`,
      "",
      `Оценка агента (клиенту не уходила): ${pricing.priceRub} ₽, ${pricing.timelineDays} дн`,
      pricing.rationale,
      "",
      "Цифры клиенту только после вас. Команда: /price " + order.id + " 150000 21",
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
  return { order, reply: templates.briefReceived() };
}

export async function attachClient(orderId: string, telegramId: number, username?: string, name?: string) {
  const order = await getOrder(orderId);
  if (!order) return undefined;
  order.client.telegramId = telegramId;
  if (username) order.client.telegramUsername = username;
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
