# Phase 2: Core Workflows - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Port the 4 primary GSD commands (new-project, plan-phase, execute-phase, verify-work) to OpenClaw as SKILL.md workflows. Implement all agent roles needed by these commands, wave-based execution with state tracking, and essential state query tools. Remaining commands (20 of 24) and their agents are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Agent Role Organization
- Agent SKILL.md files grouped by workflow (e.g., planning-agents.md bundles planner + plan-checker + researcher)
- Full faithful port of all original GSD agent system prompts — every instruction, guardrail, and example preserved
- Agent skills are internal-only — not user-invocable via slash commands. Users interact via workflow commands (/gsd:plan-phase), not agent commands
- Only implement agents used by the 4 core commands (~8-10 agents). Remaining agents come in Phase 3 with their commands

### Orchestration Pattern
- Each workflow command has separate SKILL.md files per stage (e.g., plan-phase has research stage, planning stage, verification stage)
- Agent prompts embedded directly in stage skills — self-contained, no @path references to agent files
- All workflows default to --auto mode with smart defaults, no AskUserQuestion prompts. Fully autonomous execution
- Orchestration is LLM-driven: workflow SKILL.md contains step-by-step instructions the LLM follows using available tools

### Wave Execution Model
- Execute-phase runs plans sequentially within wave groupings. Wave structure tracked in wave-state.json for future parallelism
- wave-state.json tracks per-plan completion. On resume, skip completed plans and continue from first incomplete
- Atomic git commits after each plan completes — clean history, easy to revert individual plans
- wave-state.json lives in phase directory: .planning/phases/XX-name/wave-state.json

### State Query Tools
- Register 3-4 essential tools only: gsd_phase_status, gsd_config_get, gsd_roadmap_summary, gsd_state_snapshot
- All tools return structured JSON responses for reliable parsing by workflow skills
- Tools are LLM-callable — registered via registerTool() so SKILL.md instructions can invoke them directly
- All tool names use gsd_ prefix to avoid namespace collisions with other plugins

### Claude's Discretion
- Exact wave grouping logic (how to determine which plans can run in parallel within a wave)
- Internal file structure for stage SKILL.md files within skills/workflows/
- Which gsd-tools.cjs subcommands map to the 3-4 registered tools
- Error handling and retry logic within workflow stages

</decisions>

<specifics>
## Specific Ideas

- The orchestrator SKILL.md for each command should read like a recipe — clear sequential steps the LLM follows
- Stage skills should be self-contained enough that swapping one out doesn't break the pipeline
- wave-state.json should be human-readable for debugging interrupted executions

</specifics>

<deferred>
## Deferred Ideas

- True parallel sub-agent execution within waves — v2 requirement (PARA-01, PARA-02)
- Model profile system driving sub-agent model selection — v2 requirement (PLAT-02)
- Remaining 20 commands and their agent roles — Phase 3

</deferred>

---

*Phase: 02-core-workflows*
*Context gathered: 2026-03-05*
