# Architecture Research

**Domain:** CLI AI assistant plugin — GSD-to-OpenClaw port
**Researched:** 2026-03-04
**Confidence:** HIGH (based on direct inspection of both GSD source and existing OpenClaw plugin)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OpenClaw Runtime                                    │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  /gsd:*      │  │  gsd_*       │  │  SKILL.md    │  │  Services     │  │
│  │  Commands    │  │  Tools       │  │  Skills      │  │  (lifecycle)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                 │                  │                  │           │
│  ┌──────┴─────────────────┴──────────────────┴──────────────────┴───────┐  │
│  │                    Plugin Entry Point (src/index.ts)                  │  │
│  │          api.registerCommand / registerTool / registerService         │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼────────────────────────────────────┐  │
│  │                    Workflow Engine (SKILL.md prompts)                  │  │
│  │   Orchestrator skills spawn sub-agents via OpenClaw agent system      │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                         Shared Runtime Layer                                 │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐   │
│  │  gsd-tools.cjs    │  │  .planning/ files  │  │  git (shell access)   │   │
│  │  (CLI utility)    │  │  (state & docs)    │  │  (atomic commits)     │   │
│  └───────────────────┘  └───────────────────┘  └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Commands (`/gsd:*`) | Entry points that inject workflow prompts into the agent's context | `api.registerCommand()` in `src/index.ts`; handler returns markdown text that triggers agent behavior |
| Tools (`gsd_*`) | Structured callable functions; agents use these to retrieve data or instructions | `api.registerTool()` in `src/index.ts`; execute() returns content blocks |
| SKILL.md files | Declarative agent behavior definitions; auto-trigger tools when user intent matches | YAML frontmatter + markdown instructions in `skills/*/SKILL.md` |
| Services | Plugin lifecycle management (start/stop); background state if needed | `api.registerService()` in `src/index.ts` |
| Workflow SKILLs | Orchestrator logic; read GSD workflow markdown and spawn sub-agents | Large SKILL.md files that embed or reference GSD workflow steps |
| Agent SKILLs | Specialized sub-agent roles (planner, executor, verifier, etc.) | SKILL.md files in `skills/agents/` corresponding to each `gsd-*.md` agent definition |
| gsd-tools.cjs | CLI utility for state management, phase lookup, commits, config; shared across all workflows | Reused as-is from GSD; invoked via shell in SKILL.md prompts |
| .planning/ | File-based state store; PROJECT.md, ROADMAP.md, STATE.md, phase dirs | Written by agents executing workflow steps |

## GSD-to-OpenClaw Component Mapping

### Direct Mappings

| GSD Component | GSD Mechanism | OpenClaw Equivalent | Notes |
|---------------|---------------|---------------------|-------|
| Slash commands (`/gsd:new-project`, etc.) | `.claude/commands/gsd/*.md` files | `api.registerCommand()` returning workflow prompt | Commands inject instructions into the chat context |
| Orchestrator workflows | `workflows/*.md` markdown files | SKILL.md files in `skills/workflows/` | Workflow logic embedded in SKILL.md or returned by a tool |
| Specialized agents | `.claude/agents/gsd-*.md` | SKILL.md files in `skills/agents/` | Each agent role becomes a separate SKILL.md |
| `gsd-tools.cjs` | Node.js CLI utility | Reuse directly via shell calls in SKILL.md | No porting needed; shell access works in OpenClaw |
| Templates (PROJECT.md, ROADMAP.md, etc.) | `templates/*.md` in GSD package | Bundle into plugin at `templates/` | Referenced by workflow SKILLs |
| `SessionStart` hook | `settings.json` hooks | `api.registerService()` start() + OpenClaw event if available | Update-check on session start |
| `PostToolUse` hook (context monitor) | `settings.json` hooks | OpenClaw event subscription or periodic poll via service | Requires investigation: OpenClaw event model |
| `statusLine` hook | `settings.json` statusLine | OpenClaw statusline API if it exists; else omit | LOW confidence — needs verification |

### Structural Difference: No Native Sub-Agent Spawning

**GSD:** Uses `Task(prompt=..., subagent_type="gsd-planner")` — Claude Code's built-in Task tool spawns a named agent directly from a known agent definition file.

