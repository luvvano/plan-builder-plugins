# Phase 02: Core Workflows - Research

**Researched:** 2026-03-05
**Domain:** OpenClaw SKILL.md orchestration, GSD agent porting, wave execution state tracking
**Confidence:** HIGH

## Summary

Phase 2 is fundamentally a porting and orchestration problem, not a new technology problem. The GSD workflow logic already exists in `/Users/egorproskyrin/.claude/get-shit-done/workflows/` — the work is translating four source workflows (new-project, plan-phase, execute-phase, verify-work) into OpenClaw SKILL.md files that achieve the same orchestration without the Claude Code `Task()` primitive.

The core insight from Phase 1 is the replacement strategy for `Task()`: instead of spawning a subagent with a system prompt, the SKILL.md embeds the agent's role prompt inline and then gives the LLM step-by-step instructions to follow. This was proven with `gsd-new-project/SKILL.md`. Phase 2 scales this pattern to all four commands with multi-stage SKILL.md decomposition per workflow.

The two genuinely novel pieces are: (1) the wave execution state machine in `execute-phase`, which needs `wave-state.json` as a local file instead of in-memory state that `Task()` subagents would maintain, and (2) four `registerTool()` entries that give the LLM structured JSON access to phase status, config, roadmap, and a combined snapshot — replacing the ad-hoc bash parsing that GSD workflows do inline.

**Primary recommendation:** Port each workflow as 2-4 self-contained stage SKILL.md files grouped under `skills/workflows/{command}/`. Embed agent prompts verbatim inline. Wire the stages through the orchestrator SKILL.md with explicit sequential step instructions. Use `wave-state.json` for execute-phase resume. Register 4 gsd_ tools backed by `gsd-tools.cjs` subcommands.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Agent Role Organization**
- Agent SKILL.md files grouped by workflow (e.g., planning-agents.md bundles planner + plan-checker + researcher)
- Full faithful port of all original GSD agent system prompts — every instruction, guardrail, and example preserved
- Agent skills are internal-only — not user-invocable via slash commands. Users interact via workflow commands (/gsd:plan-phase), not agent commands
- Only implement agents used by the 4 core commands (~8-10 agents). Remaining agents come in Phase 3 with their commands

**Orchestration Pattern**
- Each workflow command has separate SKILL.md files per stage (e.g., plan-phase has research stage, planning stage, verification stage)
- Agent prompts embedded directly in stage skills — self-contained, no @path references to agent files
- All workflows default to --auto mode with smart defaults, no AskUserQuestion prompts. Fully autonomous execution
- Orchestration is LLM-driven: workflow SKILL.md contains step-by-step instructions the LLM follows using available tools

**Wave Execution Model**
- Execute-phase runs plans sequentially within wave groupings. Wave structure tracked in wave-state.json for future parallelism
- wave-state.json tracks per-plan completion. On resume, skip completed plans and continue from first incomplete
- Atomic git commits after each plan completes — clean history, easy to revert individual plans
- wave-state.json lives in phase directory: .planning/phases/XX-name/wave-state.json

**State Query Tools**
- Register 3-4 essential tools only: gsd_phase_status, gsd_config_get, gsd_roadmap_summary, gsd_state_snapshot
- All tools return structured JSON responses for reliable parsing by workflow skills
- Tools are LLM-callable — registered via registerTool() so SKILL.md instructions can invoke them directly
- All tool names use gsd_ prefix to avoid namespace collisions with other plugins

### Claude's Discretion
- Exact wave grouping logic (how to determine which plans can run in parallel within a wave)
- Internal file structure for stage SKILL.md files within skills/workflows/
- Which gsd-tools.cjs subcommands map to the 3-4 registered tools
- Error handling and retry logic within workflow stages

