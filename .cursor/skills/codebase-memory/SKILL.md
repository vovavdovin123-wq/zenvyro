---
name: codebase-memory
description: >-
  Queries the local codebase-memory-mcp CLI (not MCP) for architecture, callers,
  routes, and git impact. Use when exploring this repo, tracing who calls a
  function, listing HTTP routes, finding dead code, or checking a diff's blast radius.
---

# Codebase memory (CLI, not MCP)

Do not use the codebase-memory MCP server. Query the graph with `npm run memory -- …`.

## Workflow

1. If the graph may be empty or stale: `npm run memory -- index`
2. Structural questions: `arch`, `search`, `trace`, `impact` — not a full-repo grep
3. Then `Read` only the files the graph points to

## Commands

```bash
npm run memory -- index
npm run memory -- arch
npm run memory -- search --name Handler --label Function
npm run memory -- trace ProcessOrder --direction inbound
npm run memory -- impact
npm run memory -- snippet <qualifiedName>
npm run memory -- code "retry backoff"
npm run memory -- query "MATCH (f:Function) RETURN f.name LIMIT 5"
npm run memory -- --repo /path/to/other/checkout arch
```

`search --name` accepts a literal or a regex. Labels include `Function`, `Class`, `Route`, `File`.

If the CLI errors with "binary not found", stop guessing the layout from random file reads and say the binary is missing (`install.ps1 --skip-config` or `CBM_BIN`).
