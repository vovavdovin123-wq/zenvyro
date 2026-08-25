import { execFile as execFileCb, type ExecFileOptions } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

export const CBM_TOOLS = [
  "index_repository",
  "search_graph",
  "trace_path",
  "detect_changes",
  "get_architecture",
  "get_code_snippet",
  "search_code",
  "query_graph",
  "index_status",
] as const;

export type CbmTool = (typeof CBM_TOOLS)[number];
export type CbmFlags = Record<string, string | number | boolean | undefined>;

export type CbmExec = (
  file: string,
  args: string[],
  options: ExecFileOptions,
) => Promise<{ stdout: string; stderr: string }>;

const defaultExec = promisify(execFileCb) as CbmExec;

const BIN = "codebase-memory-mcp";
const INDEX_TIMEOUT_MS = 180_000;
const QUERY_TIMEOUT_MS = 30_000;
const MAX_BUFFER = 8 * 1024 * 1024;

export class CbmMissingError extends Error {
  constructor() {
    super(
      "codebase-memory-mcp binary not found. Install the binary only (no MCP): run install.ps1 --skip-config from https://github.com/DeusData/codebase-memory-mcp/releases or set CBM_BIN to the executable.",
    );
    this.name = "CbmMissingError";
  }
}

export class CbmCliError extends Error {
  constructor(
    message: string,
    readonly stderr = "",
    readonly code: string | number | null = null,
  ) {
    super(message);
    this.name = "CbmCliError";
  }
}

export type FindBinOptions = {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  exists?: (file: string) => boolean;
  platform?: string;
};

export type RunCbmOptions = {
  repoPath?: string;
  timeoutMs?: number;
  bin?: string;
  exec?: CbmExec;
  env?: NodeJS.ProcessEnv;
  exists?: (file: string) => boolean;
  cwd?: string;
};

function existsFn(options?: { exists?: (file: string) => boolean }) {
  return (
    options?.exists ??
    ((file: string) => {
      try {
        return fs.existsSync(file);
      } catch {
        return false;
      }
    })
  );
}

function binNames(platform: string) {
  return platform === "win32" ? [`${BIN}.exe`, `${BIN}.cmd`, `${BIN}.bat`, BIN] : [BIN];
}

export function cacheDir(repoRoot: string) {
  return path.join(path.resolve(repoRoot), ".codebase-memory", "cache");
}

export function projectName(repoPath: string) {
  return path.basename(path.resolve(repoPath)) || "project";
}

