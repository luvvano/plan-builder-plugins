---
name: gsd:set-profile
description: "Set the model profile for GSD workflows (e.g., fast, balanced, thorough)."
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:set-profile

Switch the model profile used by GSD agents. Controls which Claude model each agent uses, balancing quality vs token spend.

**Usage:** `/gsd:set-profile <profile>`

Valid profiles: `quality`, `balanced`, `budget`

## Step 1: Validate Argument

Check that a profile argument was provided and is valid:

```
if $ARGUMENTS.profile not in ["quality", "balanced", "budget"]:
  Error: Invalid profile "$ARGUMENTS.profile"
  Valid profiles: quality, balanced, budget
  EXIT
```

If no argument provided:
```
Usage: /gsd:set-profile <profile>
Valid profiles:
- quality   — Opus everywhere except verification (highest cost)
- balanced  — Opus for planning, Sonnet for execution/verification
- budget    — Sonnet for writing, Haiku for research/verification (lowest cost)
```

## Step 2: Ensure and Load Config

Ensure config exists and load current state:

```bash
node "$GSD_TOOLS_PATH" config-ensure-section
INIT=$(node "$GSD_TOOLS_PATH" state load)
```

This creates `.planning/config.json` with defaults if missing and loads current config.

## Step 3: Update Config

Read current config from state load or directly, then update `model_profile` field:

```json
{
  "model_profile": "$ARGUMENTS.profile"
}
```

Write updated config back to `.planning/config.json`.

## Step 4: Confirm

Display confirmation with model table for selected profile:

```
Model profile set to: {profile}

Agents will now use:

| Agent              | Model   |
|--------------------|---------|
| gsd-planner        | {model} |
| gsd-executor       | {model} |
| gsd-verifier       | {model} |
| gsd-researcher     | {model} |
| gsd-codebase-mapper | {model} |

Next spawned agents will use the new profile.
```

Map profile names:
- `quality`: highest quality models for all agents
- `balanced`: recommended mix — quality planning, efficient execution
- `budget`: economical models for all agents

## Success Criteria

- [ ] Argument validated (must be quality, balanced, or budget)
- [ ] Config file ensured to exist
- [ ] Config updated with new model_profile
- [ ] Confirmation displayed with model table
