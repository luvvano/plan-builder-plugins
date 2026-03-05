# Phase 4: Telegram Utility Aliases — Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Register 8 utility GSD commands as `gsd_*` underscore aliases via `api.registerCommand` in `src/index.ts`. Each handler executes logic directly — no AI, no SKILL.md dispatch, instant Telegram response.

Commands in scope: `gsd_status`, `gsd_progress`, `gsd_help`, `gsd_health`, `gsd_settings`, `gsd_update`, `gsd_project_list`, `gsd_cleanup`

Out of scope for this phase: workflow commands (gsd_quick, gsd_plan_phase, etc.) — those are Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Response Format
- Use **Telegram HTML mode** — `<b>`, `<code>`, `<pre>` tags
- No markdown tables (Telegram doesn't render them)
- Progress bars: `<code>[████████░░] 80%</code>` + structured list
- Max response length: 4096 chars (Telegram limit), truncate with note if exceeded

### Handler Architecture
- Each handler **directly executes the logic inline** — no SKILL.md dispatch, no AI
- All shell calls via `execSync` + `node gsd-tools.cjs` subcommands already available
- Handler pattern:
  ```ts
  handler(args) {
    const result = execSync(`node "${toolsPath}" <subcommand>`, { encoding: "utf8" });
    return { text: formatHtml(JSON.parse(result)) };
  }
  ```
- `gsd_update`: git pull → rsync → gateway restart — all inline via `execSync`
- `gsd_project_list`: calls `node gsd-tools.cjs project-list [action] [arg]` directly

### gsd_help Content
- Shows **`gsd_*` Telegram aliases** only — what actually works in Telegram
- Format: `<b>/gsd_quick</b> <description>` per command
- Grouped by category (same structure as existing gsd:help)
- Does NOT show `gsd:*` colon-style names (they don't work in Telegram)

### Error Handling (No GSD Project)
- **Detailed message** when `.planning/` not found:
  ```
  ⚠️ No GSD project found.

  Current directory: <code>/path/to/cwd</code>

  To start a new project here:
  /gsd_new_project

  Or navigate to an existing GSD project directory first.
  ```
- Show `process.cwd()` so user understands context
- Always include actionable next step

### Claude's Discretion
- Exact HTML structure of each command's output (within the HTML mode constraint)
- Whether to use `<pre>` vs `<code>` for code blocks per command
- gsd_health and gsd_cleanup output formatting (run the gsd-tools command, format the JSON output sensibly)

</decisions>

<specifics>
## Specific Implementation Notes

- All handlers use same pattern: `execSync(gsd-tools subcommand)` → parse JSON → format HTML
- `gsd_update` is the most complex — git + rsync + gateway restart, all inline
- `gsd_project_list` needs to handle 3 sub-actions: `list` (default), `add [path]`, `remove <name>`
  - Parse from `args`: first token = action, rest = path/name
- `gsd_settings` reads `.planning/config.json` directly, no gsd-tools needed
- `gsd_cleanup` — run `gsd-tools cleanup` equivalent or equivalent shell logic

</specifics>

<deferred>
## Deferred Ideas

- Telegram `setMyCommands` registration (bot command autocomplete menu) — noted for Phase 5 or separate quick task
- `gsd_update` confirmation prompt before restarting gateway — could be added later

</deferred>

---

*Phase: 04-telegram-utility-aliases*
*Context gathered: 2026-03-05*
