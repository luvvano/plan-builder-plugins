---
name: gsd:add-tests
description: Add test coverage for specified code areas following project testing conventions.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:add-tests

Generate unit and E2E tests for a completed phase based on its SUMMARY.md, CONTEXT.md, and implementation. Classifies each changed file into TDD (unit), E2E (browser), or Skip categories, presents a test plan for confirmation, then generates tests following RED-GREEN conventions.

## Step 1: Parse Arguments

Parse `$ARGUMENTS` for:
- Phase number (integer, decimal, or letter-suffix) → store as `$PHASE_ARG`
- Remaining text after phase number → store as `$EXTRA_INSTRUCTIONS` (optional)

Example: `/gsd:add-tests 12 focus on edge cases` → `$PHASE_ARG=12`, `$EXTRA_INSTRUCTIONS="focus on edge cases"`

If no phase argument provided:

```
ERROR: Phase number required
Usage: /gsd:add-tests <phase> [additional instructions]
Example: /gsd:add-tests 12
Example: /gsd:add-tests 12 focus on edge cases in the pricing module
```

Exit.

## Step 2: Initialize

Load phase operation context:

```bash
GSD_TOOLS_PATH="${GSD_TOOLS_PATH:-$(node -e "console.log(require('path').join(import.meta.dirname || __dirname, '..', '..', 'bin', 'gsd-tools.cjs'))")}"
INIT=$(node "$GSD_TOOLS_PATH" init phase-op "${PHASE_ARG}")
```

Extract from init JSON: `phase_dir`, `phase_number`, `phase_name`.

Verify the phase directory exists. If not, report error and exit.

Read the phase artifacts (in order of priority):
1. `${phase_dir}/*-SUMMARY.md` — what was implemented, files changed
2. `${phase_dir}/CONTEXT.md` — acceptance criteria, decisions
3. `${phase_dir}/*-VERIFICATION.md` — user-verified scenarios (if UAT was done)

If no SUMMARY.md exists:

```
ERROR: No SUMMARY.md found for phase ${PHASE_ARG}
This command works on completed phases. Run /gsd:execute-phase first.
```

Exit.