### Deferred Ideas (OUT OF SCOPE)
- True parallel sub-agent execution within waves — v2 requirement (PARA-01, PARA-02)
- Model profile system driving sub-agent model selection — v2 requirement (PLAT-02)
- Remaining 20 commands and their agent roles — Phase 3
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMD-03 | Core 4 commands work end-to-end: new-project, plan-phase, execute-phase, verify-work | Each command maps to a skill directory with orchestrator + stage SKILL.md files; inline agent injection pattern proven in Phase 1 |
| CMD-04 | All commands default to `--auto` mode (no AskUserQuestion dependency) | Source workflows have explicit auto-mode branches; SKILL.md instructions can enforce auto path by omitting AskUserQuestion steps |
| AGNT-01 | All 10+ GSD agent roles implemented as SKILL.md files in `skills/agents/` | 8 agent files identified for Phase 2: gsd-planner, gsd-plan-checker, gsd-phase-researcher, gsd-executor, gsd-verifier, gsd-roadmapper, gsd-research-synthesizer, gsd-project-researcher (partial). Grouped by workflow per decision. |
| AGNT-02 | Agent SKILL.md files contain full role system prompt from original GSD agent definitions | Source agent files at `/Users/egorproskyrin/.claude/agents/` contain complete system prompts — verbatim copy required |
| AGNT-03 | Workflow SKILL.md files can inline-inject agent SKILL.md content for orchestration | Proven pattern from Phase 1; stage skills embed agent role text directly instead of @-referencing agent files |
| ORCH-01 | Workflow orchestration works via inline agent context injection (replacing Task() primitive) | Phase 1 proof-of-concept confirmed this works. Orchestrator SKILL.md reads step-by-step instructions; the LLM executes each stage in sequence using the embedded agent context |
| ORCH-02 | Execute-phase uses sequential wave execution with wave-state.json tracking | `gsd-tools phase-plan-index` returns `{ phase, plans[], waves{}, incomplete[], has_checkpoints }` — sufficient to drive wave grouping. wave-state.json persists completion state between sessions |
| ORCH-03 | Interrupted workflows are resumable by reading wave-state.json | wave-state.json schema must include: phase, plans with status (pending/complete/failed), current_wave. On resume, filter `incomplete` from phase-plan-index and skip completed entries |
| ORCH-04 | State queries (phase status, config reads) are registered as `registerTool()` entries returning structured JSON | `gsd-tools` has: `state` (config + state_exists + roadmap_exists), `init execute-phase/plan-phase` (full phase context), `roadmap analyze` (full roadmap parse), `find-phase` (find phase dir). These back the 4 registerTool() entries |
</phase_requirements>

---

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| OpenClaw Plugin SDK (`openclaw/plugin-sdk/core`) | `>=2026.2.3-1` (peerDep) | `registerTool()`, `registerService()` API | Established in Phase 1 |
| `@sinclair/typebox` | bundled with SDK | Schema definition for `registerTool()` parameters | Required by OpenClaw tool registration API |
| `gsd-tools.cjs` | bundled in plugin (`bin/`) | All GSD state operations, commits, init, roadmap queries | Proven in Phase 1; `GSD_TOOLS_PATH` set by lifecycle service |
| SKILL.md (OpenClaw skill format) | n/a | LLM-readable orchestration instructions | Proven pattern from Phase 1 |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| `node:fs`, `node:path` | Node built-ins | File existence checks in registerTool handlers | When backing tool with filesystem reads |
| `node:child_process` | Node built-in | Execute `gsd-tools.cjs` subcommands from registerTool handlers | For state queries that need gsd-tools output |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline agent prompt embedding | @-path references to agent SKILL.md | @-references would make stage skills dependent on agent file paths; inline is self-contained and portable |
| wave-state.json file | In-memory state in SKILL.md | SKILL.md has no persistent memory across invocations; file is the only option for resume |
| gsd-tools.cjs subcommand calls from registerTool | Reimplementing logic in TypeScript | gsd-tools.cjs is working, tested, and maintained; no reason to rewrite |

**Installation:** No new packages needed. All dependencies established in Phase 1.

---

## Architecture Patterns

### Recommended File Structure

```
openclaw-plugin/
├── src/
│   └── index.ts                           # Add registerTool() for 4 state tools (already has registerService + registerCommand)
└── skills/
    ├── gsd-new-project/
    │   └── SKILL.md                       # Phase 1 proof-of-concept (extend / replace)
    └── workflows/
        ├── new-project/
        │   ├── SKILL.md                   # Orchestrator — user-invocable, step-by-step recipe
        │   ├── stage-setup.md             # Inline: gsd-project-researcher (x4) + gsd-research-synthesizer
        │   └── stage-roadmap.md           # Inline: gsd-roadmapper
        ├── plan-phase/
        │   ├── SKILL.md                   # Orchestrator — user-invocable
        │   ├── stage-research.md          # Inline: gsd-phase-researcher full prompt
        │   ├── stage-planning.md          # Inline: gsd-planner full prompt
        │   └── stage-verification.md      # Inline: gsd-plan-checker full prompt + revision loop
        ├── execute-phase/
        │   ├── SKILL.md                   # Orchestrator — user-invocable, wave loop
        │   └── stage-executor.md          # Inline: gsd-executor full prompt
        └── verify-work/
            ├── SKILL.md                   # Orchestrator — user-invocable
            └── stage-verify.md            # Inline: gsd-verifier full prompt
```

