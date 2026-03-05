---
name: gsd:complete-milestone
description: Mark a milestone as complete, generating final audit and archiving state.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:complete-milestone

Mark a shipped milestone as complete. Creates historical record in MILESTONES.md, performs full PROJECT.md evolution review, reorganizes ROADMAP.md with milestone groupings, and tags the release in git.

## Step 1: Initialize

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"
INIT=$(node "$GSD_TOOLS_PATH" init execute-phase "1")
```

Read required files:
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/PROJECT.md`

## Step 2: Verify Readiness

Use roadmap analyze for comprehensive readiness check:

```bash
ROADMAP=$(node "$GSD_TOOLS_PATH" roadmap analyze)
```

This returns all phases with plan/summary counts and disk status. Use to verify:
- Which phases belong to this milestone?
- All phases complete (all plans have summaries)? Check `disk_status === 'complete'` for each.
- `progress_percent` should be 100%.

**Requirements completion check:**

Parse REQUIREMENTS.md traceability table:
- Count total v[X.Y] requirements vs checked-off (`[x]`) requirements
- Identify any non-Complete rows in the traceability table

Present readiness summary:

```
Milestone: [Name, e.g., "v1.0 MVP"]

Includes:
- Phase 1: Foundation (2/2 plans complete)
- Phase 2: Authentication (2/2 plans complete)

Total: {phase_count} phases, {total_plans} plans, all complete
Requirements: {N}/{M} v[X.Y] requirements checked off
```

**If requirements incomplete (N < M):**

Show the unchecked requirements and present 3 options:
1. **Proceed anyway** — mark milestone complete with known gaps
2. **Run audit first** — assess gap severity before completing
3. **Abort** — return to development

If proceeding with gaps: note incomplete requirements in MILESTONES.md under `### Known Gaps`.

**In yolo/auto mode:** Auto-approve readiness check and proceed to gather_stats.

## Step 3: Gather Stats

Calculate milestone statistics:

```bash
git log --oneline --grep="feat(" | head -20
git diff --stat FIRST_COMMIT..LAST_COMMIT | tail -1
find . -name "*.swift" -o -name "*.ts" -o -name "*.py" | xargs wc -l 2>/dev/null
```

Present stats:
```
Milestone Stats:
- Phases: [X-Y]
- Plans: [Z] total
- Tasks: [N] total (from phase summaries)
- Files modified: [M]
- Lines of code: [LOC]
- Timeline: [Days] days ([Start] → [End])
```

## Step 4: Extract Accomplishments

Extract one-liners from SUMMARY.md files:

```bash
for summary in .planning/phases/*-*/*-SUMMARY.md; do
  node "$GSD_TOOLS_PATH" summary-extract "$summary" --fields one_liner | node -e "const d = require('fs').readFileSync('/dev/stdin','utf8'); try { console.log(JSON.parse(d).one_liner); } catch(e) { console.log(''); }"
done
```

Extract 4-6 key accomplishments from the one-liners.

## Step 5: Full PROJECT.md Evolution Review

Read all phase summaries:

```bash
cat .planning/phases/*-*/*-SUMMARY.md
```

Full review checklist:

1. **"What This Is" accuracy** — Compare description to what was built; update if meaningfully changed
2. **Core Value check** — Still the right priority? Update if shifted
3. **Requirements audit:**
   - All shipped Active requirements → Move to Validated: `- ✓ [Requirement] — v[X.Y]`
   - Remove moved requirements from Active
   - Keep unaddressed requirements in Active
   - Add new requirements for next milestone if known
4. **Out of Scope audit** — Review each item, remove irrelevant, add invalidated items
5. **Context update** — Current codebase state (LOC, tech stack), user feedback, known issues
6. **Key Decisions audit** — Extract all milestone decisions from phase summaries, add to table with outcomes
7. **Constraints check** — Update any changed constraints

Update PROJECT.md inline. Update "Last updated" footer:

