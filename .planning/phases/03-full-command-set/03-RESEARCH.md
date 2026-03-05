# Phase 3: Full Command Set - Research

**Researched:** 2026-03-05
**Domain:** OpenClaw SKILL.md authoring, GSD workflow porting, plugin-relative path resolution
**Confidence:** HIGH

## Summary

Phase 3 completes the plugin's command surface. Phase 2 delivered 4 core workflow commands (new-project, plan-phase, execute-phase, verify-work). Phase 3 must add the remaining 24 commands from the GSD help reference, fix a path-resolution defect in existing Phase 2 stage files, and ensure every SKILL.md has correct frontmatter.

The primary work is mechanical: for each of the ~20 remaining commands, create a SKILL.md in `skills/workflows/<command>/` that ports the corresponding GSD source workflow from `/Users/egorproskyrin/.claude/get-shit-done/workflows/<command>.md`. The porting pattern is already established and working — the main judgment calls are (1) which commands are genuinely useful to port vs. plugin-irrelevant (update, join-discord), and (2) which commands need embedded agent roles vs. are simple enough to be self-contained.

A critical defect was discovered during research: existing Phase 2 stage files (stage-planning.md, stage-executor.md, etc.) contain absolute paths like `/Users/egorproskyrin/.claude/get-shit-done/templates/summary.md` and `node /Users/egorproskyrin/.claude/get-shit-done/bin/gsd-tools.cjs`. These must be converted to plugin-relative paths (via `GSD_TOOLS_PATH` env var and plugin-bundled `templates/`/`references/` directories) to satisfy TMPL-03. Templates and references are already bundled identically in the plugin — the fix is purely path substitution in existing stage files.

**Primary recommendation:** Port all 26 GSD help-reference commands as SKILL.md files, skip `update` and `join-discord` (plugin-irrelevant), fix absolute paths in Phase 2 stage files to use plugin-relative references, and expand the `gsd:help` registerCommand handler in index.ts to list all 26 commands organized by the same stages as the GSD help reference.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMD-01 | All 24 GSD slash commands implemented as individual SKILL.md files in `skills/workflows/` | GSD help reference enumerates 28 commands in 14 stages; ~26 are plugin-relevant; 4 already exist from Phase 2; ~22 need creation |
| CMD-02 | Each SKILL.md has correct YAML frontmatter (name, description, user-invocable, os gating) | Established pattern from Phase 2: `name: gsd:<command>`, `user-invocable: true`, `os: ["darwin", "linux"]`; stage files use `user-invocable: false` |
| CMD-05 | `/gsd:help` command lists all registered commands organized by workflow stage without invoking LLM | `registerCommand` in index.ts already implements help as LLM-bypass; handler returns static `{ text: string }`; needs expansion to cover all 26 commands |
| TMPL-01 | All GSD planning templates bundled in `templates/` | ALREADY SATISFIED: plugin's `templates/` is an identical copy of GSD source templates; verified 26 files match exactly |
| TMPL-02 | All GSD reference docs bundled in `references/` | ALREADY SATISFIED: plugin's `references/` is an identical copy of GSD source references; verified 13 files match exactly |
| TMPL-03 | Workflow SKILL.md files reference bundled templates by plugin-relative path | DEFECT IN PHASE 2: stage files still use absolute paths (`/Users/egorproskyrin/.claude/...`); must be replaced with `$GSD_TOOLS_PATH` references for gsd-tools calls and plugin-bundled paths for template @-references |
</phase_requirements>

## Standard Stack

