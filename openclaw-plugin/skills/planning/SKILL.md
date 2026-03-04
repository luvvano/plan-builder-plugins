---
name: plan_builder
description: Generates PROJECT.md and ROADMAP.md for a coding task using the plan_builder tool. Use when user asks to plan a project, create a roadmap, or structure a coding task.
---

# Plan Builder Skill

When the user asks to plan a project or coding task, use the `plan_builder` tool.

## How to use

1. Identify the task from the user's message
2. Call `plan_builder` with:
   - `task`: full description of what needs to be built
   - `output_dir`: `.planning` (default)
   - `phases`: 4 (default)
3. Execute the sub-agent task returned by the tool
4. Confirm files created: `.planning/PROJECT.md` and `.planning/ROADMAP.md`

## Example triggers
- "plan a REST API with auth"
- "create a roadmap for my CLI tool"
- "help me structure this project"