**OpenClaw:** Sub-agent spawning works differently. The current evidence (existing plugin, SKILL.md format) shows orchestration happens through the model conversation, not a typed task system. Agent roles must be conveyed via SKILL.md prompt injection rather than `subagent_type` dispatch.

**Mapping strategy:** Each orchestrator workflow (e.g., `plan-phase`) becomes a SKILL.md that instructs the model to reason as the orchestrator. When spawning a "sub-agent" (e.g., gsd-planner), the orchestrator SKILL injects the full agent SKILL.md content inline as a context block. This preserves the multi-role behavior within a single agent conversation thread, or — if OpenClaw supports spawning — uses whatever spawn mechanism it provides.

This is the most significant architectural difference and warrants investigation in its own phase.

## Recommended Project Structure

```
gsd-openclaw/                          # Plugin root
├── openclaw.plugin.json               # Plugin manifest (id, version, configSchema)
├── package.json                       # npm metadata + openclaw.extensions pointer
├── tsconfig.json                      # TypeScript config
├── src/
│   └── index.ts                       # Plugin entry: all registerCommand/Tool/Service calls
├── skills/
│   ├── workflows/                     # Orchestrator SKILL.md files (one per major command)
│   │   ├── new-project/
│   │   │   └── SKILL.md               # /gsd:new-project full workflow
│   │   ├── plan-phase/
│   │   │   └── SKILL.md               # /gsd:plan-phase orchestrator
│   │   ├── execute-phase/
│   │   │   └── SKILL.md               # /gsd:execute-phase orchestrator
│   │   ├── verify-phase/
│   │   │   └── SKILL.md               # /gsd:verify-phase
│   │   └── [22 more workflow skills]
│   └── agents/                        # Specialized agent role SKILL.md files
│       ├── gsd-planner/
│       │   └── SKILL.md               # Plan creation agent
│       ├── gsd-executor/
│       │   └── SKILL.md               # Plan execution agent
│       ├── gsd-verifier/
│       │   └── SKILL.md               # Phase verification agent
│       ├── gsd-roadmapper/
│       │   └── SKILL.md               # Roadmap creation agent
│       ├── gsd-phase-researcher/
│       │   └── SKILL.md               # Phase research agent
│       ├── gsd-project-researcher/
│       │   └── SKILL.md               # Project research agent
│       ├── gsd-plan-checker/
│       │   └── SKILL.md               # Plan quality checker agent
│       ├── gsd-debugger/
│       │   └── SKILL.md               # Debug session agent
│       ├── gsd-codebase-mapper/
│       │   └── SKILL.md               # Codebase mapping agent
│       └── [3 more agent skills]
├── templates/                         # GSD planning file templates
│   ├── project.md
│   ├── roadmap.md
│   ├── state.md
│   ├── requirements.md
│   ├── phase-prompt.md
│   ├── milestone.md
│   └── [remaining templates]
├── references/                        # GSD reference docs used by skills
│   ├── checkpoints.md
│   ├── tdd.md
│   ├── verification-patterns.md
│   └── [remaining references]
├── bin/
│   └── gsd-tools.cjs                  # Reused as-is from GSD (+ libs/)
└── README.md
```

### Structure Rationale

- **`src/index.ts`:** Single registration point mirrors the existing plugin pattern; all commands/tools/services wired here.
- **`skills/workflows/`:** One subdirectory per orchestrator workflow. SKILL.md files are large (they embed workflow logic) so isolation prevents loading conflicts.
- **`skills/agents/`:** Agent roles as separate skills. Orchestrators reference agent skills by path when injecting agent context.
- **`templates/` and `references/`:** Bundled inside the plugin so the plugin is self-contained. Paths in SKILL.md prompts reference `~/.openclaw/extensions/gsd/templates/` at runtime.
- **`bin/`:** gsd-tools.cjs and its `lib/` subdirectory copied verbatim. Called via shell by all SKILL.md workflow steps.

## Architectural Patterns

### Pattern 1: Command-as-Prompt-Injector

