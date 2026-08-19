import { studio } from "../config";
import type { Order } from "../types";
import { runJsonAgent } from "./llm";

export async function runQa(order: Order) {
  if (!order.spec) {
    return {
      pass: false,
      report: "Нет зафиксированного ТЗ. QA без spec.json не проводится.",
    };
  }

  const lastRun = order.development.runs.at(-1);

  return runJsonAgent<{ pass: boolean; report: string }>({
    name: "qa",
    system: `Ты QA студии ${studio.name}.
Сверяешь сборку ТОЛЬКО с зафиксированным spec.json.
Код на этом шаге сам не чинишь. Не предлагай «заодно добавить».
pass=true только если состав и критерии приёмки закрыты.
JSON: { "pass": boolean, "report": string }`,
    user: JSON.stringify(
      {
        spec: order.spec,
        lastStage: lastRun,
        reworkCount: order.development.reworkCount,
      },
      null,
      2,
    ),
    fallback: {
      pass: Boolean(lastRun?.report),
      report: lastRun
        ? `Сверка с ТЗ v${order.spec.version}: этап «${lastRun.title}». Человек открывает демо только после своего подтверждения.`
        : "Нет отчёта этапа. Возврат в разработку.",
    },
  });
}