### Core
| Component | Version/Source | Purpose | Why Standard |
|-----------|---------------|---------|--------------|
| SKILL.md files | OpenClaw convention | User-invocable slash commands via LLM | Established in Phase 2; all workflow commands use this pattern |
| `registerCommand` in index.ts | Phase 1 pattern | LLM-bypass commands (gsd:help, gsd:status) | Only for commands that return static text without invoking the agent |
| GSD source workflows | `/Users/egorproskyrin/.claude/get-shit-done/workflows/` | Source of truth for command logic | Faithful port — not a redesign |
| `GSD_TOOLS_PATH` env var | Set by plugin service on startup | Runtime path to gsd-tools.cjs | Set in Phase 1; all shell calls use this |
| Plugin-bundled templates | `openclaw-plugin/templates/` | GSD planning templates for new projects | Identical copy of GSD source; already present |
| Plugin-bundled references | `openclaw-plugin/references/` | GSD reference docs used by workflow prompts | Identical copy of GSD source; already present |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| Stage SKILL.md files (`stage-*.md`) | Embed agent roles for complex multi-agent workflows | Only for commands that spawn sub-agents (audit-milestone, new-milestone, map-codebase) |
| Embedded agent roles (verbatim) | Self-contained agent context without file system dependency | Any stage that needs an agent role — copy verbatim from `~/.claude/agents/` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate SKILL.md per command | Single large SKILL.md with all commands | Separate files prevent loading conflicts; easier to audit per-command frontmatter |
| Absolute paths to gsd-tools | `$GSD_TOOLS_PATH` env var | Absolute paths are machine-specific and break cross-user portability |
| @-referencing templates from `~/.claude/get-shit-done/` | Plugin-bundled `templates/` | Plugin must be self-contained; GSD source is not guaranteed to exist on user machines |

## Architecture Patterns

### Recommended Project Structure

```
openclaw-plugin/
├── skills/workflows/
│   ├── new-project/          # Phase 2 — orchestrator + stage-*.md
│   ├── plan-phase/           # Phase 2 — orchestrator + stage-*.md
│   ├── execute-phase/        # Phase 2 — orchestrator + stage-*.md
│   ├── verify-work/          # Phase 2 — single SKILL.md
│   ├── discuss-phase/        # Phase 3 — single SKILL.md (no sub-agents)
│   ├── research-phase/       # Phase 3 — single SKILL.md
│   ├── list-phase-assumptions/ # Phase 3 — single SKILL.md
│   ├── map-codebase/         # Phase 3 — SKILL.md + stage (has agent)
│   ├── add-phase/            # Phase 3 — single SKILL.md
│   ├── insert-phase/         # Phase 3 — single SKILL.md
│   ├── remove-phase/         # Phase 3 — single SKILL.md
│   ├── progress/             # Phase 3 — single SKILL.md
│   ├── new-milestone/        # Phase 3 — single SKILL.md (mirrors new-project)
│   ├── complete-milestone/   # Phase 3 — single SKILL.md
│   ├── audit-milestone/      # Phase 3 — SKILL.md + stage (has agent)
│   ├── plan-milestone-gaps/  # Phase 3 — single SKILL.md
│   ├── resume-work/          # Phase 3 — single SKILL.md
│   ├── pause-work/           # Phase 3 — single SKILL.md
│   ├── debug/                # Phase 3 — single SKILL.md
│   ├── add-todo/             # Phase 3 — single SKILL.md
│   ├── check-todos/          # Phase 3 — single SKILL.md
│   ├── add-tests/            # Phase 3 — single SKILL.md
│   ├── health/               # Phase 3 — single SKILL.md
│   ├── settings/             # Phase 3 — single SKILL.md
│   ├── set-profile/          # Phase 3 — single SKILL.md
│   ├── quick/                # Phase 3 — single SKILL.md
│   └── cleanup/              # Phase 3 — single SKILL.md
└── src/index.ts              # gsd:help handler expanded with all commands
```

### Pattern 1: Simple Self-Contained SKILL.md (majority of commands)

**What:** Single SKILL.md with frontmatter + full workflow prompt body. No stage files. The LLM executes the workflow inline.

**When to use:** Commands that do not spawn sub-agents with distinct role prompts. This covers ~20 of the 26 commands.

**Example (discuss-phase):**
```yaml
---
name: gsd:discuss-phase
description: Capture implementation decisions for a phase before planning. Creates CONTEXT.md with locked decisions and open questions.
user-invocable: true
os: ["darwin", "linux"]
---

<purpose>
[verbatim from GSD source with absolute paths replaced]
</purpose>

<process>
[verbatim from GSD source — gsd-tools calls use $GSD_TOOLS_PATH]
</process>
```

### Pattern 2: Orchestrator + Stage SKILL.md (commands with sub-agents)

**What:** User-invocable orchestrator SKILL.md that @-references one or more stage-*.md files which embed agent roles verbatim. Established in Phase 2.

**When to use:** Commands that spawn a distinct agent role (e.g., audit-milestone spawns integration-checker; map-codebase spawns codebase-mapper).

