---
phase: 03-full-command-set
plan: 02
subsystem: skills/workflows
tags: [skill-md, gsd-commands, phase-management, workflow-porting]
dependency_graph:
  requires: []
  provides:
    - gsd:discuss-phase SKILL.md
    - gsd:research-phase SKILL.md
    - gsd:list-phase-assumptions SKILL.md
    - gsd:add-phase SKILL.md
    - gsd:insert-phase SKILL.md
    - gsd:remove-phase SKILL.md
    - gsd:quick SKILL.md
    - gsd:progress SKILL.md
  affects:
    - openclaw-plugin/skills/workflows/
tech_stack:
  added: []
  patterns:
    - GSD_TOOLS_PATH env variable resolution via node fallback
    - AskUserQuestion replaced with auto-mode defaults
    - Absolute paths replaced with $GSD_TOOLS_PATH
key_files:
  created:
    - openclaw-plugin/skills/workflows/discuss-phase/SKILL.md
    - openclaw-plugin/skills/workflows/research-phase/SKILL.md
    - openclaw-plugin/skills/workflows/list-phase-assumptions/SKILL.md
    - openclaw-plugin/skills/workflows/add-phase/SKILL.md
    - openclaw-plugin/skills/workflows/insert-phase/SKILL.md
    - openclaw-plugin/skills/workflows/remove-phase/SKILL.md
    - openclaw-plugin/skills/workflows/quick/SKILL.md
    - openclaw-plugin/skills/workflows/progress/SKILL.md
  modified: []
decisions:
  - "All AskUserQuestion calls replaced with auto-mode defaults (select recommended option, proceed)"
  - "GSD_TOOLS_PATH resolved via node fallback: node -e console.log(require('path').join(...))"
  - "discuss-phase auto_advance spawns plan-phase Task using @./skills/workflows/plan-phase/SKILL.md (relative reference)"
metrics:
  duration: ~6 min
  completed_date: "2026-03-05"
  tasks_completed: 2
  files_created: 8
---

# Phase 03 Plan 02: Phase Management Commands Summary

**One-liner:** 8 SKILL.md files porting GSD phase management commands (discuss, research, assumptions, add, insert, remove, quick, progress) with $GSD_TOOLS_PATH and auto-mode defaults.

## What Was Built

Created 8 SKILL.md files for phase management and planning-adjacent commands, faithfully porting from GSD source workflows. Each file follows the established frontmatter convention (`name`, `description`, `user-invocable: true`, `os: ["darwin", "linux"]`) and replaces absolute paths with `$GSD_TOOLS_PATH` env variable pattern.

### Files Created

**Task 1 — Phase discussion and structure commands:**
- `discuss-phase/SKILL.md` — Full phase discussion workflow with CONTEXT.md creation, gray area identification, auto-mode discussion flow
- `research-phase/SKILL.md` — Spawns gsd-phase-researcher Task, returns RESEARCH.md
- `list-phase-assumptions/SKILL.md` — Surfaces Claude's 5-area assumptions (no file output, conversational)
- `add-phase/SKILL.md` — Delegates to `gsd-tools phase add`, updates ROADMAP.md and STATE.md

**Task 2 — Phase modification and ad-hoc commands:**
- `insert-phase/SKILL.md` — Decimal phase insertion (N.1, N.2...) for urgent mid-milestone work
- `remove-phase/SKILL.md` — Future-phase-only removal with renumbering via gsd-tools
- `quick/SKILL.md` — Full quick task orchestration: planner → executor, optional checker+verifier with --full
- `progress/SKILL.md` — Rich status report with smart routing (6 routes: A/B/C/D/E/F)

## Porting Decisions

### GSD_TOOLS_PATH Resolution

All `node /Users/egorproskyrin/.claude/get-shit-done/bin/gsd-tools.cjs` calls replaced with:
```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"
node "$GSD_TOOLS_PATH" ...
```

This matches the pattern from existing SKILL.md files (e.g., verify-work).

### AskUserQuestion Removal

All interactive prompts replaced with auto-mode defaults:
- `discuss-phase`: "check_existing" step — auto-proceeds with "Update it" / "Continue and replan after"
- `discuss-phase`: "present_gray_areas" — auto-selects recommended option per gray area
- `remove-phase`: "confirm_removal" — auto-proceeds with removal
- `quick`: "description empty" check — errors with usage message instead of prompting

### Auto-advance in discuss-phase

The `auto_advance` step's `Task()` call was updated to reference `@./skills/workflows/plan-phase/SKILL.md` instead of the absolute GSD workflow path, maintaining plugin portability.

## Verification Results

```
All 8 SKILL.md files: PRESENT
All 8 frontmatter checks: PASSED (user-invocable: true, os: [...])
Absolute path count across all 8 files: 0
```

## Deviations from Plan

None - plan executed exactly as written.

The expected count of "13 total SKILL.md files" in the plan verification was based on 5 existing files. The actual count is higher because Phase 3 Plan 01 already created additional SKILL.md files. All 8 target files were created successfully — the core objective is met.

## Self-Check: PASSED

All 8 created files confirmed present on disk.
Both task commits confirmed in git log (b74bf9c, e9fceb0).
