import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  type CbmExec,
  buildCbmInvocation,
  cacheDir,
  collectNamed,
  ensureIndexed,
  flagArgs,
  findCbmBin,
  parseCbmStdout,
  runCbm,
  shouldSkipMemory,
} from "@/memory/cbm";
import { parseMemoryArgs, runMemoryCommand } from "@/memory/cli";
import {
  asNamePattern,
  compactJson,
  graphPromptBlock,
  stageNamePattern,
  studioGraphContext,
} from "@/memory/context";
import { readSrc } from "./helpers";

describe("cbm flags and invocation", () => {
  it("turns camelCase flags into kebab-case argv", () => {
    expect(flagArgs({ repoPath: "/tmp/repo", namePattern: ".*Handler.*", limit: 20, json: true })).toEqual([
      "--repo-path",
      "/tmp/repo",
      "--name-pattern",
      ".*Handler.*",
      "--limit",
      "20",
      "--json",
    ]);
  });

  it("sets CBM_CACHE_DIR and CBM_ALLOWED_ROOT from the repo", () => {
    const repo = path.resolve("/tmp/zenvyro-client");
    const invocation = buildCbmInvocation(
      "search_graph",
      { namePattern: ".*Order.*" },
      { repoPath: repo, bin: "/opt/cbm", env: { PATH: "" } },
    );
    expect(invocation.bin).toBe("/opt/cbm");
    expect(invocation.cwd).toBe(repo);
    expect(invocation.args).toEqual([
      "cli",
      "--json",
      "search_graph",
      "--name-pattern",
      ".*Order.*",
      "--project",
      "zenvyro-client",
    ]);
    expect(invocation.env.CBM_CACHE_DIR).toBe(cacheDir(repo));
    expect(invocation.env.CBM_ALLOWED_ROOT).toBe(repo);
  });

  it("indexes with an absolute --repo-path", () => {
    const repo = path.resolve("/tmp/app");
    const invocation = buildCbmInvocation("index_repository", {}, { repoPath: repo, bin: "/opt/cbm", env: {} });
    expect(invocation.args).toContain("--repo-path");
    expect(invocation.args).toContain(repo);
    expect(invocation.args).not.toContain("--project");
  });
});

describe("binary discovery", () => {
  it("prefers CBM_BIN, then PATH, then node_modules/.bin", () => {
    const exists = (file: string) =>
      file === "/custom/cbm" || file === "/usr/bin/codebase-memory-mcp" || file.endsWith(`${path.sep}node_modules${path.sep}.bin${path.sep}codebase-memory-mcp`);

    expect(
      findCbmBin({
        env: { CBM_BIN: "/custom/cbm", PATH: "/usr/bin" },
        cwd: "/proj",
        exists,
        platform: "linux",
      }),
    ).toBe("/custom/cbm");

    expect(
      findCbmBin({
        env: { PATH: "/usr/bin" },
        cwd: "/proj",
        exists,
        platform: "linux",
      }),
    ).toBe("/usr/bin/codebase-memory-mcp");

    expect(
      findCbmBin({
        env: { PATH: "" },
        cwd: "/proj",
        exists,
        platform: "linux",
      }),
    ).toBe(path.join("/proj", "node_modules", ".bin", "codebase-memory-mcp"));
  });

  it("skips when Vercel or the binary is missing", () => {
    expect(shouldSkipMemory({ VERCEL: "1", CBM_BIN: "/custom/cbm" }, { exists: () => true })).toBe(true);
    expect(shouldSkipMemory({ PATH: "" }, { exists: () => false, cwd: "/tmp", platform: "linux" })).toBe(true);
  });

  it("throws a skip-config install hint when the binary is missing", () => {
    expect(() =>
      buildCbmInvocation("get_architecture", {}, { env: { PATH: "" }, exists: () => false }),
    ).toThrow(/install\.ps1 --skip-config/);
  });
});

describe("stdout and names", () => {
  it("parses a JSON object hidden behind log noise", () => {
    expect(parseCbmStdout("warming\n{\"status\":\"indexed\"}\n")).toEqual({ status: "indexed" });
  });

  it("unwraps MCP envelopes into names", () => {
    expect(
      collectNamed({
        structuredContent: {
          results: [{ name: "GET /api/orders" }, { qualified_name: "src.app.api.studio.GET" }],
        },
      }),
    ).toEqual(["GET /api/orders", "src.app.api.studio.GET"]);
  });
});

describe("ensureIndexed", () => {
  it("runs index_repository when status is empty", async () => {
    const tools: string[] = [];
    const exec: CbmExec = async (_file, args) => {
      tools.push(String(args[2]));
      if (args[2] === "index_status") return { stdout: "{}", stderr: "" };
      return { stdout: JSON.stringify({ status: "indexed" }), stderr: "" };
    };
    await ensureIndexed("/tmp/repo", { exec, bin: "/opt/cbm", env: {} });
    expect(tools).toEqual(["index_status", "index_repository"]);
  });

  it("skips index_repository when the graph is already ready", async () => {
    const tools: string[] = [];
    const exec: CbmExec = async (_file, args) => {
      tools.push(String(args[2]));
      return { stdout: JSON.stringify({ status: "indexed", node_count: 12 }), stderr: "" };
    };
    await ensureIndexed("/tmp/repo", { exec, bin: "/opt/cbm", env: {} });
    expect(tools).toEqual(["index_status"]);
  });
});

