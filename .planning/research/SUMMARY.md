# Project Research Summary

**Project:** GSD for OpenClaw — Plan Builder Plugins
**Domain:** AI coding assistant plugin development (porting a spec-driven development system between platforms)
**Researched:** 2026-03-04
**Confidence:** HIGH (stack and architecture verified against official OpenClaw docs and live source; pitfalls MEDIUM due to cross-platform inference)

## Executive Summary

This project ports the GSD (Get Shit Done) spec-driven development system from its Claude Code implementation to OpenClaw's plugin architecture. GSD is a multi-agent, multi-phase workflow system with 24+ slash commands, 11+ specialized agent roles, file-based state management, and a CLI utility layer (gsd-tools.cjs). The porting challenge is not the feature set — GSD's features are well-defined — but the platform translation: OpenClaw's SKILL.md + plugin SDK architecture is fundamentally different from Claude Code's `Task()` primitives, hooks.json, and agent file format. The two platforms use the same vocabulary (skills, hooks, agents) but have different semantics for each concept.

The recommended approach is a faithful port, not a redesign. The core execution strategy is: SKILL.md files for all AI-driven workflow commands, `registerCommand()` only for LLM-bypass utility commands, gsd-tools.cjs bundled as-is inside the plugin and invoked via shell, and a deliberate v1 simplification of sequential wave execution in place of parallel sub-agent synchronization (which OpenClaw cannot provide). All interactive prompts (`AskUserQuestion`) default to `--auto` mode. This delivers a complete, working GSD experience on OpenClaw without chasing unverified platform APIs.

The dominant risk is the sub-agent orchestration gap: GSD's orchestrators depend on Claude Code's synchronous `Task()` call that returns a value, but OpenClaw sub-agents announce results to the chat channel asynchronously with no return value. This must be resolved in Phase 1 before writing any workflow skill files. Every other pitfall (hardcoded paths, hook format mismatch, command naming, module interop) is mechanical and low-recovery-cost compared to getting the orchestration model wrong.

## Key Findings

### Recommended Stack

OpenClaw plugins are TypeScript-first, loaded at runtime by jiti (no build step required). The plugin SDK's stable public API surface is `openclaw/plugin-sdk/core`, providing `registerCommand`, `registerTool`, `registerService`, and `api.logger`. All GSD commands that involve LLM reasoning are implemented as SKILL.md files (YAML frontmatter + Markdown instructions), not as `registerCommand` handlers — `registerCommand` bypasses the LLM entirely and is appropriate only for static responses like `/gsd:help` and `/gsd:status`.

**Core technologies:**
- **TypeScript 5.3+ (src/index.ts):** Plugin entry point; SDK ships `.d.ts` types; jiti handles runtime transpilation — no `tsc --build` step needed
- **openclaw >=2026.2.3-1 (peer dependency):** Plugin SDK runtime; must be declared as peerDependency, never dependencies, to avoid version conflicts
- **Node.js >=20 LTS:** Required by OpenClaw's npm package and by gsd-tools.cjs; assumed present on any machine running OpenClaw
- **SKILL.md (AgentSkills format):** Primary delivery mechanism for GSD's 24+ workflow commands and 11+ agent role definitions; loaded on demand via gating
- **HOOK.md + handler.ts:** OpenClaw's lifecycle automation format; replaces Claude Code's hooks.json + shell scripts for `agent:bootstrap` and `gateway:startup` events
- **@sinclair/typebox ^0.32:** JSON Schema generation for `registerTool` parameters; use for complex tool schemas; optional for simple 1-2 parameter tools

