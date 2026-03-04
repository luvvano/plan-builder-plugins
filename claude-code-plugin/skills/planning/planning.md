---
name: planning_skill
description: Activates structured project planning. Use when user asks to plan, roadmap, or structure a project.
---

# Planning Skill

Activates structured project planning using the plan-builder agent, plan-status command, and phase-executor agent.

## When to use this skill

Trigger on phrases like:
- "plan a project / feature / service"
- "create a roadmap for..."
- "help me structure this"
- "what should I build first"
- "break this down into phases"

## How to use

### Starting a new project plan

Use the **plan-builder** agent:

```
Use plan-builder: <task description>
```

This creates `.planning/PROJECT.md` and `.planning/ROADMAP.md` tailored to the project type (API, CLI, frontend, etc.).

### Checking an existing plan

Use the **plan-status** command:

```
/plan-status
```

Shows project goal, tech stack, phase completion, and what's next.

### Implementing a phase

Use the **phase-executor** agent:

```
Use phase-executor for phase <N>
```

Reads the roadmap, finds the phase, and breaks deliverables into concrete, ordered implementation steps with acceptance criteria.

## Workflow example

1. `/plan Build a CLI tool to manage local dev environments` → creates the plan
2. `/plan-status` → verify the plan looks right
3. `Use phase-executor for phase 1` → get a step-by-step execution plan for Phase 1
4. Implement Phase 1, mark deliverables ✅ in ROADMAP.md
5. Repeat from step 3 for phases 2–4
