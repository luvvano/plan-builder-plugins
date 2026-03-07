#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_DIR="$HOME/.openclaw/extensions/gsd-for-openclaw"
OPENCLAW_JSON="$HOME/.openclaw/openclaw.json"

echo "→ Pulling latest from GitHub..."
git -C "$REPO_DIR" pull --ff-only

echo "→ Installing gsd-for-openclaw..."
rsync -a --delete --exclude=node_modules "$REPO_DIR/openclaw-plugin/" "$EXT_DIR/"

echo "→ Registering plugin in openclaw.json..."
node -e "
const fs = require('fs');
const path = '$OPENCLAW_JSON';
const cfg = JSON.parse(fs.readFileSync(path, 'utf8'));

cfg.plugins = cfg.plugins || {};
cfg.plugins.allow = cfg.plugins.allow || [];
if (!cfg.plugins.allow.includes('gsd-for-openclaw')) {
  cfg.plugins.allow.push('gsd-for-openclaw');
}

cfg.plugins.entries = cfg.plugins.entries || {};
cfg.plugins.entries['gsd-for-openclaw'] = {
  path: '$EXT_DIR',
  config: {}
};

fs.writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n');
console.log('openclaw.json updated.');
"

echo ""
echo "✅ Plugin installed: gsd-for-openclaw"
echo "   Gateway hot-reloads config — no restart needed for config changes."
