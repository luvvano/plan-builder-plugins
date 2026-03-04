# Phase 1: Foundation - Research

**Researched:** 2026-03-04
**Domain:** OpenClaw plugin architecture, gsd-tools.cjs bundling, command registration
**Confidence:** HIGH

## Summary

Phase 1 builds the OpenClaw plugin scaffold that loads without errors, bundles gsd-tools.cjs with portable path resolution, validates the colon-namespaced command convention (`/gsd:new-project`), and proves the orchestration pattern (inline agent context injection as Task() replacement) works end-to-end with one complete GSD workflow.

**Primary recommendation:** Build the plugin as a default-exported function receiving `PluginContext` from `openclaw/plugin-sdk/core`. Use `api.registerCommand()` for the LLM-bypass `/gsd:help` command, `api.registerService()` for the lifecycle service that sets `GSD_TOOLS_PATH`, and ship all GSD workflows as SKILL.md files inside a `skills/` directory declared in `openclaw.plugin.json`. Use `@sinclair/typebox` for any `registerTool()` parameter schemas.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Rebuild `openclaw-plugin/` from scratch based on research findings (existing basic plugin is too minimal)
- Plugin entry point: `src/index.ts` exporting default function
- Use `openclaw >=2026.2.3-1` as peerDependency (never `workspace:*` per issue #14042)
- TypeScript source consumed directly by jiti — no build step, `tsc --noEmit` for type checking only
- Target ES2022, ESNext modules, bundler module resolution, strict mode
- Copy gsd-tools.cjs into `bin/` inside the plugin package
- Resolve path at runtime using `import.meta.dirname` (Node.js >=20)
- Expose as `GSD_TOOLS_PATH` environment variable via registered service `start()` method
- All SKILL.md files reference `$GSD_TOOLS_PATH` instead of hardcoded absolute paths
- Bundle the full `get-shit-done/` support directory (templates, references, workflows) alongside gsd-tools.cjs
- Test colon-namespaced commands first: `/gsd:new-project`
- Fallback to hyphen naming (`/gsd-new-project`) if colons are rejected by `registerCommand()`
- Lock convention before writing any SKILL.md files
- Use inline instruction-generation pattern: workflow SKILL.md returns detailed instructions the main agent executes
- For sub-agent roles: inline-inject the agent SKILL.md content as context blocks within the workflow instructions
- Sequential execution only in v1 — no parallel sub-agent synchronization
- Validate with one complete workflow: `/gsd:new-project` (exercises research agents, roadmapper, state management)
- Auto mode (`--auto`) is the default for all OpenClaw commands (no AskUserQuestion dependency)
- All SKILL.md and HOOK.md files include `os: ["darwin", "linux"]` in YAML frontmatter

### Claude's Discretion
- Exact service lifecycle implementation details
- How to surface the GSD_TOOLS_PATH to SKILL.md contexts (env var vs tool response vs both)
- Error messaging format when plugin fails to load
- Whether to keep the existing basic `openclaw-plugin/` code as a starting point or replace entirely

### Deferred Ideas (OUT OF SCOPE)
- Full command set (24 commands) — Phase 3
- Lifecycle services (update check, context monitor) — Phase 4
- ClawHub distribution packaging — Phase 4
- Parallel sub-agent wave execution — v2
- Model profile system for sub-agent model selection — v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Plugin has valid `openclaw.plugin.json` manifest that loads in OpenClaw >=2026.2.3-1 | Manifest format confirmed: requires `id` and `configSchema`. Optional: `name`, `description`, `version`, `skills` array. Source: official plugin manifest docs. |
| FOUND-02 | Plugin `package.json` declares openclaw as peerDependency (not workspace:*) | Confirmed pattern: `"peerDependencies": { "openclaw": ">=2026.2.3-1" }`. Never use `workspace:*`. |
| FOUND-03 | gsd-tools.cjs is bundled inside the plugin and path-resolved at runtime via `import.meta.dirname` | gsd-tools.cjs (23KB) + lib/ directory (11 .cjs files) exist at `~/.claude/get-shit-done/bin/`. Copy entire `bin/` directory to plugin's `bin/`. Resolve via `path.join(import.meta.dirname, 'bin', 'gsd-tools.cjs')`. |
| FOUND-04 | GSD_TOOLS_PATH environment variable is set by the plugin service on startup | Use `api.registerService({ id: 'gsd-lifecycle', start() { process.env.GSD_TOOLS_PATH = resolvedPath; } })`. SKILL.md files reference `$GSD_TOOLS_PATH`. |
| FOUND-05 | Command naming convention is validated (colon vs hyphen) with a test registration | Prior research flagged this as Pitfall 6. OpenClaw docs show `name: "gsd:new-project"` pattern used in example code. Official naming conventions say "kebab or camel, but avoid clashing with core commands". Colons appear to work based on SDK examples. Test with one registration before committing. |
| FOUND-06 | One end-to-end workflow works as proof of the orchestration pattern | Use `/gsd:new-project` as the proof workflow. SKILL.md returns inline instructions that the main agent executes. Sub-agent roles are inline-injected as context blocks. |
</phase_requirements>

## Recommended Stack

### Core Platform

| Technology | Version | Purpose |
|------------|---------|---------|
| OpenClaw | >=2026.2.3-1 | Host platform (peerDependency) |
| TypeScript | ^5.3.0 | Type checking only (devDependency) |
| Node.js | >=20 | Required for `import.meta.dirname` |
| jiti | (bundled with OpenClaw) | Runtime TypeScript transpilation |

### Supporting Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `@sinclair/typebox` | ^0.32 | JSON Schema for `registerTool` parameters |
| `openclaw/plugin-sdk/core` | (from peerDep) | `PluginContext` type import |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@sinclair/typebox` | Hand-written JSON Schema | Typebox is the official pattern per OpenClaw docs; hand-written is more error-prone |
| `import.meta.dirname` | `__dirname` (CJS) or `fileURLToPath` | `import.meta.dirname` is cleaner, requires Node >=20 which is guaranteed by OpenClaw |

## Architecture Patterns

### Recommended Plugin Structure

```
openclaw-plugin/
├── openclaw.plugin.json          # Plugin manifest (id, configSchema, skills)
├── package.json                  # peerDependency on openclaw
├── tsconfig.json                 # ES2022, ESNext, strict, noEmit
├── src/
│   └── index.ts                  # Default export function(api: PluginContext)
├── bin/
│   ├── gsd-tools.cjs             # Bundled CLI tool
│   └── lib/                      # gsd-tools.cjs support modules
│       ├── state.cjs
│       ├── commands.cjs
│       ├── template.cjs
│       ├── phase.cjs
│       ├── verify.cjs
│       ├── core.cjs
│       ├── roadmap.cjs
│       ├── init.cjs
│       ├── frontmatter.cjs
│       ├── milestone.cjs
│       └── config.cjs
├── workflows/                    # GSD workflow definitions (from get-shit-done/)
├── references/                   # GSD reference docs (from get-shit-done/)
├── templates/                    # GSD planning templates (from get-shit-done/)
├── agents/                       # GSD agent role definitions
└── skills/
    └── gsd-new-project/          # Phase 1 proof-of-concept skill
        └── SKILL.md
```

### Pattern 1: Plugin Entry Point

**What:** Default-exported function receiving `PluginContext` API.
**When to use:** Always — this is the only way OpenClaw loads plugins.
**Example:**
```typescript
// Source: https://docs.openclaw.ai/tools/plugin
import type { PluginContext } from "openclaw/plugin-sdk/core";

export default function gsdPlugin(api: PluginContext): void {
  const cfg = api.config?.plugins?.entries?.["gsd-for-openclaw"]?.config ?? {};

  api.registerCommand({
    name: "gsd:new-project",
    description: "Initialize a new GSD project",
    acceptsArgs: true,
    requireAuth: true,
    handler(ctx, args) {
      return { text: "..." };
    },
  });

  api.registerService({
    id: "gsd-lifecycle",
    start: () => { /* set GSD_TOOLS_PATH */ },
    stop: () => { /* cleanup */ },
  });
}
```

### Pattern 2: SKILL.md as Inline Agent Instructions

**What:** A SKILL.md file contains YAML frontmatter + markdown instructions. When invoked, OpenClaw injects the skill content as context for the agent. The skill returns instructions that the main agent executes directly.
**When to use:** For all GSD workflows that require LLM reasoning (new-project, plan-phase, execute-phase, etc.).
**Example:**
```markdown
---
name: gsd-new-project
description: Initialize a new GSD project with PROJECT.md, REQUIREMENTS.md, and ROADMAP.md
user-invocable: true
os: ["darwin", "linux"]
---

# GSD New Project

[Instructions the agent follows when this skill is invoked...]
```

### Pattern 3: Service Lifecycle for Environment Setup

**What:** `api.registerService()` with `start()` that sets `process.env.GSD_TOOLS_PATH`.
**When to use:** Plugin load time — ensures all SKILL.md files can reference `$GSD_TOOLS_PATH`.
**Example:**
```typescript
import { join } from "node:path";

api.registerService({
  id: "gsd-lifecycle",
  start() {
    const toolsPath = join(import.meta.dirname, "..", "bin", "gsd-tools.cjs");
    process.env.GSD_TOOLS_PATH = toolsPath;
    api.logger.info(`[gsd] GSD_TOOLS_PATH set to ${toolsPath}`);
  },
  stop() {
    delete process.env.GSD_TOOLS_PATH;
    api.logger.info("[gsd] cleanup complete");
  },
});
```

### Anti-Patterns to Avoid
- **Hardcoded absolute paths in SKILL.md:** Always use `$GSD_TOOLS_PATH`. The plugin may be installed in different locations.
- **Using `workspace:*` as dependency:** Use `peerDependencies` with version range. `workspace:*` breaks outside monorepo contexts.
- **Building TypeScript before loading:** jiti handles transpilation. Running `tsc` to build JS output is unnecessary and creates stale artifacts.
- **Registering LLM workflows as `registerCommand`:** Commands bypass the LLM. Use SKILL.md for anything that needs AI reasoning.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool parameter schemas | Hand-written JSON Schema objects | `@sinclair/typebox` `Type.Object()` | Official pattern, type-safe, less error-prone |
| Runtime TS transpilation | Custom build step | jiti (bundled with OpenClaw) | Already configured, zero-config |
| Plugin config access | Custom config loader | `api.config?.plugins?.entries?.["id"]?.config` | Standard accessor pattern |
| Path resolution | `__dirname` or `fileURLToPath` | `import.meta.dirname` | Cleaner, Node >=20 guaranteed |

**Key insight:** OpenClaw handles TypeScript transpilation, config validation, and plugin lifecycle. The plugin author's job is to declare the manifest, register commands/tools/services, and ship SKILL.md files.

## Common Pitfalls

### Pitfall 1: Colon-Namespaced Commands May Not Register
**What goes wrong:** GSD uses `/gsd:new-project` naming. If OpenClaw's `registerCommand()` rejects colons in the `name` field, all 24 commands fail.
**Why it happens:** OpenClaw docs say "kebab or camel, avoid clashing with core commands" but don't explicitly address colons. Prior research examples show colons working in SDK samples.
**How to avoid:** Register one test command with a colon name (`gsd:test`) in Phase 1 before porting all commands. Have a fallback plan (hyphens: `gsd-new-project`).
**Warning signs:** Plugin load errors mentioning invalid command names; commands register but don't trigger on invocation.

### Pitfall 2: GSD_TOOLS_PATH Not Available in SKILL.md Context
**What goes wrong:** The `process.env.GSD_TOOLS_PATH` set in `registerService.start()` might not be visible when SKILL.md instructions are executed by the agent.
**Why it happens:** The agent may run in a different process or sandbox where environment variables from the plugin host are not inherited.
**How to avoid:** Test that `$GSD_TOOLS_PATH` resolves in the agent's shell context. If not, expose it via a `registerTool()` that returns the path, or inject it directly into SKILL.md instructions at load time.
**Warning signs:** `gsd-tools.cjs` not found errors during workflow execution.

### Pitfall 3: Missing gsd-tools.cjs lib/ Dependencies
**What goes wrong:** Copying only `gsd-tools.cjs` without the `lib/` directory causes runtime failures because gsd-tools.cjs requires its sibling modules.
**Why it happens:** The 11 `.cjs` files in `lib/` (state.cjs, commands.cjs, etc.) are required by gsd-tools.cjs at runtime.
**How to avoid:** Always copy the entire `bin/` directory (gsd-tools.cjs + lib/) into the plugin.
**Warning signs:** `MODULE_NOT_FOUND` errors when running `node bin/gsd-tools.cjs`.

### Pitfall 4: Skills Not Loading from Plugin
**What goes wrong:** SKILL.md files placed in the plugin's `skills/` directory don't appear in OpenClaw.
**Why it happens:** The `openclaw.plugin.json` manifest must declare `"skills": ["./skills"]` to tell OpenClaw where to find bundled skills.
**How to avoid:** Always include the `skills` array in the manifest pointing to the skills directory.
**Warning signs:** Skills don't show up in `/skills` listing; agent doesn't recognize the skill name.

### Pitfall 5: Plugin Config Not Accessible
**What goes wrong:** `api.config?.plugins?.entries?.["gsd-for-openclaw"]?.config` returns undefined.
**Why it happens:** User hasn't added the plugin entry to their `openclaw.json`, or the plugin ID in the manifest doesn't match.
**How to avoid:** Always use optional chaining with sensible defaults. Ensure `openclaw.plugin.json` `id` matches the key used in config access.
**Warning signs:** All config values fall through to defaults; changes to openclaw.json have no effect.

## Code Examples

### Plugin Manifest (openclaw.plugin.json)
```json
{
  "id": "gsd-for-openclaw",
  "name": "GSD for OpenClaw",
  "description": "Spec-driven development: plan, execute, and verify coding workflows",
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
  }
}
```

### Package.json
```json
{
  "name": "gsd-for-openclaw",
  "version": "1.0.0",
  "type": "module",
  "description": "GSD spec-driven development plugin for OpenClaw",
  "main": "src/index.ts",
  "openclaw": {
    "extensions": ["./src/index.ts"]
  },
  "peerDependencies": {
    "openclaw": ">=2026.2.3-1"
  },
  "devDependencies": {
    "@sinclair/typebox": "^0.32.0",
    "typescript": "^5.3.0"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

### SKILL.md Frontmatter Pattern
```yaml
---
name: gsd-new-project
description: Initialize a new GSD project with full planning scaffold
user-invocable: true
os: ["darwin", "linux"]
---
```

### GSD_TOOLS_PATH Service Registration
```typescript
import { join } from "node:path";
import type { PluginContext } from "openclaw/plugin-sdk/core";

export default function gsdPlugin(api: PluginContext): void {
  api.registerService({
    id: "gsd-lifecycle",
    start() {
      const toolsPath = join(import.meta.dirname, "..", "bin", "gsd-tools.cjs");
      process.env.GSD_TOOLS_PATH = toolsPath;

      // Also set GSD_HOME for templates/references/workflows resolution
      const gsdHome = join(import.meta.dirname, "..");
      process.env.GSD_HOME = gsdHome;

      api.logger.info(`[gsd] tools path: ${toolsPath}`);
    },
    stop() {
      delete process.env.GSD_TOOLS_PATH;
      delete process.env.GSD_HOME;
    },
  });
}
```

## Sources

- OpenClaw Plugin Docs: https://docs.openclaw.ai/tools/plugin
- OpenClaw Plugin Manifest: https://docs.openclaw.ai/plugins/manifest
- OpenClaw Plugin Agent Tools: https://docs.openclaw.ai/plugins/agent-tools
- OpenClaw Skills Docs: https://github.com/openclaw/openclaw/blob/main/docs/tools/skills.md
- OpenClaw Creating Skills: https://docs.openclaw.ai/tools/creating-skills
- OpenClaw ClawHub: https://docs.openclaw.ai/tools/clawhub

---

*Phase: 01-foundation*
*Researched: 2026-03-04*
