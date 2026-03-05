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
- [ ] **Phase 3: Full Command Set** - Scale out to all 24 commands, bundle all templates and references, add state query tools
- [ ] **Phase 4: Lifecycle and Distribution** - Add hooks, lifecycle services, install scripts, and ClawHub packaging

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

### Phase 4: Lifecycle and Distribution
**Goal**: Plugin is production-grade — lifecycle services run automatically, and users can install via ClawHub or manual copy with documentation
**Depends on**: Phase 3
**Requirements**: LIFE-01, LIFE-02, LIFE-03, DIST-01, DIST-02, DIST-03, DIST-04
**Success Criteria** (what must be TRUE):
  1. On OpenClaw startup, the update check fires via `gateway:startup` and reports whether a newer GSD plugin version is available
  2. On agent bootstrap, the context monitor fires via `agent:bootstrap` and injects GSD state context into the session
  3. Plugin installs successfully via `clawhub install luvvano/plan-builder-plugins` and uninstalls cleanly via the provided shell script
  4. README documents OpenClaw-specific setup, command reference, and manual install path clearly enough that a new user can get started without external help
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-04 |
| 2. Core Workflows | 0/TBD | Not started | - |
| 3. Full Command Set | 3/5 | In Progress|  |
| 4. Lifecycle and Distribution | 0/TBD | Not started | - |
