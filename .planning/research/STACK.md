# Stack Research

**Domain:** OpenClaw Plugin Development (porting GSD spec-driven dev system)
**Researched:** 2026-03-04
**Confidence:** HIGH — all core claims verified against official docs.openclaw.ai (verified 2026-03-04, OpenClaw v2026.3.2)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | `^5.3.0` | Plugin entry point language | OpenClaw's plugin loader (jiti) runs `.ts` files at runtime without a build step. TypeScript catches type errors early; the official SDK ships `.d.ts` types. All official plugin examples use TS. |
| openclaw (as peerDep) | `>=2026.2.3-1` | Plugin SDK types and runtime helpers | Provides `openclaw/plugin-sdk/core` — the stable public API surface for `registerCommand`, `registerTool`, `registerService`, `api.logger`. Put in `peerDependencies`; runtime resolves the alias via jiti. |
| Node.js | `>=20 LTS` | Runtime for hooks, scripts, gsd-tools.cjs | OpenClaw's npm package targets Node 20+. GSD's existing `gsd-tools.cjs` runs in Node; no rewrite needed if Node ≥ 20 is present on the host. |
| SKILL.md (AgentSkills format) | current | LLM instruction delivery for each GSD command | OpenClaw's primary mechanism for teaching the agent how to use tools. YAML frontmatter + Markdown body. Loaded from `~/.openclaw/skills/<name>/SKILL.md` or workspace. Each GSD slash command gets its own SKILL.md. |
| HOOK.md | current | Lifecycle event handlers (context injection, status) | OpenClaw's automation hook format. YAML frontmatter (`events`, `requires`) + a default-exported JS/TS handler. Replaces Claude Code's `hooks.json` + shell scripts for `agent:bootstrap`, `command:new`, `gateway:startup` events. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@sinclair/typebox` | `^0.32` | JSON Schema generation for `registerTool` parameters | Use instead of hand-written JSON Schema objects. Official docs show `Type.Object(...)` pattern. Only needed in plugin `src/index.ts`, not in SKILL.md files. |
| `typescript` | `^5.3.0` | Type-checking (devDependency only) | Run `tsc --noEmit` for CI type checks. jiti handles runtime transpilation so no `tsc --build` needed. |
| `clawhub` (CLI) | latest (`npm i -g clawhub`) | Publishing/installing skills to ClawHub registry | Use for ClawHub distribution: `clawhub publish ./skills/gsd-new-project --slug gsd-new-project --version 1.0.0`. Not a runtime dependency. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| jiti (bundled in OpenClaw) | Runtime TypeScript transpilation | OpenClaw bundles jiti internally. Plugin `.ts` files are executed directly — no `tsc --build` step during development. |
| `tsc --noEmit` | Type safety CI gate | Add to `package.json` `scripts.typecheck`. Single command to verify all types without emitting files. |
| `openclaw reload` (CLI) | Hot-reload plugins during development | OpenClaw v2026.x supports config reload without restart for plugin changes. Faster than full restart. |

---

## File Format APIs

### Plugin Entry Point (`src/index.ts`)

A plugin is a **default-exported function** receiving `api`:

```typescript
import type { PluginContext } from "openclaw/plugin-sdk/core";
import { Type } from "@sinclair/typebox";