### Pattern 1: Orchestrator SKILL.md Structure

Each workflow has a top-level SKILL.md that acts as the recipe. It is user-invocable, references stage files via @-path, and provides the sequential step instructions the LLM follows.

```yaml
---
name: gsd:plan-phase
description: Create executable plans for a GSD roadmap phase
user-invocable: true
os: ["darwin", "linux"]
---
```

The body is a step-by-step recipe:

```markdown
## Step 1: Initialize

Run init to get phase context:
```bash
INIT=$(node "$GSD_TOOLS_PATH" init plan-phase "$PHASE_ARG")
```
Parse: researcher_model, planner_model, checker_model, research_enabled,
plan_checker_enabled, commit_docs, phase_found, phase_dir, phase_number, ...

## Step 2: Research (if research_enabled)

Follow @.../skills/workflows/plan-phase/stage-research.md

## Step 3: Plan

Follow @.../skills/workflows/plan-phase/stage-planning.md

## Step 4: Verify Plans

Follow @.../skills/workflows/plan-phase/stage-verification.md (max 3 revision loops)
```

### Pattern 2: Stage SKILL.md with Inline Agent Prompt

Stage files embed the full agent role verbatim. They are NOT user-invocable. The orchestrator includes them via @-reference, and the LLM reads and executes them in sequence within the same context window.

```yaml
---
name: gsd-plan-phase-research-stage
description: Research stage for /gsd:plan-phase — embeds gsd-phase-researcher role
user-invocable: false
os: ["darwin", "linux"]
---

<!-- AGENT ROLE: gsd-phase-researcher -->
<!-- Source: /Users/egorproskyrin/.claude/agents/gsd-phase-researcher.md (verbatim copy) -->

<role>
You are a GSD phase researcher. You answer "What do I need to know to PLAN this phase well?"...
[full agent system prompt verbatim]
</role>

## Stage Instructions

1. Construct research prompt using phase context from orchestrator
2. Execute research following the agent role above
3. Write RESEARCH.md to phase_dir
4. Commit if commit_docs is true
5. Return: "RESEARCH COMPLETE" with summary
```

**Key rule:** Stage files do NOT use `Task()`. The LLM IS the agent — it reads the role and executes inline.

### Pattern 3: registerTool() for State Queries

Four tools registered in `src/index.ts`. Each shells out to `gsd-tools.cjs` and returns structured JSON.

```typescript
// Source: Phase 1 research (openclaw-plugin/src/index.ts pattern confirmed)
import { Type } from "@sinclair/typebox";

api.registerTool(
  {
    name: "gsd_phase_status",
    description: "Get status of a GSD phase: plans found, completion state, wave-state.json contents",
    parameters: Type.Object({
      phase: Type.String({ description: "Phase number or identifier (e.g. '2', '02', '02-core-workflows')" }),
    }),
    async execute(_id, params) {
      const result = execGsdTools(`init execute-phase ${params.phase}`);
      const waveState = readWaveStateIfExists(params.phase);
      return {
        content: [{ type: "text", text: JSON.stringify({ ...result, wave_state: waveState }) }],
      };
    },
  },
  { optional: true },
);

api.registerTool(
  {
    name: "gsd_config_get",
    description: "Get GSD project config (model_profile, workflow settings, commit_docs)",
    parameters: Type.Object({
      key: Type.Optional(Type.String({ description: "Specific config key to retrieve, or omit for full config" })),
    }),
    async execute(_id, params) {
      const state = execGsdTools("state");
      const config = state.config;
      const result = params.key ? { [params.key]: config[params.key] } : config;
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  },
  { optional: true },
);

api.registerTool(
  {
    name: "gsd_roadmap_summary",
    description: "Get parsed roadmap with phase list, requirements, and progress",
    parameters: Type.Object({}),
    async execute(_id, _params) {
      const result = execGsdTools("roadmap analyze");
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  },
  { optional: true },
);

api.registerTool(
  {
    name: "gsd_state_snapshot",
    description: "Get combined project snapshot: state, config, roadmap existence, current position",
    parameters: Type.Object({
      phase: Type.Optional(Type.String({ description: "Phase to include detailed status for" })),
    }),
    async execute(_id, params) {
      const state = execGsdTools("state");
      const phaseDetail = params.phase ? execGsdTools(`init execute-phase ${params.phase}`) : null;
      return {
        content: [{ type: "text", text: JSON.stringify({ state, phase_detail: phaseDetail }) }],
      };
    },
  },
  { optional: true },
);
```