```markdown
---
*Last updated: [date] after v[X.Y] milestone*
```

## Step 6: Archive Milestone

Delegate archival to gsd-tools:

```bash
ARCHIVE=$(node "$GSD_TOOLS_PATH" milestone complete "v[X.Y]" --name "[Milestone Name]")
```

The CLI handles:
- Creating `.planning/milestones/` directory
- Archiving ROADMAP.md to `milestones/v[X.Y]-ROADMAP.md`
- Archiving REQUIREMENTS.md to `milestones/v[X.Y]-REQUIREMENTS.md`
- Moving audit file to milestones if exists
- Creating/appending MILESTONES.md entry with accomplishments
- Updating STATE.md (status, last activity)

Extract from result: `version`, `date`, `phases`, `plans`, `tasks`, `accomplishments`, `archived`.

Ask user conversationally whether to archive phase directories to `milestones/v[X.Y]-phases/`. If yes:

```bash
mkdir -p .planning/milestones/v[X.Y]-phases
# Move each phase directory
```

## Step 7: Reorganize ROADMAP.md

Reorganize ROADMAP.md with milestone groupings:

```markdown
# Roadmap: [Project Name]

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped YYYY-MM-DD)
- 🚧 **v1.1 Security** — Phases 5-6 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED YYYY-MM-DD</summary>

- [x] Phase 1: Foundation (2/2 plans) — completed YYYY-MM-DD
- [x] Phase 2: Authentication (2/2 plans) — completed YYYY-MM-DD

</details>
```

Then delete original files:

```bash
rm .planning/ROADMAP.md
rm .planning/REQUIREMENTS.md
```

## Step 8: Write Retrospective

Check for existing retrospective:

```bash
ls .planning/RETROSPECTIVE.md 2>/dev/null
```

- **If exists:** Append new milestone section before the "## Cross-Milestone Trends" section
- **If doesn't exist:** Create new RETROSPECTIVE.md

Write the milestone section:

```markdown
## Milestone: v{version} — {name}

**Shipped:** {date}
**Phases:** {phase_count} | **Plans:** {plan_count}

### What Was Built
{Extract from SUMMARY.md one-liners}

### What Worked
{Patterns that led to smooth execution}

### What Was Inefficient
{Missed opportunities, rework, bottlenecks}

### Patterns Established
{New conventions discovered during this milestone}

### Key Lessons
{Specific, actionable takeaways}
```

Update cross-milestone trends section if it exists.

```bash
node "$GSD_TOOLS_PATH" commit "docs: update retrospective for v[X.Y]" --files .planning/RETROSPECTIVE.md
```

## Step 9: Create Git Tag

```bash
git tag -a v[X.Y] -m "v[X.Y] [Name]

Delivered: [One sentence]

Key accomplishments:
- [Item 1]
- [Item 2]
- [Item 3]

See .planning/MILESTONES.md for full details."
```

Ask user conversationally whether to push the tag to remote. If yes:

```bash
git push origin v[X.Y]
```

## Step 10: Final Commit

```bash
node "$GSD_TOOLS_PATH" commit "chore: complete v[X.Y] milestone" --files .planning/milestones/v[X.Y]-ROADMAP.md .planning/milestones/v[X.Y]-REQUIREMENTS.md .planning/MILESTONES.md .planning/PROJECT.md .planning/STATE.md
```

## Step 11: Report

```
✅ Milestone v[X.Y] [Name] complete

Shipped:
- [N] phases ([M] plans, [P] tasks)
- [One sentence of what shipped]

Archived:
- milestones/v[X.Y]-ROADMAP.md
- milestones/v[X.Y]-REQUIREMENTS.md

Summary: .planning/MILESTONES.md
Tag: v[X.Y]

---

## ▶ Next Up

**Start Next Milestone** — questioning → research → requirements → roadmap

`/gsd:new-milestone`

<sub>`/clear` first → fresh context window</sub>
```
