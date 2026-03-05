---
name: gsd:research-phase
description: Research a phase domain for niche or complex technologies. Creates RESEARCH.md with findings and recommendations.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:research-phase

<purpose>
Research how to implement a phase. Spawns gsd-phase-researcher with phase context.

Standalone research command. For most workflows, use `/gsd:plan-phase` which integrates research automatically.
</purpose>

<process>

## Step 0: Resolve GSD Tools Path

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"
```

## Step 1: Normalize and Validate Phase

```bash
PHASE_INFO=$(node "$GSD_TOOLS_PATH" roadmap get-phase "${PHASE}")
```

If `found` is false: Error and exit.

## Step 2: Check Existing Research

```bash
ls .planning/phases/${PHASE}-*/RESEARCH.md 2>/dev/null
```

If exists: Offer update/view/skip options. In auto-mode, proceed with update.

## Step 3: Gather Phase Context

```bash
INIT=$(node "$GSD_TOOLS_PATH" init phase-op "${PHASE}")
# Extract: phase_dir, padded_phase, phase_number, state_path, requirements_path, context_path
```

## Step 4: Spawn Researcher

```
Task(
  prompt="<objective>
Research implementation approach for Phase {phase}: {name}
</objective>

<files_to_read>
- {context_path} (USER DECISIONS from /gsd:discuss-phase)
- {requirements_path} (Project requirements)
- {state_path} (Project decisions and history)
</files_to_read>

<additional_context>
Phase description: {description}
</additional_context>

<output>
Write to: .planning/phases/${PHASE}-{slug}/${PHASE}-RESEARCH.md
</output>",
  subagent_type="gsd-phase-researcher",
  description="Research Phase {phase}: {name}"
)
```

## Step 5: Handle Return

- `## RESEARCH COMPLETE` — Display summary, offer: Plan/Dig deeper/Review/Done
- `## CHECKPOINT REACHED` — Present to user, spawn continuation
- `## RESEARCH INCONCLUSIVE` — Show attempts, offer: Add context/Try different mode/Manual

</process>
