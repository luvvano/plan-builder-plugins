---
name: gsd:add-todo
description: Add a TODO item to the project's pending todos list in STATE.md.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:add-todo

Capture an idea, task, or issue that surfaces during a GSD session as a structured todo for later work. Enables "thought → capture → continue" flow without losing context.

## Step 1: Initialize

Load todo context:

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"
INIT=$(node "$GSD_TOOLS_PATH" init todos)
```

Extract from init JSON: `commit_docs`, `date`, `timestamp`, `todo_count`, `todos`, `pending_dir`, `todos_dir_exists`.

Ensure directories exist:

```bash
mkdir -p .planning/todos/pending .planning/todos/done
```

Note existing areas from the todos array for consistency in area inference.

## Step 2: Extract Content

**With arguments:** Use as the title/focus.
- `/gsd:add-todo Add auth token refresh` → title = "Add auth token refresh"

**Without arguments:** Analyze recent conversation to extract:
- The specific problem, idea, or task discussed
- Relevant file paths mentioned
- Technical details (error messages, line numbers, constraints)

Formulate:
- `title`: 3-10 word descriptive title (action verb preferred)
- `problem`: What's wrong or why this is needed
- `solution`: Approach hints or "TBD" if just an idea
- `files`: Relevant paths with line numbers from conversation

## Step 3: Infer Area

Infer area from file paths:

| Path pattern | Area |
|--------------|------|
| `src/api/*`, `api/*` | `api` |
| `src/components/*`, `src/ui/*` | `ui` |
| `src/auth/*`, `auth/*` | `auth` |
| `src/db/*`, `database/*` | `database` |
| `tests/*`, `__tests__/*` | `testing` |
| `docs/*` | `docs` |
| `.planning/*` | `planning` |
| `scripts/*`, `bin/*` | `tooling` |
| No files or unclear | `general` |

Use existing area from the todos array if a similar match exists.

## Step 4: Check for Duplicates

```bash
# Search for key words from title in existing todos
grep -l -i "[key words from title]" .planning/todos/pending/*.md 2>/dev/null
```

If potential duplicate found:
1. Read the existing todo
2. Compare scope

If overlapping, ask user conversationally:
- Skip — keep existing todo
- Replace — update existing with new context
- Add anyway — create as separate todo

Do NOT use AskUserQuestion — state the situation in the chat and wait for the user's next message.

## Step 5: Create Todo File

Generate slug for the title:

```bash
slug=$(node "$GSD_TOOLS_PATH" generate-slug "$title" --raw)
```

Use `timestamp` and `date` from the init context.

Write to `.planning/todos/pending/${date}-${slug}.md`:

```markdown
---
created: [timestamp]
title: [title]
area: [area]
files:
  - [file:lines]
---

## Problem

[problem description — enough context for future Claude to understand weeks later]

## Solution

[approach hints or "TBD"]
```

## Step 6: Update STATE.md

If `.planning/STATE.md` exists:

1. Use `todo_count` from init context
2. Update "### Pending Todos" under "## Accumulated Context"

## Step 7: Commit

```bash
node "$GSD_TOOLS_PATH" commit "docs: capture todo - [title]" --files .planning/todos/pending/[filename] .planning/STATE.md
```

## Step 8: Confirm

```
Todo saved: .planning/todos/pending/[filename]

  [title]
  Area: [area]
  Files: [count] referenced

---

Would you like to:

1. Continue with current work
2. Add another todo
3. View all todos (/gsd:check-todos)
```
