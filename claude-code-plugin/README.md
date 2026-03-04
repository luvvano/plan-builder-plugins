# plan-builder-cc — Claude Code Plugin

Structured project planning for coding tasks. Given a task description, generates:

- `.planning/PROJECT.md` — goal, tech stack, constraints, out-of-scope
- `.planning/ROADMAP.md` — 4-phase delivery plan with concrete, testable deliverables

Tailored to project type: APIs, CLIs, frontends, libraries.

---

## Structure

```
plan-builder-cc/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── commands/
│   ├── plan.md              # /plan <task> — generate a new plan
│   └── plan-status.md       # /plan-status — show current plan progress
├── agents/
│   ├── plan-builder.md      # Agent: analyzes task + writes plan files
│   └── phase-executor.md    # Agent: breaks a phase into implementation steps
├── hooks/
│   ├── hooks.json           # SessionStart hook config
│   └── load-plan-context.sh # Injects existing plan into session context
├── skills/
│   └── planning/
│       └── planning.md      # Skill: routes planning requests to the right tool
└── README.md
```

---

## Install

### Option A — Plugin install (when supported)

```bash
cd plan-builder-cc
claude plugin install .
```

### Option B — Manual copy

```bash
# Commands (slash commands)
cp commands/*.md ~/.claude/commands/

# Agents
cp agents/*.md ~/.claude/agents/

# Skills (if your setup supports skill files)
mkdir -p ~/.claude/skills/planning
cp skills/planning/planning.md ~/.claude/skills/planning/
```

No restart required — Claude Code picks up new files automatically.

---

## Usage

### Generate a new plan

```
/plan Build a REST API with JWT auth and Postgres
/plan CLI tool in Go to sync dotfiles via GitHub Gist
/plan React dashboard for monitoring CI/CD pipelines
```

Claude creates `.planning/PROJECT.md` and `.planning/ROADMAP.md` in the current directory.

### Check plan status

```
/plan-status
```

Shows: project goal, tech stack, how many phases, which deliverables are complete (✅), what's next.

### Generate a plan via agent

```
Use plan-builder: <task description>
```

Same result as `/plan` but invoked as an agent — useful in multi-step workflows.

### Implement a phase

```
Use phase-executor for phase 1
Use phase-executor for phase 2 — extra context: we're using Prisma for the ORM
```

The agent reads `.planning/ROADMAP.md`, finds the phase, and outputs:
- Per-deliverable task breakdowns (specific files, functions, commands)
- Acceptance criteria for each deliverable
- Effort estimates

### Mark progress

Append ✅ to completed deliverables in `ROADMAP.md`. The `/plan-status` command reads these markers to calculate completion.

```markdown
## Phase 1 — Data Models

- Define User, Project, Task schemas in Prisma ✅
- Write and run initial migration ✅
- Seed dev database with fixtures
```

---

## How hooks work

`hooks/hooks.json` registers a `SessionStart` hook that fires when your initial message contains the words `plan`, `roadmap`, or `project`.

The hook runs `load-plan-context.sh`, which checks if `.planning/` exists in the current directory and, if so, injects the contents of `PROJECT.md` and `ROADMAP.md` into the session context at the start.

This means Claude already knows your plan before you ask your first question — no manual copy-paste.

**Requirement:** The hooks mechanism requires Claude Code to support the `SessionStart` hook type and the `${CLAUDE_PLUGIN_ROOT}` variable. Check your Claude Code version if hooks don't fire.

---

## Phase executor workflow

The recommended flow for shipping a project:

```
1. /plan <task>                          → creates the plan
2. /plan-status                          → sanity-check the plan
3. Use phase-executor for phase 1        → get step-by-step tasks for Phase 1
4. Implement, mark deliverables ✅
5. Use phase-executor for phase 2        → repeat
```

Each phase-executor call reads the current state of your ROADMAP.md, so it knows what's done and can reference it in context.
