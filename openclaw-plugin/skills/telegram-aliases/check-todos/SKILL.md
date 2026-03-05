---
name: gsd_check_todos
description: Review and process pending TODO items, marking completed ones and surfacing blockers.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:check-todos

List all pending todos, allow selection, load full context for the selected todo, and route to appropriate action.

## Step 1: Initialize

Load todo context:

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"
INIT=$(node "$GSD_TOOLS_PATH" init todos)
```

Extract from init JSON: `todo_count`, `todos`, `pending_dir`.

If `todo_count` is 0:

```
No pending todos.

Todos are captured during work sessions with /gsd:add-todo.

---

Would you like to:

1. Continue with current phase (/gsd:progress)
2. Add a todo now (/gsd:add-todo)
```

Exit.

## Step 2: Parse Filter

Check for area filter in arguments:
- `/gsd:check-todos` → show all
- `/gsd:check-todos api` → filter to area:api only

## Step 3: List Todos

Use the `todos` array from init context (already filtered by area if specified).

Parse and display as numbered list:

```
Pending Todos:

1. Add auth token refresh (api, 2d ago)
2. Fix modal z-index issue (ui, 1d ago)
3. Refactor database connection pool (database, 5h ago)

---

Reply with a number to view details, or:
- `/gsd:check-todos [area]` to filter by area
- `q` to exit
```

Format age as relative time from created timestamp.

## Step 4: Handle Selection

Wait for user to reply with a number.

If valid: load selected todo, proceed.
If invalid: "Invalid selection. Reply with a number (1-[N]) or `q` to exit."

## Step 5: Load Context

Read the todo file completely. Display:

```
## [title]

**Area:** [area]
**Created:** [date] ([relative time] ago)
**Files:** [list or "None"]

### Problem
[problem section content]

### Solution
[solution section content]
```

If `files` field has entries, read and briefly summarize each referenced file.

## Step 6: Check Roadmap

Check for roadmap:

```bash
ls .planning/ROADMAP.md 2>/dev/null
```

If `.planning/ROADMAP.md` exists:
1. Check if todo's area matches an upcoming phase
2. Check if todo's files overlap with a phase's scope
3. Note any match for action options

## Step 7: Offer Actions

**If todo maps to a roadmap phase:**

Ask conversationally (do NOT use AskUserQuestion):
- "Work on it now" — move to done, start working
- "Add to phase plan" — include when planning Phase [N]
- "Brainstorm approach" — think through before deciding
- "Put it back" — return to list

**If no roadmap match:**

Ask conversationally:
- "Work on it now" — move to done, start working
- "Create a phase" — /gsd:add-phase with this scope
- "Brainstorm approach" — think through before deciding
- "Put it back" — return to list

## Step 8: Execute Action

**Work on it now:**

```bash
mv ".planning/todos/pending/[filename]" ".planning/todos/done/"
```

Update STATE.md todo count. Present problem/solution context. Begin work or ask how to proceed.

**Add to phase plan:**
Note todo reference in phase planning notes. Keep in pending. Return to list or exit.

**Create a phase:**
Display: `/gsd:add-phase [description from todo]`
Keep in pending. User runs command in fresh context.

**Brainstorm approach:**
Keep in pending. Start discussion about problem and approaches.

**Put it back:**
Return to list_todos step.

## Step 9: Update STATE.md

After any action that changes todo count:

Re-run `init todos` to get updated count, then update STATE.md "### Pending Todos" section if exists.

## Step 10: Commit Changes

If todo was moved to done/, commit the change:

```bash
git rm --cached .planning/todos/pending/[filename] 2>/dev/null || true
node "$GSD_TOOLS_PATH" commit "docs: start work on todo - [title]" --files .planning/todos/done/[filename] .planning/STATE.md
```
