---
name: gsd:update
description: Update the GSD OpenClaw plugin to the latest version from GitHub. Pulls from https://github.com/luvvano/plan-builder-plugins, copies files to the extension directory, and restarts the gateway.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:update

<purpose>
Self-update the GSD for OpenClaw plugin from the GitHub repo. One command to get the latest features, bug fixes, and new commands.
</purpose>

<process>

## Step 1: Resolve paths

```bash
REPO_DIR="$HOME/projects/plan-builder-plugins"
PLUGIN_SRC="$REPO_DIR/openclaw-plugin"
INSTALL_DIR="$HOME/.openclaw/extensions/gsd-for-openclaw"
```

## Step 2: Read current installed version

```bash
OLD_VERSION=$(node -e "try{const p=require('$INSTALL_DIR/openclaw.plugin.json');console.log(p.version||'unknown')}catch(e){console.log('unknown')}")
```

## Step 3: Clone or pull the repo

**If `$REPO_DIR/.git` exists** (already cloned):
```bash
git -C "$REPO_DIR" pull --ff-only
PULL_OUTPUT=$?
```

**If not cloned yet:**
```bash
git clone https://github.com/luvvano/plan-builder-plugins "$REPO_DIR"
```

If git fails, report the error and stop.

Get the latest commit hash:
```bash
COMMIT=$(git -C "$REPO_DIR" rev-parse --short HEAD)
```

## Step 4: Read new version

```bash
NEW_VERSION=$(node -e "try{const p=require('$PLUGIN_SRC/openclaw.plugin.json');console.log(p.version||'unknown')}catch(e){console.log('unknown')}")
```

## Step 5: Copy plugin files

Prefer rsync (excludes node_modules cleanly):
```bash
rsync -a --exclude=node_modules "$PLUGIN_SRC/" "$INSTALL_DIR/"
```

If rsync is unavailable, fallback:
```bash
cp -r "$PLUGIN_SRC"/. "$INSTALL_DIR/"
```

## Step 6: Restart the OpenClaw gateway

```bash
openclaw gateway restart
```

## Step 7: Report result

Present a clear summary:

```
✅ GSD plugin updated

Version: [OLD_VERSION] → [NEW_VERSION] @ `[COMMIT]`

📡 Pulled latest from origin
📦 Files copied to ~/.openclaw/extensions/gsd-for-openclaw/
🔄 Gateway restarted

Changes are live.
```

If old version equals new version:
```
✅ GSD plugin updated (already latest)

Version: [VERSION] @ `[COMMIT]`

📦 Files refreshed
🔄 Gateway restarted
```

</process>

<success_criteria>
- [ ] Repo pulled or cloned successfully
- [ ] Plugin files copied to INSTALL_DIR
- [ ] Gateway restarted
- [ ] Version and commit hash reported
</success_criteria>
