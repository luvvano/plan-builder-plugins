# Summary: Task 5 — Add install.sh Script

## What Was Done

1. **Created `install.sh`** at repo root (`/home/egor/projects/plan-builder-plugins/install.sh`):
   - Clones or pulls `luvvano/openclaw-tracer` into `~/projects/openclaw_tracer`
   - Rsyncs `openclaw-plugin/` → `~/.openclaw/extensions/gsd-for-openclaw/`
   - Rsyncs `openclaw_tracer/` → `~/.openclaw/extensions/openclaw-tracer/` (excludes `.git`, `.planning`)
   - Runs an inline Node.js snippet to idempotently patch `~/.openclaw/openclaw.json`:
     - Adds both plugin IDs to `plugins.allow[]`
     - Adds entries to `plugins.entries` for each plugin
   - Prints `✅ Both plugins installed. Run: openclaw gateway restart`
   - Made executable with `chmod +x`

2. **Updated `README.md`**:
   - Added an `## Installation` section above `## Quick start` with a one-liner:
     ```bash
     git clone https://github.com/luvvano/plan-builder-plugins.git && cd plan-builder-plugins && ./install.sh
     ```

3. **Committed and pushed**:
   - Commit: `feat: add install.sh for one-command plugin setup`
   - Commit hash: `867467b`
   - Pushed to `origin main`

## Result

Both files (`install.sh`, `README.md`) are live on GitHub. Users can now install both plugins with a single command.
