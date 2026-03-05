---
status: testing
phase: 03-full-command-set
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md
started: 2026-03-05T09:30:00Z
updated: 2026-03-05T09:32:00Z
---

## Current Test

number: 2
name: gsd:help lists all commands by stage
expected: |
  Running `/gsd:help` displays a categorized listing of 26 commands organized into ~14 workflow stages.
awaiting: user response

## Tests

### 1. No absolute paths in any skill file
expected: Running `grep -r "/Users/" openclaw-plugin/skills/` returns zero matches. All stage files use `$GSD_TOOLS_PATH` instead of hardcoded paths.
result: pass

### 2. gsd:help lists all commands by stage
expected: Running `/gsd:help` displays a categorized listing of 26 commands organized into ~14 workflow stages (Project Initialization, Phase Planning, Execution, etc.)
result: [pending]

### 3. Phase management SKILL.md files exist with correct frontmatter
expected: All 8 phase management commands (discuss-phase, research-phase, list-phase-assumptions, add-phase, insert-phase, remove-phase, quick, progress) have SKILL.md files under `openclaw-plugin/skills/workflows/` with `user-invocable: true` and `os: ["darwin", "linux"]` in frontmatter.
result: [pending]

### 4. Milestone & lifecycle SKILL.md files exist with correct frontmatter
expected: All 8 commands (new-milestone, complete-milestone, resume-work, pause-work, debug, add-todo, check-todos, add-tests) have SKILL.md files with correct frontmatter.
result: [pending]

### 5. Orchestrator commands have stage files
expected: `map-codebase/` contains SKILL.md + stage-mapper.md, and `audit-milestone/` contains SKILL.md + stage-check.md. Stage files have `user-invocable: false`.
result: [pending]

### 6. Simple utility commands exist
expected: plan-milestone-gaps, health, cleanup, set-profile, and settings each have a SKILL.md file with correct frontmatter and no AskUserQuestion usage.
result: [pending]

### 7. Total SKILL.md count matches expectation
expected: There are 27 SKILL.md files total under `openclaw-plugin/skills/workflows/`. All have valid YAML frontmatter with required fields (name, description, user-invocable, os).
result: [pending]

### 8. No AskUserQuestion in any SKILL.md
expected: `grep -r "AskUserQuestion" openclaw-plugin/skills/` returns zero matches. All interactive prompts have been replaced with auto-mode defaults or conversational equivalents.
result: [pending]

## Summary

total: 8
passed: 1
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
