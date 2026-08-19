import { studio } from "../config";
import type { Order, SpecJson } from "../types";
import { runJsonAgent } from "./llm";

export async function buildSpec(order: Order, notes?: string): Promise<SpecJson> {
  const version = (order.spec?.version ?? 0) + 1;
  const fallback: SpecJson = {
    version,
    goal: order.brief.goal || "Сайт под задачу клиента",
    stack: order.hunter?.stackGuess?.length ? order.hunter.stackGuess : ["next", "react"],
    scope: ["Главная", "Услуги или каталог", "Форма заявки", "Адаптив"],
    outOfScope: ["Интеграции вне брифа", "Контент-маркетинг", "SEO-продвижение"],
    acceptance: [
      "Страницы из состава открываются",
      "Форма отправляет заявку",
      "Совпадает с зафиксированным составом",
    ],
    risks: ["Контент от клиента может задержать срок"],
    stages: [
      { id: 1, title: "Каркас и контентные экраны", doneWhen: "Все экраны из состава на месте" },
      { id: 2, title: "Формы, адаптив, сдача", doneWhen: "Форма работает, демо можно открыть" },
    ],
    priceRub: order.pricing?.priceRub ?? studio.minBudgetRub,
    timelineDays: order.pricing?.timelineDays ?? 21,
  };

  const generated = await runJsonAgent<SpecJson>({
    name: "spec",
    system: `Ты собираешь spec.json — единственный документ для кода.
Поля: version, goal, stack[], scope[], outOfScope[], acceptance[], risks[], stages[{id,title,doneWhen}], priceRub, timelineDays.
Новое требование нельзя прятать в текущий заказ: только новая версия.
Код по этому файлу ещё нельзя писать, пока человек не зафиксирует ТЗ.
JSON = spec.json`,
    user: JSON.stringify(
      {
        version,
        notes: notes ?? order.specNotes ?? "",
        previous: order.spec ?? null,
        lead: order.leadText,
        brief: order.brief,
        pricing: order.pricing,
      },
      null,
      2,
    ),
    fallback,
  });

  return { ...generated, version };
}