Present banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ADD TESTS — Phase ${phase_number}: ${phase_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 3: Analyze Implementation

Extract the list of files modified by the phase from SUMMARY.md.

For each file, classify into one of three categories:

| Category | Criteria | Test Type |
|----------|----------|-----------|
| **TDD** | Pure functions where `expect(fn(input)).toBe(output)` is writable | Unit tests |
| **E2E** | UI behavior verifiable by browser automation | Playwright/E2E tests |
| **Skip** | Not meaningfully testable or already covered | None |

**TDD classification — apply when:**
- Business logic: calculations, pricing, tax rules, validation
- Data transformations: mapping, filtering, aggregation, formatting
- Parsers: CSV, JSON, XML, custom format parsing
- Validators: input validation, schema validation, business rules
- State machines: status transitions, workflow steps
- Utilities: string manipulation, date handling, number formatting

**E2E classification — apply when:**
- Keyboard shortcuts: key bindings, modifier keys, chord sequences
- Navigation: page transitions, routing, breadcrumbs, back/forward
- Form interactions: submit, validation errors, field focus, autocomplete
- Selection: row selection, multi-select, shift-click ranges
- Drag and drop: reordering, moving between containers
- Modal dialogs: open, close, confirm, cancel
- Data grids: sorting, filtering, inline editing, column resize

**Skip classification — apply when:**
- UI layout/styling: CSS classes, visual appearance, responsive breakpoints
- Configuration: config files, environment variables, feature flags
- Glue code: dependency injection setup, middleware registration, routing tables
- Migrations: database migrations, schema changes
- Simple CRUD: basic create/read/update/delete with no business logic
- Type definitions: records, DTOs, interfaces with no logic

Read each file to verify classification. Do not classify based on filename alone.

## Step 4: Present Classification

Present the classification to the user for confirmation:

```
## Files classified for testing

### TDD (Unit Tests) — {N} files
{list of files with brief reason}

### E2E (Browser Tests) — {M} files
{list of files with brief reason}

### Skip — {K} files
{list of files with brief reason}

{if $EXTRA_INSTRUCTIONS: "Additional instructions: ${EXTRA_INSTRUCTIONS}"}

How would you like to proceed?
- Approve and generate test plan
- Adjust classification (I'll specify changes)
- Cancel
```

Ask conversationally — do NOT use AskUserQuestion. Wait for the user's next message.

If user wants to adjust: apply their changes and re-present.
If user says cancel: exit gracefully.

## Step 5: Discover Test Structure

Before generating the test plan, discover the project's existing test structure:

```bash
# Find existing test directories
find . -type d -name "*test*" -o -name "*spec*" -o -name "*__tests__*" 2>/dev/null | head -20
# Find existing test files for convention matching
find . -type f \( -name "*.test.*" -o -name "*.spec.*" \) 2>/dev/null | head -20
# Check for test runners
ls package.json *.sln 2>/dev/null
```

Identify:
- Test directory structure (where unit tests live, where E2E tests live)
- Naming conventions (`.test.ts`, `.spec.ts`, etc.)
- Test runner commands
- Test framework (Jest, Playwright, xUnit, etc.)

If test structure is ambiguous, ask conversationally where to create tests.

## Step 6: Generate Test Plan

For each approved file, create a detailed test plan.

**For TDD files**, plan tests following RED-GREEN-REFACTOR:
1. Identify testable functions/methods in the file
2. For each function: list input scenarios, expected outputs, edge cases
3. Note: since code already exists, tests may pass immediately — verify they test the RIGHT behavior

**For E2E files**, plan tests following RED-GREEN gates:
1. Identify user scenarios from CONTEXT.md/VERIFICATION.md
2. For each scenario: describe the user action, expected outcome, assertions

Present the complete test plan:

```
## Test Generation Plan

### Unit Tests ({N} tests across {M} files)
{for each file: test file path, list of test cases}

### E2E Tests ({P} tests across {Q} files)
{for each file: test file path, list of test scenarios}

### Test Commands
- Unit: {discovered test command}
- E2E: {discovered e2e command}

Ready to generate?
```

Ask conversationally: "Approve, cherry-pick (I'll specify which), or adjust plan?"

## Step 7: Execute TDD Generation

For each approved TDD test:

1. **Create test file** following discovered project conventions (directory, naming, imports)

2. **Write test** with clear arrange/act/assert structure:
   ```
   // Arrange — set up inputs and expected outputs
   // Act — call the function under test
   // Assert — verify the output matches expectations
   ```

3. **Run the test:**
   ```bash
   {discovered test command}
   ```

4. **Evaluate result:**
   - **Test passes**: Verify it checks meaningful behavior (not just that it compiles)
   - **Test fails with assertion error**: Flag as potential bug — do NOT fix the implementation:
     ```
     Potential bug found: {test name}
     Expected: {expected}
     Actual: {actual}
     File: {implementation file}
     ```
   - **Test fails with error (import, syntax, etc.)**: Fix the test error and re-run

## Step 8: Execute E2E Generation

For each approved E2E test:

1. **Check for existing tests** covering the same scenario:
   ```bash
   grep -r "{scenario keyword}" {e2e test directory} 2>/dev/null
   ```
   If found, extend rather than duplicate.

2. **Create test file** targeting the user scenario from CONTEXT.md/VERIFICATION.md

3. **Run the E2E test:**
   ```bash
   {discovered e2e command}
   ```

4. **Evaluate result:**
   - **GREEN (passes)**: Record success
   - **RED (fails)**: Determine if test issue or genuine application bug. Flag bugs.
   - **Cannot run**: Report blocker. Do NOT mark as complete:
     ```
     E2E blocker: {reason tests cannot run}
     ```

**No-skip rule:** If E2E tests cannot execute, report the blocker and mark the test as incomplete. Never mark success without actually running the test.

## Step 9: Summary and Commit

Create a test coverage report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► TEST GENERATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Results

| Category | Generated | Passing | Failing | Blocked |
|----------|-----------|---------|---------|---------|
| Unit     | {N}       | {n1}    | {n2}    | {n3}    |
| E2E      | {M}       | {m1}    | {m2}    | {m3}    |

## Files Created/Modified
{list of test files with paths}

## Coverage Gaps
{areas that couldn't be tested and why}

## Bugs Discovered
{any assertion failures that indicate implementation bugs}
```

If there are passing tests to commit:

```bash
git add {test files}
git commit -m "test(phase-${phase_number}): add unit and E2E tests from add-tests command"
```

Present next steps:

```
---

## ▶ Next Up

{if bugs discovered:}
**Fix discovered bugs:** `/gsd:quick fix the {N} test failures discovered in phase ${phase_number}`

{if blocked tests:}
**Resolve test blockers:** {description of what's needed}

{otherwise:}
**All tests passing!** Phase ${phase_number} is fully tested.

---

**Also available:**
- `/gsd:add-tests {next_phase}` — test another phase
- `/gsd:verify-work {phase_number}` — run UAT verification
```
