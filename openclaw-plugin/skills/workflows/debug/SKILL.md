---
name: gsd:debug
description: Diagnose and fix issues using systematic debugging workflow with hypothesis testing.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:debug

Orchestrate parallel debug agents to investigate UAT gaps and find root causes.

After UAT finds gaps, spawn one debug agent per gap. Each agent investigates autonomously with symptoms pre-filled from UAT. Collect root causes, update UAT.md gaps with diagnosis, then hand off to plan-phase --gaps with actual diagnoses.

## Step 1: Initialize

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"
```

## Step 2: Parse Gaps

Extract gaps from UAT.md. Read the "Gaps" section (YAML format):

```yaml
- truth: "Comment appears immediately after submission"
  status: failed
  reason: "User reported: works but doesn't show until I refresh the page"
  severity: major
  test: 2
  artifacts: []
  missing: []
```

For each gap, also read the corresponding test from the "Tests" section to get full context.

Build gap list with: `truth`, `severity`, `test_num`, `reason`.

## Step 3: Report Diagnosis Plan

Report plan to user:

```
## Diagnosing {N} Gaps

Spawning parallel debug agents to investigate root causes:

| Gap (Truth) | Severity |
|-------------|----------|
| Comment appears immediately after submission | major |
| Reply button positioned correctly | minor |
| Delete removes comment | blocker |

Each agent will:
1. Investigate autonomously (read code, form hypotheses, test)
2. Return root cause with evidence
3. Save debug session to .planning/debug/

This runs in parallel — all gaps investigated simultaneously.
```

## Step 4: Spawn Debug Agents

Spawn one debug sub-agent per gap in a single message (parallel execution).

Each agent receives:
- The gap truth (expected behavior that failed)
- The actual behavior from the UAT reason field
- Any error messages (or "None reported")
- The test number from UAT for context
- A reference to the UAT.md file path

Each agent's task:
1. Read the codebase to find the root cause
2. Form and test hypotheses
3. Write debug session to `.planning/debug/{slug}.md`
4. Return with:
   - Root cause (specific, with evidence)
   - Files involved and what is wrong in each
   - Suggested fix direction for plan-phase --gaps

If an agent returns `INVESTIGATION INCONCLUSIVE`:
- root_cause: "Investigation inconclusive - manual review needed"
- Note which issue needs manual attention

## Step 5: Collect Results

Parse each agent return to extract:
- `root_cause`: The diagnosed cause
- `files`: Files involved
- `debug_path`: Path to debug session file
- `suggested_fix`: Hint for gap closure plan

## Step 6: Update UAT.md

For each gap in the Gaps section, add artifacts, missing, and root_cause fields:

```yaml
- truth: "Comment appears immediately after submission"
  status: failed
  reason: "User reported: works but doesn't show until I refresh the page"
  severity: major
  test: 2
  root_cause: "useEffect in CommentList.tsx missing commentCount dependency"
  artifacts:
    - path: "src/components/CommentList.tsx"
      issue: "useEffect missing dependency"
  missing:
    - "Add commentCount to useEffect dependency array"
    - "Trigger re-render when new comment added"
  debug_session: .planning/debug/comment-not-refreshing.md
```

Update status in frontmatter to "diagnosed".

Commit the updated UAT.md:

```bash
node "$GSD_TOOLS_PATH" commit "docs({phase_num}): add root causes from diagnosis" --files ".planning/phases/XX-name/{phase_num}-UAT.md"
```

## Step 7: Report Results and Hand Off

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► DIAGNOSIS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Gap (Truth) | Root Cause | Files |
|-------------|------------|-------|
| Comment appears immediately | useEffect missing dependency | CommentList.tsx |

Debug sessions: .planning/debug/

Proceeding to plan fixes...
```

Hand off to verify-work orchestrator for automatic planning. Do NOT offer manual next steps — verify-work handles the rest.

## Failure Handling

**Agent fails to find root cause:**
- Mark gap as "needs manual review"
- Continue with other gaps
- Report incomplete diagnosis

**All agents fail:**
- Something systemic (permissions, git, etc.)
- Report for manual investigation
- Fall back to plan-phase --gaps without root causes (less precise)
