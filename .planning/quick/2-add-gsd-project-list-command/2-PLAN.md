---
quick_num: 2
description: "Add gsd:project-list command — persistent project tracking"
mode: quick
created: 2026-03-05
must_haves:
  truths:
    - "~/.gsd/projects.json tracks all GSD projects (created on first add)"
    - "gsd:project-list (no args) lists all tracked projects"
    - "gsd:project-list add [path] registers a project"
    - "gsd:project-list remove <name> unregisters a project"
    - "gsd:new-project auto-registers the project on completion"
  artifacts:
    - "openclaw-plugin/bin/lib/commands.cjs (cmdProjectList added + exported)"
    - "openclaw-plugin/bin/gsd-tools.cjs (project-list case added)"
    - "openclaw-plugin/src/index.ts (gsd:project-list registered, help updated)"
    - "openclaw-plugin/skills/workflows/new-project/SKILL.md (auto-register added)"
---

# Quick Task 2: Add gsd:project-list command

## Goal

Add a persistent project registry command so users can track which projects they're actively developing with GSD.

## Tasks

```xml
<task type="auto">
  <name>Add cmdProjectList to commands.cjs</name>
  <files>openclaw-plugin/bin/lib/commands.cjs</files>
  <action>
    Add cmdProjectList(action, projectPath, raw) function.
    Storage: ~/.gsd/projects.json
    Schema: { version: 1, projects: [{ name, path, added, last_active }] }
    - 'list' (default): read file, output formatted JSON with all projects
    - 'add': read PROJECT.md name if available; add/update entry for path (cwd if not given); create ~/.gsd/ if needed
    - 'remove': remove by name match or path match
    Export from module.exports.
  </action>
  <verify>node gsd-tools.cjs project-list list returns JSON with projects array</verify>
  <done>cmdProjectList exported from commands.cjs, handles list/add/remove</done>
</task>

<task type="auto">
  <name>Wire project-list in gsd-tools.cjs</name>
  <files>openclaw-plugin/bin/gsd-tools.cjs</files>
  <action>
    Add case 'project-list' to the switch statement before the default case.
    Route: action = args[1] || 'list', pathArg = args[2]
    Call: commands.cmdProjectList(action, pathArg || cwd, raw)
    Also add 'project-list [list|add|remove] [path]' to the error usage string.
  </action>
  <verify>node gsd-tools.cjs project-list returns JSON</verify>
  <done>project-list subcommand routes to cmdProjectList</done>
</task>

<task type="auto">
  <name>Register gsd:project-list in src/index.ts + update help</name>
  <files>openclaw-plugin/src/index.ts</files>
  <action>
    1. Add api.registerCommand for 'gsd:project-list':
       - acceptsArgs: true, requireAuth: false
       - handler(args): parse args[0] as action, args[1] as path
       - call execGsdTools(`project-list ${action} ${pathArg}`.trim())
       - Format output: on list, show table of projects; on add/remove, show success message
    2. In gsd:help handler, add to Utility section:
       "  /gsd:project-list               — List/add/remove tracked GSD projects"
  </action>
  <verify>gsd:help includes gsd:project-list in output</verify>
  <done>gsd:project-list registered and help updated</done>
</task>

<task type="auto">
  <name>Auto-register in new-project SKILL.md</name>
  <files>openclaw-plugin/skills/workflows/new-project/SKILL.md</files>
  <action>
    In Step 9 (Done), after the completion banner block and before "If auto mode" section,
    add a new step to auto-register the project:

    ```bash
    node "$GSD_TOOLS_PATH" project-list add .
    ```

    Add it as a silent step with comment: "Register project in ~/.gsd/projects.json"
  </action>
  <verify>Step 9 in new-project/SKILL.md contains project-list add call</verify>
  <done>New projects auto-register on /gsd:new-project completion</done>
</task>
```
