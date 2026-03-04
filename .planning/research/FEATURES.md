# Features Research: GSD for OpenClaw

## Table Stakes (must have)

Features that are essential for GSD to work on OpenClaw. Without these, the port is useless.

---

### 1. All 24 GSD Slash Commands as SKILL.md Files

**Description:** Every GSD slash command (`/gsd:new-project`, `/gsd:plan-phase`, `/gsd:execute-phase`, `/gsd:verify-phase`, and all remaining ~20 commands) must be represented as individual SKILL.md files with YAML frontmatter. Each SKILL.md auto-triggers when the user invokes the command and injects the full workflow instruction set into the agent's context. Commands that bypass the LLM (status/info commands) register via `api.registerCommand()` in `src/index.ts`; all AI-driven workflow commands use SKILL.md instead (not `registerCommand`, which bypasses the LLM).

**Complexity:** High

**Dependencies:** Working OpenClaw plugin manifest (`openclaw.plugin.json`), resolved command naming convention (colon vs. hyphen vs. underscore), gsd-tools.cjs path resolution

---

### 2. gsd-tools.cjs Bundled and Path-Resolved

**Description:** The GSD tooling layer (`gsd-tools.cjs`) must be bundled inside the plugin package — not referenced by absolute path. The plugin entry (`src/index.ts`) resolves the path at startup using `import.meta.dirname` or `__dirname` and injects it into the shell environment (e.g., as `GSD_TOOLS_PATH`) via the registered service. Every workflow SKILL.md references this environment variable for shell calls. Without this, all state management, phase lookup, commit helpers, and config reads fail silently for any user who is not the original developer.

**Complexity:** Medium

**Dependencies:** Plugin service registration (`api.registerService()`), Node.js >=20 on host, `openclaw.plugin.json` plugin manifest

---

### 3. All 10+ GSD Agent Roles as Agent SKILL.md Files

**Description:** Each GSD specialized agent (gsd-planner, gsd-executor, gsd-verifier, gsd-roadmapper, gsd-phase-researcher, gsd-project-researcher, gsd-plan-checker, and others) must be a separate SKILL.md in `skills/agents/`. These files contain the role's full system prompt. Orchestrator workflow SKILL.md files inject the relevant agent SKILL.md content inline when simulating sub-agent dispatch, since OpenClaw has no synchronous `Task()` primitive that returns a value. Without the agent definitions, multi-role orchestration collapses into a single undifferentiated agent.

**Complexity:** Medium

