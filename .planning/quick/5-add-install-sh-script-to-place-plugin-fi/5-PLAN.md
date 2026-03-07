# Plan 5: Add install.sh Script

**Goal:** Single `./install.sh` at repo root that installs both plugins and registers them in openclaw.json — fully idempotent.

---

## Task 1: Create install.sh

**File:** `~/projects/plan-builder-plugins/install.sh`

**What it does:**
1. Clone or pull `luvvano/openclaw-tracer` into `~/projects/openclaw_tracer`
2. `rsync -a --delete openclaw-plugin/ ~/.openclaw/extensions/gsd-for-openclaw/`
3. `rsync -a --delete --exclude='.git' --exclude='.planning' ~/projects/openclaw_tracer/ ~/.openclaw/extensions/openclaw-tracer/`
4. Run embedded Node.js snippet (inline `node -e`) to patch `~/.openclaw/openclaw.json` — idempotent:
   - Add both plugin IDs to `plugins.allow[]` (if not already present)
   - Add entries to `plugins.entries` for each plugin (if not already present)
5. Print: `✅ Done. Run: openclaw gateway restart`

**Script skeleton:**

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
TRACER_REPO="https://github.com/luvvano/openclaw-tracer.git"
TRACER_DIR="$HOME/projects/openclaw_tracer"
EXT_DIR="$HOME/.openclaw/extensions"
OPENCLAW_JSON="$HOME/.openclaw/openclaw.json"

echo "→ Syncing openclaw-tracer..."
if [ -d "$TRACER_DIR/.git" ]; then
  git -C "$TRACER_DIR" pull --ff-only
else
  git clone "$TRACER_REPO" "$TRACER_DIR"
fi

echo "→ Installing gsd-for-openclaw..."
rsync -a --delete "$REPO_DIR/openclaw-plugin/" "$EXT_DIR/gsd-for-openclaw/"

echo "→ Installing openclaw-tracer..."
rsync -a --delete \
  --exclude='.git' \
  --exclude='.planning' \
  "$TRACER_DIR/" "$EXT_DIR/openclaw-tracer/"

echo "→ Registering plugins in openclaw.json..."
node -e "
const fs = require('fs');
const path = '$OPENCLAW_JSON';
const cfg = JSON.parse(fs.readFileSync(path, 'utf8'));

// Ensure plugins.allow
cfg.plugins = cfg.plugins || {};
cfg.plugins.allow = cfg.plugins.allow || [];
const toAllow = ['gsd-for-openclaw', 'openclaw-tracer'];
for (const id of toAllow) {
  if (!cfg.plugins.allow.includes(id)) cfg.plugins.allow.push(id);
}

// Ensure plugins.entries
cfg.plugins.entries = cfg.plugins.entries || {};
if (!cfg.plugins.entries['gsd-for-openclaw']) {
  cfg.plugins.entries['gsd-for-openclaw'] = {
    path: '$EXT_DIR/gsd-for-openclaw',
    config: {}
  };
}
if (!cfg.plugins.entries['openclaw-tracer']) {
  cfg.plugins.entries['openclaw-tracer'] = {
    path: '$EXT_DIR/openclaw-tracer',
    config: {}
  };
}

fs.writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n');
console.log('openclaw.json updated.');
"

echo ""
echo "✅ Both plugins installed."
echo "   Run: openclaw gateway restart"
```

**Make executable:** `chmod +x install.sh`

---

## Task 2: Commit and push

```bash
cd ~/projects/plan-builder-plugins
git add install.sh
git commit -m "feat: add install.sh for one-command plugin setup"
git push
```

Also update `README.md` installation section to reference `./install.sh` instead of manual rsync steps (one-liner addition to existing README).

---

## Notes

- Node.js snippet uses `require` (CommonJS) for compatibility with any Node version, no `--input-type` flag needed when passed via `-e`.
- The `rsync --delete` flag ensures stale files are removed from extension dirs.
- Script is idempotent: re-running is safe (git pull is ff-only, JSON patch checks before pushing).
- No build step in install.sh — assumes `openclaw-plugin/` already contains compiled output (dist/bin). If a build step is needed, add `npm run build` in `openclaw-plugin/` before rsync.