**Example (audit-milestone orchestrator frontmatter):**
```yaml
---
name: gsd:audit-milestone
description: Audit milestone completion against original requirements. Aggregates phase verifications and runs integration checking.
user-invocable: true
os: ["darwin", "linux"]
---
```

**Stage file frontmatter:**
```yaml
---
name: gsd-audit-milestone-stage-check
description: Integration checking stage for /gsd:audit-milestone — internal use only
user-invocable: false
os: ["darwin", "linux"]
---
```

### Pattern 3: gsd:help LLM-bypass registerCommand (CMD-05)

**What:** The `gsd:help` command in `src/index.ts` uses `registerCommand` to return static text without invoking the LLM. The handler must be expanded to list all ~26 commands organized by the same stages as the GSD help reference.

**Current state:** Handler lists only 6 commands (new-project, discuss-phase, plan-phase, research-phase, execute-phase, verify-work, status).

**Target state:** Handler lists all 26 commands organized by 14 workflow stages matching the GSD help reference structure.

```typescript
// Source: src/index.ts pattern (Phase 1)
api.registerCommand({
  name: "gsd:help",
  description: "List all GSD commands organized by workflow stage",
  acceptsArgs: false,
  requireAuth: false,
  handler() {
    return {
      text: [
        "**GSD for OpenClaw** - Spec-driven development workflows",
        "",
        "**Project Initialization:**",
        "  /gsd:new-project           - Full initialization: research → requirements → roadmap",
        "  /gsd:map-codebase          - Generate architectural map of existing codebase",
        "",
        "**Phase Planning:**",
        "  /gsd:discuss-phase <N>     - Capture design decisions before planning",
        "  /gsd:research-phase <N>    - Research phase domain (niche/complex domains)",
        "  /gsd:list-phase-assumptions <N> - Preview Claude's intended approach",
        "  /gsd:plan-phase <N>        - Research + plan + verify for a phase",
        "",
        "**Execution:**",
        "  /gsd:execute-phase <N>     - Execute all plans in a phase",
        "",
        "**Quick Mode:**",
        "  /gsd:quick                 - Ad-hoc task with GSD guarantees",
        // ... all 14 stages
      ].join("\n"),
    };
  },
});
```

### Pattern 4: Plugin-Relative Path Replacement (TMPL-03 fix)

**What:** Replace all absolute paths in existing Phase 2 stage files with portable alternatives.

**Path types and replacements:**

| Absolute Path Pattern | Replace With |
|-----------------------|-------------|
| `node /Users/egorproskyrin/.claude/get-shit-done/bin/gsd-tools.cjs` | `node "$GSD_TOOLS_PATH"` |
| `@/Users/egorproskyrin/.claude/get-shit-done/templates/summary.md` | `@./templates/summary.md` (plugin-relative) OR embed inline |
| `@/Users/egorproskyrin/.claude/get-shit-done/workflows/execute-plan.md` | Inline the content or @-reference from plugin |
| `@/Users/egorproskyrin/.claude/agents/gsd-*.md` | Already handled via verbatim embedding — no path reference needed |

**Affected files confirmed:**
- `openclaw-plugin/skills/workflows/plan-phase/stage-planning.md` — has absolute paths to templates/summary.md and gsd-tools.cjs
- Other stage files may have the same issue — scan required

**Note on @-reference resolution:** OpenClaw resolves `@./` paths relative to the SKILL.md file location. For plugin-bundled templates, the path would be something like `@../../templates/summary.md` from within `skills/workflows/plan-phase/`. The exact resolution mechanism needs verification — if relative @-paths from skills/ subdirs don't resolve to plugin root, consider inlining template content instead.

### Anti-Patterns to Avoid

- **Absolute paths in SKILL.md prompts:** Use `$GSD_TOOLS_PATH` for tool calls; use relative @-paths or inline for template content. Machine-specific paths break portability.
- **user-invocable: true on stage files:** Stage files must have `user-invocable: false` — they are internal to orchestrators, not user-facing.
- **Missing os gating:** Every SKILL.md (orchestrator and stage) must include `os: ["darwin", "linux"]` — omitting this field causes silent load failure on target platforms.
- **Referencing ~/.claude/get-shit-done/ from plugin:** The GSD source location is not guaranteed to exist on user machines; the plugin must be self-contained using its own bundled templates/ and references/.
- **Porting update and join-discord:** These are GSD maintenance commands that operate on the Claude Code installation, not the user's project. They are not portable to the plugin context and should be omitted.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command listing without LLM | Custom mechanism | `registerCommand` with static `{ text }` return | Already established pattern in index.ts |
| Template file bundling | Custom copy mechanism | Templates already bundled identically — confirmed match | 26 template files match GSD source exactly |
| Reference file bundling | Custom copy mechanism | References already bundled identically — confirmed match | 13 reference files match GSD source exactly |
| Workflow logic | Custom reimplementation | Port verbatim from GSD source workflows | Out of scope: "Modifying GSD core logic or workflows" |

