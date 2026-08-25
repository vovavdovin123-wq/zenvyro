import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function dataDir() {
  return path.join(process.cwd(), "data");
}

function usagePath() {
  return path.join(dataDir(), "usage.json");
}

export type UsageEvent = {
  at: string;
  agent: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  mode: "llm" | "fallback";
};

export type AgentUsage = {
  calls: number;
  llmCalls: number;
  fallbackCalls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  byAgent: Record<string, { calls: number; llmCalls: number; totalTokens: number }>;
};

const emptyUsage = (): AgentUsage => ({
  calls: 0,
  llmCalls: 0,
  fallbackCalls: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  byAgent: {},
});

let queue: Promise<unknown> = Promise.resolve();

function lock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readEvents(): Promise<UsageEvent[]> {
  try {
    const raw = await readFile(usagePath(), "utf8");
    const parsed = JSON.parse(raw) as { events?: UsageEvent[] };
    return Array.isArray(parsed.events) ? parsed.events : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export function summarizeUsage(events: UsageEvent[]): AgentUsage {
  const summary = emptyUsage();
  for (const event of events) {
    summary.calls += 1;
    if (event.mode === "llm") summary.llmCalls += 1;
    else summary.fallbackCalls += 1;
    summary.promptTokens += event.promptTokens;
    summary.completionTokens += event.completionTokens;
    summary.totalTokens += event.totalTokens;
    const bucket = summary.byAgent[event.agent] ?? { calls: 0, llmCalls: 0, totalTokens: 0 };
    bucket.calls += 1;
    if (event.mode === "llm") bucket.llmCalls += 1;
    bucket.totalTokens += event.totalTokens;
    summary.byAgent[event.agent] = bucket;
  }
  return summary;
}

export async function recordUsage(event: Omit<UsageEvent, "at"> & { at?: string }) {
  try {
    await lock(async () => {
      const events = await readEvents();
      events.push({
        at: event.at ?? new Date().toISOString(),
        agent: event.agent,
        model: event.model,
        promptTokens: event.promptTokens,
        completionTokens: event.completionTokens,
        totalTokens: event.totalTokens,
        mode: event.mode,
      });
      await mkdir(dataDir(), { recursive: true });
      await writeFile(usagePath(), JSON.stringify({ events }, null, 2));
    });
  } catch (error) {
    console.error("[zenvyro] usage", error);
  }
}

export async function listUsage(): Promise<AgentUsage> {
  try {
    return summarizeUsage(await readEvents());
  } catch (error) {
    console.error("[zenvyro] usage read", error);
    return emptyUsage();
  }
}