### Pattern 4: wave-state.json Schema

```json
{
  "phase": "02",
  "phase_dir": ".planning/phases/02-core-workflows",
  "created": "2026-03-05T00:00:00Z",
  "updated": "2026-03-05T00:00:00Z",
  "waves": {
    "1": ["02-01", "02-02"],
    "2": ["02-03"]
  },
  "plans": {
    "02-01": { "status": "complete", "completed_at": "2026-03-05T00:10:00Z" },
    "02-02": { "status": "pending", "completed_at": null },
    "02-03": { "status": "pending", "completed_at": null }
  },
  "current_wave": 1,
  "total_plans": 3,
  "completed_plans": 1
}
```

**Status values:** `pending` | `complete` | `failed`

**Resume logic:** Read wave-state.json, filter plans where `status !== "complete"`, find minimum `current_wave` of incomplete plans, continue from there.

**Write strategy:** Update after each plan completes (not after each task). Atomic write — write to temp file then rename.

### Anti-Patterns to Avoid

- **@-referencing original agent files at `/Users/egorproskyrin/.claude/agents/`**: Those paths are user-local and won't exist on other machines. Agent content must be embedded verbatim.
- **Making stage skills user-invocable**: Users invoke workflow orchestrators only. Stage files with `user-invocable: false` prevent accidental direct invocation.
- **Using AskUserQuestion in any workflow**: Confirmed incompatible or unavailable in OpenClaw. All decision paths use `--auto` smart defaults.
- **One monolithic SKILL.md per command**: Context window overflow. Each stage as a separate file keeps each invocation focused.
- **Calling `gsd-tools phase-plan-index` without the phase number argument**: The subcommand exists and returns `{ phase, plans[], waves{}, incomplete[], has_checkpoints }` — requires explicit phase arg.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phase dir lookup | Custom path resolver | `gsd-tools find-phase <N>` | Returns `{ phase_dir, phase_number, phase_name, padded_phase }` |
| Init context (models, paths, flags) | Manual config reads | `gsd-tools init <workflow> <phase>` | Returns full JSON context for all workflow types |
| Plan index with wave groups | Custom PLAN.md parser | `gsd-tools phase-plan-index <phase>` | Returns `{ plans[], waves{}, incomplete[], has_checkpoints }` |
| Roadmap parsing | Custom ROADMAP.md parser | `gsd-tools roadmap analyze` | Full parse with disk status |
| Git commits | Direct `git add && git commit` | `gsd-tools commit "<msg>" --files <paths>` | Handles commit_docs flag, consistent format |
| Plan structure validation | Manual frontmatter checks | `gsd-tools verify plan-structure <plan>` | Returns `{ valid, errors, warnings, task_count, frontmatter_fields }` |
| State updates | Direct STATE.md edits | `gsd-tools state update` / `state advance-plan` | Preserves STATE.md structure, handles edge cases |

**Key insight:** `gsd-tools.cjs` was designed exactly to avoid hand-rolling these operations across 50+ workflow/agent files. Every operation that involves reading/writing GSD state files should go through gsd-tools.

---

## Common Pitfalls

### Pitfall 1: Sub-agent Spawn Semantics Still Unresolved
**What goes wrong:** Original GSD workflows use `Task()` to spawn gsd-phase-researcher, gsd-planner, gsd-plan-checker, gsd-executor, gsd-verifier as separate agents. OpenClaw equivalent is unknown — nested session protection may block direct `claude` CLI invocation.
**Why it happens:** This was an OPEN blocker from Phase 1.
**How to avoid:** Use the proven inline injection pattern exclusively. The LLM reads the agent role in the SKILL.md and acts as that agent within the same session — no sub-agent spawn needed.
**Warning signs:** Any attempt to shell out to `claude` CLI or spawn a new session will fail.

