---
name: gsd_execute_phase
description: Execute all plans in a GSD roadmap phase. Runs plans sequentially by wave with state tracking and atomic commits.
user-invocable: true
os: ["darwin", "linux"]
---

## Step 0: Validate Active Project

**Before anything else**, resolve the active project:

```bash
PROJECT_DIR="${GSD_CURRENT_PROJECT_DIR:-}"
```

**If `PROJECT_DIR` is empty**, stop and reply:
```
⚠️ **No active project set.**

Set one first:
• /gsd_set_project <name> — switch to a tracked project
• /gsd_project_list add — add a new project

Run /gsd_project_list to see all tracked projects.
```

**If set**, use `PROJECT_DIR` as the working directory for ALL subsequent operations (gsd-tools calls, file reads/writes, git commands).

---



# /gsd:execute-phase

Execute all plans in a GSD roadmap phase.

## Arguments

The user provides the phase number: `/gsd:execute-phase 2` or `/gsd:execute-phase 02`.
If no argument provided, ask which phase to execute.

## Step 1: Initialize

Run init to get phase context:

```bash
INIT=$(node "$GSD_TOOLS_PATH" init execute-phase "$PHASE_ARG")
```

Parse JSON: `executor_model`, `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`.

If `phase_found` is false: inform user and stop.
If `plan_count` is 0: inform user no plans exist, suggest running `/gsd:plan-phase` first.

## Step 2: Get Wave Structure

```bash
WAVE_INDEX=$(node "$GSD_TOOLS_PATH" phase-plan-index "$PHASE_ARG")
```

Parse JSON: `plans[]`, `waves{}`, `incomplete[]`, `has_checkpoints`.

Each plan entry includes: `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`.

Report to user:

```
## Execution Plan

**Phase {X}: {Name}** -- {total_plans} plans across {wave_count} waves

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1    | XX-01, XX-02 | {from plan objectives, 3-8 words} |
| 2    | XX-03        | ...                                |
```

## Step 3: Initialize or Resume wave-state.json

Check if `$PHASE_DIR/wave-state.json` already exists.

**If it exists (RESUME mode):**

Read the existing wave-state.json using the Read tool. Identify plans with `status !== "complete"`.
Inform user: "Resuming execution from wave N, plan XX-NN".

**If it does NOT exist (FRESH mode):**

Create wave-state.json with all plans as pending:

```json
{
  "phase": "<phase_number>",
  "phase_dir": "<phase_dir>",
  "created": "<ISO timestamp>",
  "updated": "<ISO timestamp>",
  "waves": { "<from WAVE_INDEX.waves>" },
  "plans": {
    "<plan_id>": { "status": "pending", "completed_at": null }
  },
  "current_wave": 1,
  "total_plans": "<count>",
  "completed_plans": 0
}
```

Write this to `$PHASE_DIR/wave-state.json` using the Write tool.

## Step 4: Execute Plans by Wave

For each wave (1, 2, 3, ...) in order:

  For each plan_id in the wave:

  1. **Skip completed plans:** If wave-state.json shows `status: "complete"` for this plan, skip it and move to the next.

  2. **Read the plan:** Read the PLAN.md file for this plan from the phase directory.

  3. **Describe what is being built:** Read the plan `<objective>` and report to the user what this plan builds and why, in 2-3 sentences.

  4. **Execute the plan:** Follow the executor stage to execute this plan:

     @./stage-executor.md

     The executor stage contains the full gsd-executor agent role. Follow it to:
     - Parse the plan's `<objective>`, `<context>`, and `<tasks>`
     - Execute each `<task>` in order
     - For each task: implement the `<action>`, run `<verify>` checks, confirm `<done>` criteria
     - Apply deviation rules (auto-fix bugs, missing critical functionality, blocking issues)
     - Handle checkpoints and authentication gates as specified

  5. **After successful plan execution:**

     a. **Commit the plan's work** via gsd-tools:
     ```bash
     node "$GSD_TOOLS_PATH" commit "<commit message>" --files "<modified files>"
     ```

     b. **Create SUMMARY.md** for the plan at `$PHASE_DIR/<phase>-<plan>-SUMMARY.md` following the summary template. Include frontmatter with dependency graph, tech tracking, key files, decisions, and metrics.

     c. **Update wave-state.json:** Set this plan's status to `"complete"`, update `completed_at` with ISO timestamp, increment `completed_plans`, update the `"updated"` timestamp.

     d. **Write updated wave-state.json** using the Write tool.

**IMPORTANT:** Update wave-state.json AFTER each plan completes, not at the end of all plans. This ensures resume works correctly if execution is interrupted.

**Plans in the same wave execute sequentially** (v1 -- no parallel execution). This is by design since OpenClaw has no synchronization primitive.

**Never re-execute a completed plan.** On resume, skip all plans with `status: "complete"`.

## Step 5: Update State

After all plans complete:

```bash
node "$GSD_TOOLS_PATH" state advance-plan "$PHASE_NUMBER"
node "$GSD_TOOLS_PATH" state update-progress
```

## Step 6: Report

Report to user:

```
## Phase {X}: {Name} Execution Complete

**Plans executed:** N/N
**Wave structure:**
| Wave | Plans | Status |
|------|-------|--------|
| 1    | XX-01, XX-02 | Complete |
| 2    | XX-03        | Complete |

Next step: `/gsd:verify-work {X}` to verify the phase
```
