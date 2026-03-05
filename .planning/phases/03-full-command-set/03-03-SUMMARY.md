---
phase: 03-full-command-set
plan: "03"
subsystem: openclaw-plugin/skills/workflows
tags: [skill-md, porting, milestone-commands, lifecycle-commands, utility-commands]
dependency_graph:
  requires: []
  provides:
    - gsd:new-milestone
    - gsd:complete-milestone
    - gsd:resume-work
    - gsd:pause-work
    - gsd:debug
    - gsd:add-todo
    - gsd:check-todos
    - gsd:add-tests
  affects: []
tech_stack:
  added: []
  patterns:
    - GSD_TOOLS_PATH env var pattern for portable tool resolution
    - Conversational prompting instead of AskUserQuestion
    - Sub-agent delegation for research and roadmapping steps
key_files:
  created:
    - openclaw-plugin/skills/workflows/new-milestone/SKILL.md
    - openclaw-plugin/skills/workflows/complete-milestone/SKILL.md
    - openclaw-plugin/skills/workflows/resume-work/SKILL.md
    - openclaw-plugin/skills/workflows/pause-work/SKILL.md
    - openclaw-plugin/skills/workflows/debug/SKILL.md
    - openclaw-plugin/skills/workflows/add-todo/SKILL.md
    - openclaw-plugin/skills/workflows/check-todos/SKILL.md
    - openclaw-plugin/skills/workflows/add-tests/SKILL.md
  modified: []
decisions:
  - "debug command maps to diagnose-issues.md source logic (parallel gap investigation)"
  - "resume-work maps to resume-project.md source logic (STATE.md context restoration)"
  - "All interactive prompts replaced with conversational equivalents (no AskUserQuestion)"
  - "Sub-agent spawning described as instructions, not Task() calls, for SKILL.md portability"
metrics:
  duration_seconds: 353
  completed_date: "2026-03-05"
  tasks_completed: 2
  files_created: 8
---

# Phase 03 Plan 03: Second Batch Command SKILL.md Files Summary

**One-liner:** 8 milestone, lifecycle, and utility SKILL.md files ported from GSD source — new-milestone, complete-milestone, resume-work, pause-work, debug, add-todo, check-todos, add-tests — bringing total to 21 SKILL.md files.

## What Was Built

Created 8 new SKILL.md files in `openclaw-plugin/skills/workflows/` covering:

**Milestone commands:**
- `gsd:new-milestone` — Full milestone initialization: load context, gather goals, research, define requirements, create roadmap
- `gsd:complete-milestone` — Milestone archival: verify readiness, gather stats, archive, reorganize roadmap, write retrospective, create git tag

**Lifecycle commands:**
- `gsd:resume-work` — Session restoration: read STATE.md, detect incomplete work, present status, determine next action
- `gsd:pause-work` — Session handoff: detect active phase, gather state, write .continue-here.md handoff file

**Utility commands:**
- `gsd:debug` — Parallel gap diagnosis: parse UAT gaps, spawn debug agents, collect root causes, update UAT.md
- `gsd:add-todo` — Todo capture: extract from conversation, infer area, check duplicates, write structured todo file
- `gsd:check-todos` — Todo review: list pending todos, load context, check roadmap match, route to action
- `gsd:add-tests` — Test generation: classify files into TDD/E2E/Skip, discover test structure, generate and run tests

## Porting Pattern Applied

All 8 files follow the established porting pattern:
- Correct YAML frontmatter: `name: gsd:<command>`, `description`, `user-invocable: true`, `os: ["darwin", "linux"]`
- GSD_TOOLS_PATH env var with inline fallback for tool resolution
- No absolute paths (all `/Users/` references removed)
- No AskUserQuestion (all replaced with conversational prompts)
- Workflow logic preserved in full

## Notable Source Mappings

Two commands map to differently-named source files:
- `gsd:debug` → sources from `diagnose-issues.md` (not debug.md)
- `gsd:resume-work` → sources from `resume-project.md` (not resume-work.md)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

Files created:
- [x] openclaw-plugin/skills/workflows/new-milestone/SKILL.md
- [x] openclaw-plugin/skills/workflows/complete-milestone/SKILL.md
- [x] openclaw-plugin/skills/workflows/resume-work/SKILL.md
- [x] openclaw-plugin/skills/workflows/pause-work/SKILL.md
- [x] openclaw-plugin/skills/workflows/debug/SKILL.md
- [x] openclaw-plugin/skills/workflows/add-todo/SKILL.md
- [x] openclaw-plugin/skills/workflows/check-todos/SKILL.md
- [x] openclaw-plugin/skills/workflows/add-tests/SKILL.md

Total SKILL.md count: 21 ✓
Absolute paths: 0 ✓
AskUserQuestion calls: 0 ✓
