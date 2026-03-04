# plan-builder — OpenClaw Plugin

Generates structured project plans for coding tasks. Given a task description, it produces two files:

- `.planning/PROJECT.md` — goal, tech stack, constraints, out-of-scope
- `.planning/ROADMAP.md` — phased delivery plan with concrete, testable deliverables

---

## Install

1. Copy the plugin directory to your extensions folder:

   ```bash
   cp -r plan-builder-openclaw/ ~/.openclaw/extensions/plan-builder/
   ```

2. Restart the gateway:

   ```bash
   openclaw gateway restart
   ```

3. Verify the plugin loaded:

   ```bash
   openclaw plugins list | grep plan-builder
   ```

---

## Config

Add to `~/.openclaw/openclaw.json` under `plugins.entries`:

```json
{
  "plugins": {
    "entries": {
      "plan-builder": {
        "config": {
          "outputDir": ".planning",
          "defaultPhases": 4
        }
      }
    }
  }
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `outputDir` | string | `.planning` | Directory where `PROJECT.md` and `ROADMAP.md` are written |
| `defaultPhases` | number | `4` | Number of roadmap phases to generate |

---

## Enable the tool for an agent

The `plan_builder` tool is marked `optional` — you must explicitly allow it per agent:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "allow": ["plan_builder"]
        }
      }
    ]
  }
}
```

---

## Usage

### Slash command

```
/plan Build a REST API with JWT auth and Postgres
```

The command returns a prompt you can paste into chat. The agent then calls `plan_builder` which returns sub-agent instructions to write the plan files.

### Direct agent request

Ask the agent directly:

```
Use plan_builder to plan: Build a CLI tool for managing Docker containers
```

The agent calls `plan_builder`, receives the sub-agent instructions, and executes them to create the files.

### Skill trigger

If the `skills/planning/SKILL.md` skill is loaded, the agent automatically uses `plan_builder` when you say things like:

- "plan a REST API with auth"
- "create a roadmap for my CLI tool"
- "help me structure this project"

---

## Project structure

```
plan-builder-openclaw/
├── openclaw.plugin.json   # Plugin manifest
├── package.json           # npm metadata + openclaw extensions pointer
├── tsconfig.json          # TypeScript config
├── src/
│   └── index.ts           # Plugin entry point
├── skills/
│   └── planning/
│       └── SKILL.md       # Skill definition for auto-triggering
└── README.md
```

---

## How it works

1. `/plan <task>` → returns a one-liner prompt to paste into chat
2. Agent calls `plan_builder(task, output_dir, phases)` → tool returns detailed sub-agent instructions
3. Agent (or sub-agent) executes the instructions → writes `PROJECT.md` + `ROADMAP.md`
4. Output is tailored to project type: API / CLI / frontend / other
