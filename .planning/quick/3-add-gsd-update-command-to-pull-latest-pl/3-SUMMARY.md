---
quick_num: 3
description: "Add gsd:update command — pull latest plugin from git and reinstall"
date: "2026-03-05"
status: complete
key-files:
  - "openclaw-plugin/src/index.ts"
---

# Quick Task 3 Summary: gsd:update

## What Was Done

Added `/gsd:update` registered command that self-updates the GSD OpenClaw plugin from GitHub.

## Changes

### `openclaw-plugin/src/index.ts`
- Added `homedir` import from `node:os`
- Added `cpSync` import from `node:fs` (fallback copy method)
- Registered `gsd:update` command (acceptsArgs: false)
- Updated `gsd:help` Utility section to include `/gsd:update`

## Update Flow

1. **Clone or pull** — clones `https://github.com/luvvano/plan-builder-plugins` to `~/projects/plan-builder-plugins` if missing, else `git pull --ff-only`
2. **Version check** — reads old version from installed plugin + new version from pulled source
3. **Copy** — `rsync -a --exclude=node_modules` (falls back to Node.js `cpSync` if rsync unavailable)
4. **Restart** — `openclaw gateway restart`
5. **Report** — shows version diff, commit hash, and restart status

## Output Example

```
✅ GSD plugin updated

Version: 1.0.0 → 1.1.0 @ `abc1234`

📡 Pulling latest from origin...
Already up to date.

📦 Installing files...
Files copied via rsync.

🔄 Restarting OpenClaw gateway...
Gateway restarted.

Changes take effect on next command.
```
