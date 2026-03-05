---
name: gsd:verify-work
description: Verify phase completion by testing success criteria against actual implementation. Presents testable behaviors and runs gap analysis.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:verify-work

Verify phase completion against success criteria.

## Arguments

The user provides the phase number: `/gsd:verify-work 2`.
If no argument provided, ask which phase to verify.

## Step 1: Initialize

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"
INIT=$(node "$GSD_TOOLS_PATH" init verify-work "$PHASE_ARG")
```

Parse JSON: `checker_model`, `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `has_verification`.

If `phase_found` is false: inform user and stop.

## Step 2: Gather Evidence

Read all SUMMARY.md files from the phase directory:

```bash
ls $PHASE_DIR/*-SUMMARY.md 2>/dev/null
```

Read the ROADMAP.md success criteria for this phase.
Read any `must_haves` from the PLAN.md frontmatter files.

If no SUMMARY files exist: inform user that execution has not completed, suggest `/gsd:execute-phase` first.

## Step 3: Extract Testable Behaviors

From SUMMARY files and ROADMAP success criteria, extract a list of testable behaviors. Each behavior should be:
- Specific and verifiable
- Tied to a success criterion or `must_have` truth
- Testable via code inspection, running commands, or checking file existence

## Step 4: Present Test Checklist

Present the tests as an inline checklist in the chat:

```
## Phase <N> Verification Tests

I will now verify each success criterion:

### Test 1: [Description]
**Criterion:** [From ROADMAP success criteria]
**How to verify:** [Command or inspection]
**Result:** [Run the verification and report PASS/FAIL]

### Test 2: [Description]
...
```

For each test:
1. State what is being tested
2. Run the verification command or inspect the code
3. Report PASS or FAIL with evidence
4. If FAIL, note what is missing or broken

**Auto-mode behavior:** Do NOT use AskUserQuestion. Run all verifications yourself using available tools (Bash, Read, Grep). Report results directly. If a verification requires manual user action (e.g., opening a browser), note it as MANUAL and describe what the user should check.

## Step 5: Gap Analysis (if failures)

If any tests FAIL:

Follow the gap analysis stage:
@./stage-verify.md

The verifier analyzes failures and produces a structured gap report.

## Step 6: Write VERIFICATION.md

Write `$PHASE_DIR/VERIFICATION.md` with:
- Test results (pass/fail for each criterion)
- Overall result: PASSED or FAILED
- Gap analysis (if applicable)
- Recommended next steps

If `commit_docs` is true:
```bash
node "$GSD_TOOLS_PATH" commit "docs($PHASE): add verification results" --files "$PHASE_DIR/VERIFICATION.md"
```

## Step 7: Report

Report to user:
- Overall: PASSED or FAILED (X/Y tests passed)
- If PASSED: Phase complete, suggest updating roadmap
- If FAILED: Gap analysis summary, suggest `/gsd:plan-phase --gaps $PHASE` for gap closure