**What:** `/gsd:*` commands registered via `api.registerCommand()` do not contain workflow logic themselves. They return a text prompt that tells the agent which SKILL.md to load and with what arguments.

**When to use:** All 24+ slash commands use this pattern. The command handler is thin — it validates args and returns the trigger text.

**Trade-offs:** Simple, consistent. Command handler complexity stays near zero. Full workflow logic lives in SKILL.md. Agent must load the right skill before acting.

**Example:**
```typescript
api.registerCommand({
  name: "gsd:plan-phase",
  acceptsArgs: true,
  requireAuth: true,
  handler(_ctx, args) {
    const phase = args?.trim();
    if (!phase) return { text: "Usage: /gsd:plan-phase <phase-number>" };
    return {
      text: `Use the \`gsd_plan_phase\` skill to plan phase ${phase}. Arguments: ${phase}`,
    };
  },
});
```

### Pattern 2: Tool-as-Workflow-Dispatcher

**What:** A `gsd_*` tool registered via `api.registerTool()` receives structured arguments and returns detailed sub-agent instructions as a text content block. The agent executes those instructions directly.

**When to use:** Complex orchestrator workflows (new-project, plan-phase, execute-phase) where structured input (phase number, flags) is needed before generating instructions.

**Trade-offs:** Structured inputs enable validation. Instruction text can be large. Compatible with how the existing `plan_builder` tool works.

**Example:**
```typescript
api.registerTool({
  name: "gsd_execute_phase",
  description: "Execute all plans in a GSD phase using wave-based parallel execution.",
  parameters: {
    type: "object",
    properties: {
      phase: { type: "string", description: "Phase number (e.g. '3' or '3.1')" },
      auto: { type: "boolean", description: "Auto-advance without checkpoints" },
    },
    required: ["phase"],
  },
  execute(_id, params) {
    const instructions = buildExecutePhaseInstructions(params);
    return { content: [{ type: "text", text: instructions }] };
  },
});
```

### Pattern 3: SKILL.md as Agent Role Container

**What:** Each GSD agent definition (`gsd-planner.md`, `gsd-executor.md`, etc.) is converted into a SKILL.md file. The SKILL.md contains the agent's role, tools list, and full behavioral instructions. Orchestrator workflow SKILL.md files reference agent SKILL.md content by embedding it inline when spawning sub-roles.

**When to use:** All 11 GSD agent types map to this pattern.

**Trade-offs:** Context cost — embedding a full agent SKILL.md inline during orchestration adds tokens. Alternative: orchestrator references the agent SKILL.md path and instructs the model to read it. The path-reference approach is lower cost and matches how GSD's Claude Code version works (agent files read via `@` references).

**Example SKILL.md frontmatter:**
```yaml
---
name: gsd_planner
description: GSD plan creation agent. Creates PLAN.md files with task breakdown, dependency analysis, and goal-backward verification. Spawned by gsd:plan-phase.
tools: Read, Write, Edit, Bash, Grep, Glob
---
```

### Pattern 4: Service as Lifecycle + Hook Emulator

**What:** `api.registerService()` provides `start()` and `stop()` callbacks. The `start()` method runs on plugin load — use it for the SessionStart equivalent (update check). For PostToolUse behavior (context monitor), this depends on whether OpenClaw exposes tool-use events; if not, a polling interval inside the service is a fallback.

**When to use:** The three GSD hooks (context-monitor, check-update, statusline) must map here.

**Trade-offs:** If OpenClaw lacks a PostToolUse event, context monitoring cannot fire after every tool call. A polling approach (every N seconds) is an approximation. The statusline hook requires a dedicated OpenClaw API — if absent, this feature is not portable.

```typescript
api.registerService({
  id: "gsd-lifecycle",
  start() {
    runUpdateCheck();                  // replaces SessionStart hook
    startContextMonitor();            // replaces PostToolUse hook (best-effort)
  },
  stop() { clearContextMonitor(); },
});
```

## Data Flow

### Request Flow (Core Workflow: /gsd:plan-phase 3)

```
User types: /gsd:plan-phase 3
    ↓
api.registerCommand("gsd:plan-phase") handler
    → returns: "Use gsd_plan_phase tool with phase=3"
    ↓