**Critical version constraint:** Do NOT use `"openclaw": "workspace:*"` in package.json — this breaks `npm install --omit=dev` (OpenClaw issue #14042). Use `>=2026.2.3-1` in peerDependencies.

### Expected Features

GSD for OpenClaw has a clear and well-bounded feature scope: faithful port of the existing system, no redesign. The anti-features section is as important as the feature list — it defines what is explicitly excluded from v1.

**Must have (table stakes):**
- All 24 GSD slash commands as individual SKILL.md files — the core product
- gsd-tools.cjs bundled inside the plugin with runtime path resolution — prerequisite for all workflows
- All 11+ GSD agent roles as separate SKILL.md files in `skills/agents/` — required for multi-role orchestration
- Workflow orchestration via inline agent context injection — replacement for Claude Code's `Task()` primitive
- GSD planning templates bundled in `templates/` — agents need these to produce correctly-structured documents
- Valid `openclaw.plugin.json` manifest with ClawHub-compatible installation — foundation for everything
- Session lifecycle service (update check on `gateway:startup`, context monitoring on `agent:bootstrap`)
- OS gating (`os: ["darwin", "linux"]`) on all skills and hooks — prevents silent failure on Windows
- Command naming convention validated before full port — colon support in `registerCommand` is unconfirmed

**Should have (differentiators):**
- Native `registerTool()` entries for structured state queries (phase status, config reads) — produces reliable JSON for agent reasoning vs. free-form shell text
- `/gsd:help` LLM-bypass command listing all registered commands — self-documenting plugin
- Auto-detection of existing GSD state on command entry — eliminates mandatory `/gsd:config` setup step
- `--auto` mode as default — sidesteps the AskUserQuestion incompatibility cleanly
- Wave-state.json for sequential phase execution tracking — makes interrupted workflows resumable
- Install/uninstall shell scripts — reduces friction for manual (non-ClawHub) installation

**Defer to v2+:**
- Parallel sub-agent wave execution — OpenClaw has no synchronization primitive; sequential is the correct v1 choice
- OpenClaw statusline integration — API surface not confirmed to exist
- Modifications to GSD core logic or workflows — out of scope by design
- Cross-runtime support (Gemini CLI, Codex, etc.) — would force lowest-common-denominator design
- Rewriting gsd-tools.cjs in TypeScript — working code, no reason to touch it

### Architecture Approach

The plugin follows a layered architecture: the thin `src/index.ts` entry point registers commands/tools/services; SKILL.md files in `skills/workflows/` carry all AI-driven orchestration logic; SKILL.md files in `skills/agents/` define specialized agent roles; and gsd-tools.cjs + `.planning/` file store handle all persistent state. The most critical architectural pattern is "command-as-prompt-injector": slash commands return a brief trigger text that causes the agent to load and follow the relevant SKILL.md, keeping command handlers near zero complexity.

**Major components:**
1. **Plugin entry point (`src/index.ts`)** — registers all commands/tools/services; thin wiring layer; no workflow logic
2. **Workflow SKILL.md files (`skills/workflows/`)** — one per major GSD command; carries full orchestration logic as LLM instructions; references agent SKILL.md content by path or injection
3. **Agent SKILL.md files (`skills/agents/`)** — one per GSD agent role (planner, executor, verifier, roadmapper, phase-researcher, project-researcher, plan-checker, debugger, codebase-mapper, etc.)
4. **gsd-tools.cjs (`bin/`)** — bundled as-is; called via shell from SKILL.md steps; handles state management, phase lookup, commit helpers, config reads
5. **Templates + References (`templates/`, `references/`)** — bundled planning file templates and reference docs; read by workflow SKILL.md instructions at runtime
6. **Lifecycle service** — `registerService()` providing update check on startup and context monitoring on `agent:bootstrap`

### Critical Pitfalls

1. **Task() has no OpenClaw equivalent** — GSD's `Task(subagent_type="gsd-planner")` is synchronous and returns a value; OpenClaw sub-agents announce results to the chat channel and never return a value. Use the inline instruction-generation pattern (tools that return detailed instruction strings the main agent executes itself) for tight orchestration, and accept sequential wave execution in v1. Must be resolved in Phase 1 before writing any workflow skill files — wrong architecture here requires full rewrite.

2. **Hardcoded absolute paths to gsd-tools.cjs** — Every GSD workflow references `node /Users/egorproskyrin/.claude/get-shit-done/bin/gsd-tools.cjs`. This path must be made portable before any other porting work. Solution: bundle gsd-tools.cjs in `bin/` inside the plugin; resolve path at startup using `import.meta.dirname`; expose as `GSD_TOOLS_PATH` env var via the lifecycle service.

3. **AskUserQuestion has no OpenClaw equivalent** — GSD uses Claude Code's `AskUserQuestion` for structured multi-select dialogs at 8+ critical workflow decision points. OpenClaw has no equivalent interactive dialog primitive. Solution: default all OpenClaw GSD commands to `--auto` mode; use GSD's existing auto-advance path which skips all `AskUserQuestion` calls.

4. **Claude Code hooks.json format is silently ignored by OpenClaw** — Copying `hooks.json` or placing shell scripts in a hooks directory does nothing. OpenClaw hooks are HOOK.md files with TypeScript handlers responding to typed events (`command:new`, `agent:bootstrap`, `gateway:startup`). Must use the correct format from Phase 1.

5. **Colon-namespaced command names are unverified** — OpenClaw's `registerCommand()` may not support `/gsd:new-project` naming. The existing OpenClaw plugin uses plain names. Test one colon-named command before porting all 24; establish and apply the naming convention (colons / hyphens / underscores) consistently across all SKILL.md frontmatter, command registrations, and documentation.

## Implications for Roadmap

Based on combined research, the architecture's dependency graph and pitfall-to-phase mapping both converge on the same build sequence. Foundation must come first; the agent injection pattern must be validated before scaling out commands; hooks and distribution are independent later-phase concerns.

### Phase 1: Foundation and Architecture Validation

**Rationale:** Five of the ten documented pitfalls must be addressed before writing any workflow skill files. The most expensive pitfall (Task() orchestration model) cannot be discovered after 20+ workflow skills are written. This phase validates all critical unknowns before scale-up.

**Delivers:** Working plugin scaffold with manifest, one complete end-to-end workflow (new-project or plan-phase), portable gsd-tools.cjs path resolution, confirmed command naming convention, verified skill loading chain, OS gating boilerplate

**Addresses:** Table stakes items 6 (manifest), 2 (gsd-tools.cjs bundling), 9 (command naming validation), 4 (orchestration pattern)

**Avoids:** Pitfalls 1 (Task() misdesign), 2 (hardcoded paths), 3 (AskUserQuestion), 6 (colon naming), 7 (CJS module interop), 9 (skills not loading), 10 (Unix path gating)

**Research flag:** Needs phase research — specifically, OpenClaw's sub-agent spawning API needs hands-on testing to confirm whether `llm_task` tool exists, what its return semantics are, and whether colon-namespaced commands register correctly.

### Phase 2: Core Workflow Commands (new-project, plan-phase, execute-phase, verify-phase)

**Rationale:** These 4 commands cover 80% of GSD's value. They exercise the full orchestration pattern validated in Phase 1. Building all 4 together ensures the agent injection pattern (workflow skill → agent skill content) is consistent before scaling to 20+ commands.

**Delivers:** The 4 primary GSD commands as SKILL.md files; 4 primary agent SKILL.md files (planner, executor, verifier, roadmapper); wave-state.json sequential execution pattern for execute-phase; auto-mode as default interaction pattern

**Addresses:** Table stakes 1 (24 commands — 4 of them), 3 (agent roles — 4 of them), 4 (workflow orchestration), 14 (wave-state tracking)

**Avoids:** Pitfall 8 (parallel wave sync — v1 uses sequential), Pitfall 3 (AskUserQuestion — use --auto)

**Research flag:** Standard patterns; Phase 1 validation results define the exact implementation approach. No additional research needed if Phase 1 succeeds.

### Phase 3: Remaining Commands and Agent Roles

**Rationale:** With the orchestration pattern validated and 4 core commands working, remaining commands are mechanical applications of the same pattern. All 7+ remaining agent roles follow the same SKILL.md format established in Phase 2.

**Delivers:** All 24 GSD slash commands as SKILL.md files; all 11+ agent role SKILL.md files; full templates bundle; all reference docs bundled; native `registerTool()` state query tools; `/gsd:help` LLM-bypass command; auto-detection of GSD state on command entry

**Addresses:** Table stakes 1 (all remaining commands), 3 (all remaining agents), 5 (templates), 10 (native state query tools), 11 (help command), 12 (state auto-detection), 13 (--auto default), 8 (OS gating applied consistently)

**Avoids:** Pitfall 5 (model selection — implement as a TypeScript tool reading config.json)

**Research flag:** Standard patterns; no new research needed. Scale-up of validated pattern.

### Phase 4: Hooks, Lifecycle Services, and Distribution

**Rationale:** Hooks and distribution are independent of workflow correctness. They can be built in parallel with Phase 3 or after, depending on bandwidth. The lifecycle service (update check, context monitoring) and ClawHub distribution require the manifest to be finalized first.

**Delivers:** HOOK.md + handler.ts for context monitor (`agent:bootstrap`) and update check (`gateway:startup`); ClawHub-compatible manifest finalization; install/uninstall scripts; end-to-end ClawHub installation test; security audit (requireAuth on all write commands)

**Addresses:** Table stakes 7 (session lifecycle), 6 (ClawHub installation), 15 (install scripts); Differentiator 15 (install UX)

**Avoids:** Pitfall 4 (hooks.json format confusion — use correct HOOK.md format from start)

**Research flag:** Moderate — OpenClaw's `agent:bootstrap` event and its context injection mechanism need verification. If it does not support file content injection, context monitoring degrades to opt-in (documented manual approach). Statusline API is unconfirmed; exclude unless documented.

### Phase Ordering Rationale

- Phase 1 before everything: five critical unknowns (orchestration model, path resolution, naming, CJS interop, skill loading) must be resolved first or all subsequent work may need rearchitecting
- Phase 2 before Phase 3: agent injection pattern must be proven on 4 commands before scaling to 24; pattern bugs are cheap to fix at 4 commands, expensive at 24
- Phase 4 last: hooks and distribution are additive; the plugin is usable (if manually installed) after Phase 2; Phase 4 makes it production-grade and distributable
- Sequential execution (not parallel) for wave model in v1: OpenClaw has no synchronization primitive; accepting this limitation in the design phase prevents Pitfall 8

### Research Flags

Phases needing deeper research during planning:
- **Phase 1:** OpenClaw sub-agent spawning semantics need hands-on testing — does the `llm_task` tool exist? Does it return a value? Are colon-namespaced commands supported in `registerCommand()`? These questions block the entire orchestration architecture and cannot be answered from documentation alone.
- **Phase 4:** OpenClaw `agent:bootstrap` event semantics — specifically, can context be injected as file content or is it limited to message prepending? Affects whether the context monitor is automatic or opt-in.

Phases with standard patterns (skip research-phase):
- **Phase 2:** SKILL.md format, agent role pattern, and inline instruction generation are all documented and proven in the existing plugin. Apply validated Phase 1 patterns.
- **Phase 3:** Mechanical scale-up of Phase 2 patterns. Well-documented distribution via `openclaw.plugin.json` skills array.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All claims verified against official OpenClaw docs (docs.openclaw.ai) as of 2026-03-04, OpenClaw v2026.3.2. Critical known issue (#14042) confirmed from official repo. |
| Features | HIGH | Feature set is bounded by the existing GSD implementation (ground truth) and the OpenClaw plugin SDK (constraint). Anti-features are well-reasoned from platform capability gaps. |
| Architecture | HIGH | Based on direct source inspection of both GSD workflows/agents and the existing OpenClaw plugin. Component mapping is concrete, not speculative. One LOW confidence area: OpenClaw sub-agent spawn semantics. |
| Pitfalls | MEDIUM | Platform API pitfalls (Task() mismatch, hooks format, AskUserQuestion) are HIGH confidence. Cross-platform porting pitfalls (module interop behavior, skill auto-loading edge cases) are MEDIUM — inferred from architecture analysis, not community post-mortems. |

**Overall confidence:** HIGH — the recommended approach is conservative and based on verified information. The main uncertainties are confined to Phase 1 unknowns which are explicitly flagged for hands-on validation.

### Gaps to Address

- **OpenClaw sub-agent spawn API:** Whether `llm_task` tool exists, its return semantics, and whether it enables synchronous orchestration or only announcement-based results. Handle in Phase 1 by building one complete orchestration flow and verifying behavior before scaling. If synchronous return is unavailable, the inline instruction-generation pattern is the confirmed fallback.
- **Colon support in registerCommand names:** Whether `/gsd:new-project` registers correctly or requires renaming to `gsd-new-project` or `gsd_new_project`. Handle in Phase 1 with a single test registration before porting all 24 commands.
- **OpenClaw agent:bootstrap injection mechanism:** Whether context can be file-content-injected or is limited to chat-prepended text. Affects context monitor design. Handle in Phase 4 by testing with a minimal HOOK.md before building the full monitor.
- **Model selection in sub-agent spawning:** GSD's model profile system requires passing a model parameter to sub-agent invocations. OpenClaw's sub-agent spawn `--model` flag may not be accessible from SKILL.md instructions directly. Handle in Phase 3 by implementing model selection as a `registerTool()` TypeScript tool that reads config.json and returns the correct model identifier.

## Sources

### Primary (HIGH confidence)
- [docs.openclaw.ai/tools/plugin](https://docs.openclaw.ai/tools/plugin) — Plugin API: registerCommand, registerTool, registerService, SDK import paths
- [docs.openclaw.ai/plugins/manifest](https://docs.openclaw.ai/plugins/manifest) — openclaw.plugin.json required fields and validation behavior
- [docs.openclaw.ai/plugins/agent-tools](https://docs.openclaw.ai/plugins/agent-tools) — registerTool patterns, optional tools, TypeBox usage
- [docs.openclaw.ai/tools/skills](https://docs.openclaw.ai/tools/skills) — SKILL.md format, gating, AgentSkills compatibility
- [docs.openclaw.ai/tools/creating-skills](https://docs.openclaw.ai/tools/creating-skills) — Step-by-step SKILL.md creation guide
- [docs.openclaw.ai/automation/hooks](https://docs.openclaw.ai/automation/hooks) — HOOK.md format, event types, handler export format
- [docs.openclaw.ai/tools/subagents](https://docs.openclaw.ai/tools/subagents) — Sub-agent spawning, tool policy by depth, nested orchestration
- [docs.openclaw.ai/tools/clawhub](https://docs.openclaw.ai/tools/clawhub) — ClawHub CLI distribution workflow
- [github.com/openclaw/openclaw/issues/14042](https://github.com/openclaw/openclaw/issues/14042) — workspace:* devDependency bug in peerDependencies
- Direct source inspection: `/Users/egorproskyrin/Projects/luvvano/plan-builder-plugins/openclaw-plugin/src/index.ts` — existing OpenClaw plugin API usage
- Direct source inspection: `/Users/egorproskyrin/.claude/get-shit-done/workflows/` — all 28 GSD workflow files
- Direct source inspection: `/Users/egorproskyrin/.claude/agents/` — all 11 GSD agent definitions
- Direct source inspection: `/Users/egorproskyrin/.claude/settings.json` — GSD hooks (SessionStart, PostToolUse, statusLine)
- Direct source inspection: `/Users/egorproskyrin/.claude/get-shit-done/bin/gsd-tools.cjs` — CLI interface (20+ subcommands)

### Secondary (MEDIUM confidence)
- [dev.to/wonderlab/openclaw-deep-dive-4-plugin-sdk-and-extension-development](https://dev.to/wonderlab/openclaw-deep-dive-4-plugin-sdk-and-extension-development-51ki) — peerDependencies pattern, jiti alias, TypeScript runtime loading; consistent with official docs but third-party

### Tertiary (LOW confidence)
- OpenClaw sub-agent synchronous return semantics — inferred from architecture analysis of existing plugin; needs hands-on validation in Phase 1
- OpenClaw agent:bootstrap context injection mechanism — documented event exists, injection details unverified

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