### Pitfall 2: @-Path References to Absolute Agent Files
**What goes wrong:** Agent SKILL.md stages reference the GSD agent files at `/Users/egorproskyrin/.claude/agents/gsd-planner.md`. These paths are user-local and break on any other machine.
**Why it happens:** The original GSD Claude Code plugin uses `@/Users/egorproskyrin/.claude/...` path references freely. OpenClaw SKILL.md files must be self-contained.
**How to avoid:** Embed all agent system prompt text verbatim in the stage SKILL.md. No external @-path references to agent files.
**Warning signs:** Any `@/Users/egorproskyrin/.claude/agents/` reference in a SKILL.md file.

### Pitfall 3: gsd-tools.cjs registerTool Shelling Out
**What goes wrong:** `registerTool()` handlers that call `gsd-tools.cjs` via `execSync` may fail if `GSD_TOOLS_PATH` is not set at the time the tool is called (timing issue between registerService start and tool invocation).
**Why it happens:** `registerService.start()` sets `process.env.GSD_TOOLS_PATH` — but tool handlers could theoretically be called before start(). In practice this is unlikely but should be guarded.
**How to avoid:** In registerTool handlers, compute the tools path using `import.meta.dirname` as fallback if `process.env.GSD_TOOLS_PATH` is not set. Pattern established in Phase 1.
**Warning signs:** `GSD_TOOLS_PATH is not defined` errors in tool handler logs.

### Pitfall 4: wave-state.json Not Written Before Crash
**What goes wrong:** If the LLM executing execute-phase crashes mid-plan, wave-state.json may be missing or stale. Resume reads stale state and re-executes completed plans.
**Why it happens:** SKILL.md instructions tell the LLM to update wave-state.json, but the LLM may not reach that step on failure.
**How to avoid:** SKILL.md must instruct the LLM to write wave-state.json BEFORE starting each plan (marking it `pending`), then update to `complete` after the git commit. If restarted, a `pending` plan is treated as potentially incomplete — re-run it (idempotent execution preferred).
**Warning signs:** wave-state.json shows `pending` for a plan that appears to have a SUMMARY.md — this is a safe duplicate-execution scenario.

### Pitfall 5: Agent Prompt Size Causing Context Overflow
**What goes wrong:** Agent prompts are large (gsd-planner.md is ~50KB). Embedding verbatim in stage SKILL.md + orchestrator context + project files may overflow the context window.
**Why it happens:** Each stage skill is @-referenced from the orchestrator, meaning all content is pulled into a single context window.
**How to avoid:** Keep stage SKILL.md files self-contained — orchestrator @-references one stage at a time, not all stages simultaneously. The orchestrator directs the LLM to "follow stage-planning.md" by including that @-reference at the relevant step only, not all stages upfront.
**Warning signs:** Orchestrator SKILL.md has @-references to ALL stage files in the header — that loads everything at once.

### Pitfall 6: gsd-new-project SKILL.md Already Exists (Phase 1 Proof-of-Concept)
**What goes wrong:** Phase 1 created `skills/gsd-new-project/SKILL.md` as a proof-of-concept. It implements a simplified version of new-project. Phase 2 needs to decide: extend it or replace it with the full workflow implementation.
**Why it happens:** Phase 1 POC was intentionally simplified to prove orchestration works.
**How to avoid:** Phase 2 should replace/extend the existing SKILL.md with the full new-project workflow, migrating it to `skills/workflows/new-project/SKILL.md` for consistency with the new structure.
**Warning signs:** Two SKILL.md files trying to handle `/gsd:new-project` — the name field in YAML frontmatter must be unique.

---

## Code Examples

Verified patterns from direct source inspection:

### gsd-tools init JSON outputs (HIGH confidence — verified live)

**`init execute-phase <phase>`:**
```json
{
  "executor_model": "sonnet", "verifier_model": "sonnet",
  "commit_docs": true, "parallelization": true,
  "branching_strategy": "none", "branch_name": null,
  "phase_found": true/false, "phase_dir": ".planning/phases/02-core-workflows",
  "phase_number": "02", "phase_name": "core-workflows",
  "phase_slug": "core-workflows", "phase_req_ids": ["CMD-03", "CMD-04", ...],
  "plans": [], "summaries": [], "incomplete_plans": [],
  "plan_count": 0, "incomplete_count": 0,
  "state_exists": true, "roadmap_exists": true,
  "state_path": ".planning/STATE.md", "roadmap_path": ".planning/ROADMAP.md"
}
```

