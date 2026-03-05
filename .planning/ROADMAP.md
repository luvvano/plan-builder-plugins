# Roadmap: GSD for OpenClaw

## Overview

Port the full GSD spec-driven development system from its Claude Code implementation to OpenClaw's plugin architecture. The work progresses in four phases: first validate the foundational architecture unknowns before writing any workflow files; then build the four core commands that deliver 80% of GSD's value; then scale out the remaining commands, agents, and templates; finally, add lifecycle services and distribution packaging to make the plugin production-grade and installable via ClawHub.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Scaffold the plugin, bundle gsd-tools.cjs, validate command naming and orchestration pattern end-to-end
- [ ] **Phase 2: Core Workflows** - Port the 4 primary GSD commands, all agent roles, and the full orchestration model
- [x] **Phase 3: Full Command Set** - Scale out to all 24 commands, bundle all templates and references, add state query tools (completed 2026-03-05)
- [ ] **Phase 4: Telegram Utility Aliases** — Register 8 direct-handler commands (gsd_status, gsd_progress, gsd_help, gsd_health, gsd_settings, gsd_update, gsd_project_list, gsd_cleanup) in src/index.ts
- [ ] **Phase 5: Telegram Workflow Aliases** — Register 17 workflow dispatch commands (gsd_quick, gsd_new_project, gsd_plan_phase, gsd_execute_phase, and 13 more) in src/index.ts

## Phase Details

### Phase 1: Foundation
**Goal**: Plugin loads in OpenClaw with a working end-to-end GSD workflow, resolving all architecture unknowns before any scale-up
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):
  1. Running `clawhub install` (or manual copy to `~/.openclaw/extensions/`) loads the plugin without errors in OpenClaw >=2026.2.3-1
  2. `node bin/gsd-tools.cjs` resolves correctly from within the plugin at runtime via `GSD_TOOLS_PATH` — no hardcoded absolute paths remain
  3. A colon-namespaced command (e.g., `/gsd:new-project`) registers and invokes successfully, confirming the naming convention for all 24 commands
  4. One complete GSD workflow (new-project or plan-phase) runs end-to-end, confirming the inline agent context injection pattern works as the Task() replacement
**Plans**: 01-01 (scaffold), 01-02 (commands + SKILL.md) — COMPLETE

### Phase 2: Core Workflows
**Goal**: The four primary GSD commands work end-to-end in OpenClaw with all agent roles and sequential wave execution
**Depends on**: Phase 1
**Requirements**: CMD-03, CMD-04, AGNT-01, AGNT-02, AGNT-03, ORCH-01, ORCH-02, ORCH-03, ORCH-04
**Success Criteria** (what must be TRUE):
  1. `/gsd:new-project`, `/gsd:plan-phase`, `/gsd:execute-phase`, and `/gsd:verify-work` all run end-to-end without requiring `AskUserQuestion`
  2. Each of the 10+ agent roles (planner, executor, verifier, roadmapper, etc.) is invokable as a specialized SKILL.md and produces GSD-quality output
  3. `/gsd:execute-phase` writes wave-state.json and resumes correctly from the last completed wave after an interruption
  4. State queries (phase status, config reads) return structured JSON via `registerTool()` entries, not free-form shell text
**Plans**: TBD

### Phase 3: Full Command Set
**Goal**: All 24 GSD slash commands are available, all templates are bundled, and the plugin is functionally complete for daily use
**Depends on**: Phase 2
**Requirements**: CMD-01, CMD-02, CMD-05, TMPL-01, TMPL-02, TMPL-03
**Success Criteria** (what must be TRUE):
  1. All 24 GSD slash commands are listed and individually invocable via `/gsd:<command>` in OpenClaw
  2. `/gsd:help` returns a structured listing of all commands organized by workflow stage without invoking the LLM
  3. All GSD planning templates (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, etc.) are present in `templates/` and referenced by workflow skills via plugin-relative paths
  4. Every SKILL.md has correct YAML frontmatter (name, description, user-invocable, os gating) — no skill silently fails to load on darwin/linux
**Plans**: TBD

### Phase 4: Telegram Utility Aliases
**Goal**: 8 most-used GSD commands available as instant Telegram bot commands — no AI required, direct execution via gsd-tools
**Milestone**: v1.1 — Telegram Support
**Depends on**: v1.0 complete
**Requirements**: TEL-01, TEL-02, TEL-03, TEL-04, TEL-05, TEL-06, TEL-07, TEL-08, TEL-09, TEL-10
**Success Criteria** (what must be TRUE):
  1. `/gsd_status` in Telegram returns project name, phase, and progress bar without AI involvement
  2. `/gsd_update` pulls latest from GitHub, rsyncs to extension dir, and restarts gateway — all from Telegram
  3. `/gsd_project_list`, `/gsd_progress`, `/gsd_help`, `/gsd_health`, `/gsd_settings`, `/gsd_cleanup` all return formatted text directly
  4. All 8 commands show up in Telegram's bot command autocomplete menu
  5. Passing no args to a command that requires them returns a usage hint, not an error
**Plans**: 04-01 (status, progress, help, health, settings, cleanup), 04-02 (update, project-list)

### Phase 5: Telegram Workflow Aliases
**Goal**: All remaining 17 GSD workflow commands accessible in Telegram as `gsd_*` aliases that dispatch to the corresponding SKILL.md
**Milestone**: v1.1 — Telegram Support
**Depends on**: Phase 4
**Requirements**: TEL-11 through TEL-27
**Success Criteria** (what must be TRUE):
  1. `/gsd_quick Fix login bug` in Telegram triggers the gsd:quick workflow with "Fix login bug" as the task description
  2. `/gsd_plan_phase 1` and `/gsd_execute_phase 1` correctly pass phase number to the corresponding SKILL.md
  3. `/gsd_new_project` starts the new-project workflow with no args required upfront
  4. All 17 workflow aliases pass their `$ARGUMENTS` to the underlying skill correctly
  5. Unrecognized or malformed args return a one-line usage hint
**Plans**: 05-01 (quick, new_project, plan_phase, execute_phase, discuss_phase, verify_work), 05-02 (add_phase, new_milestone, complete_milestone, resume_work, pause_work, debug), 05-03 (add_todo, check_todos, audit_milestone, add_tests, map_codebase, research_phase, list_phase_assumptions, set_profile, insert_phase, remove_phase, plan_milestone_gaps)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-04 |
| 2. Core Workflows | 5/5 | Complete | 2026-03-05 |
| 3. Full Command Set | 5/5 | Complete | 2026-03-05 |
| 4. Telegram Utility Aliases | 0/2 | Not started | - |
| 5. Telegram Workflow Aliases | 0/3 | Not started | - |