Agent calls: gsd_plan_phase tool (phase="3")
    ↓
Tool execute() builds instructions string
    → reads SKILL.md content for plan-phase workflow
    → returns instruction text block
    ↓
Agent executes instructions:
    → calls gsd-tools.cjs init plan-phase 3  (shell)
    → reads STATE.md, ROADMAP.md, REQUIREMENTS.md
    → (if research) injects gsd-phase-researcher SKILL.md content, acts as researcher
    → injects gsd-planner SKILL.md content, acts as planner → writes PLAN.md files
    → injects gsd-plan-checker SKILL.md content, acts as checker → validates plans
    ↓
State persisted to .planning/phases/03-*/
    ↓
Agent reports status to user
```

### State Management Flow

```
.planning/STATE.md  (source of truth)
    ↑ written by             ↑ read by
    │                        │
gsd-tools.cjs          workflow SKILL.md
state update cmd       init command
    ↑                        │
    │                        ↓
agents write SUMMARYs   orchestrators route decisions
(SUMMARY.md per plan)   (which phase, what model, flags)
```

### Key Data Flows

1. **Initialization:** Every orchestrator starts with `node gsd-tools.cjs init <workflow> <phase>` → JSON blob with all paths, model assignments, phase data. Single shell call replaces 10+ individual reads.
2. **Agent injection:** Orchestrator SKILL.md injects agent role SKILL.md content (either inline or via path reference) → model adopts the agent's persona and tools list for that sub-task.
3. **Commit flow:** Agents call `gsd-tools.cjs commit <message> --files <list>` → git add + git commit. Shell access in OpenClaw makes this identical to Claude Code.
4. **Config propagation:** `.planning/config.json` stores user preferences (research enabled, auto-advance, model profiles). All workflows read via `gsd-tools.cjs config-get <key>`.

## Scaling Considerations

This is a developer tooling plugin, not a multi-user service. Scaling concerns are irrelevant. Instead, the relevant capacity concerns are:

| Concern | Approach |
|---------|----------|
| Context window per session | Same as GSD: orchestrators stay lean, delegates to sub-agent roles, reads files by path not by embedding content |
| Plugin file count (~50 SKILL.md files) | Organize under `skills/workflows/` and `skills/agents/`; OpenClaw loads skills on demand, not all at once |
| gsd-tools.cjs dependency | Self-contained CJS bundle; no npm install needed at runtime |
| Template/reference file access | All files bundled inside plugin directory; path known at install time |

## Anti-Patterns

### Anti-Pattern 1: Monolithic SKILL.md

**What people do:** Put all 24 workflow commands into a single large SKILL.md.
**Why it's wrong:** Context bloat — OpenClaw loads the entire SKILL.md into context when any skill triggers. A single monolithic file means every /gsd: command carries the weight of all other commands.
**Do this instead:** One SKILL.md per workflow (in `skills/workflows/<name>/SKILL.md`). Each loads only when its specific command runs.

### Anti-Pattern 2: Embedding Full Workflow Logic in Command Handlers

**What people do:** Put the entire `new-project.md` workflow logic inside `api.registerCommand()` handler TypeScript code.
**Why it's wrong:** Workflow logic is prompt-heavy markdown. Encoding 400-line workflows as TypeScript strings is unmaintainable. Updates require a code change + build.
**Do this instead:** Command handler returns a one-liner trigger. All logic lives in SKILL.md files which are plain markdown, easily updated without a build step.

### Anti-Pattern 3: Rewriting gsd-tools.cjs

**What people do:** Port gsd-tools.cjs to a different format (TypeScript module, OpenClaw API calls, etc.).
**Why it's wrong:** gsd-tools.cjs is a 1000+ line battle-tested CLI with 20+ subcommands. It works over shell, which OpenClaw supports. Rewriting risks breaking the state model.
**Do this instead:** Bundle gsd-tools.cjs as-is in `bin/`. Call it from SKILL.md workflow steps via shell exactly as GSD does today.

### Anti-Pattern 4: Coupling Agent Types to OpenClaw's Agent Dispatch

**What people do:** Assume OpenClaw has a `subagent_type` parameter equivalent and design the port around it.
**Why it's wrong:** OpenClaw's sub-agent spawning model is not yet confirmed to match Claude Code's Task() dispatch. Building on an unverified API leads to a blocked phase.
**Do this instead:** Design agent roles as SKILL.md content that can be injected into context regardless of how spawning works. The content is portable; the dispatch mechanism is a layer on top.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| git | Shell (`gsd-tools.cjs commit`) | Works directly; OpenClaw has shell access |
| GitHub (update check) | HTTPS fetch in gsd-check-update.js | Existing Node.js script; runs via shell in service start() |
| npm/node | Runtime dependency for gsd-tools.cjs | Node.js assumed present (gsd-tools.cjs is CJS); verify OpenClaw environment |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Command → Tool | Command returns trigger text; agent calls tool | Loose coupling; agent decides which tool to call |
| Tool → SKILL.md | Tool returns instruction text embedding SKILL.md content or path | Tools read SKILL.md from plugin's `skills/` directory at execute time |
| Workflow SKILL → Agent SKILL | Orchestrator injects agent SKILL.md content inline in sub-task prompt | Core multi-agent boundary; most critical to get right |
| Agent SKILL → gsd-tools.cjs | Shell invocation via Bash | Stateless; tools.cjs reads .planning/ files directly |
| gsd-tools.cjs → .planning/ | File I/O | State store boundary; no abstraction layer |
| Service → Hooks | Service start() calls hook scripts via Node.js | gsd-check-update.js, gsd-context-monitor.js remain Node.js scripts |

## Build Order (Phase Dependency)

Based on component dependencies, the correct build sequence is:

```
Phase 1: Foundation
  gsd-tools.cjs bundle + plugin manifest + src/index.ts skeleton
  ↓ (everything depends on this shell + state layer)

