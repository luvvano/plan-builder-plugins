---
description: "Generate PROJECT.md and ROADMAP.md for a coding task. Usage: /plan <task description>"
---

Task: $ARGUMENTS

---

If $ARGUMENTS is empty or blank, respond with:

```
Plan Builder — usage:

  /plan <task description>

Examples:
  /plan Build a REST API with JWT auth and Postgres
  /plan CLI tool to sync dotfiles across machines
  /plan React dashboard for monitoring deployment pipelines

I'll generate .planning/PROJECT.md and .planning/ROADMAP.md for your project.
```

Stop. Do not proceed further.

---

Otherwise, follow these steps exactly:

## Step 1 — Parse the task

Read $ARGUMENTS carefully. Extract:
- What is being built (product type: API / CLI / frontend / library / other)
- Inferred tech stack (language, framework, database, infra — based on what the task implies)
- Any explicit constraints mentioned

## Step 2 — Create the output directory

Create `.planning/` if it does not already exist.

## Step 3 — Write `.planning/PROJECT.md`

Use this structure. Be specific — no placeholder text in the final file:

```markdown
# <Project Name>

## Goal

<One paragraph. What this project builds, who uses it, and what problem it solves.>

## Tech Stack

- <Language and version>
- <Framework>
- <Database / storage>
- <Key libraries or tools>
- <Infrastructure / deployment target>

## Constraints

- <Time, team, or resource constraints>
- <Technical constraints (e.g. must work offline, must use existing DB)>
- <Any stated limitations from the task>

## Out of Scope (v1)

- <Feature that sounds related but is excluded from v1>
- <Another exclusion>
- <Keep this list honest — don't over-promise>
```

## Step 4 — Write `.planning/ROADMAP.md`

Generate exactly 4 phases. Each phase must have a name and exactly 3 deliverables.
Every deliverable must be **concrete and independently testable** — no vague items like "implement feature X".

Choose phases appropriate to the project type:
- **API**: Data models → Core endpoints → Auth & security → Testing & docs
- **CLI**: Core commands → Config & flags → Error handling → Distribution & packaging
- **Frontend**: Component library → State & routing → API integration → Polish & performance
- **Library**: Core API design → Implementation → Tests & edge cases → Docs & publishing
- **Other**: Use judgment — think in layers: foundation → core logic → integration → hardening

Format:

```markdown
# Roadmap

## Phase 1 — <Name>

- <Concrete deliverable: specific schema / endpoint / command / component>
- <Concrete deliverable>
- <Concrete deliverable>

## Phase 2 — <Name>

- <Concrete deliverable>
- <Concrete deliverable>
- <Concrete deliverable>

## Phase 3 — <Name>

- <Concrete deliverable>
- <Concrete deliverable>
- <Concrete deliverable>

## Phase 4 — <Name>

- <Concrete deliverable>
- <Concrete deliverable>
- <Concrete deliverable>
```

## Step 5 — Confirm

After writing both files, output:

```
**Plan created for:** <task summary in one line>

**Summary:**
- <Key point 1>
- <Key point 2>
- <Key point 3>
- <Key point 4>
- <Key point 5>

Files written to .planning/ ✅
```

Style rules:
- No filler sentences ("Great! I'll now...", "Sure, here's...")
- Infer tech stack from context — don't ask the user
- Be specific in every deliverable (name the endpoint, the table, the flag)
- If the task is ambiguous, make a reasonable assumption and state it in the Constraints section
