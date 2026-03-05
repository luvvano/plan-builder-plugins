---
phase: 03-full-command-set
plan: 01
subsystem: infra
tags: [portability, gsd-tools, stage-files, plan-phase, absolute-paths]

requires:
  - phase: 02-core-workflows
    provides: Phase 2 stage files (stage-planning, stage-research, stage-verification, stage-executor, stage-setup, stage-roadmap, stage-verify) that this plan fixes

provides:
  - Portable stage files with no machine-specific absolute paths
  - All gsd-tools.cjs calls use node "$GSD_TOOLS_PATH" in plan-phase stage files
  - TMPL-01 confirmed: templates/ directory has 36 files matching GSD source
  - TMPL-02 confirmed: references/ directory has 13 files matching GSD source

affects: [03-full-command-set, any user installing the plugin on a non-developer machine]

tech-stack:
  added: []
  patterns:
    - "Use node \"$GSD_TOOLS_PATH\" instead of absolute node path for gsd-tools.cjs calls"
    - "Remove machine-specific @-references from PLAN templates; stage-executor.md is self-contained"

key-files:
  created: []
  modified:
    - openclaw-plugin/skills/workflows/plan-phase/stage-planning.md
    - openclaw-plugin/skills/workflows/plan-phase/stage-research.md
    - openclaw-plugin/skills/workflows/plan-phase/stage-verification.md

key-decisions:
  - "Replace absolute gsd-tools.cjs paths with node \"$GSD_TOOLS_PATH\" across all plan-phase stage files"
  - "Remove absolute @-references from PLAN.md template in stage-planning.md; add comment noting stage-executor.md is self-contained"
  - "TMPL-01 and TMPL-02 confirmed satisfied: 36 templates and 13 references files match GSD source exactly"

patterns-established:
  - "All gsd-tools calls in stage files: node \"$GSD_TOOLS_PATH\" <subcommand>"
  - "No absolute paths in any file under openclaw-plugin/skills/workflows/"

requirements-completed: [TMPL-01, TMPL-02, TMPL-03]

duration: 3min
completed: 2026-03-05
---

# Phase 3 Plan 01: Portable Path Replacement in Stage Files Summary

**Replaced 15 absolute path occurrences across 3 plan-phase stage files with `node "$GSD_TOOLS_PATH"`, and confirmed templates/ (36 files) and references/ (13 files) match GSD source exactly**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T07:54:31Z
- **Completed:** 2026-03-05T07:57:48Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Removed all 15 absolute path references (`/Users/egorproskyrin/.claude/get-shit-done/bin/gsd-tools.cjs`) from stage-planning.md, stage-research.md, and stage-verification.md
- Replaced all gsd-tools.cjs calls with portable `node "$GSD_TOOLS_PATH"` syntax
- Removed absolute @-references to execute-plan.md and summary.md from PLAN template in stage-planning.md; replaced with a comment noting stage-executor.md is self-contained
- Confirmed TMPL-01: 36 template files in plugin match GSD source count exactly
- Confirmed TMPL-02: 13 reference files in plugin match GSD source count exactly
- Confirmed TMPL-03: Zero absolute paths remain anywhere in openclaw-plugin/skills/workflows/

## Task Commits

1. **Task 1: Replace absolute paths in all Phase 2 stage files** - `9cdc101` (fix)
2. **Task 2: Verify templates and references directories** - no commit (verification-only, no changes needed)

## Files Created/Modified

- `openclaw-plugin/skills/workflows/plan-phase/stage-planning.md` - 7 absolute path occurrences replaced (6 gsd-tools calls + 2 @-references removed)
- `openclaw-plugin/skills/workflows/plan-phase/stage-research.md` - 3 absolute path occurrences replaced with GSD_TOOLS_PATH
- `openclaw-plugin/skills/workflows/plan-phase/stage-verification.md` - 5 absolute path occurrences replaced with GSD_TOOLS_PATH

## Decisions Made

- Removed the @-references in the PLAN.md template (`<execution_context>` block) entirely rather than trying to use `$GSD_HOME`-prefixed paths, because `@` references do not support shell variable expansion. Since stage-executor.md already has all execution logic embedded verbatim, the references are not needed.
- The 4 other stage files (stage-executor.md, stage-setup.md, stage-roadmap.md, stage-verify.md) had no absolute paths — only the 3 plan-phase stages required changes.

## Deviations from Plan

None - plan executed exactly as written. The only clarification was that stage-executor.md, stage-setup.md, stage-roadmap.md, and stage-verify.md had zero absolute paths already, so only the 3 plan-phase stage files required edits.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Plan 03-02 (next plan in Phase 3: full command set).

---
*Phase: 03-full-command-set*
*Completed: 2026-03-05*
