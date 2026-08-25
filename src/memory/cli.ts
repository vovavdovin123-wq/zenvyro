import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  type CbmFlags,
  type CbmTool,
  type RunCbmOptions,
  ensureIndexed,
  projectName,
  runCbm,
} from "./cbm";
import { asNamePattern } from "./context";

export type MemoryCli = {
  repoPath: string;
  command: string;
  flags: Record<string, string>;
  positionals: string[];
};

const COMMANDS: Record<string, CbmTool | "index"> = {
  index: "index",
  status: "index_status",
  arch: "get_architecture",
  architecture: "get_architecture",
  search: "search_graph",
  trace: "trace_path",
  impact: "detect_changes",
  snippet: "get_code_snippet",
  code: "search_code",
  query: "query_graph",
};

export function parseMemoryArgs(argv: string[], cwd = process.cwd()): MemoryCli {
  let repoPath = cwd;
  const flags: Record<string, string> = {};
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo" || arg === "--repo-path") {
      repoPath = argv[i + 1] ?? repoPath;
      i += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = "true";
      } else {
        flags[key] = next;
        i += 1;
      }
      continue;
    }
    positionals.push(arg);
  }

  return {
    repoPath: path.resolve(repoPath),
    command: positionals[0] ?? "arch",
    flags,
    positionals: positionals.slice(1),
  };
}

function take(flags: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    if (flags[key] !== undefined) return flags[key];
  }
  return undefined;
}

function flagsForCommand(parsed: MemoryCli): { tool: CbmTool; flags: CbmFlags } {
  const mapped = COMMANDS[parsed.command];
  if (!mapped) {
    throw new Error(
      `Unknown command "${parsed.command}". Use: index, arch, search, trace, impact, snippet, code, query, status`,
    );
  }

  const project = take(parsed.flags, "project") ?? projectName(parsed.repoPath);

  if (mapped === "index") {
    return { tool: "index_repository", flags: { repoPath: parsed.repoPath } };
  }

  if (mapped === "search_graph") {
    const name = take(parsed.flags, "name", "name-pattern", "namePattern") ?? parsed.positionals[0];
    return {
      tool: mapped,
      flags: {
        project,
        namePattern: name ? asNamePattern(name) : undefined,
        label: take(parsed.flags, "label"),
        filePattern: take(parsed.flags, "file", "file-pattern", "filePattern"),
        limit: take(parsed.flags, "limit") ? Number(take(parsed.flags, "limit")) : 20,
      },
    };
  }

  if (mapped === "trace_path") {
    const fn = take(parsed.flags, "function", "function-name", "functionName", "name") ?? parsed.positionals[0];
    if (!fn) throw new Error("trace needs a function name");
    return {
      tool: mapped,
      flags: {
        project,
        functionName: fn,
        direction: take(parsed.flags, "direction") ?? "both",
        depth: take(parsed.flags, "depth") ? Number(take(parsed.flags, "depth")) : undefined,
      },
    };
  }

  if (mapped === "get_code_snippet") {
    const qname = take(parsed.flags, "qname", "qualified-name", "qualifiedName") ?? parsed.positionals[0];
    if (!qname) throw new Error("snippet needs a qualified name");
    return { tool: mapped, flags: { project, qualifiedName: qname } };
  }

  if (mapped === "search_code") {
    const query = take(parsed.flags, "query", "q") ?? parsed.positionals.join(" ");
    if (!query) throw new Error("code needs a search string");
    return { tool: mapped, flags: { project, query } };
  }

  if (mapped === "query_graph") {
    const query = take(parsed.flags, "query", "q") ?? parsed.positionals.join(" ");
    if (!query) throw new Error("query needs a Cypher string");
    return { tool: mapped, flags: { project, query } };
  }

  return { tool: mapped, flags: { project } };
}

export async function runMemoryCommand(argv: string[], options: RunCbmOptions = {}) {
  const parsed = parseMemoryArgs(argv, options.cwd ?? process.cwd());
  const repoPath = options.repoPath ?? parsed.repoPath;
  const run = { ...options, repoPath };

  if (parsed.command === "index") {
    return ensureIndexed(repoPath, run);
  }

  const { tool, flags } = flagsForCommand({ ...parsed, repoPath });
  if (tool !== "index_repository") {
    await ensureIndexed(repoPath, run);
  }
  return runCbm(tool, flags, run);
}

function launchedFromCli() {
  const arg = process.argv[1];
  if (!arg) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(arg)).href;
  } catch {
    return /memory[\\/]cli\.(ts|js|mjs)$/.test(arg);
  }
}

async function main() {
  await import("../studio/loadEnv");
  const result = await runMemoryCommand(process.argv.slice(2));
  const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
  process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
}

if (launchedFromCli()) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
