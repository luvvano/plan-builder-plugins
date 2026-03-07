---
task: "Add project env var validation to GSD workflow Telegram commands"
num: 6
date: 2026-03-07
commit: 01e385c0
branch: feat/workflow-commands-project-check
pr: https://github.com/luvvano/plan-builder-plugins/pull/1
status: complete
---

## What was done

Added TypeScript `registerCommand` handlers for 5 GSD workflow commands that previously had no handler and fell through directly to SKILL.md:

- `/gsd_discuss_phase <N>`
- `/gsd_plan_phase <N>`
- `/gsd_execute_phase <N>`
- `/gsd_verify_work <N>`
- `/gsd_new_milestone [version]`

## Changes

**`openclaw-plugin/src/index.ts`** (+166 lines):

### New helpers (before `const GSD_COMMANDS`)

```typescript
function requireProject(): { dir: string } | { text: string }
```
- Checks `process.env.GSD_CURRENT_PROJECT_DIR`
- If not set → returns error with `/gsd_set_project` + `/gsd_project_list` instructions
- If dir has no `.planning/` → returns error with `/gsd_new_project` instruction
- If valid → returns `{ dir }`

```typescript
function projectHeader(dir: string): string
```
- Returns formatted `📁 **Project: name**\n/path` header

### Per-command handlers

Each handler follows the same pattern:
1. `requireProject()` → return error if invalid
2. Parse `args` for phase number (show usage hint if missing)
3. Call `runTools("state-snapshot", dir)` for current state
4. Return formatted response: project header + state context + SKILL.md dispatch note

## Key decisions

- Used `process.env.GSD_CURRENT_PROJECT_DIR` (not `resolveActiveProjectDir()`) for explicit check — the point is to validate the env var is SET, not to fall back to guessing
- `runTools()` called with explicit `cwd = check.dir` — ensures gsd-tools runs in the correct project directory
- Response includes SKILL.md dispatch instruction so AI knows what workflow to run

## PR

[#1 feat: project validation for workflow Telegram commands](https://github.com/luvvano/plan-builder-plugins/pull/1)