export function flagArgs(flags: CbmFlags) {
  const args: string[] = [];
  for (const [key, value] of Object.entries(flags)) {
    if (value === undefined || value === false) continue;
    const flag = `--${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
    if (value === true) args.push(flag);
    else args.push(flag, String(value));
  }
  return args;
}

export function findCbmBin(options: FindBinOptions = {}) {
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const cwd = options.cwd ?? process.cwd();
  const exists = existsFn(options);
  const names = binNames(platform);

  const explicit = (env.CBM_BIN ?? "").trim();
  if (explicit) return exists(explicit) ? explicit : undefined;

  const pathEnv = env.PATH ?? env.Path ?? "";
  const delimiter = platform === "win32" ? ";" : ":";
  const extensions =
    platform === "win32"
      ? (env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";").filter(Boolean)
      : [""];

  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) continue;
    for (const name of names) {
      const full = path.join(dir, name);
      if (exists(full)) return full;
      if (platform === "win32" && !path.extname(name)) {
        for (const ext of extensions) {
          const withExt = path.join(dir, `${name}${ext}`);
          if (exists(withExt)) return withExt;
        }
      }
    }
  }

  for (const name of names) {
    const local = path.join(cwd, "node_modules", ".bin", name);
    if (exists(local)) return local;
  }

  return undefined;
}

export function shouldSkipMemory(env: NodeJS.ProcessEnv = process.env, options: FindBinOptions = {}) {
  if (env.VERCEL) return true;
  return !findCbmBin({ ...options, env });
}

export function parseCbmStdout(stdout: string) {
  const text = stdout.trim();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const start = text.indexOf("{") >= 0 ? text.indexOf("{") : text.indexOf("[");
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as unknown;
    }
    throw new CbmCliError("codebase-memory-mcp CLI did not return JSON", text);
  }
}

export function unwrapCbm(result: unknown): unknown {
  if (!result || typeof result !== "object") return result;
  const row = result as Record<string, unknown>;
  if (row.structuredContent && typeof row.structuredContent === "object") {
    return unwrapCbm(row.structuredContent);
  }
  if (row.result && typeof row.result === "object") return unwrapCbm(row.result);
  return result;
}

export function collectNamed(result: unknown, limit = 40) {
  const unwrapped = unwrapCbm(result);
  const list = Array.isArray(unwrapped)
    ? unwrapped
    : Array.isArray((unwrapped as { results?: unknown[] } | null)?.results)
      ? ((unwrapped as { results: unknown[] }).results)
      : Array.isArray((unwrapped as { nodes?: unknown[] } | null)?.nodes)
        ? ((unwrapped as { nodes: unknown[] }).nodes)
        : [];
  const names: string[] = [];
  for (const item of list) {
    if (names.length >= limit) break;
    if (typeof item === "string") {
      names.push(item);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = row.name ?? row.qualified_name ?? row.qualifiedName ?? row.path ?? row.id;
    if (typeof name === "string" && name.trim()) names.push(name.trim());
  }
  return names;
}

function isIndexedStatus(result: unknown): boolean {
  const status = unwrapCbm(result);
  if (!status || typeof status !== "object") return false;
  const row = status as Record<string, unknown>;
  const value = String(row.status ?? row.state ?? row.index_status ?? "").toLowerCase();
  if (["indexed", "ready", "complete", "ok", "idle", "success"].includes(value)) return true;
  if (row.indexed === true || row.ready === true) return true;
  if (typeof row.node_count === "number" && row.node_count > 0) return true;
  if (typeof row.nodes === "number" && row.nodes > 0) return true;
  if (typeof row.edge_count === "number" && row.edge_count > 0) return true;
  return false;
}

export function buildCbmInvocation(
  tool: CbmTool,
  flags: CbmFlags = {},
  options: RunCbmOptions = {},
) {
  const env = options.env ?? process.env;
  const repoPath = path.resolve(options.repoPath ?? options.cwd ?? process.cwd());
  const bin = options.bin ?? findCbmBin({ env, cwd: options.cwd ?? process.cwd(), exists: options.exists });
  if (!bin) throw new CbmMissingError();

  const merged: CbmFlags = { ...flags };
  if (tool === "index_repository") {
    merged.repoPath = typeof merged.repoPath === "string" ? path.resolve(merged.repoPath) : repoPath;
  } else if (merged.project === undefined) {
    merged.project = projectName(repoPath);
  }

  const nextEnv: NodeJS.ProcessEnv = {
    ...env,
    CBM_CACHE_DIR: env.CBM_CACHE_DIR || cacheDir(repoPath),
    CBM_ALLOWED_ROOT: env.CBM_ALLOWED_ROOT || repoPath,
  };

  return {
    bin,
    args: ["cli", "--json", tool, ...flagArgs(merged)],
    env: nextEnv,
    cwd: repoPath,
    timeoutMs: options.timeoutMs ?? (tool === "index_repository" ? INDEX_TIMEOUT_MS : QUERY_TIMEOUT_MS),
  };
}

export async function runCbm(tool: CbmTool, flags: CbmFlags = {}, options: RunCbmOptions = {}) {
  const invocation = buildCbmInvocation(tool, flags, options);
  const exec = options.exec ?? defaultExec;
  try {
    const { stdout, stderr } = await exec(invocation.bin, invocation.args, {
      cwd: invocation.cwd,
      env: invocation.env,
      timeout: invocation.timeoutMs,
      maxBuffer: MAX_BUFFER,
      windowsHide: true,
      encoding: "utf8",
    });
    if (stderr.trim()) {
      console.error("[zenvyro:memory]", stderr.trim());
    }
    return parseCbmStdout(stdout);
  } catch (error) {
    if (error instanceof CbmMissingError || error instanceof CbmCliError) throw error;
    const err = error as {
      stdout?: string;
      stderr?: string;
      message?: string;
      code?: string | number | null;
    };
    if (err.stdout) {
      try {
        return parseCbmStdout(err.stdout);
      } catch {
        // fall through to CLI error
      }
    }
    throw new CbmCliError(
      err.stderr?.trim() || err.message || `codebase-memory-mcp ${tool} failed`,
      err.stderr ?? "",
      err.code ?? null,
    );
  }
}

export async function ensureIndexed(repoPath: string, options: RunCbmOptions = {}) {
  const opts = { ...options, repoPath };
  try {
    const status = await runCbm("index_status", { project: projectName(repoPath) }, opts);
    if (isIndexedStatus(status)) return status;
  } catch (error) {
    if (error instanceof CbmMissingError) throw error;
  }
  return runCbm("index_repository", { repoPath }, opts);
}