**`init plan-phase <phase>`:**
```json
{
  "researcher_model": "sonnet", "planner_model": "inherit", "checker_model": "sonnet",
  "research_enabled": true, "plan_checker_enabled": true, "commit_docs": true,
  "phase_found": false, "phase_dir": null, "phase_number": null,
  "padded_phase": null, "phase_req_ids": null,
  "has_research": false, "has_context": false, "has_plans": false,
  "state_path": ".planning/STATE.md", "roadmap_path": ".planning/ROADMAP.md",
  "requirements_path": ".planning/REQUIREMENTS.md"
}
```

**`init new-project`:**
```json
{
  "researcher_model": "sonnet", "synthesizer_model": "sonnet", "roadmapper_model": "sonnet",
  "commit_docs": true, "project_exists": false, "has_codebase_map": false,
  "planning_exists": false, "has_existing_code": false, "has_package_file": false,
  "is_brownfield": false, "needs_codebase_map": false,
  "has_git": false, "brave_search_available": false,
  "project_path": ".planning/PROJECT.md"
}
```

**`init verify-work <phase>`:**
```json
{
  "planner_model": "inherit", "checker_model": "sonnet",
  "commit_docs": true, "phase_found": false,
  "phase_dir": null, "phase_number": null, "phase_name": null,
  "has_verification": false
}
```

### gsd-tools phase-plan-index output (HIGH confidence — verified live)
```json
{
  "phase": "02",
  "plans": [
    { "id": "02-01", "wave": 1, "autonomous": true, "objective": "...",
      "files_modified": [], "task_count": 3, "has_summary": false }
  ],
  "waves": { "1": ["02-01", "02-02"], "2": ["02-03"] },
  "incomplete": ["02-01", "02-02", "02-03"],
  "has_checkpoints": false
}
```

### PLAN.md frontmatter (HIGH confidence — from gsd-planner agent source)
```yaml
---
phase: 02-core-workflows
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true
requirements: ["CMD-03"]
must_haves:
  truths: []
  artifacts: []
  key_links: []
---
```

### registerTool handler shell helper pattern (HIGH confidence — Phase 1 index.ts)
```typescript
// In src/index.ts
import { execSync } from "node:child_process";

function execGsdTools(subcommand: string): unknown {
  const toolsPath = process.env.GSD_TOOLS_PATH
    ?? join(import.meta.dirname, "..", "bin", "gsd-tools.cjs");
  try {
    const output = execSync(`node "${toolsPath}" ${subcommand}`, { encoding: "utf8" });
    return JSON.parse(output);
  } catch (e) {
    return { error: String(e) };
  }
}
```

### SKILL.md frontmatter for workflow orchestrator (HIGH confidence — Phase 1 SKILL.md)
```yaml
---
name: gsd:plan-phase
description: Create executable plans for a GSD roadmap phase. Runs research, planning, and verification stages.
user-invocable: true
os: ["darwin", "linux"]
---
```

### SKILL.md frontmatter for internal stage (HIGH confidence — design based on Phase 1 pattern)
```yaml
---
name: gsd-plan-phase-stage-research
description: Research stage for /gsd:plan-phase — internal use only
user-invocable: false
os: ["darwin", "linux"]
---
```

---

## Workflow Analysis: What Each Command Needs

### /gsd:new-project

**Source:** `/Users/egorproskyrin/.claude/get-shit-done/workflows/new-project.md`

**Auto mode path (what Phase 2 implements):**
1. `init new-project` → get researcher/synthesizer/roadmapper models, project_exists, has_git
2. Auto mode: read provided idea document (passed as argument or pasted text)
3. Write PROJECT.md from template using synthesized context
4. Spawn 4 parallel researchers (STACK, FEATURES, ARCHITECTURE, PITFALLS) — inline injection of gsd-project-researcher role
5. Spawn synthesizer — inline injection of gsd-research-synthesizer role
6. Spawn roadmapper — inline injection of gsd-roadmapper role
7. Write REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json
8. Commit all planning files

**Agents needed:** gsd-project-researcher (x4 roles), gsd-research-synthesizer, gsd-roadmapper

**Stage split:** stage-setup.md (project-researcher + synthesizer), stage-roadmap.md (roadmapper)

**Phase 2 note:** The existing `skills/gsd-new-project/SKILL.md` (Phase 1 POC) implements a simplified version. Phase 2 replaces it with a full workflow under `skills/workflows/new-project/`.

---

### /gsd:plan-phase

**Source:** `/Users/egorproskyrin/.claude/get-shit-done/workflows/plan-phase.md`

