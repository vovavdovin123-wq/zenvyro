import { studio, telegram } from "./config";
import { producerName } from "./site";
import type { Order } from "./types";

function botLink(orderId?: string) {
  const username = telegram.botUsername;
  if (!username) return "";
  return orderId
    ? `https://t.me/${username}?start=${orderId}`
    : `https://t.me/${username}`;
}

export const templates = {
  startClient(name?: string) {
    return [
      `Здравствуйте${name ? `, ${name}` : ""}. Это ${studio.name}.`,
      `Пишет ${producerName}. Расскажите, что нужно сделать — дальше предложим формат.`,
    ].join("\n\n");
  },

  linked(order: Order) {
    return `Заявку ${order.id} вижу. Четыре коротких вопроса по брифу.`;
  },

  briefAsk(field: "goal" | "deadline" | "budget" | "references") {
    const map = {
      goal: "1/4. Какая цель? Что должно произойти после запуска?",
      deadline: "2/4. Какой срок? Дата или «через N недель».",
      budget: "3/4. Какой бюджет? Цифра или вилка.",
      references: "4/4. Один-два ориентира — или напишите, что ориентиров нет.",
    };
    return map[field];
  },

  briefReceived() {
    return "Бриф у студии. Смету пришлём, когда продюсер её утвердит. Пока ничего не оплачивайте.";
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
