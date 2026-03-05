---
name: gsd:project-list
description: List, add, or remove tracked GSD projects. Maintains a persistent registry at ~/.gsd/projects.json. Usage - list all projects, add current project, or remove by name.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:project-list

<purpose>
Track all projects you work on with GSD. Maintains a persistent registry at `~/.gsd/projects.json` so you can see and navigate all your active GSD projects across sessions.
</purpose>

<process>

## Parse arguments

Check `$ARGUMENTS` for subcommand:
- No args or `list` → list all tracked projects
- `add [path]` → register a project
- `remove <name>` → unregister a project

---

## list (default)

```bash
GSD_TOOLS="${GSD_TOOLS_PATH:-$HOME/.openclaw/extensions/gsd-for-openclaw/bin/gsd-tools.cjs}"
node "$GSD_TOOLS" project-list list
```

Parse JSON output. Present as a readable list:

**If no projects tracked yet:**
```
No GSD projects tracked yet.

To register a project, navigate to it and run:
  /gsd:project-list add
```

**If projects exist:**
```
## GSD Projects (N tracked)

1. **[name]**
   Path: /absolute/path
   Added: YYYY-MM-DD · Active: YYYY-MM-DD

2. **[name]**
   ...

---
/gsd:project-list add        — register current dir
/gsd:project-list remove <name>  — unregister
```

---

## add [path]

```bash
GSD_TOOLS="${GSD_TOOLS_PATH:-$HOME/.openclaw/extensions/gsd-for-openclaw/bin/gsd-tools.cjs}"
TARGET_PATH="${path_arg:-$(pwd)}"
node "$GSD_TOOLS" project-list add "$TARGET_PATH"
```

Parse JSON: `{ added, name, path }`

Report:
```
✅ Registered: **[name]**
Path: [path]

Run /gsd:project-list to see all tracked projects.
```

---

## remove <name>

```bash
GSD_TOOLS="${GSD_TOOLS_PATH:-$HOME/.openclaw/extensions/gsd-for-openclaw/bin/gsd-tools.cjs}"
node "$GSD_TOOLS" project-list remove "[name_arg]"
```

Parse JSON: `{ removed, target }`

**If removed:** `✅ Removed: [name]`
**If not found:** `Project not found: [name]. Run /gsd:project-list to see tracked projects.`

</process>

<success_criteria>
- [ ] list: outputs all projects from ~/.gsd/projects.json
- [ ] add: registers project, reads name from PROJECT.md if available
- [ ] remove: removes by name match
- [ ] Clear, readable output in all cases
</success_criteria>
