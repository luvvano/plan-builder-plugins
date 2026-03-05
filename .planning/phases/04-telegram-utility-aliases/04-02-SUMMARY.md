---
plan: 04-02
phase: 04-telegram-utility-aliases
status: complete
completed_at: "2026-03-05T13:25:00.000Z"
commit: 12f57eb
files_modified:
  - openclaw-plugin/src/index.ts
tasks_completed: 2
requirements_addressed:
  - TEL-06
  - TEL-07
---

# Plan 04-02 Summary: gsd_update + gsd_project_list

## What Was Built

Added `gsd_update` and `gsd_project_list` handlers + `homedir`, `existsSync`, `cpSync` imports.

## Commands Registered

### gsd_update (TEL-06)
- Reads old version from installed plugin
- Clone (first time) or `git pull --ff-only` (already cloned)
- `rsync -a --exclude=node_modules` → cpSync fallback
- `openclaw gateway restart`
- Returns HTML with old→new version diff + commit hash

### gsd_project_list (TEL-07)
- `list` (default): reads `~/.gsd/projects.json`, HTML-formatted project cards
- `add [path]`: registers current dir or given path via gsd-tools
- `remove <name>`: removes by name, returns not-found message if missing
- Usage hint returned on missing required args (no stack trace)

## Verification

- gsd_update, gsd_project_list present ✓
- homedir, existsSync, cpSync imported ✓
- Brace balance = 0 ✓
- Total registerCommand count = 8 ✓
