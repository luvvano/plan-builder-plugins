---
name: gsd
description: >
  Get Shit Done — spec-driven project development.
  Use when: user asks to start a new GSD project, initialize a project with GSD,
  run gsd new-project, discuss/plan/execute a phase, continue a GSD project,
  or mentions GSD workflow commands (gsd:quick, gsd:plan-phase, gsd:execute-phase, etc.).
  Also use when user types /gsd_quick, /gsd_plan_phase, /gsd_discuss_phase,
  /gsd_execute_phase, /gsd_verify_work, /gsd_new_milestone, /gsd_new_project,
  /gsd_resume_work, /gsd_pause_work, /gsd_debug, /gsd_add_phase, /gsd_add_todo, etc.
user-invocable: true
os: ["darwin", "linux"]
---

# GSD Skill Dispatcher

This skill dispatches to the appropriate GSD workflow based on the user's request.

## Active Project Resolution

**ALWAYS** start by resolving the active project directory:

1. Check `GSD_CURRENT_PROJECT_DIR` environment variable — this is the source of truth
2. If not set, inform the user:
   ```
   ⚠️ No active project set.

   Set one first:
   • /gsd_set_project <name> — switch to a tracked project
   • /gsd_project_list add — add a new project

   Run /gsd_project_list to see all tracked projects.
   ```
3. All file operations, gsd-tools calls, and workflow execution must use the active project directory as `cwd`

## Command → Workflow Mapping

| User types | Follow skill |
|-----------|-------------|
| `/gsd_quick` or `gsd:quick` | `skills/telegram-aliases/quick/SKILL.md` |
| `/gsd_new_project` or `gsd:new-project` | `skills/telegram-aliases/new-project/SKILL.md` |
| `/gsd_discuss_phase` or `gsd:discuss-phase` | `skills/telegram-aliases/discuss-phase/SKILL.md` |
| `/gsd_plan_phase` or `gsd:plan-phase` | `skills/telegram-aliases/plan-phase/SKILL.md` |
| `/gsd_execute_phase` or `gsd:execute-phase` | `skills/telegram-aliases/execute-phase/SKILL.md` |
| `/gsd_verify_work` or `gsd:verify-work` | `skills/telegram-aliases/verify-work/SKILL.md` |
| `/gsd_new_milestone` or `gsd:new-milestone` | `skills/telegram-aliases/new-milestone/SKILL.md` |
| `/gsd_complete_milestone` or `gsd:complete-milestone` | `skills/telegram-aliases/complete-milestone/SKILL.md` |
| `/gsd_resume_work` or `gsd:resume-work` | `skills/telegram-aliases/resume-work/SKILL.md` |
| `/gsd_pause_work` or `gsd:pause-work` | `skills/telegram-aliases/pause-work/SKILL.md` |
| `/gsd_debug` or `gsd:debug` | `skills/telegram-aliases/debug/SKILL.md` |
| `/gsd_add_phase` or `gsd:add-phase` | `skills/telegram-aliases/add-phase/SKILL.md` |
| `/gsd_insert_phase` or `gsd:insert-phase` | `skills/telegram-aliases/insert-phase/SKILL.md` |
| `/gsd_remove_phase` or `gsd:remove-phase` | `skills/telegram-aliases/remove-phase/SKILL.md` |
| `/gsd_add_todo` or `gsd:add-todo` | `skills/telegram-aliases/add-todo/SKILL.md` |
| `/gsd_check_todos` or `gsd:check-todos` | `skills/telegram-aliases/check-todos/SKILL.md` |
| `/gsd_audit_milestone` or `gsd:audit-milestone` | `skills/telegram-aliases/audit-milestone/SKILL.md` |
| `/gsd_add_tests` or `gsd:add-tests` | `skills/telegram-aliases/add-tests/SKILL.md` |

## Steps

1. Identify the command/intent from the user message
2. Resolve active project (check `GSD_CURRENT_PROJECT_DIR`)
3. Read the corresponding SKILL.md from the table above
4. Follow that skill's instructions exactly, using the active project dir as `cwd` for all operations

## GSD_TOOLS_PATH

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-}"
```

If `GSD_TOOLS_PATH` is not set, locate gsd-tools.cjs relative to this skill:
```bash
# From extension root: bin/gsd-tools.cjs
GSD_TOOLS_PATH="$(find ~/.openclaw/extensions/gsd-for-openclaw/bin -name gsd-tools.cjs 2>/dev/null | head -1)"
```
