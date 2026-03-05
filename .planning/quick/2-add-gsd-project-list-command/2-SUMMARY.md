---
quick_num: 2
description: "Add gsd:project-list command — persistent project tracking"
date: "2026-03-05"
status: complete
key-files:
  - "openclaw-plugin/bin/lib/commands.cjs"
  - "openclaw-plugin/bin/gsd-tools.cjs"
  - "openclaw-plugin/src/index.ts"
  - "openclaw-plugin/skills/workflows/new-project/SKILL.md"
---

# Quick Task 2 Summary: gsd:project-list

## What Was Done

Added `gsd:project-list` command — a persistent project registry for tracking GSD projects.

## Changes

### `openclaw-plugin/bin/lib/commands.cjs`
- Added `cmdProjectList(action, projectPath, raw)` function
- Reads/writes `~/.gsd/projects.json` (schema: `{ version, projects: [{name, path, added, last_active}] }`)
- `list`: outputs all tracked projects
- `add`: reads name from PROJECT.md if available, upserts entry, creates `~/.gsd/` dir if needed
- `remove`: removes by name match or path match

### `openclaw-plugin/bin/gsd-tools.cjs`
- Added `project-list [list|add|remove] [path|name]` subcommand
- Smart routing: `add` resolves path, `remove` passes raw (to support name-based removal)

### `openclaw-plugin/src/index.ts`
- Registered `gsd:project-list` command (acceptsArgs: true)
- Formats list as readable project cards
- Updated `gsd:help` Utility section to include `/gsd:project-list`

### `openclaw-plugin/skills/workflows/new-project/SKILL.md`
- Added Step 5.5 to auto-register new projects in `~/.gsd/projects.json` on initialization

## Verification

- `node gsd-tools.cjs project-list add .` → registers with name from PROJECT.md ✓
- `node gsd-tools.cjs project-list list` → shows project with name/path/dates ✓
- `node gsd-tools.cjs project-list remove "GSD for OpenClaw"` → removes by name ✓
- Storage persists at `~/.gsd/projects.json` ✓
