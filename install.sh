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
