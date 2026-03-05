# Requirements: GSD for OpenClaw

**Defined:** 2026-03-04
**Core Value:** OpenClaw users can run the full GSD spec-driven development workflow with the same quality as Claude Code users

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: Plugin has valid `openclaw.plugin.json` manifest that loads in OpenClaw >=2026.2.3-1
- [ ] **FOUND-02**: Plugin `package.json` declares openclaw as peerDependency (not workspace:*)
- [ ] **FOUND-03**: gsd-tools.cjs is bundled inside the plugin and path-resolved at runtime via `import.meta.dirname`
- [ ] **FOUND-04**: GSD_TOOLS_PATH environment variable is set by the plugin service on startup
- [ ] **FOUND-05**: Command naming convention is validated (colon vs hyphen) with a test registration before full port
- [ ] **FOUND-06**: One end-to-end workflow (e.g., new-project) works as proof of the orchestration pattern

### Commands

- [x] **CMD-01**: All 24 GSD slash commands are implemented as individual SKILL.md files in `skills/workflows/`
- [x] **CMD-02**: Each SKILL.md has correct YAML frontmatter (name, description, user-invocable, os gating)
- [x] **CMD-03**: Core 4 commands work end-to-end: new-project, plan-phase, execute-phase, verify-work
- [x] **CMD-04**: All commands default to `--auto` mode (no AskUserQuestion dependency)
- [x] **CMD-05**: `/gsd:help` command lists all registered commands organized by workflow stage

### Agents

- [x] **AGNT-01**: All 10+ GSD agent roles are implemented as SKILL.md files in `skills/agents/`
- [x] **AGNT-02**: Agent SKILL.md files contain the full role system prompt from the original GSD agent definitions
- [x] **AGNT-03**: Workflow SKILL.md files can inline-inject agent SKILL.md content for orchestration

### Orchestration