Phase 2: Core Commands (new-project, plan-phase, execute-phase, verify-phase)
  Skills/workflows for 4 primary commands + 4 agent SKILLs (planner, executor, verifier, roadmapper)
  ↓ (these 4 cover 80% of GSD's value; validate agent spawning model here)

Phase 3: Remaining Commands + Agents
  All remaining 20+ commands + 7+ agent SKILLs + templates bundle
  ↓ (depends on agent injection pattern validated in Phase 2)

Phase 4: Hooks + Services + Lifecycle
  Context monitor, update check, statusline (if OpenClaw API supports it)
  ↓ (depends on knowing OpenClaw's event/service API surface)

Phase 5: Plugin Manifest + Distribution
  openclaw.plugin.json finalization, ClawHub compatibility, install scripts
```

**Critical dependency:** Phase 2 must validate how OpenClaw handles sub-agent spawning before Phase 3 can be built. If the agent injection pattern does not work as hypothesized, Phases 3-5 need to adapt.

## Sources

- Direct inspection of `/Users/egorproskyrin/Projects/luvvano/plan-builder-plugins/openclaw-plugin/src/index.ts` — OpenClaw plugin API (`registerCommand`, `registerTool`, `registerService`) — HIGH confidence
- Direct inspection of `/Users/egorproskyrin/Projects/luvvano/plan-builder-plugins/openclaw-plugin/skills/planning/SKILL.md` — SKILL.md format — HIGH confidence
- Direct inspection of `/Users/egorproskyrin/.claude/get-shit-done/workflows/` (all 28 workflow files indexed) — GSD workflow structure — HIGH confidence
- Direct inspection of `/Users/egorproskyrin/.claude/agents/` (11 agent files indexed) — GSD agent types — HIGH confidence
- Direct inspection of `/Users/egorproskyrin/.claude/settings.json` — GSD hooks (SessionStart, PostToolUse, statusLine) — HIGH confidence
- Direct inspection of `/Users/egorproskyrin/.claude/get-shit-done/bin/gsd-tools.cjs` — CLI interface (20+ subcommands) — HIGH confidence
- OpenClaw sub-agent spawning model (whether `subagent_type` or equivalent exists) — LOW confidence, needs verification in Phase 2

---
*Architecture research for: GSD-to-OpenClaw port*
*Researched: 2026-03-04*
