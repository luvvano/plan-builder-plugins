---
task: "Add project env var validation to GSD workflow Telegram commands"
num: 6
slug: add-project-env-var-validation-to-gsd-wo
date: 2026-03-07
branch: feat/workflow-commands-project-check
must_haves:
  truths:
    - GSD_CURRENT_PROJECT_DIR env var is the source of truth for active project
    - Commands without project context silently fail — need clear user-facing errors
    - Workflow commands (gsd_plan_phase etc.) were not registered in TypeScript
  artifacts:
    - openclaw-plugin/src/index.ts with registerCommand handlers for 5 workflow commands
    - PR on GitHub branch feat/workflow-commands-project-check
  key_links:
    - /home/egor/projects/plan-builder-plugins/openclaw-plugin/src/index.ts
---

## Task 1: Add requireProject() helper and projectHeader() helper

**files:** `openclaw-plugin/src/index.ts`
**action:**
  - Add `requireProject()` function that checks `process.env.GSD_CURRENT_PROJECT_DIR`
  - If not set → return `{ text: error message explaining /gsd_set_project }` 
  - If set but no `.planning/` → return error explaining /gsd_new_project
  - If valid → return `{ dir: string }`
  - Add `projectHeader(dir)` helper for formatted project name + path
**verify:** Helper function exists and handles all 3 cases
**done:** ✅

## Task 2: Register TypeScript handlers for 5 workflow commands

**files:** `openclaw-plugin/src/index.ts`
**action:**
  - Add `api.registerCommand()` for: `gsd_discuss_phase`, `gsd_plan_phase`, `gsd_execute_phase`, `gsd_verify_work`, `gsd_new_milestone`
  - Each handler calls `requireProject()` first
  - Error case: returns error text with instructions
  - Valid case: reads project state via `runTools("state-snapshot")`, returns formatted context with SKILL.md dispatch instruction
**verify:** All 5 handlers registered before `const GSD_COMMANDS`
**done:** ✅

## Task 3: Create PR on new branch

**files:** git
**action:**
  - Create branch `feat/workflow-commands-project-check`
  - Commit changes
  - Push and open PR against main
**verify:** PR exists at github.com/luvvano/plan-builder-plugins/pull/1
**done:** ✅