**Dependencies:** Workflow SKILL.md files (Table Stakes #1), understanding of OpenClaw's inline context injection pattern

---

### 4. Workflow Orchestration via Inline Agent Context Injection

**Description:** GSD orchestrators spawn parallel sub-agents using Claude Code's `Task()` primitive, which is synchronous and returns a value. OpenClaw has no equivalent. The port must implement orchestration using inline instruction generation: each orchestrator workflow SKILL.md instructs the main agent to reason through the workflow and, where sub-agent roles are needed, inline-injects the full agent SKILL.md content as a context block. For the execute-phase parallel wave model, v1 uses sequential execution as a deliberate simplification (see Anti-Features). This is the highest-risk architectural decision in the entire port.

**Complexity:** High

**Dependencies:** All agent SKILL.md files (Table Stakes #3), all workflow SKILL.md files (Table Stakes #1)

---

### 5. GSD Templates Bundled in Plugin

**Description:** GSD's planning templates (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, PHASE-*.md, and others) must be bundled in the plugin under a `templates/` directory. Workflow SKILL.md files reference these templates by path when instructing the agent to create planning documents. Without the templates, agents produce ad-hoc planning files that deviate from GSD's expected structure, breaking subsequent commands that parse these files via gsd-tools.cjs.

**Complexity:** Low

**Dependencies:** gsd-tools.cjs path resolution (Table Stakes #2)

---

### 6. Plugin Manifest and ClawHub-Compatible Installation

**Description:** A valid `openclaw.plugin.json` manifest must declare the plugin's id, version, entry point, skill directories, and config schema. The plugin must be installable both via ClawHub (the official OpenClaw extension registry) and via manual copy to `~/.openclaw/extensions/`. The `package.json` must declare `openclaw` as a peer dependency using the version range format (`>=2026.2.3-1`), not `workspace:*` which breaks `npm install --omit=dev`. Without a valid manifest, the plugin does not load and all other features are moot.

**Complexity:** Low

**Dependencies:** None (this is the foundation everything else builds on)

---

### 7. Session Lifecycle Service (Update Check + Context Monitor)

**Description:** GSD's `SessionStart` hook (version update check) and `PostToolUse` hook (context window monitor) must map to `api.registerService()` in `src/index.ts`. The service's `start()` method runs the update check on plugin load. Context monitoring is best-effort: if OpenClaw exposes a tool-use event, subscribe to it; otherwise, a polling interval inside the service approximates PostToolUse behavior. The statusline hook is excluded (see Anti-Features). Without the update check, users run stale GSD definitions; without context monitoring, agents risk context overflow on long workflows.

**Complexity:** Medium

**Dependencies:** Plugin manifest (Table Stakes #6), gsd-tools.cjs path resolution (Table Stakes #2), investigation of OpenClaw's event model

---

### 8. OS Gating for Unix-Only Shell Commands

**Description:** All GSD workflow SKILL.md files and HOOK.md files must include `os: ["darwin", "linux"]` gating in their YAML frontmatter. GSD's shell commands (`mkdir -p`, `cat`, Unix path separators) are Unix-specific and will fail silently on Windows. OS gating surfaces a clear unsupported message rather than cryptic shell failures. Without this, Windows users get confusing errors that appear to be bugs in the port.

**Complexity:** Low

**Dependencies:** SKILL.md and HOOK.md files (Table Stakes #1, #7)

---

### 9. Command Naming Convention Validated Before Full Port

**Description:** OpenClaw's `registerCommand()` API may not support colon-separated command names (`gsd:new-project`). Before porting all 24 commands, the naming convention must be tested and locked. The decision (colons / hyphens `gsd-new-project` / underscores `gsd_new_project`) must be made in Phase 1 and applied consistently to all SKILL.md frontmatter, all `api.registerCommand()` calls, and all user-facing documentation. A mid-port naming change across 24+ files is a high-cost rework.

**Complexity:** Low

**Dependencies:** Plugin manifest (Table Stakes #6)

---

## Differentiators

Features that make this port stand out vs manually copying GSD files.

---

### 10. Native OpenClaw Tool Registration for State Queries

**Description:** Instead of forcing users to invoke shell commands manually or parse raw SKILL.md output, register key gsd-tools.cjs operations (phase status, roadmap summary, config read) as `api.registerTool()` entries. This gives the agent structured JSON tool responses it can reason about directly, rather than parsing free-form shell text. The result is more reliable state transitions and fewer hallucinated "phase complete" claims. This is a step up from the inline-instruction pattern used in the minimal existing plugin.

**Complexity:** Medium

**Dependencies:** gsd-tools.cjs path resolution (Table Stakes #2), plugin manifest (Table Stakes #6)

---

### 11. `/gsd:help` Command Listing All Registered Commands

**Description:** A `/gsd:help` command (registered via `api.registerCommand()`, bypassing the LLM) that returns a formatted list of all 24+ GSD commands with one-line descriptions, organized by workflow stage (init / plan / execute / verify / utility). This makes the plugin self-documenting inside OpenClaw without requiring users to read external documentation. It also serves as a smoke test confirming all commands are registered and discoverable.

**Complexity:** Low

**Dependencies:** All SKILL.md files registered (Table Stakes #1)

---

### 12. Auto-Detection of Existing GSD State on Command Entry

**Description:** Each workflow SKILL.md reads `.planning/STATE.md` at the start and branches its instructions based on current state (no project / project initialized / phase in progress / phase complete). Users do not need to run a `/gsd:config` setup step before other commands. This removes a common GSD onboarding friction point and is implemented by injecting a gsd-tools.cjs `get-state` call at the top of every workflow skill's instruction block.

**Complexity:** Medium

**Dependencies:** gsd-tools.cjs path resolution (Table Stakes #2), workflow SKILL.md files (Table Stakes #1)

---

### 13. Explicit `--auto` Mode as Default for OpenClaw

**Description:** GSD supports an interactive questioning mode (`AskUserQuestion`) that relies on Claude Code's user-interaction primitives. OpenClaw's equivalent is unconfirmed and may not exist. The port defaults all commands to `--auto` mode (no interactive questions; agents make reasonable assumptions). A SKILL.md-level flag allows users to opt into a verbose mode that prompts them for answers within the chat channel instead. Defaulting to `--auto` eliminates a whole class of broken interactive flows while preserving workflow completeness.

**Complexity:** Low

**Dependencies:** Workflow SKILL.md files (Table Stakes #1)

---

### 14. Wave-State File for Sequential Phase Execution Tracking

**Description:** GSD's execute-phase workflow is wave-based (parallel agent groups). Since OpenClaw lacks a synchronization primitive for parallel sub-agents, v1 executes waves sequentially. A `wave-state.json` file in `.planning/` tracks which wave is active, which tasks are complete, and which are pending. The orchestrator SKILL.md reads this file before each step, enabling resumable execution if a command is interrupted mid-phase. This turns a known limitation (no parallelism) into a recoverable sequential workflow.

**Complexity:** Medium

**Dependencies:** Workflow orchestration pattern (Table Stakes #4), gsd-tools.cjs path resolution (Table Stakes #2)

---

### 15. Install and Uninstall Scripts

**Description:** Shell scripts (`install.sh`, `uninstall.sh`) that handle symlinking or copying the plugin to `~/.openclaw/extensions/`, resolving gsd-tools.cjs, and verifying Node.js version. Reduces setup friction for users who install manually instead of via ClawHub. The install script also sets any required environment variables in the user's shell profile if needed. Uninstall cleans up without leaving orphaned config.

**Complexity:** Low

**Dependencies:** Plugin manifest (Table Stakes #6), gsd-tools.cjs bundling (Table Stakes #2)

---

## Anti-Features

Things to deliberately NOT build.

---

### 16. Parallel Sub-Agent Wave Execution (v1)

**Description:** GSD's execute-phase spawns multiple executor agents in parallel per wave, then synchronizes their outputs before proceeding. OpenClaw has no synchronization primitive — sub-agents announce results asynchronously to the chat channel with no "wait for all" barrier. Attempting to implement this faithfully in v1 produces race conditions in STATE.md updates, missing SUMMARY.md files, and non-deterministic wave advancement. V1 deliberately executes waves sequentially, documented as a known limitation. Parallel execution is deferred to v2 pending investigation of the OpenClaw LLM Task tool's multi-invocation pattern.

**Complexity:** N/A (excluded)

**Dependencies:** N/A

---

### 17. Statusline Hook Port

**Description:** GSD's `statusLine` hook injects a live status string into Claude Code's UI statusline (showing current phase, context usage, etc.). OpenClaw has no confirmed equivalent statusline API. Implementing a mock statusline that only outputs to chat on demand (e.g., via `/gsd:status`) is already covered by Table Stakes #1. Building a full statusline integration requires an API surface that may not exist, and approximating it via polling produces visual noise. This feature is excluded unless OpenClaw documents a statusline extension point.

**Complexity:** N/A (excluded)

**Dependencies:** N/A

---

### 18. Modifications to GSD Core Logic or Workflows

**Description:** This project is a faithful port, not a redesign. GSD's planning stages, phase structure, commit conventions, agent roles, and document formats are not changed. Any temptation to "improve" GSD workflows while porting them (adding new stages, merging agent roles, changing template schemas) is explicitly out of scope. Such changes would diverge the OpenClaw port from GSD's canonical behavior, making the two plugins incompatible and creating a maintenance split with no clear owner.

**Complexity:** N/A (excluded)

**Dependencies:** N/A

---

### 19. Support for Non-OpenClaw Runtimes

**Description:** This plugin targets OpenClaw only. Gemini CLI, Codex, OpenCode, and other agentic runtimes are not supported. The existing `claude-code-plugin` stays as-is. Building an abstraction layer that attempts to run on multiple runtimes would require a lowest-common-denominator approach that undermines OpenClaw's native SKILL.md and plugin SDK features, producing a worse experience on all platforms.

**Complexity:** N/A (excluded)

**Dependencies:** N/A

---

### 20. Rewriting gsd-tools.cjs in TypeScript

**Description:** `gsd-tools.cjs` is working, tested Node.js utility code. Rewriting it in TypeScript to make it "feel native" to the plugin wastes significant time and introduces new bugs in logic that is already correct. The plugin bundles the `.cjs` file as-is and calls it via shell. The only change allowed is path resolution (moving it from a hardcoded absolute path to a relative plugin-internal path). Any deeper rewrite is out of scope for v1.

**Complexity:** N/A (excluded)

**Dependencies:** N/A

---

### 21. Custom UI or Chat Widget

**Description:** OpenClaw's existing chat UI, skill system, and command palette are sufficient for all GSD interactions. Building custom UI components (phase progress bars, inline task boards, file tree views) would require OpenClaw UI extension APIs that are either undocumented or non-existent. All GSD output is markdown-formatted text rendered in the standard chat channel. No custom UI work is planned.

**Complexity:** N/A (excluded)

**Dependencies:** N/A

---

*Last updated: 2026-03-04*
