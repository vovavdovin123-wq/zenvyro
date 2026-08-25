import { collectNamed, ensureIndexed, projectName, runCbm, shouldSkipMemory } from "./cbm";
import type { RunCbmOptions } from "./cbm";

export const GRAPH_PROMPT_LIMIT = 8_000;
export const SEARCH_PROMPT_LIMIT = 4_000;

const IDENT = /[A-Za-z][A-Za-z0-9_]{2,}/g;

export function compactJson(value: unknown, maxChars = GRAPH_PROMPT_LIMIT) {
  const full = JSON.stringify(value);
  if (!full) return "";
  if (full.length <= maxChars) return full;
  return `${full.slice(0, Math.max(0, maxChars - 1))}…`;
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function asNamePattern(raw: string) {
  const value = raw.trim();
  if (!value) return value;
  if (/[.*+?^${}()|[\]\\]/.test(value)) return value;
  return `.*${value}.*`;
}

export function stageNamePattern(text: string) {
  const unique = [...new Set((text.match(IDENT) ?? []).filter((token) => token.length >= 3))];
  if (!unique.length) return undefined;
  return unique.slice(0, 6).map(escapeRegex).join("|");
}

export type GraphContext = {
  architecture?: unknown;
  search?: unknown;
  routes?: string[];
};

export function graphPromptBlock(graph: GraphContext | undefined) {
  if (!graph) return "";
  const parts = ["Факты графа кода (не угадывай структуру, не читай репо целиком):"];
  if (graph.architecture !== undefined) {
    parts.push(`architecture:\n${compactJson(graph.architecture)}`);
  }
  if (graph.search !== undefined) {
    parts.push(`search:\n${compactJson(graph.search, SEARCH_PROMPT_LIMIT)}`);
  }
  if (graph.routes?.length) {
    parts.push(`routes:\n${graph.routes.join("\n")}`);
  }
  return parts.length > 1 ? parts.join("\n\n") : "";
}

export async function studioGraphContext(
  kind: "dev" | "qa",
  extra: { namePattern?: string; repoPath?: string; run?: RunCbmOptions } = {},
): Promise<GraphContext | undefined> {
  const env = extra.run?.env ?? process.env;
  if (env.VERCEL) return undefined;
  if (!extra.run?.bin && shouldSkipMemory(env, extra.run)) return undefined;

  const repoPath = extra.repoPath ?? extra.run?.repoPath ?? process.cwd();
  const run = { ...extra.run, repoPath };

  try {
    await ensureIndexed(repoPath, run);
    const project = projectName(repoPath);
    const [architecture, search, routes] = await Promise.all([
      kind === "dev" ? runCbm("get_architecture", { project }, run) : Promise.resolve(undefined),
      extra.namePattern
        ? runCbm("search_graph", { project, namePattern: extra.namePattern, limit: 20 }, run)
        : Promise.resolve(undefined),
      kind === "qa"
        ? runCbm("search_graph", { project, label: "Route", limit: 40 }, run)
        : Promise.resolve(undefined),
    ]);

    return {
      architecture,
      search,
      routes: routes !== undefined ? collectNamed(routes) : undefined,
    };
  } catch (error) {
    console.error("[zenvyro] codebase memory", error);
    return undefined;
  }
}