- [x] **ORCH-01**: Workflow orchestration works via inline agent context injection (replacing Claude Code's Task() primitive)
- [x] **ORCH-02**: Execute-phase uses sequential wave execution with wave-state.json tracking
- [x] **ORCH-03**: Interrupted workflows are resumable by reading wave-state.json
- [x] **ORCH-04**: State queries (phase status, config reads) are registered as `registerTool()` entries returning structured JSON

### Templates and References

- [x] **TMPL-01**: All GSD planning templates (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, etc.) are bundled in `templates/`
- [x] **TMPL-02**: All GSD reference docs (questioning.md, ui-brand.md, etc.) are bundled in `references/`
- [x] **TMPL-03**: Workflow SKILL.md files reference bundled templates by plugin-relative path

### Lifecycle Services

- [ ] **LIFE-01**: Plugin service runs update check on startup via `gateway:startup` event
- [ ] **LIFE-02**: Context monitoring service uses `agent:bootstrap` event for context injection
- [ ] **LIFE-03**: All skills and hooks include `os: ["darwin", "linux"]` gating

### Distribution

- [ ] **DIST-01**: Plugin is installable via ClawHub (`clawhub install` compatible)
- [ ] **DIST-02**: Plugin is installable via manual copy to `~/.openclaw/extensions/`
- [ ] **DIST-03**: Install/uninstall shell scripts are provided
- [ ] **DIST-04**: README documents OpenClaw-specific setup and usage

## v1.1 Requirements — Telegram Support

Requirements for milestone v1.1. Phases 4–5.

### Telegram Utility Aliases

- [ ] **TEL-01**: `gsd_status` — shows project name, current phase, progress bar. Direct handler, no AI.
- [ ] **TEL-02**: `gsd_progress` — renders progress table from gsd-tools. Direct handler.
- [ ] **TEL-03**: `gsd_help` — lists all `gsd_*` Telegram aliases with one-line descriptions. Direct handler.
- [ ] **TEL-04**: `gsd_health` — runs project health check via gsd-tools. Direct handler.
- [ ] **TEL-05**: `gsd_settings` — reads and displays `.planning/config.json`. Direct handler.
- [ ] **TEL-06**: `gsd_update` — git pull → rsync → gateway restart. Direct handler.
- [ ] **TEL-07**: `gsd_project_list [list|add|remove] [name]` — project registry. Direct handler.
- [ ] **TEL-08**: `gsd_cleanup` — runs cleanup logic via gsd-tools. Direct handler.
- [ ] **TEL-09**: All utility handlers return Telegram-friendly text (no markdown tables, ≤4096 chars).
- [ ] **TEL-10**: Missing required args return a usage hint, not a stack trace.

### Telegram Workflow Aliases

- [ ] **TEL-11**: `gsd_quick <description>` — dispatches to gsd:quick SKILL.md with args.
- [ ] **TEL-12**: `gsd_new_project` — dispatches to gsd:new-project SKILL.md.
- [ ] **TEL-13**: `gsd_plan_phase <N>` — dispatches to gsd:plan-phase SKILL.md.
- [ ] **TEL-14**: `gsd_execute_phase <N>` — dispatches to gsd:execute-phase SKILL.md.
- [ ] **TEL-15**: `gsd_discuss_phase <N>` — dispatches to gsd:discuss-phase SKILL.md.
- [ ] **TEL-16**: `gsd_verify_work [N]` — dispatches to gsd:verify-work SKILL.md.
- [ ] **TEL-17**: `gsd_add_phase <description>` — dispatches to gsd:add-phase SKILL.md.
- [ ] **TEL-18**: `gsd_new_milestone <version>` — dispatches to gsd:new-milestone SKILL.md.
- [ ] **TEL-19**: `gsd_complete_milestone <version>` — dispatches to gsd:complete-milestone SKILL.md.
- [ ] **TEL-20**: `gsd_resume_work` — dispatches to gsd:resume-work SKILL.md.
- [ ] **TEL-21**: `gsd_pause_work` — dispatches to gsd:pause-work SKILL.md.
- [ ] **TEL-22**: `gsd_debug [issue]` — dispatches to gsd:debug SKILL.md.
- [ ] **TEL-23**: `gsd_add_todo [description]` — dispatches to gsd:add-todo SKILL.md.
- [ ] **TEL-24**: `gsd_check_todos` — dispatches to gsd:check-todos SKILL.md.
- [ ] **TEL-25**: `gsd_audit_milestone [version]` — dispatches to gsd:audit-milestone SKILL.md.
- [ ] **TEL-26**: `gsd_add_tests` — dispatches to gsd:add-tests SKILL.md.
- [ ] **TEL-27**: All workflow aliases pass `$ARGUMENTS` correctly to the underlying skill.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Parallel Execution

- **PARA-01**: Execute-phase supports parallel sub-agent wave execution
- **PARA-02**: Synchronization barrier for wave completion before advancement

### Platform Extensions

- **PLAT-01**: Statusline integration (pending OpenClaw statusline API)
- **PLAT-02**: Model profile system dynamically drives sub-agent model selection

## Out of Scope

| Feature | Reason |
|---------|--------|
| Claude Code plugin improvements | Existing claude-code-plugin stays as-is |
| Cross-runtime support (Gemini CLI, Codex, OpenCode) | Would force lowest-common-denominator design |
| Rewriting gsd-tools.cjs in TypeScript | Working code, no reason to rewrite |
| Custom UI or chat widgets | OpenClaw's existing UI is sufficient |
| Modifying GSD core logic or workflows | Faithful port, not a redesign |
| Windows support | GSD shell commands are Unix-specific; gated via OS frontmatter |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| FOUND-06 | Phase 1 | Pending |
| CMD-03 | Phase 2 | Complete |
| CMD-04 | Phase 2 | Complete |
| AGNT-01 | Phase 2 | Complete |
| AGNT-02 | Phase 2 | Complete |
| AGNT-03 | Phase 2 | Complete |
| ORCH-01 | Phase 2 | Complete |
| ORCH-02 | Phase 2 | Complete |
| ORCH-03 | Phase 2 | Complete |
| ORCH-04 | Phase 2 | Complete |
| CMD-01 | Phase 3 | Complete |
| CMD-02 | Phase 3 | Complete |
| CMD-05 | Phase 3 | Complete |
| TMPL-01 | Phase 3 | Complete |
| TMPL-02 | Phase 3 | Complete |
| TMPL-03 | Phase 3 | Complete |
| LIFE-01 | Phase 4 | Pending |
| LIFE-02 | Phase 4 | Pending |
| LIFE-03 | Phase 4 | Pending |
| DIST-01 | Phase 4 | Pending |
| DIST-02 | Phase 4 | Pending |
| DIST-03 | Phase 4 | Pending |
| DIST-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

| TEL-01 | Phase 4 | Pending |
| TEL-02 | Phase 4 | Pending |
| TEL-03 | Phase 4 | Pending |
| TEL-04 | Phase 4 | Pending |
| TEL-05 | Phase 4 | Pending |
| TEL-06 | Phase 4 | Pending |
| TEL-07 | Phase 4 | Pending |
| TEL-08 | Phase 4 | Pending |
| TEL-09 | Phase 4 | Pending |
| TEL-10 | Phase 4 | Pending |
| TEL-11 | Phase 5 | Pending |
| TEL-12 | Phase 5 | Pending |
| TEL-13 | Phase 5 | Pending |
| TEL-14 | Phase 5 | Pending |
| TEL-15 | Phase 5 | Pending |
| TEL-16 | Phase 5 | Pending |
| TEL-17 | Phase 5 | Pending |
| TEL-18 | Phase 5 | Pending |
| TEL-19 | Phase 5 | Pending |
| TEL-20 | Phase 5 | Pending |
| TEL-21 | Phase 5 | Pending |
| TEL-22 | Phase 5 | Pending |
| TEL-23 | Phase 5 | Pending |
| TEL-24 | Phase 5 | Pending |
| TEL-25 | Phase 5 | Pending |
| TEL-26 | Phase 5 | Pending |
| TEL-27 | Phase 5 | Pending |

**v1.1 coverage:**
- TEL requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-05 after v1.1 milestone start*