**Auto mode path:**
1. `init plan-phase <phase>` → researcher_model, planner_model, checker_model, research_enabled, plan_checker_enabled, phase_dir, phase_req_ids, etc.
2. Research stage (if research_enabled): inline gsd-phase-researcher → produces RESEARCH.md
3. Planning stage: inline gsd-planner → produces PLAN.md files in phase_dir
4. Verification stage (if plan_checker_enabled): inline gsd-plan-checker → VERIFICATION PASSED or ISSUES FOUND
5. Revision loop (max 3): if ISSUES FOUND → inline gsd-planner revision → re-verify
6. Commit plans

**Agents needed:** gsd-phase-researcher, gsd-planner, gsd-plan-checker

**Stage split:** stage-research.md, stage-planning.md, stage-verification.md

---

### /gsd:execute-phase

**Source:** `/Users/egorproskyrin/.claude/get-shit-done/workflows/execute-phase.md`

**Auto mode path:**
1. `init execute-phase <phase>` → executor_model, parallelization, phase_dir, plans, incomplete_plans, plan_count
2. `phase-plan-index <phase>` → waves{}, plans[], incomplete[], has_checkpoints
3. Write initial wave-state.json with all plans as `pending`
4. For each wave (sequential): for each plan in wave (sequential per user decision):
   - Mark plan `pending` in wave-state.json (already done at init)
   - Execute plan inline using gsd-executor role
   - `gsd-tools commit` atomically after plan completes
   - Update wave-state.json plan status to `complete`
5. After all waves: inline gsd-verifier → produces VERIFICATION.md
6. `roadmap update-plan-progress <phase>` → update ROADMAP.md

**Resume logic:** Read wave-state.json → skip plans with `status: "complete"` → continue from first `pending` plan

**Agents needed:** gsd-executor, gsd-verifier

**Stage split:** stage-executor.md (contains gsd-executor role), stage-verifier.md reused from verify-work if possible

---

### /gsd:verify-work

**Source:** `/Users/egorproskyrin/.claude/get-shit-done/workflows/verify-work.md`

**Auto mode path:**
The original verify-work is a conversational UAT flow — it presents tests to the user interactively. In auto mode (per user decision), it must work without user interaction.

**Critical finding:** verify-work is inherently interactive — it reads SUMMARY.md files, extracts testable behaviors, and waits for user pass/fail responses. The `--auto` decision means no AskUserQuestion prompts, but the core loop (present test → wait for response) IS the workflow. The SKILL.md must preserve the interactive test loop but without AskUserQuestion.

**Recommended auto adaptation:** In auto mode, verify-work presents all tests inline as a checklist in the chat and waits for user free-text responses (no structured AskUserQuestion required). The LLM manages the conversation flow directly.

**Agents needed:** gsd-verifier (for gap closure phase after UAT failures)

