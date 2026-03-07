#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_DIR="$HOME/.openclaw/extensions"
OPENCLAW_JSON="$HOME/.openclaw/openclaw.json"

echo "→ Installing gsd-for-openclaw..."
rsync -a --delete "$REPO_DIR/openclaw-plugin/" "$EXT_DIR/gsd-for-openclaw/"

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
if (!cfg.plugins.entries['gsd-for-openclaw']) {
  cfg.plugins.entries['gsd-for-openclaw'] = {
    path: '$EXT_DIR/gsd-for-openclaw',
    config: {}
  };
}

fs.writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n');
console.log('openclaw.json updated.');
"

echo ""
echo "✅ Plugin installed: gsd-for-openclaw"
echo "   Gateway hot-reloads config — no restart needed for most changes."
