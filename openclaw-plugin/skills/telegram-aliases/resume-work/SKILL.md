---
name: gsd_resume_work
description: Resume interrupted GSD work by reading STATE.md and continuing from last known position.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:resume-work

Instantly restore full project context and resume from where work was paused.

## Step 1: Initialize

Load all context in one call:

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"
INIT=$(node "$GSD_TOOLS_PATH" init resume)
```

Parse JSON for: `state_exists`, `roadmap_exists`, `project_exists`, `planning_exists`, `has_interrupted_agent`, `interrupted_agent_id`, `commit_docs`.

**If `state_exists` is true:** Proceed to load_state.
**If `state_exists` is false but `roadmap_exists` or `project_exists` is true:** Offer to reconstruct STATE.md.
**If `planning_exists` is false:** This is a new project — route to /gsd:new-project.

## Step 2: Load State

Read and parse STATE.md, then PROJECT.md:

```bash
cat .planning/STATE.md
cat .planning/PROJECT.md
```

**From STATE.md extract:**
- **Project Reference**: Core value and current focus
- **Current Position**: Phase X of Y, Plan A of B, Status
- **Progress**: Visual progress bar
- **Recent Decisions**: Key decisions affecting current work
- **Pending Todos**: Ideas captured during sessions
- **Blockers/Concerns**: Issues carried forward
- **Session Continuity**: Where we left off, any resume files

**From PROJECT.md extract:**
- **What This Is**: Current accurate description
- **Requirements**: Validated, Active, Out of Scope
- **Key Decisions**: Full decision log with outcomes
- **Constraints**: Hard limits on implementation

## Step 3: Check Incomplete Work

Look for incomplete work that needs attention:

```bash
# Check for continue-here files (mid-plan resumption)
ls .planning/phases/*/.continue-here*.md 2>/dev/null

# Check for plans without summaries (incomplete execution)
for plan in .planning/phases/*/*-PLAN.md; do
  summary="${plan/PLAN/SUMMARY}"
  [ ! -f "$summary" ] && echo "Incomplete: $plan"
done 2>/dev/null
```

Check `has_interrupted_agent` from init result. If true, note: "Interrupted agent: $interrupted_agent_id".

**If .continue-here file exists:**
- This is a mid-plan resumption point
- Read the file for specific resumption context
- Flag: "Found mid-plan checkpoint"

**If PLAN without SUMMARY exists:**
- Execution was started but not completed
- Flag: "Found incomplete plan execution"

## Step 4: Present Status

Present complete project status to user:

```
╔══════════════════════════════════════════════════════════════╗
║  PROJECT STATUS                                               ║
╠══════════════════════════════════════════════════════════════╣
║  Building: [one-liner from PROJECT.md "What This Is"]         ║
║                                                               ║
║  Phase: [X] of [Y] - [Phase name]                            ║
║  Plan:  [A] of [B] - [Status]                                ║
║  Progress: [██████░░░░] XX%                                  ║
║                                                               ║
║  Last activity: [date] - [what happened]                     ║
╚══════════════════════════════════════════════════════════════╝
```

If incomplete work detected, add:
```
⚠  Incomplete work detected:
    - [.continue-here file or incomplete plan]
```

If pending todos exist:
```
[N] pending todos — /gsd:check-todos to review
```

If blockers exist, list them.

## Step 5: Determine Next Action

Based on project state, determine the most logical next action:

**If .continue-here file exists:**
→ Primary: Resume from checkpoint
→ Option: Start fresh on current plan

**If incomplete plan (PLAN without SUMMARY):**
→ Primary: Complete the incomplete plan
→ Option: Abandon and move on

**If phase in progress, all plans complete:**
→ Primary: Transition to next phase

**If phase ready to plan:**
→ Check if CONTEXT.md exists for this phase:

```bash
ls .planning/phases/XX-name/*-CONTEXT.md 2>/dev/null
```

- If CONTEXT.md missing: suggest `/gsd:discuss-phase [N]` first
- If CONTEXT.md exists: suggest `/gsd:plan-phase [N]`

**If phase ready to execute:**
→ Primary: Execute next plan with `/gsd:execute-phase [N]`

## Step 6: Present Options

Present contextual options based on project state:

```
What would you like to do?

1. [Primary action based on state — e.g., Execute phase or Resume checkpoint]
2. Review current phase status
3. Check pending todos ([N] pending)
4. Something else
```

Provide the exact command(s) the user should run:

```
---

## ▶ Next Up

**{phase}-{plan}: [Plan Name]** — [objective]

`/gsd:execute-phase {phase}`

<sub>`/clear` first → fresh context window</sub>

---
```

## Step 7: Update Session

Update STATE.md session continuity:

```markdown
## Session Continuity

Last session: [now]
Stopped at: Session resumed, proceeding to [action]
Resume file: [updated if applicable]
```

## Reconstruction

If STATE.md is missing but other artifacts exist:

"STATE.md missing. Reconstructing from artifacts..."

1. Read PROJECT.md → Extract "What This Is" and Core Value
2. Read ROADMAP.md → Determine phases, find current position
3. Scan *-SUMMARY.md files → Extract decisions, concerns
4. Count pending todos in .planning/todos/pending/
5. Check for .continue-here files → Session continuity

Reconstruct and write STATE.md, then proceed normally.

## Quick Resume

If user says "continue" or "go":
- Load state silently
- Determine primary action
- Execute immediately without presenting options

"Continuing from [state]... [action]"
