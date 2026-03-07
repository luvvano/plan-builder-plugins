---
name: gsd_new_milestone
description: Start a new milestone with fresh roadmap and requirements. Archives current milestone state.
user-invocable: true
os: ["darwin", "linux"]
---

## Step 0: Validate Active Project

**Before anything else**, resolve the active project:

```bash
PROJECT_DIR="${GSD_CURRENT_PROJECT_DIR:-}"
```

**If `PROJECT_DIR` is empty**, stop and reply:
```
⚠️ **No active project set.**

Set one first:
• /gsd_set_project <name> — switch to a tracked project
• /gsd_project_list add — add a new project

Run /gsd_project_list to see all tracked projects.
```

**If set**, use `PROJECT_DIR` as the working directory for ALL subsequent operations (gsd-tools calls, file reads/writes, git commands).

---



# /gsd:new-milestone

Start a new milestone cycle for an existing project.

## Step 1: Load Context

Read existing project artifacts:

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"
```

Read the following files:
- `.planning/PROJECT.md` (existing project, validated requirements, decisions)
- `.planning/MILESTONES.md` (what shipped previously)
- `.planning/STATE.md` (pending todos, blockers)
- `.planning/MILESTONE-CONTEXT.md` (if it exists — from /gsd:discuss-milestone)

## Step 2: Gather Milestone Goals

**If MILESTONE-CONTEXT.md exists:**
- Use features and scope from discuss-milestone
- Present summary for confirmation

**If no context file:**
- Present what shipped in last milestone
- Ask: "What do you want to build next?"
- Explore features, priorities, constraints, and scope through conversation
- Do NOT use AskUserQuestion — ask conversationally and wait for the user's next message

## Step 3: Determine Milestone Version

- Parse last version from MILESTONES.md
- Suggest next version (v1.0 → v1.1, or v2.0 for major)
- Confirm version with user conversationally

## Step 4: Update PROJECT.md

Add/update the current milestone section:

```markdown
## Current Milestone: v[X.Y] [Name]

**Goal:** [One sentence describing milestone focus]

**Target features:**
- [Feature 1]
- [Feature 2]
- [Feature 3]
```

Update Active requirements section and "Last updated" footer.

## Step 5: Update STATE.md

```markdown
## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: [today] — Milestone v[X.Y] started
```

Keep Accumulated Context section from previous milestone.

## Step 6: Cleanup and Commit

Delete MILESTONE-CONTEXT.md if exists (consumed).

```bash
node "$GSD_TOOLS_PATH" commit "docs: start milestone v[X.Y] [Name]" --files .planning/PROJECT.md .planning/STATE.md
```

## Step 7: Load Context and Resolve Models

```bash
INIT=$(node "$GSD_TOOLS_PATH" init new-milestone)
```

Extract from init JSON: `researcher_model`, `synthesizer_model`, `roadmapper_model`, `commit_docs`, `research_enabled`, `current_milestone`, `project_exists`, `roadmap_exists`.

## Step 8: Research Decision

Ask the user conversationally: "Research the domain ecosystem for new features before defining requirements?"

Options:
- Research first (Recommended) — Discover patterns, features, architecture for NEW capabilities
- Skip research — Go straight to requirements

**Persist choice to config:**

```bash
# If research first:
node "$GSD_TOOLS_PATH" config-set workflow.research true

# If skip research:
node "$GSD_TOOLS_PATH" config-set workflow.research false
```

**If research selected:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► RESEARCHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning 4 researchers in parallel...
  → Stack, Features, Architecture, Pitfalls
```

```bash
mkdir -p .planning/research
```

Spawn 4 parallel research sub-agents (one per dimension): Stack, Features, Architecture, Pitfalls. Each agent:
1. Reads `.planning/PROJECT.md` for existing project context
2. Focuses ONLY on what's needed for the NEW milestone features
3. Writes results to `.planning/research/{STACK|FEATURES|ARCHITECTURE|PITFALLS}.md`

After all 4 complete, spawn a synthesizer agent that:
1. Reads all 4 research files
2. Writes `.planning/research/SUMMARY.md` with key findings
3. Commits after writing

Display key findings from SUMMARY.md after synthesis completes.

**If skip research:** Continue to Step 9.

## Step 9: Define Requirements

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► DEFINING REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Read PROJECT.md for core value, current milestone goals, and validated requirements.

**If research exists:** Read FEATURES.md, extract feature categories and present grouped by category.

**If no research:** Gather requirements through conversation.

For each feature category, confirm which items are in scope for this milestone. Track: Selected → this milestone. Unselected → future or out of scope.

**Generate REQUIREMENTS.md:**
- v[X.Y] Requirements grouped by category (checkboxes, REQ-IDs)
- Future Requirements (deferred)
- Out of Scope (explicit exclusions with reasoning)
- Traceability section (empty, filled by roadmap)

**REQ-ID format:** `[CATEGORY]-[NUMBER]` (AUTH-01, NOTIF-02). Continue numbering from existing.

Present the full requirements list for confirmation. If user wants adjustments, return to scoping.

**Commit requirements:**
```bash
node "$GSD_TOOLS_PATH" commit "docs: define milestone v[X.Y] requirements" --files .planning/REQUIREMENTS.md
```

## Step 10: Create Roadmap

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CREATING ROADMAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning roadmapper...
```

Determine starting phase number by reading MILESTONES.md for the last phase number. Continue from there.

Spawn a roadmapper sub-agent with:
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/research/SUMMARY.md` (if exists)
- `.planning/config.json`
- `.planning/MILESTONES.md`

Instructions for the roadmapper:
1. Start phase numbering from [N] (continuing from last milestone)
2. Derive phases from THIS MILESTONE's requirements only
3. Map every requirement to exactly one phase
4. Derive 2-5 success criteria per phase (observable user behaviors)
5. Validate 100% requirement coverage
6. Write ROADMAP.md, STATE.md, and update REQUIREMENTS.md traceability
7. Return "ROADMAP CREATED" with summary

**If "ROADMAP BLOCKED":** Present blocker, work with user, re-spawn roadmapper.

**If "ROADMAP CREATED":** Read ROADMAP.md and present inline as a table of phases with goals, requirements, and success criteria counts.

Ask user for approval. Options: Approve, Adjust phases, Review full file.

**Commit roadmap after approval:**
```bash
node "$GSD_TOOLS_PATH" commit "docs: create milestone v[X.Y] roadmap ([N] phases)" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md
```

## Step 11: Done

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► MILESTONE INITIALIZED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Milestone v[X.Y]: [Name]**

| Artifact       | Location                    |
|----------------|-----------------------------|
| Project        | `.planning/PROJECT.md`      |
| Research       | `.planning/research/`       |
| Requirements   | `.planning/REQUIREMENTS.md` |
| Roadmap        | `.planning/ROADMAP.md`      |

**[N] phases** | **[X] requirements** | Ready to build ✓

## ▶ Next Up

**Phase [N]: [Phase Name]** — [Goal]

`/gsd:discuss-phase [N]` — gather context and clarify approach

<sub>`/clear` first → fresh context window</sub>

Also: `/gsd:plan-phase [N]` — skip discussion, plan directly
```
