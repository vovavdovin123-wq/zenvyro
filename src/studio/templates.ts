import { studio, telegram, publicSite } from "./config";
import { producerName } from "../content/site";
import type { Order } from "./types";
import { SOURCE_LABEL } from "./types";

function botLink(orderId?: string) {
  const username = telegram.botUsername;
  if (!username) return "";
  return orderId
    ? `https://t.me/${username}?start=${orderId}`
    : `https://t.me/${username}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeMailto(email: string) {
  if (!/^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/.test(email)) return escapeHtml(email);
  return `<a href="mailto:${encodeURIComponent(email)}">${escapeHtml(email)}</a>`;
}

function safeTelegramUser(username: string) {
  const handle = username.replace(/^@/, "").trim();
  if (!/^[A-Za-z0-9_]{5,32}$/.test(handle)) return `@${escapeHtml(handle)}`;
  return `<a href="https://t.me/${handle}">@${escapeHtml(handle)}</a>`;
}

function formatLeadHtml(leadText: string) {
  return leadText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf(":");
      if (index <= 0) return escapeHtml(line);
      const label = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      return `<b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`;
    })
    .join("\n");
}

function contactLine(order: Order) {
  const parts: string[] = [];
  const email = order.client.email?.trim();
  if (email) parts.push(safeMailto(email));
  const username = order.client.telegramUsername?.replace(/^@/, "").trim();
  if (username) parts.push(safeTelegramUser(username));
  const phone = order.client.phone?.trim();
  if (phone) {
    const tel = phone.replace(/[^\d+]/g, "");
    parts.push(`<a href="tel:${escapeHtml(tel)}">${escapeHtml(phone)}</a>`);
  }
  return parts.join(" · ") || "—";
}

export const htmlParse = { parse_mode: "HTML" as const };

export function replyApprovalMarkup(orderId: string) {
  return {
    ...htmlParse,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "В работу", callback_data: `ar:${orderId}` },
          { text: "Пропуск", callback_data: `sr:${orderId}` },
        ],
      ],
    },
  };
}

export const templates = {
  startClient(name?: string) {
    const apply = `${publicSite.url}${publicSite.applyPath}`;
    return [
      `<b>Здравствуйте${name ? `, ${escapeHtml(name)}` : ""}.</b>`,
      `Это ${escapeHtml(studio.name)}.`,
      `Заявки принимаем на сайте: ${escapeHtml(apply)}`,
      "Там короткий бриф. После него свяжемся в Telegram, по почте или по телефону — как укажете.",
      "Случайные сообщения в этот чат не разбираем. Отклики с фриланса смотрит агент отдельно.",
    ].join("\n\n");
  },

  linked(order: Order) {
    return `Заявку <code>${escapeHtml(order.id)}</code> вижу. Короткий бриф — четыре вопроса. Можно отвечать одним сообщением на каждый.`;
  },

  briefAsk(field: "goal" | "deadline" | "budget" | "references") {
    const map = {
      goal: {
        title: "Бриф · 1/4 · Цель",
        ask: "Что должно произойти после запуска? Не «сделать сайт», а зачем он.",
        example: "Собрать заявки на курс в Telegram, чтобы менеджер не ловил их в директ.",
      },
      deadline: {
        title: "Бриф · 2/4 · Срок",
        ask: "К какому моменту нужен результат? Дата или «через N недель».",
        example: "К 12 сентября" + " / " + "через 6 недель",
      },
      budget: {
        title: "Бриф · 3/4 · Бюджет",
        ask: "Какой бюджет закладываете? Цифра или вилка, как удобно.",
        example: "250 000 ₽" + " / " + "150–200 тыс",
      },
      references: {
        title: "Бриф · 4/4 · Ориентиры",
        ask: "Один-два сайта, которые нравятся — или напишите, что ориентиров нет.",
        example: "https://example.com — нравится сетка и тон" + " / " + "ориентиров нет",
      },
    };
    const item = map[field];
    return [
      `<b>${item.title}</b>`,
      "",
      escapeHtml(item.ask),
      "",
      "<i>Пример ответа:</i>",
      `<blockquote>${escapeHtml(item.example)}</blockquote>`,
    ].join("\n");
  },

  briefReceived() {
    return "Бриф у студии. Смету пришлём, когда продюсер её утвердит. Пока ничего не оплачивайте.";
  },

  briefReady(order: Order) {
    const price = order.pricing?.priceRub?.toLocaleString("ru-RU") ?? "—";
    const days = order.pricing?.timelineDays ?? "—";
    return [
      `<b>Бриф готов</b> · <code>${escapeHtml(order.id)}</code>`,
      "",
      `<blockquote>${formatLeadHtml(
        [
          `Цель: ${order.brief.goal}`,
          `Срок: ${order.brief.deadline}`,
          `Бюджет: ${order.brief.budget}`,
          `Ориентиры: ${order.brief.references}`,
        ].join("\n"),
      )}</blockquote>`,
      "",
      `<i>Оценка агента, клиенту не уходила:</i> <b>${escapeHtml(String(price))} ₽</b>, ${escapeHtml(String(days))} дн`,
      escapeHtml(order.pricing?.rationale ?? ""),
      "",
      `Цифры клиенту только после вас. Команда: <code>/price ${escapeHtml(order.id)} 150000 21</code>`,
    ].join("\n");
  },

  callInvite() {
    return `Бриф ещё не полный. Можем созвониться на ${studio.callMinutes} мин — или допишите цель, срок, бюджет и ориентиры текстом.`;
  },

  reminder() {
    return "Напоминание: ждём бриф — цель, срок, бюджет, ориентиры. Это единственное письмо, дальше пауза.";
  },

  paused() {
    return `Пауза ${studio.pauseHours} ч. Когда будете готовы — напишите «продолжить».`;
  },

  kp(order: Order) {
    const price = order.pricing?.priceRub?.toLocaleString("ru-RU");
    const days = order.pricing?.timelineDays;
    return [
      `Предложение по заявке ${order.id}.`,
      `${price} ₽, ${days} рабочих дней.`,
      "Следующий шаг — предоплата. Разработку начинаем после оплаты и утверждённого ТЗ.",
      studio.prepaymentHint ?? `Реквизиты пришлёт ${producerName} отдельным письмом.`,
    ].join("\n\n");
  },

  waitingPrepayment() {
    return "Ждём предоплату. Когда деньги поступят, соберём ТЗ и пришлём состав на согласование.";
  },

  specForHuman(order: Order) {
    return [
      `spec.json v${order.spec?.version} по заявке ${order.id}.`,
      "Проверьте цену, срок и состав. Код ещё нельзя.",
      "Новое требование = новая версия ТЗ, не «допилите в этот же заказ».",
      "```json\n" + JSON.stringify(order.spec, null, 2) + "\n```",
    ].join("\n\n");
  },

  stageReport(order: Order, report: string, prUrl?: string) {
    return [
      `Этап ${order.development.currentStageId} по заявке ${order.id}.`,
      report,
      prUrl ? `PR: ${prUrl}` : "PR в Cursor: после принятия этапа QA сверит с ТЗ.",
      `Доработок использовано: ${order.development.reworkCount}/${studio.maxReworkCycles}.`,
    ].join("\n\n");
  },

  delivery(order: Order, demoUrl?: string) {
    return [
      `Сдаём заявку ${order.id}.`,
      demoUrl ? `Демо: ${demoUrl}` : "Ссылку на демо пришлём отдельно, как только продюсер её откроет.",
      "Сделано по утверждённому ТЗ.",
      `Гарантия ${studio.warrantyDays} дней — по этому ТЗ. Новые идеи оформим отдельным этапом.`,
    ].join("\n\n");
  },

  status(order: Order) {
    return `Заявка ${order.id} в работе. Если нужно уточнить статус — напишите, ответит продюсер.`;
  },

  leadCard(order: Order) {
    const contact = [
      order.client.email,
      order.client.telegramUsername ? `@${order.client.telegramUsername.replace(/^@/, "")}` : "",
      order.client.phone,
    ]
      .filter(Boolean)
      .join(" · ") || "—";
    return [
      `Заявка ${order.id} (${SOURCE_LABEL[order.source]})`,
      "",
      `Имя: ${order.client.name}`,
      `Контакт: ${contact}`,
      "",
      order.leadText,
    ].join("\n");
  },

  adminReview(order: Order) {
    const source = SOURCE_LABEL[order.source];
    const hunter = order.hunter;
    const passed = Boolean(hunter?.fit);
    const reason = hunter?.reason?.trim() || "—";
    const draft = order.replyDraft?.trim();
    const lines = [
      `<b>Заявка</b> <code>${escapeHtml(order.id)}</code> <b>(${escapeHtml(source)})</b>`,
      "",
      `<b>Имя:</b> ${escapeHtml(order.client.name)}`,
      `<b>Контакт:</b> ${contactLine(order)}`,
      "",
      `<blockquote>${formatLeadHtml(order.leadText)}</blockquote>`,
    ];
    if (hunter) {
      lines.push(
        "",
        passed ? `<b>Охотник:</b> заявка прошла` : `<b>Охотник:</b> <s>отказ</s>`,
        `<i>${escapeHtml(reason)}</i>`,
      );
    }
    if (passed && draft) {
      if (order.source === "web") {
        lines.push(
          "",
          "<b>Что делать:</b> бриф уже на сайте. Свяжитесь по контакту выше — Telegram, почта или телефон.",
          "<i>Автоматически клиенту ничего не пишем.</i>",
        );
      } else {
        lines.push(
          "",
          `<b>Черновик отклика</b> <i>(для площадки, без цены и срока)</i>`,
          `<blockquote expandable>${escapeHtml(draft)}</blockquote>`,
          "<i>Скопируйте на фриланс. В этот чат клиенту не уходит.</i>",
        );
      }
    }
    if (!passed) {
      lines.push("", "<i>Клиенту не пишем.</i>");
    }
    return lines.join("\n");
  },

  webThanks(orderId: string) {
    const link = botLink(orderId);
    return [
      `Заявку получил ${producerName}.`,
      link
        ? `Если удобнее продолжить в Telegram: ${link}`
        : "Можно написать нам в Telegram и прислать номер заявки: " + orderId,
    ].join(" ");
  },

  botDeepLink: botLink,
};

export { botLink };