export default function gsdPlugin(api: PluginContext): void {
  // Read config from openclaw.json → plugins.entries.gsd-for-openclaw.config
  const cfg = api.config?.plugins?.entries?.["gsd-for-openclaw"]?.config ?? {};

  // Register an LLM-bypass slash command (no agent invoked)
  api.registerCommand({
    name: "gsd:new-project",   // invoked as /gsd:new-project
    description: "Initialize a new GSD project with PROJECT.md and ROADMAP.md",
    acceptsArgs: true,
    requireAuth: true,
    handler(ctx, args) {
      return { text: "..." };  // must return { text: string }
    },
  });

  // Register an agent tool (LLM can call this)
  api.registerTool(
    {
      name: "gsd_plan_phase",
      description: "Plan a GSD roadmap phase",
      parameters: Type.Object({ phase: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.phase }] };
      },
    },
    { optional: true },  // optional = user must opt-in via tools.allow
  );

  // Register a lifecycle service
  api.registerService({
    id: "gsd-svc",
    start: () => api.logger.info("[gsd] ready"),
    stop:  () => api.logger.info("[gsd] stopped"),
  });
}
```

**Key rules:**
- `registerCommand` handlers bypass the LLM — for slash commands that return a response directly (status checks, help text). GSD commands that need actual AI work should use SKILL.md + agent invocation, not `registerCommand`.
- `registerTool` with `{ optional: true }` — required for tools that write files or run git. Users opt-in via `tools.allow: ["gsd-for-openclaw"]`.
- `api.config?.plugins?.entries?.["<id>"]?.config` — the config accessor pattern. Always use optional chaining; plugin may not have user config set.
- Return `{ content: [{ type: "text", text: "..." }] }` from `execute` (MCP-compatible tool result format).

### Plugin Manifest (`openclaw.plugin.json`)

```json
{
  "id": "gsd-for-openclaw",
  "name": "GSD for OpenClaw",
  "description": "Spec-driven development system: new-project, plan-phase, execute-phase, and all GSD workflows",
  "version": "1.0.0",
  "skills": ["./skills"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "planningDir": {
        "type": "string",
        "description": "Directory for GSD planning files (default: .planning)"
      }
    }
  },
  "uiHints": {
    "planningDir": { "label": "Planning directory", "placeholder": ".planning" }
  }
}
```

**Key rules:**
- `id` must be globally unique and stable — this is the key used in `openclaw.json` entries.
- `skills` array (paths relative to plugin root) tells OpenClaw to load skill folders bundled with the plugin.
- `configSchema` is validated strictly: `additionalProperties: false` is required, or OpenClaw's Doctor will warn.
- `uiHints` is optional but improves the Control UI for non-technical users.
- Missing or broken manifest blocks config validation for the entire OpenClaw instance — always ship a valid manifest.

### SKILL.md Format

Each GSD command gets its own skill directory:

```
skills/
  gsd-new-project/
    SKILL.md
  gsd-plan-phase/
    SKILL.md
  gsd-execute-phase/
    SKILL.md
  ...
```

SKILL.md structure:

```yaml
---
name: gsd_new_project
description: >
  Initializes a new GSD project. Creates PROJECT.md, REQUIREMENTS.md, and
  ROADMAP.md in .planning/. Use when the user asks to start a new project,
  run /gsd:new-project, or set up spec-driven development.
metadata:
  {
    "openclaw": {
      "requires": { "bins": ["git", "node"] },
      "always": false,
      "emoji": "🚀",
      "homepage": "https://github.com/your-repo/gsd-for-openclaw"
    }
  }
---

# GSD New Project

You are orchestrating a new GSD project initialization. Follow these steps:

1. Spawn a `gsd-project-researcher` sub-agent using the `sessions_spawn` tool...
[detailed workflow instructions]
```

**Key fields:**
- `name` — snake_case identifier. Must be unique across all loaded skills. This is what the agent uses to reference the skill and what ClawHub uses as slug base.
- `description` — this is injected into the LLM system prompt. Write it as a natural-language trigger description ("Use when user asks to..."). This is what makes the agent pick the right skill.
- `metadata.openclaw.requires.bins` — gate the skill on binary presence. Include `["git", "node"]` for GSD since it needs both.
- `metadata.openclaw.always: false` — do not force-load; let gating work.
- The Markdown body is the LLM instruction. For GSD orchestrators, this is where multi-agent coordination is described.

### HOOK.md Format

For GSD hooks (context injection, status line, update checks):

```
hooks/
  gsd-context-monitor/
    HOOK.md
    handler.ts
```

HOOK.md structure:

```yaml
---
name: gsd-context-monitor
description: "Injects GSD planning context before each agent run"
metadata:
  {
    "openclaw": {
      "events": ["agent:bootstrap"],
      "requires": { "bins": ["node"] },
      "emoji": "📋"
    }
  }
---

# GSD Context Monitor

Reads .planning/ files and injects them as context before agent runs.
```

**Supported events (verified):**
- `command:new` — fires when `/new` is issued (session reset)
- `command:reset` — fires on `/reset`
- `command:stop` — fires on `/stop`
- `gateway:startup` — fires after channels start (one-time init)
- `agent:bootstrap` — fires before workspace files are injected into the agent context

Handler export:

```typescript
// handler.ts
export default async function (event: any): Promise<void> {
  // read .planning/ files, inject context, etc.
}
```

### `package.json` Structure

```json
{
  "name": "gsd-for-openclaw",
  "version": "1.0.0",
  "type": "module",
  "description": "GSD spec-driven development system for OpenClaw",
  "main": "src/index.ts",
  "openclaw": {
    "extensions": ["./src/index.ts"]
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "openclaw": ">=2026.2.3-1"
  },
  "devDependencies": {
    "openclaw": "2026.3.2",
    "typescript": "^5.3.0",
    "@sinclair/typebox": "^0.32.0"
  }
}
```

**Critical:** Do NOT use `"openclaw": "workspace:*"` in any published package — this causes `npm install --omit=dev` to fail with `EUNSUPPORTEDPROTOCOL` (known OpenClaw issue #14042).

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "hooks/**/*.ts"]
}
```

