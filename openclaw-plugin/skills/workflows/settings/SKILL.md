---
name: gsd:settings
description: Display current GSD configuration settings from .planning/config.json.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:settings

Display current GSD configuration and explain how to change each setting. This command reads `.planning/config.json` and presents settings in a readable format with instructions for manual editing.

**Note:** This plugin uses auto-mode. Settings are displayed for reference; edit `.planning/config.json` directly to change them.

## Step 1: Ensure and Load Config

```bash
node "$GSD_TOOLS_PATH" config-ensure-section
```

Creates `.planning/config.json` with defaults if missing.

```bash
cat .planning/config.json
```

Parse the current config values. If a field is missing, use the default value shown in the table below.

## Step 2: Display Current Settings

Display the settings table:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD Settings — .planning/config.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Setting              | Current Value         | Default   |
|----------------------|-----------------------|-----------|
| Model Profile        | {model_profile}       | balanced  |
| Plan Researcher      | {workflow.research}   | true      |
| Plan Checker         | {workflow.plan_check} | true      |
| Execution Verifier   | {workflow.verifier}   | true      |
| Auto-Advance         | {workflow.auto_advance} | false   |
| Nyquist Validation   | {workflow.nyquist_validation} | true |
| Git Branching        | {git.branching_strategy} | none  |
| Mode                 | {mode}                | yolo      |
| Depth                | {depth}               | quick     |
| Commit Docs          | {commit_docs}         | true      |
| Parallelization      | {parallelization}     | true      |
```

## Step 3: Explain Each Setting

```
## Setting Explanations

**model_profile** — Which Claude model tier agents use
  - quality: Opus everywhere (highest cost, best results)
  - balanced: Opus for planning, Sonnet for execution (recommended)
  - budget: Sonnet/Haiku mix (lowest cost)
  To change: /gsd:set-profile <quality|balanced|budget>

**workflow.research** — Spawn researcher agent during plan-phase
  - true: Researches domain before planning (better plans)
  - false: Plan directly without research (faster)
  To change: edit .planning/config.json

**workflow.plan_check** — Spawn plan checker before execution
  - true: Verifies plans meet phase goals before executing
  - false: Execute plans without pre-verification
  To change: edit .planning/config.json

**workflow.verifier** — Spawn verifier after execution
  - true: Verifies must-haves after each phase execution
  - false: Skip post-execution verification
  To change: edit .planning/config.json

**workflow.auto_advance** — Auto-advance pipeline stages
  - true: Chain plan/execute stages automatically
  - false: Manual /clear + paste between stages (recommended)
  To change: edit .planning/config.json

**workflow.nyquist_validation** — Research test coverage during planning
  - true: Adds automated test requirements to plans (recommended)
  - false: Skip validation research
  To change: edit .planning/config.json

**git.branching_strategy** — How GSD creates git branches
  - none: Commit directly to current branch (recommended)
  - phase: Create branch per phase (gsd/phase-{N}-{name})
  - milestone: Create branch per milestone (gsd/{version}-{name})
  To change: edit .planning/config.json
```

## Step 4: Show Config File Location

```
Config file: .planning/config.json

To edit directly:
  Open .planning/config.json in your editor

Quick commands:
  /gsd:set-profile <profile>  — switch model profile
  /gsd:health                 — validate config integrity
```

## Success Criteria

- [ ] config.json ensured to exist
- [ ] Current config values read and displayed
- [ ] All settings shown with current values and defaults
- [ ] Instructions provided for changing each setting
- [ ] Config file location shown
