---
name: gsd_pause_work
description: Pause current work, saving session state for later resumption.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:pause-work

Create a `.continue-here.md` handoff file to preserve complete work state across sessions. Enables seamless resumption with full context restoration.

## Step 1: Detect Active Phase

Find current phase directory from most recently modified files:

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"

# Find most recent phase directory with work
ls -lt .planning/phases/*/PLAN.md 2>/dev/null | head -1 | grep -oP 'phases/\K[^/]+'
```

If no active phase detected, ask user conversationally which phase they're pausing work on. Do NOT use AskUserQuestion — simply state what you need in the chat.

## Step 2: Gather State for Handoff

Collect complete state for handoff by reading existing files and reviewing the recent conversation:

1. **Current position**: Which phase, which plan, which task
2. **Work completed**: What got done this session
3. **Work remaining**: What's left in current plan/phase
4. **Decisions made**: Key decisions and rationale
5. **Blockers/issues**: Anything stuck
6. **Mental context**: The approach, next steps, the plan
7. **Files modified**: What's changed but not committed

Ask user conversationally for clarifications if needed.

## Step 3: Get Timestamp

```bash
timestamp=$(node "$GSD_TOOLS_PATH" current-timestamp full --raw)
```

## Step 4: Write Handoff File

Write handoff to `.planning/phases/XX-name/.continue-here.md`:

```markdown
---
phase: XX-name
task: 3
total_tasks: 7
status: in_progress
last_updated: [timestamp]
---

<current_state>
[Where exactly are we? Immediate context]
</current_state>

<completed_work>

- Task 1: [name] - Done
- Task 2: [name] - Done
- Task 3: [name] - In progress, [what's done]
</completed_work>

<remaining_work>

- Task 3: [what's left]
- Task 4: Not started
- Task 5: Not started
</remaining_work>

<decisions_made>

- Decided to use [X] because [reason]
- Chose [approach] over [alternative] because [reason]
</decisions_made>

<blockers>
- [Blocker 1]: [status/workaround]
</blockers>

<context>
[Mental state, what were you thinking, the plan]
</context>

<next_action>
Start with: [specific first action when resuming]
</next_action>
```

Be specific enough for a fresh Claude to understand immediately.

## Step 5: Commit

```bash
node "$GSD_TOOLS_PATH" commit "wip: [phase-name] paused at task [X]/[Y]" --files .planning/phases/*/.continue-here.md
```

## Step 6: Confirm

```
✓ Handoff created: .planning/phases/[XX-name]/.continue-here.md

Current state:

- Phase: [XX-name]
- Task: [X] of [Y]
- Status: [in_progress/blocked]
- Committed as WIP

To resume: /gsd:resume-work
```