---

## Installation

```bash
# Manual install (development / non-ClawHub)
cp -r openclaw-plugin/ ~/.openclaw/extensions/gsd-for-openclaw/

# ClawHub distribution (publishing skills separately)
npm i -g clawhub
clawhub publish ./skills/gsd-new-project --slug gsd-new-project --version 1.0.0 --tags latest

# User installs via ClawHub
clawhub install gsd-new-project

# User enables plugin in openclaw.json
# plugins.entries.gsd-for-openclaw.enabled: true
```

---

## Skills vs Plugins: When to Use Each

This is the most important architectural decision for this port:

| Mechanism | What It Is | When to Use for GSD |
|-----------|-----------|---------------------|
| **SKILL.md** | LLM instruction — tells the agent what to do when triggered | ALL GSD commands that involve LLM reasoning: `new-project`, `plan-phase`, `execute-phase`, `verify-phase`, etc. The agent reads the SKILL.md and follows it. |
| **`registerCommand`** | LLM-bypass handler — runs code without invoking the LLM | Only for commands that return static/computed text: `/gsd:status`, `/gsd:help`. Do NOT use for commands that need AI reasoning. |
| **`registerTool`** | Agent-callable function — LLM decides when to call it | Sub-agent utility tools: file writers, git operations, context loaders. Mark `optional: true` for anything with side effects. |
| **HOOK.md** | Event-driven handler — fires on lifecycle events | GSD's `context-monitor` (inject .planning/ files on `agent:bootstrap`), `check-update` (on `gateway:startup`). |
| **`registerService`** | Background service with start/stop | Minimal use: plugin lifecycle tracking. Not needed for most GSD functionality. |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| TypeScript entry point (`src/index.ts`) | Plain JavaScript (`src/index.js`) | Only if you have no type-checking CI and want to minimize tooling. TS is strictly better here because the SDK ships types and the jiti loader handles transpilation for free. |
| `@sinclair/typebox` for tool schemas | Hand-written JSON Schema objects | For very simple tools with 1-2 string params, hand-written JSON Schema is fine and avoids the import. Use TypeBox when schemas have unions, optional fields, or nesting. |
| SKILL.md per GSD command | Single monolithic SKILL.md | A monolithic SKILL.md injected into every session bloats context. Per-command SKILL.md files are gated at load time, loaded only when their `requires` conditions are met. |
| `openclaw/plugin-sdk/core` import | `openclaw/plugin-sdk` (monolithic) | Use subpath imports. The monolithic `openclaw/plugin-sdk` is deprecated in favor of subpaths (`/core`, `/telegram`, etc.). Subpaths are tree-shakeable and version-stable. |
| `peerDependencies` for openclaw | `dependencies` for openclaw | Never put openclaw in `dependencies` — the runtime resolves its own copy via jiti alias. Having it in `dependencies` causes version conflicts and npm install issues. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Shell scripts as hook handlers | Claude Code hooks used `.sh` files; OpenClaw hooks use JS/TS handlers. Shell scripts in `hooks/` are not auto-executed by OpenClaw's hook system. | `handler.ts` with `export default async function(event)` |
| `hooks.json` (Claude Code format) | Claude Code-specific format not recognized by OpenClaw | `HOOK.md` with YAML frontmatter `events` array |
| `"openclaw": "workspace:*"` in package.json | Breaks `npm install --omit=dev` (EUNSUPPORTEDPROTOCOL, issue #14042) | `"openclaw": ">=2026.2.3-1"` in peerDependencies |
| Building/compiling TS before shipping | jiti loads `.ts` at runtime — `tsc --build` output is not used by OpenClaw | `tsc --noEmit` for type checking only; ship the `.ts` source |
| One giant plugin entry for all 24 commands | Bloats the service; all registerTool calls run at startup | Use SKILL.md for LLM-driven commands; only put utility tools in `registerTool` |
| `registerCommand` for AI-driven GSD workflows | `registerCommand` bypasses the LLM — the handler has no access to the agent | SKILL.md with natural-language instructions; let the agent follow them |

---

## Stack Patterns by Variant

**For GSD orchestrator commands (`new-project`, `plan-phase`, `execute-phase`):**
- Use SKILL.md — the body describes the multi-step workflow
- Reference sub-agent spawning via `sessions_spawn` tool in the SKILL.md instructions
- The agent reads the SKILL.md and orchestrates sub-agents itself

**For GSD utility/status commands (`gsd:status`, `gsd:help`):**
- Use `registerCommand` in `src/index.ts`
- Handler reads `.planning/` files and returns formatted text
- No LLM invocation

**For GSD file-writing operations (what sub-agents do):**
- Use `registerTool` with `optional: true`
- Sub-agents call these tools to write PROJECT.md, ROADMAP.md, etc.
- Mark optional — users must add `gsd-for-openclaw` to `tools.allow`

**For GSD hooks (context injection, update checks):**
- Use HOOK.md + `handler.ts`
- Listen on `agent:bootstrap` for context injection
- Listen on `gateway:startup` for one-time init tasks

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `openclaw@2026.3.2` | `typescript@^5.3.0` | Confirmed by official plugin examples |
| `openclaw@2026.3.2` | `@sinclair/typebox@^0.32` | TypeBox used in official agent-tools docs |
| `openclaw@>=2026.2.3-1` | `node@>=20` | OpenClaw npm package requires Node 20+ |
| GSD's `gsd-tools.cjs` | `node@>=20` | CommonJS module; runs directly in Node 20+; no adaptation needed for hook handlers |

---

## Sources

- [docs.openclaw.ai/tools/plugin](https://docs.openclaw.ai/tools/plugin) — Plugin API: `registerCommand`, `registerTool`, `registerService`, SDK import paths, config schema, slots. **HIGH confidence** (official docs, verified 2026-03-04).
- [docs.openclaw.ai/plugins/manifest](https://docs.openclaw.ai/plugins/manifest) — `openclaw.plugin.json` required fields, validation behavior. **HIGH confidence**.
- [docs.openclaw.ai/plugins/agent-tools](https://docs.openclaw.ai/plugins/agent-tools) — `registerTool` basic and optional patterns, TypeBox usage, rules. **HIGH confidence**.
- [docs.openclaw.ai/tools/skills](https://docs.openclaw.ai/tools/skills) — SKILL.md format, locations, gating, AgentSkills compatibility. **HIGH confidence**.
- [docs.openclaw.ai/tools/creating-skills](https://docs.openclaw.ai/tools/creating-skills) — Step-by-step SKILL.md creation. **HIGH confidence**.
- [docs.openclaw.ai/automation/hooks](https://docs.openclaw.ai/automation/hooks) — HOOK.md format, event types (`command:new`, `agent:bootstrap`, `gateway:startup`), metadata fields. **HIGH confidence**.
- [docs.openclaw.ai/tools/subagents](https://docs.openclaw.ai/tools/subagents) — Sub-agent spawning, tool policy by depth, nested orchestration. **HIGH confidence**.
- [docs.openclaw.ai/tools/clawhub](https://docs.openclaw.ai/tools/clawhub) — ClawHub CLI (`clawhub install`, `clawhub publish`), distribution workflow. **HIGH confidence**.
- [docs.openclaw.ai/tools/slash-commands](https://docs.openclaw.ai/tools/slash-commands) — Built-in vs plugin commands, `nativeSkills`, surface behavior. **HIGH confidence**.
- [npmjs.com/package/openclaw](https://www.npmjs.com/package/openclaw) — `openclaw` npm package, version 2026.3.2, ~796K weekly downloads. **HIGH confidence**.
- [github.com/openclaw/openclaw/issues/14042](https://github.com/openclaw/openclaw/issues/14042) — `workspace:*` devDependency bug. **HIGH confidence** (official repo issue).
- GitHub Releases API — confirmed latest release `v2026.3.2`, published 2026-03-03. **HIGH confidence**.
- [dev.to/wonderlab/openclaw-deep-dive-4-plugin-sdk-and-extension-development](https://dev.to/wonderlab/openclaw-deep-dive-4-plugin-sdk-and-extension-development-51ki) — peerDependencies pattern, jiti alias, TS runtime loading. **MEDIUM confidence** (third-party, consistent with official docs).

---

*Stack research for: OpenClaw plugin porting GSD spec-driven development system*
*Researched: 2026-03-04*
*OpenClaw version at time of research: v2026.3.2 (released 2026-03-03)*