**Stage split:** SKILL.md handles UAT loop directly; stage-verify.md contains gsd-verifier for gap analysis only

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Task()` sub-agent spawn (Claude Code) | Inline agent prompt injection in SKILL.md | Phase 1 | No sub-agent spawning needed; LLM executes role within same session |
| registerCommand for all GSD commands | SKILL.md for LLM workflows, registerCommand only for LLM-bypass | Phase 1 | Commands that need AI reasoning use SKILL.md; pure data-return commands use registerCommand |
| @/Users/.../agents/gsd-planner.md path refs | Verbatim inline content | Phase 2 | Portable across machines; self-contained skill files |

---

## Open Questions

1. **SKILL.md @-reference loading semantics in OpenClaw**
   - What we know: `@path` references in SKILL.md inject file content into LLM context
   - What's unclear: Whether @-references in a stage file (loaded via @-reference from orchestrator) are resolved recursively or only top-level
   - Recommendation: Design orchestrator to @-reference stage files at the point of use (not in a global preamble). Test with a two-level reference in Wave 0 plan.

2. **gsd-tools `roadmap analyze` JSON schema**
   - What we know: Subcommand exists (`roadmap analyze` — listed in gsd-tools.cjs source comments). Returns full roadmap parse.
   - What's unclear: Exact JSON schema — not verified live.
   - Recommendation: Run `node gsd-tools.cjs roadmap analyze` against an existing project in Wave 0 to document the schema before building gsd_roadmap_summary tool.

3. **wave-state.json write atomicity from SKILL.md instructions**
   - What we know: SKILL.md instructs the LLM to write files using Write tool. There is no transaction primitive.
   - What's unclear: If LLM crashes mid-write, can wave-state.json be in a corrupt/partial state?
   - Recommendation: Keep wave-state.json writes simple (one JSON object), and treat any `pending` plan as "safe to re-run" in resume logic. This handles both crash-before-write and crash-during-write.

4. **`gsd-new-project/SKILL.md` naming conflict**
   - What we know: Phase 1 created `skills/gsd-new-project/SKILL.md` with `name: gsd-new-project` (no colon namespace). Phase 2 needs `/gsd:new-project`.
   - What's unclear: Whether OpenClaw allows two SKILL.md files with different names in different directories, or whether it's directory-name-based.
   - Recommendation: Phase 2 creates `skills/workflows/new-project/SKILL.md` with `name: gsd:new-project`. Rename/remove the Phase 1 POC to avoid conflict, OR update its frontmatter to `name: gsd:new-project` in place.

---

## Validation Architecture

> Skipped — `workflow.nyquist_validation` is false in `.planning/config.json`.

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `/Users/egorproskyrin/.claude/get-shit-done/workflows/new-project.md` — full auto mode workflow
- Direct inspection of `/Users/egorproskyrin/.claude/get-shit-done/workflows/plan-phase.md` — full orchestration logic, Task() spawn patterns
- Direct inspection of `/Users/egorproskyrin/.claude/get-shit-done/workflows/execute-phase.md` — wave execution, phase-plan-index usage, aggregate_results
- Direct inspection of `/Users/egorproskyrin/.claude/get-shit-done/workflows/verify-work.md` — UAT loop, verifier spawn
- Direct inspection of `/Users/egorproskyrin/.claude/agents/gsd-planner.md` — full planner system prompt, PLAN.md structure, frontmatter fields
- Direct inspection of `/Users/egorproskyrin/.claude/agents/gsd-plan-checker.md` — full checker system prompt, verification dimensions
- Direct inspection of `/Users/egorproskyrin/.claude/agents/gsd-executor.md` — full executor system prompt
- Direct inspection of `/Users/egorproskyrin/.claude/agents/gsd-verifier.md` — full verifier system prompt, VERIFICATION.md structure
- Direct inspection of `/Users/egorproskyrin/.claude/agents/gsd-phase-researcher.md` — full researcher system prompt
- Direct inspection of `/Users/egorproskyrin/.claude/agents/gsd-roadmapper.md` — full roadmapper system prompt
- Direct inspection of `/Users/egorproskyrin/.claude/agents/gsd-research-synthesizer.md` — full synthesizer system prompt
- Live execution of `gsd-tools.cjs init execute-phase` — verified JSON schema
- Live execution of `gsd-tools.cjs init plan-phase` — verified JSON schema
- Live execution of `gsd-tools.cjs init new-project` — verified JSON schema
- Live execution of `gsd-tools.cjs init verify-work` — verified JSON schema
- Live execution of `gsd-tools.cjs phase-plan-index 2` — verified output shape
- Direct inspection of `/Users/egorproskyrin/Projects/luvvano/plan-builder-plugins/openclaw-plugin/src/index.ts` — Phase 1 plugin structure
- Direct inspection of `/Users/egorproskyrin/Projects/luvvano/plan-builder-plugins/openclaw-plugin/skills/gsd-new-project/SKILL.md` — Phase 1 SKILL.md proof-of-concept

### Secondary (MEDIUM confidence)
- gsd-tools.cjs source header comments — full subcommand listing (grep confirmed, not all subcommands individually tested)

### Tertiary (LOW confidence)
- `gsd-tools roadmap analyze` JSON schema — subcommand confirmed to exist, schema not verified live
- @-reference recursive resolution behavior in OpenClaw — functional behavior not verified in multi-level reference scenario

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — same stack as Phase 1, no new dependencies
- Architecture patterns: HIGH — based on direct source inspection of all 4 workflows + all relevant agent files
- Pitfalls: HIGH for spawn semantics / path refs (confirmed open issues from Phase 1). MEDIUM for context overflow / wave-state atomicity (design concerns, not verified failures)
- gsd-tools subcommand schemas: HIGH — verified live against gsd-tools.cjs
- Open questions: accurately flagged as LOW-MEDIUM

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable — gsd-tools.cjs is not under active change; OpenClaw SDK stable at >=2026.2.3-1)