**Key insight:** Templates and references are already correctly bundled (TMPL-01, TMPL-02 are already satisfied). The only template work needed is updating the path references in SKILL.md files to point to the plugin-bundled copies instead of the GSD source installation.

## Common Pitfalls

### Pitfall 1: Absolute Path Portability
**What goes wrong:** Stage files reference `/Users/egorproskyrin/.claude/get-shit-done/...` — works on the developer's machine but fails for any other user.
**Why it happens:** Phase 2 ported workflow content verbatim including its absolute paths, which was correct as a quick port but not a final state.
**How to avoid:** Replace all absolute path references: `node $GSD_TOOLS_PATH` for gsd-tools calls; plugin-relative `@`-paths or inline content for templates.
**Warning signs:** `grep -r '/Users/' skills/` returns hits in stage files.

### Pitfall 2: @-Reference Resolution from Subdirectories
**What goes wrong:** `@./templates/summary.md` from within `skills/workflows/plan-phase/stage-planning.md` may resolve relative to the stage file's directory, not the plugin root.
**Why it happens:** OpenClaw's @-reference resolution behavior in subdirectory SKILL.md files is not documented in the research sources found.
**How to avoid:** Either (a) verify the resolution behavior against OpenClaw docs/source, or (b) inline the template content directly in stage files rather than @-referencing it. Inlining is the safer approach given uncertainty.
**Warning signs:** @-reference to `../../templates/` fails silently when skill is invoked.

### Pitfall 3: Frontmatter Field Omission Causes Silent Failure
**What goes wrong:** A SKILL.md without `os: ["darwin", "linux"]` loads inconsistently — may work in development but fail in production or on different OS configurations.
**Why it happens:** OpenClaw may silently skip loading skills without OS gating on platforms where the field is expected.
**How to avoid:** Every SKILL.md — both orchestrators and stage files — must include `os: ["darwin", "linux"]`. Add a grep verification step in the plan.
**Warning signs:** A command doesn't appear in OpenClaw's skill list despite file existing.

### Pitfall 4: settings.md Uses AskUserQuestion
**What goes wrong:** The GSD source `settings.md` workflow uses `AskUserQuestion` for interactive configuration. This violates CMD-04 (all commands default to `--auto` mode).
**Why it happens:** settings.md is inherently interactive — it presents toggles and model profiles for the user to select.
**How to avoid:** Port settings.md with a fallback: if `AskUserQuestion` is unavailable, read current `.planning/config.json` and report current settings with instructions to edit manually. Alternatively, use a simplified `registerCommand` handler (LLM-bypass) that returns the current config as formatted text.
**Warning signs:** settings.md invocation hangs or errors when AskUserQuestion is not available.

### Pitfall 5: Counting "24" Commands
**What goes wrong:** The requirement says "24 GSD slash commands" but the GSD help reference lists 28 commands across 14 stages.
**Why it happens:** The count of 24 may have been an approximation at requirements-writing time. The authoritative list is the GSD help reference.
**How to avoid:** Port all commands that appear in the GSD help reference `**\`/gsd:` patterns, minus `update` and `join-discord` which are plugin-irrelevant. The final count will be approximately 26.
**Warning signs:** Treating "24" as a hard constraint that requires omitting legitimate commands.

## Code Examples

### Correct SKILL.md frontmatter (orchestrator)
```yaml
---
name: gsd:discuss-phase
description: Capture implementation decisions for a phase before planning. Creates CONTEXT.md with locked decisions and open questions.
user-invocable: true
os: ["darwin", "linux"]
---
```

### Correct SKILL.md frontmatter (stage — internal only)
```yaml
---
name: gsd-audit-milestone-stage-check
description: Integration checking stage for /gsd:audit-milestone — internal use only
user-invocable: false
os: ["darwin", "linux"]
---
```

