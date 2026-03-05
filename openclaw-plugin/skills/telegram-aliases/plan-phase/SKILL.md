---
name: gsd_plan_phase
description: Create executable plans for a GSD roadmap phase. Runs research, planning, and verification stages.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:plan-phase

Create executable plans for a GSD roadmap phase.

## Arguments

The user provides the phase number as an argument: `/gsd:plan-phase 2` or `/gsd:plan-phase 02`.
If no argument provided, ask the user which phase to plan (do NOT use AskUserQuestion -- just ask in chat).

## Step 1: Initialize

Run init to get phase context:
```bash
INIT=$(node "$GSD_TOOLS_PATH" init plan-phase "$PHASE_ARG")
```

Parse JSON output for:
- `researcher_model`, `planner_model`, `checker_model`
- `research_enabled`, `plan_checker_enabled`
- `commit_docs`
- `phase_found`, `phase_dir`, `phase_number`, `padded_phase`
- `phase_req_ids`
- `has_research`, `has_context`, `has_plans`
- `state_path`, `roadmap_path`, `requirements_path`

**If `phase_found` is false:** Inform the user the phase was not found and stop.

**If `has_plans` is true:** Inform the user plans already exist. Ask if they want to re-plan (overwrite) or stop.

## Step 2: Research (conditional)

If `research_enabled` is true AND `has_research` is false:

Follow the research stage:
@./stage-research.md

Pass the phase context (phase_dir, phase_number, phase_req_ids, roadmap_path, requirements_path) to the stage.

If `has_research` is true: skip research, inform the user research already exists.

## Step 3: Plan

Follow the planning stage:
@./stage-planning.md

Pass full init context plus research output (if any) to the stage.

## Step 4: Verify Plans (conditional, with revision loop)

If `plan_checker_enabled` is true:

Follow the verification stage:
@./stage-verification.md

If verification returns ISSUES FOUND:
- Loop back to stage-planning.md in REVISION MODE (pass checker issues as revision_context)
- Re-verify after revision
- Maximum 3 revision loops. After 3, accept plans as-is with warnings.

**Revision loop pseudocode:**

```
iteration = 0
while iteration < 3:
    result = run_verification()
    if result == "VERIFICATION PASSED":
        break
    iteration += 1
    if iteration < 3:
        run_planning_revision(result.issues)
    else:
        warn("Max iterations reached. Accepting plans with remaining issues.")
```

## Step 5: Commit

If `commit_docs` is true:
```bash
node "$GSD_TOOLS_PATH" commit "docs($(printf '%02d' $PHASE_NUMBER)): create phase plans" --files "$PHASE_DIR/"
```

Report to user: plans created, wave structure, next step is `/gsd:execute-phase $PHASE_NUMBER`.
