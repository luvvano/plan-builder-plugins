---
name: gsd-new-project
description: Initialize a new GSD project with PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and STATE.md
user-invocable: true
os: ["darwin", "linux"]
---

# GSD New Project

Initialize a spec-driven development project in the current workspace.

## Prerequisites

- `$GSD_TOOLS_PATH` must be set (the GSD plugin service sets this automatically)
- Current directory must be a git repository

## Instructions

When the user invokes this skill, follow these steps:

### Step 1: Validate Environment

```bash
# Verify GSD tools are available
node "$GSD_TOOLS_PATH" --help > /dev/null 2>&1 || echo "ERROR: GSD tools not found at $GSD_TOOLS_PATH"

# Verify git repository
git rev-parse --is-inside-work-tree > /dev/null 2>&1 || echo "ERROR: Not inside a git repository"
```

### Step 2: Initialize Planning Directory

```bash
node "$GSD_TOOLS_PATH" init new-project
```

If this command does not exist or fails, manually create the `.planning/` directory structure:

```bash
mkdir -p .planning
```

### Step 3: Gather Project Information

Ask the user for:
1. **Project name** - What is this project called?
2. **Project description** - What does this project do? (1-2 sentences)
3. **Core value proposition** - What is the main value for users?
4. **Key technical constraints** - Any specific tech stack, platform, or architecture requirements?

### Step 4: Create PROJECT.md

Read the template from `$GSD_HOME/templates/project.md` and fill it with the gathered information.

Write the filled template to `.planning/PROJECT.md`.

### Step 5: Create REQUIREMENTS.md

Read the template from `$GSD_HOME/templates/requirements.md`.

Based on the project description and constraints, create an initial requirements document. Group requirements by domain area. Each requirement should have:
- A unique ID (e.g., `AUTH-01`, `UI-01`)
- A clear description
- A checkbox for tracking

Write to `.planning/REQUIREMENTS.md`.

### Step 6: Create ROADMAP.md

Read the template from `$GSD_HOME/templates/roadmap.md`.

Break the project into 3-5 phases, each with:
- A clear goal
- Dependencies on prior phases
- Requirement IDs mapped to the phase
- Success criteria (what must be TRUE when the phase is done)

Write to `.planning/ROADMAP.md`.

### Step 7: Create STATE.md

Read the template from `$GSD_HOME/templates/state.md`.

Initialize with:
- Current position: Phase 1
- Status: Ready to plan
- Empty metrics

Write to `.planning/STATE.md`.

### Step 8: Create config.json

```bash
node "$GSD_TOOLS_PATH" config-set model_profile balanced
```

Or manually create `.planning/config.json`:
```json
{
  "model_profile": "balanced",
  "workflow": {
    "auto_advance": false,
    "nyquist_validation": false
  }
}
```

### Step 9: Commit

```bash
node "$GSD_TOOLS_PATH" commit "docs: initialize GSD project" --files ".planning/PROJECT.md" ".planning/REQUIREMENTS.md" ".planning/ROADMAP.md" ".planning/STATE.md" ".planning/config.json"
```

### Step 10: Report Completion

Display:
```
GSD project initialized successfully.

Created:
- .planning/PROJECT.md
- .planning/REQUIREMENTS.md
- .planning/ROADMAP.md
- .planning/STATE.md
- .planning/config.json

Next: /gsd:discuss-phase 1
```