describe("prompt helpers", () => {
  it("truncates architecture JSON for the agent prompt", () => {
    const text = compactJson({ routes: "x".repeat(200) }, 40);
    expect(text.endsWith("…")).toBe(true);
    expect(text.length).toBe(40);
  });

  it("builds a graph block that forbids file-by-file reading", () => {
    const block = graphPromptBlock({
      architecture: { packages: ["src/studio"] },
      search: { results: [{ name: "runDevStage" }] },
    });
    expect(block).toContain("не читай репо целиком");
    expect(block).toContain("runDevStage");
  });

  it("turns stage English tokens into a name pattern", () => {
    expect(stageNamePattern("Каркас Next FormHero")).toBe("Next|FormHero");
    expect(asNamePattern("Handler")).toBe(".*Handler.*");
  });
});

describe("memory CLI", () => {
  it("accepts --repo before the command", () => {
    const parsed = parseMemoryArgs(["--repo", "/tmp/client", "search", "--name", "Handler"], "/workspace");
    expect(parsed.command).toBe("search");
    expect(parsed.repoPath).toBe(path.resolve("/tmp/client"));
    expect(parsed.flags.name).toBe("Handler");
  });

  it("maps search/trace onto CLI tools", async () => {
    const tools: string[] = [];
    const exec: CbmExec = async (_file, args) => {
      tools.push(args.join(" "));
      if (args[2] === "index_status") {
        return { stdout: JSON.stringify({ status: "indexed", nodes: 3 }), stderr: "" };
      }
      return { stdout: JSON.stringify({ results: [] }), stderr: "" };
    };
    await runMemoryCommand(["search", "--name", "Handler", "--label", "Function"], {
      exec,
      bin: "/opt/cbm",
      cwd: "/tmp/zenvyro",
      env: {},
    });
    const search = tools.find((line) => line.includes("search_graph"));
    expect(search).toContain("--name-pattern");
    expect(search).toContain(".*Handler.*");
    expect(search).toContain("--label");
    expect(search).toContain("Function");
  });
});

describe("studio graph context", () => {
  it("returns undefined without a binary", async () => {
    const graph = await studioGraphContext("dev", {
      run: { env: { PATH: "" }, exists: () => false },
    });
    expect(graph).toBeUndefined();
  });

  it("loads architecture for dev and routes for qa", async () => {
    const exec: CbmExec = async (_file, args) => {
      const tool = String(args[2]);
      if (tool === "index_status") return { stdout: JSON.stringify({ status: "ready" }), stderr: "" };
      if (tool === "get_architecture") return { stdout: JSON.stringify({ packages: ["src"] }), stderr: "" };
      if (tool === "search_graph" && args.includes("Route")) {
        return { stdout: JSON.stringify({ results: [{ name: "GET /api/studio" }] }), stderr: "" };
      }
      return { stdout: JSON.stringify({ results: [{ name: "runDevStage" }] }), stderr: "" };
    };

    const dev = await studioGraphContext("dev", {
      namePattern: "runDevStage",
      repoPath: "/tmp/zenvyro",
      run: { exec, bin: "/opt/cbm", env: {} },
    });
    expect(dev?.architecture).toEqual({ packages: ["src"] });
    expect(dev?.search).toEqual({ results: [{ name: "runDevStage" }] });

    const qa = await studioGraphContext("qa", {
      repoPath: "/tmp/zenvyro",
      run: { exec, bin: "/opt/cbm", env: {} },
    });
    expect(qa?.routes).toEqual(["GET /api/studio"]);
  });
});

describe("agent wiring", () => {
  it("dev injects graph facts into the prompt", () => {
    const src = readSrc("studio", "agents", "dev.ts");
    expect(src).toContain("studioGraphContext");
    expect(src).toContain("graphPromptBlock");
  });

  it("qa passes graph routes next to spec.json", () => {
    const src = readSrc("studio", "agents", "qa.ts");
    expect(src).toContain("studioGraphContext");
    expect(src).toContain("routes: graph?.routes");
  });
});

describe("runCbm", () => {
  it("does not spawn a shell", async () => {
    const exec = vi.fn<CbmExec>(async () => ({ stdout: "{}", stderr: "" }));
    await runCbm("get_architecture", {}, { exec, bin: "/opt/cbm", repoPath: "/tmp/repo", env: {} });
    expect(exec).toHaveBeenCalledTimes(1);
    const options = exec.mock.calls[0]?.[2] as { cwd?: string; timeout?: number };
    expect(options.cwd).toBe(path.resolve("/tmp/repo"));
    expect(options.timeout).toBeGreaterThan(0);
  });
});