### Correct gsd-tools call in SKILL.md body
```bash
# Use $GSD_TOOLS_PATH, not absolute path
INIT=$(node "$GSD_TOOLS_PATH" init discuss-phase "${PHASE}")
```

### Verifying no absolute paths remain
```bash
grep -r '/Users/' openclaw-plugin/skills/ --include='*.md'
# Must return zero hits after Phase 3 is complete
```

### Verifying all SKILL.md have required frontmatter fields
```bash
for f in $(find openclaw-plugin/skills -name 'SKILL.md'); do
  echo "=== $f ==="
  grep -E 'name:|user-invocable:|os:' "$f"
done
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Absolute paths in stage files | Plugin-relative paths via $GSD_TOOLS_PATH | Phase 3 | Makes plugin portable across machines |
| 4 core commands only | All 26 user-facing commands | Phase 3 | Plugin is functionally complete for daily use |
| Partial gsd:help listing | Complete 14-stage command listing | Phase 3 | Users can discover all available commands |

**Deprecated/outdated:**
- Absolute path `node /Users/egorproskyrin/.claude/get-shit-done/bin/gsd-tools.cjs` in stage files — replaced by `node "$GSD_TOOLS_PATH"` from Phase 3 onward
- `@/Users/egorproskyrin/.claude/get-shit-done/workflows/execute-plan.md` reference in stage-planning.md — replaced by inlined content or plugin-relative @-path

## Open Questions

1. **@-reference resolution from subdirectories**
   - What we know: OpenClaw resolves `@./` references in SKILL.md files; Phase 2 orchestrators use `@./stage-*.md` successfully (same directory)
   - What's unclear: Whether `@../../templates/summary.md` resolves correctly from `skills/workflows/plan-phase/` to the plugin root `templates/` directory
   - Recommendation: Default to inlining template content in the first plan; add a verification task to test @-path resolution from subdirectories

2. **settings.md AskUserQuestion dependency**
   - What we know: GSD source settings.md uses AskUserQuestion; CMD-04 requires `--auto` mode; OpenClaw's AskUserQuestion compatibility is untested
   - What's unclear: Whether OpenClaw surfaces AskUserQuestion to the user or errors silently
   - Recommendation: Port settings.md as a `registerCommand` LLM-bypass that reads and displays current config.json; defer interactive settings to Phase 4 if needed

3. **Exact count of user-relevant commands**
   - What we know: GSD help reference has 28 commands; `update` and `join-discord` are maintenance commands that don't make sense in a plugin context; `add-tests` appears in the GSD source but not in the help reference `**` headers
   - What's unclear: Whether `add-tests` should be included (it's in `~/.claude/get-shit-done/workflows/` but not in the help reference bold-header list)
   - Recommendation: Include `add-tests` since it exists in the source; omit `update` and `join-discord`; document the final count in the plan

## Sources

### Primary (HIGH confidence)
- Direct filesystem inspection of `/Users/egorproskyrin/.claude/get-shit-done/workflows/` — 33 workflow files enumerated
- Direct inspection of `/Users/egorproskyrin/.claude/get-shit-done/workflows/help.md` — 28 bold-header commands across 14 stages (authoritative command list)
- Direct inspection of plugin `templates/` and `references/` vs GSD source — exact match confirmed (TMPL-01, TMPL-02 already satisfied)
- Direct inspection of existing Phase 2 stage files — absolute path defect confirmed in `stage-planning.md`
- Direct inspection of `src/index.ts` — current `gsd:help` handler lists only 6 commands; needs expansion

### Secondary (MEDIUM confidence)
- Phase 2 PLAN.md (02-02-PLAN.md) — establishes orchestrator+stage pattern, frontmatter conventions, agent embedding approach
- STATE.md decisions log — confirms Phase 2 architectural decisions that constrain Phase 3

### Tertiary (LOW confidence)
- @-reference resolution behavior from subdirectories — inferred from Phase 2 patterns; not verified against OpenClaw SDK documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components verified by direct filesystem inspection
- Architecture: HIGH — patterns established and working from Phase 2; Phase 3 follows same conventions
- Pitfalls: HIGH for absolute path issue (confirmed defect), MEDIUM for @-reference resolution (inferred, not verified)

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable conventions, low churn risk)
