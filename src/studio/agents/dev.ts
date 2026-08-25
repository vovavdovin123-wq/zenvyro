import { graphPromptBlock, stageNamePattern, studioGraphContext } from "../../memory/context";
import { codebaseMemory, cursorDev, studio } from "../config";
import type { Order, StageRun } from "../types";
import { runJsonAgent } from "./llm";

export async function runDevStage(order: Order): Promise<StageRun> {
  if (!order.spec) {
    throw new Error("Код нельзя начинать: нет зафиксированного ТЗ");
  }
  if (!order.prepaymentReceived) {
    throw new Error("Код нельзя начинать: нет предоплаты");
  }

  const stage =
    order.spec.stages.find((item) => item.id === order.development.currentStageId) ??
    order.spec.stages[0];

  const memory = codebaseMemory();
  const graph = await studioGraphContext("dev", {
    repoPath: memory.repo,
    namePattern: stageNamePattern(`${stage.title} ${stage.doneWhen} ${order.spec.scope.join(" ")}`),
    run: { bin: memory.bin || undefined },
  });

  const prompt = [
    `Студия ${studio.name}. Один этап = один PR.`,
    `Этап ${stage.id}: ${stage.title}.`,
    `Готово, когда: ${stage.doneWhen}.`,
    `Работай СТРОГО по spec.json. Не добавляй фичи вне состава.`,
    JSON.stringify(order.spec, null, 2),
    graphPromptBlock(graph),
  ]
    .filter(Boolean)
    .join("\n\n");

  let prUrl: string | undefined;
  let cursorAgentId: string | undefined;
  let report: string;

  if (cursorDev.apiKey) {
    try {
      const spec = "@cursor/" + "sdk";
      const { Agent } = (await import(/* webpackIgnore: true */ spec)) as typeof import("@cursor/sdk");
      const result = await Agent.prompt(prompt, {
        apiKey: cursorDev.apiKey,
        model: { id: cursorDev.model },
        ...(cursorDev.repo
          ? { cloud: { repos: [{ url: cursorDev.repo }] } }
          : { local: { cwd: process.cwd() } }),
      });
      cursorAgentId = result.id;
      prUrl = (result as { prUrl?: string }).prUrl;
      report =
        typeof result.result === "string"
          ? result.result
          : `Этап ${stage.id} отправлен в Cursor. Агент ${result.id}.`;
    } catch (error) {
      report = `Cursor SDK недоступен (${error instanceof Error ? error.message : "ошибка"}). Нужен ручной PR по этапу.`;
    }
  } else {
    const planned = await runJsonAgent<{ report: string }>({
      name: "dev",
      system: `Ты Dev-агент. Один этап = один PR. Не выходишь за spec.json. Не начинай следующий этап.
JSON: { "report": string } — что сделать в этом PR.`,
      user: prompt,
      fallback: {
        report: `Этап ${stage.id} «${stage.title}». Сделать PR строго по ТЗ v${order.spec.version}. Критерий: ${stage.doneWhen}.`,
      },
    });
    report = planned.report;
  }

  return {
    stageId: stage.id,
    title: stage.title,
    report,
    prUrl,
    cursorAgentId,
    accepted: false,
  };
}
