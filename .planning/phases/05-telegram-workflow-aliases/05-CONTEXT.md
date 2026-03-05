# Phase 5: Telegram Workflow Aliases — Context

**Gathered:** 2026-03-05  
**Status:** Ready for planning

<domain>
## Phase Boundary

Register 17 GSD workflow commands as Telegram-compatible `gsd_*` underscore aliases. Each alias fully mirrors the corresponding `gsd:*` SKILL.md workflow. Users in Telegram can invoke any GSD workflow command without switching to the main chat session. Also register all 26 `gsd_*` commands in the Telegram bot command menu via `setMyCommands`.

Out of scope: changing workflow logic, adding new workflows, modifying Phase 4 utility handlers.
</domain>

<decisions>
## Implementation Decisions

### Dispatch Mechanism
- **Variant B selected**: 17 separate SKILL.md wrapper files, one per workflow command
- Each wrapper is a **full content copy** (B2) of the original `gsd:*` SKILL.md — not a thin redirect
- Rationale: full copy is most reliable; no dependency on LLM correctly interpreting a delegation instruction; workflow runs identically to the original
- `$ARGUMENTS` flows naturally through SKILL.md execution — no special arg-passing logic needed

### File Location
- Path pattern: `skills/telegram-aliases/<command-slug>/SKILL.md`
- Example: `skills/telegram-aliases/discuss-phase/SKILL.md`
- Separate `telegram-aliases/` directory keeps wrappers isolated from originals in `skills/workflows/`

### Command Naming
- SKILL.md `name` field: `gsd_discuss_phase` (underscore, no hyphens)
- Maps to original: `gsd:discuss-phase` (colon + hyphens)
- Conversion rule: replace `:` with `_`, replace `-` with `_`

### Telegram Bot Menu (setMyCommands)
- Register all 26 `gsd_*` commands (8 utility + 17 workflow + 1 help) via Telegram Bot API `setMyCommands` on plugin startup
- Triggered from `gateway_start` hook in `src/index.ts`
- Provides autocomplete in Telegram when user types `/gsd_`
- Command descriptions from existing `registerCommand` definitions (utility) and SKILL.md descriptions (workflow)

### Arguments Handling
- Telegram delivers args as raw string after the command: `/gsd_plan_phase 3 --skip-research` → `ctx.args = "3 --skip-research"`
- For workflow SKILL.md invocations (not registerCommand): `$ARGUMENTS` receives the full args string from OpenClaw's skill invocation
- No special parsing needed — SKILL.md workflows already handle their own argument parsing

### Claude's Discretion
- Order of commands in `setMyCommands` list — alphabetical or grouped by category
- How to handle `setMyCommands` API errors (log + continue, don't crash gateway start)
- Whether to include short descriptions or full descriptions in bot menu (Telegram limits to 256 chars per description)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/index.ts`: existing `gateway_start` hook pattern (if any) or `api.on("gateway_start", ...)` for setMyCommands call
- `bin/gsd-tools.cjs`: not relevant for SKILL.md wrappers
- `skills/workflows/*/SKILL.md`: source files to copy content from (17 files)

### Established Patterns
- Phase 4 `registerCommand` handlers: utility commands, direct execSync, no AI — NOT the pattern for Phase 5
- SKILL.md frontmatter: `name`, `description`, `user-invocable: true`, `os: ["darwin", "linux"]`
- Plugin SDK: `api.on("gateway_start", handler)` — fires once on gateway startup, good for setMyCommands registration
- `PluginCommandContext.args` — raw string, available in registerCommand handlers

### Integration Points
- `setMyCommands` requires Telegram Bot Token — available via existing Telegram channel config in OpenClaw
- All 26 command names already defined: 8 in `registerCommand` + 17 new wrappers + `gsd_help`
- `skills/telegram-aliases/` directory will be new, needs to exist before gateway reads it

</code_context>

<specifics>
## Specific Implementation Notes

### The 17 Workflow Commands to Create
| Telegram alias | Source SKILL.md | Has args |
|---|---|---|
| `gsd_quick` | `skills/workflows/quick/` | yes — description |
| `gsd_new_project` | `skills/workflows/new-project/` | no |
| `gsd_plan_phase` | `skills/workflows/plan-phase/` | yes — N |
| `gsd_execute_phase` | `skills/workflows/execute-phase/` | yes — N |
| `gsd_discuss_phase` | `skills/workflows/discuss-phase/` | yes — N |
| `gsd_verify_work` | `skills/workflows/verify-work/` | optional — N |
| `gsd_add_phase` | `skills/workflows/add-phase/` | yes — desc |
| `gsd_insert_phase` | `skills/workflows/insert-phase/` | yes — N desc |
| `gsd_remove_phase` | `skills/workflows/remove-phase/` | yes — N |
| `gsd_new_milestone` | `skills/workflows/new-milestone/` | yes — version |
| `gsd_complete_milestone` | `skills/workflows/complete-milestone/` | yes — version |
| `gsd_resume_work` | `skills/workflows/resume-work/` | no |
| `gsd_pause_work` | `skills/workflows/pause-work/` | no |
| `gsd_debug` | `skills/workflows/debug/` | optional — issue |
| `gsd_add_todo` | `skills/workflows/add-todo/` | yes — desc |
| `gsd_check_todos` | `skills/workflows/check-todos/` | no |
| `gsd_audit_milestone` | `skills/workflows/audit-milestone/` | optional — version |
| `gsd_add_tests` | `skills/workflows/add-tests/` | no |

(18 total — REQUIREMENTS.md has TEL-11 through TEL-27 = 17; `gsd_remove_phase` + `gsd_insert_phase` were in help text but not in TEL list — include both)

### setMyCommands payload structure
```json
{
  "commands": [
    {"command": "gsd_status", "description": "Show GSD project status"},
    {"command": "gsd_progress", "description": "Show phase progress"},
    ...all 26+
  ]
}
```
Telegram Bot API endpoint: `POST https://api.telegram.org/bot{TOKEN}/setMyCommands`

</specifics>

<deferred>
## Deferred Ideas

- `setMyCommands` with scope per chat type (BotCommandScopeAllPrivateChats vs BotCommandScopeDefault) — keep default scope for now
- `gsd_list_phase_assumptions`, `gsd_research_phase`, `gsd_map_codebase` — mentioned in help text but no source SKILL.md found yet; skip in Phase 5, add to backlog
- `gsd_set_profile` — mentioned in help but needs investigation; defer
- Localization of command descriptions (Russian) — out of scope for v1.1

</deferred>

---

*Phase: 05-telegram-workflow-aliases*  
*Context gathered: 2026-03-05*
