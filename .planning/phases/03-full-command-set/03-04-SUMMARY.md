---
phase: 03-full-command-set
plan: "04"
subsystem: openclaw-plugin/skills/workflows
tags: [skill-authoring, orchestrator-pattern, gsd-commands, cmd-completion]
dependency_graph:
  requires:
    - 03-01: execute-phase skill (orchestrator+stage pattern reference)
    - 03-02: 8 workflow skills from plan 02 (new-project, plan-phase, etc.)
    - 03-03: 8 workflow skills from plan 03 (add-phase, debug, etc.)
  provides:
    - map-codebase orchestrator + codebase-mapper stage
    - audit-milestone orchestrator + integration-checker stage
    - plan-milestone-gaps simple workflow
    - health simple workflow
    - cleanup simple workflow
    - set-profile simple workflow
    - settings simple workflow (auto-mode, no AskUserQuestion)
  affects:
    - CMD-01: complete — all GSD commands now have SKILL.md files (27 total)
    - CMD-02: settings command compliant — no AskUserQuestion usage
key_decisions:
  - "Stage files embed agent roles verbatim for self-containment (no @-reference to agents/ dir)"
  - "settings uses display-only auto-mode — reads config.json, shows table, instructs manual edit"
  - "map-codebase orchestrator uses inline agent spawn instructions, stage-mapper.md is the role"
  - "No AskUserQuestion in any of the 7 new commands — all use auto-mode or display-only patterns"
key_files:
  created:
    - openclaw-plugin/skills/workflows/map-codebase/SKILL.md
    - openclaw-plugin/skills/workflows/map-codebase/stage-mapper.md
    - openclaw-plugin/skills/workflows/audit-milestone/SKILL.md
    - openclaw-plugin/skills/workflows/audit-milestone/stage-check.md
    - openclaw-plugin/skills/workflows/plan-milestone-gaps/SKILL.md
    - openclaw-plugin/skills/workflows/health/SKILL.md
    - openclaw-plugin/skills/workflows/cleanup/SKILL.md
    - openclaw-plugin/skills/workflows/set-profile/SKILL.md
    - openclaw-plugin/skills/workflows/settings/SKILL.md
  modified: []
metrics:
  duration: "~15min"
  tasks_completed: 2
  files_created: 9
  files_modified: 0
  completed_date: "2026-03-05"
requirements_completed:
  - CMD-01
  - CMD-02
---

# Phase 03 Plan 04: Remaining 7 GSD Commands Summary

7 new SKILL.md files completing CMD-01: map-codebase + audit-milestone with orchestrator+stage pattern (embedded agent roles), and 5 simple commands including settings with auto-mode fallback replacing AskUserQuestion.

## What Was Built

Two orchestrator+stage commands:

**map-codebase** (`openclaw-plugin/skills/workflows/map-codebase/`):
- `SKILL.md`: Orchestrates 4 parallel mapper agents (tech, arch, quality, concerns focus areas), manages `.planning/codebase/` directory, includes secret scanning before commit
- `stage-mapper.md`: Full gsd-codebase-mapper agent role embedded verbatim — explores codebase for one focus area, writes directly to `.planning/codebase/`, returns confirmation only. Contains all document templates (STACK.md, INTEGRATIONS.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md)

**audit-milestone** (`openclaw-plugin/skills/workflows/audit-milestone/`):
- `SKILL.md`: 3-source requirements cross-reference (VERIFICATION.md + SUMMARY.md frontmatter + REQUIREMENTS.md traceability), FAIL gate for unsatisfied requirements, orphan detection, spawns integration checker
- `stage-check.md`: Full gsd-integration-checker agent role embedded verbatim — verifies cross-phase wiring, API consumers, auth protection, E2E flows, produces Requirements Integration Map

Five simple commands:

- **plan-milestone-gaps**: Loads MILESTONE-AUDIT.md gaps, groups into logical fix phases, updates ROADMAP.md and REQUIREMENTS.md traceability table (resets unsatisfied checkboxes)
- **health**: Runs `gsd-tools validate health` with optional `--repair` flag, formats results with error codes, offers repair for auto-fixable issues
- **cleanup**: Archives completed milestone phase dirs to `.planning/milestones/v{X.Y}-phases/` with dry-run + user confirmation
- **set-profile**: Validates profile arg (quality/balanced/budget), updates `model_profile` in config.json, displays model assignment table
- **settings**: Reads and displays `.planning/config.json` as formatted table with edit instructions — no AskUserQuestion (auto-mode compliant)

## Decisions Made

**1. settings uses display-only pattern (no AskUserQuestion)**
The GSD source settings.md uses `AskUserQuestion` for interactive configuration. Since OpenClaw plugins must not use AskUserQuestion for non-human-action scenarios (CMD-04 compliance), the settings command instead reads the current config.json and displays it as a formatted table with instructions to edit manually or use `/gsd:set-profile`. This is functionally equivalent for the user while being plugin-compliant.

**2. Stage files embed agent roles verbatim**
Consistent with Phase 02 decision: stage-mapper.md and stage-check.md embed the full agent role content rather than @-referencing the agents/ directory files. This ensures self-containment — the stage files work independently without requiring the agents/ directory to be in scope.

**3. No absolute paths in any file**
All references to gsd-tools use `$GSD_TOOLS_PATH` env variable. The orchestrator pattern uses relative `@./stage-*.md` references so the files work from any project root.

## Verification Results

All plan verification checks passed:

- 27 SKILL.md files total (plan expected 26 — prior phases created more commands than originally estimated; the actual new files match)
- 2 stage files created with `user-invocable: false`
- Both orchestrators contain `@./stage-*` references
- Zero `/Users/` absolute paths across all skill files
- Zero `AskUserQuestion` occurrences in settings SKILL.md

## Deviations from Plan

None — plan executed exactly as written. The SKILL.md count of 27 (vs plan's expected 26) is due to prior phases having created more commands than the plan estimated at authoring time; the 7 new files in this plan are all accounted for.

## Self-Check: PASSED

Files verified:
- `openclaw-plugin/skills/workflows/map-codebase/SKILL.md` — FOUND
- `openclaw-plugin/skills/workflows/map-codebase/stage-mapper.md` — FOUND
- `openclaw-plugin/skills/workflows/audit-milestone/SKILL.md` — FOUND
- `openclaw-plugin/skills/workflows/audit-milestone/stage-check.md` — FOUND
- `openclaw-plugin/skills/workflows/plan-milestone-gaps/SKILL.md` — FOUND
- `openclaw-plugin/skills/workflows/health/SKILL.md` — FOUND
- `openclaw-plugin/skills/workflows/cleanup/SKILL.md` — FOUND
- `openclaw-plugin/skills/workflows/set-profile/SKILL.md` — FOUND
- `openclaw-plugin/skills/workflows/settings/SKILL.md` — FOUND

Commits verified:
- `58b1501` — feat(03-04): add map-codebase and audit-milestone with orchestrator + stage pattern
- `57e2141` — feat(03-04): add plan-milestone-gaps, health, cleanup, set-profile, settings SKILL.md files
