# GSD for OpenClaw

Spec-driven development plugin for OpenClaw providing 26 commands for planning, executing, and verifying coding workflows.

---

## Prerequisites

- **OpenClaw** >= 2026.2.3-1
- **Node.js** (required for `gsd-tools.cjs`)

---

## Installation

### Step 1: Clone the repository

```bash
git clone https://github.com/luvvano/plan-builder-plugins.git
```

### Step 2: Copy the plugin into OpenClaw extensions

```bash
cp -r plan-builder-plugins/openclaw-plugin ~/.openclaw/extensions/gsd-for-openclaw
```

### Step 3: Restart the gateway

```bash
openclaw gateway restart
```

### Step 4: Verify installation

```bash
openclaw plugins list
```

Should show `gsd-for-openclaw`. Then in chat, run `/gsd:help` — it should list all 26 commands.

---

## Configuration

Add to `~/.openclaw/openclaw.json` under `plugins.entries`:

```json
{
  "plugins": {
    "entries": {
      "gsd-for-openclaw": {
        "config": {
          "planningDir": ".planning"
        }
      }
    }
  }
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `planningDir` | string | `.planning` | Directory where GSD planning files are stored |

---

## Enabling tools for agents

The plugin registers 4 tools with `optional: true`. To allow an agent to use them, add to your `~/.openclaw/openclaw.json`:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "allow": [
            "gsd_phase_status",
            "gsd_config_get",
            "gsd_roadmap_summary",
            "gsd_state_snapshot"
          ]
        }
      }
    ]
  }
}
```

---

## Available commands

**Project Initialization:**
- `/gsd:new-project` — Full initialization: research, requirements, roadmap
- `/gsd:map-codebase` — Generate architectural map of existing codebase

**Phase Planning:**
- `/gsd:discuss-phase <N>` — Capture design decisions before planning
- `/gsd:research-phase <N>` — Research phase domain (niche/complex)
- `/gsd:list-phase-assumptions <N>` — Preview intended approach
- `/gsd:plan-phase <N>` — Research + plan + verify for a phase

**Execution:**
- `/gsd:execute-phase <N>` — Execute all plans in a phase

**Quick Mode:**
- `/gsd:quick` — Ad-hoc task with GSD guarantees

**Roadmap Management:**
- `/gsd:add-phase <description>` — Add phase to end of roadmap
- `/gsd:insert-phase <N> <desc>` — Insert phase at position
- `/gsd:remove-phase <N>` — Remove phase from roadmap

**Milestones:**
- `/gsd:new-milestone <name>` — Start new milestone
- `/gsd:complete-milestone <ver>` — Complete and archive milestone
- `/gsd:progress` — Show milestone/phase progress

**Session Management:**
- `/gsd:resume-work` — Resume from last saved state
- `/gsd:pause-work` — Save state for later resumption

**Debugging:**
- `/gsd:debug [issue]` — Systematic debugging workflow

**Todos:**
- `/gsd:add-todo [description]` — Add TODO to STATE.md
- `/gsd:check-todos [area]` — Review pending TODOs

**Verification:**
- `/gsd:verify-work [phase]` — Verify phase completion
- `/gsd:audit-milestone [version]` — Full milestone audit
- `/gsd:plan-milestone-gaps` — Plan gap closure for unmet requirements

**Testing:**
- `/gsd:add-tests` — Add test coverage for code areas

**Configuration:**
- `/gsd:settings` — Display current GSD config
- `/gsd:set-profile <profile>` — Set model profile
- `/gsd:health` — Project health check

**Utility:**
- `/gsd:cleanup` — Clean up GSD artifacts
- `/gsd:help` — List all commands
- `/gsd:status` — Show project status

---

## Project structure

```
openclaw-plugin/
├── openclaw.plugin.json
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts
├── bin/
│   └── gsd-tools.cjs
├── agents/
│   └── (12 agent definitions)
├── skills/
│   ├── planning/
│   └── workflows/
│       └── (26 workflow commands)
├── templates/
├── workflows/
└── README.md
```

---

## How it works

The plugin registers a lifecycle service (`gsd-lifecycle`) that sets `GSD_TOOLS_PATH` and `GSD_HOME` environment variables on startup. It registers two slash commands (`/gsd:help` and `/gsd:status`) and four query tools for programmatic state access.

All 26 workflow commands are defined as `SKILL.md` files in the `skills/` directory. Users interact via `/gsd:*` slash commands in chat. The plugin orchestrates planning, execution, and verification of coding tasks using a spec-driven approach: requirements are captured upfront, work is planned in phases, executed with per-task commits, and verified against success criteria.
