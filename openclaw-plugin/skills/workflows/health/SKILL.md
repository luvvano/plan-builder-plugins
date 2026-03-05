---
name: gsd:health
description: "Run project health check: validate planning files, config, and directory structure."
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:health

Validate `.planning/` directory integrity and report actionable issues. Checks for missing files, invalid configurations, inconsistent state, and orphaned plans. Optionally repairs auto-fixable issues.

## Step 1: Parse Arguments

Check if `--repair` flag is present in the command arguments:

```
REPAIR_FLAG=""
if arguments contain "--repair":
  REPAIR_FLAG="--repair"
```

## Step 2: Run Health Check

```bash
node "$GSD_TOOLS_PATH" validate health $REPAIR_FLAG
```

Parse JSON output:
- `status`: "healthy" | "degraded" | "broken"
- `errors[]`: Critical issues (code, message, fix, repairable)
- `warnings[]`: Non-critical issues
- `info[]`: Informational notes
- `repairable_count`: Number of auto-fixable issues
- `repairs_performed[]`: Actions taken if --repair was used

## Step 3: Format and Display Results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: HEALTHY | DEGRADED | BROKEN
Errors: N | Warnings: N | Info: N
```

**If repairs were performed:**
```
## Repairs Performed

- config.json: Created with defaults
- STATE.md: Regenerated from roadmap
```

**If errors exist:**
```
## Errors

- [E001] config.json: JSON parse error at line 5
  Fix: Run /gsd:health --repair to reset to defaults

- [E002] PROJECT.md not found
  Fix: Run /gsd:new-project to create
```

**If warnings exist:**
```
## Warnings

- [W001] STATE.md references phase 5, but only phases 1-3 exist
  Fix: Run /gsd:health --repair to regenerate

- [W005] Phase directory "1-setup" doesn't follow NN-name format
  Fix: Rename to match pattern (e.g., 01-setup)
```

**If info exists:**
```
## Info

- [I001] 02-implementation/02-01-PLAN.md has no SUMMARY.md
  Note: May be in progress
```

**Footer (if repairable issues exist and --repair was NOT used):**
```
---
N issues can be auto-repaired. Run: /gsd:health --repair
```

## Step 4: Offer Repair

**If repairable issues exist and --repair was NOT used:**

Ask user if they want to run repairs:

```
Would you like to run /gsd:health --repair to fix N issues automatically?
```

If yes, re-run with --repair flag and display results.

## Step 5: Verify Repairs

**If repairs were performed:**

Re-run health check without --repair to confirm issues are resolved:

```bash
node "$GSD_TOOLS_PATH" validate health
```

Report final status.

## Error Codes Reference

| Code | Severity | Description | Repairable |
|------|----------|-------------|------------|
| E001 | error | .planning/ directory not found | No |
| E002 | error | PROJECT.md not found | No |
| E003 | error | ROADMAP.md not found | No |
| E004 | error | STATE.md not found | Yes |
| E005 | error | config.json parse error | Yes |
| W001 | warning | PROJECT.md missing required section | No |
| W002 | warning | STATE.md references invalid phase | Yes |
| W003 | warning | config.json not found | Yes |
| W004 | warning | config.json invalid field value | No |
| W005 | warning | Phase directory naming mismatch | No |
| W006 | warning | Phase in ROADMAP but no directory | No |
| W007 | warning | Phase on disk but not in ROADMAP | No |
| I001 | info | Plan without SUMMARY (may be in progress) | No |

## Repair Actions Reference

| Action | Effect | Risk |
|--------|--------|------|
| createConfig | Create config.json with defaults | None |
| resetConfig | Delete + recreate config.json | Loses custom settings |
| regenerateState | Create STATE.md from ROADMAP structure | Loses session history |

**Not repairable (too risky):**
- PROJECT.md, ROADMAP.md content
- Phase directory renaming
- Orphaned plan cleanup

## Success Criteria

- [ ] --repair flag detected if present
- [ ] Health check run via gsd-tools
- [ ] Results formatted with status, errors, warnings, info
- [ ] Repair offer shown if repairable issues found and --repair not used
- [ ] Post-repair verification run if repairs were performed
