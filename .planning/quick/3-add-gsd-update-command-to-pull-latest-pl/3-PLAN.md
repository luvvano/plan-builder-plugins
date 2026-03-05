---
quick_num: 3
description: "Add gsd:update command — pull latest plugin from git and reinstall"
mode: quick
created: 2026-03-05
must_haves:
  truths:
    - "/gsd:update pulls latest from https://github.com/luvvano/plan-builder-plugins"
    - "Clones repo if not present at ~/projects/plan-builder-plugins, else git pull"
    - "Copies openclaw-plugin/ to ~/.openclaw/extensions/gsd-for-openclaw/ (rsync, preserving node_modules)"
    - "Restarts openclaw gateway after copy"
    - "Reports old version, new version, and restart status"
    - "gsd:help includes /gsd:update in Utility section"
  artifacts:
    - "openclaw-plugin/src/index.ts (gsd:update registered, help updated)"
---

# Quick Task 3: Add gsd:update command

## Goal

Let users update the GSD OpenClaw plugin to the latest version from GitHub with a single command.

## Tasks

```xml
<task type="auto">
  <name>Register gsd:update in src/index.ts + update help</name>
  <files>openclaw-plugin/src/index.ts</files>
  <action>
    Add api.registerCommand for 'gsd:update':
    - acceptsArgs: false, requireAuth: false
    - handler() runs these steps synchronously via execSync:

    Step 1: Determine paths
      REPO_DIR = ~/projects/plan-builder-plugins
      PLUGIN_SRC = ~/projects/plan-builder-plugins/openclaw-plugin
      INSTALL_DIR = ~/.openclaw/extensions/gsd-for-openclaw

    Step 2: Read current installed version from INSTALL_DIR/openclaw.plugin.json

    Step 3: Clone or pull
      - If REPO_DIR/.git exists: git -C REPO_DIR pull --ff-only
      - Else: git clone https://github.com/luvvano/plan-builder-plugins REPO_DIR

    Step 4: Read new version from PLUGIN_SRC/openclaw.plugin.json

    Step 5: Copy files (rsync or cp -r, preserve node_modules if present)
      rsync -a --exclude=node_modules PLUGIN_SRC/ INSTALL_DIR/

    Step 6: Restart gateway
      openclaw gateway restart

    Step 7: Return status message with:
      - Old version → new version
      - Commit hash pulled
      - "Gateway restarted. Changes take effect on next command."

    Handle errors gracefully (git pull fail, rsync not available fallback to cp).
    Import { homedir } from 'node:os' for ~ expansion.

    Also add to gsd:help Utility section:
      "  /gsd:update                    — Pull latest plugin version from GitHub + restart"
  </action>
  <verify>gsd:help includes /gsd:update; src/index.ts compiles without errors</verify>
  <done>gsd:update registered, performs git pull + copy + gateway restart</done>
</task>
```
