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

- [ ] **CMD-01**: All 24 GSD slash commands are implemented as individual SKILL.md files in `skills/workflows/`
- [ ] **CMD-02**: Each SKILL.md has correct YAML frontmatter (name, description, user-invocable, os gating)
- [x] **CMD-03**: Core 4 commands work end-to-end: new-project, plan-phase, execute-phase, verify-work
- [x] **CMD-04**: All commands default to `--auto` mode (no AskUserQuestion dependency)
- [ ] **CMD-05**: `/gsd:help` command lists all registered commands organized by workflow stage

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
| CMD-01 | Phase 3 | Pending |
| CMD-02 | Phase 3 | Pending |
| CMD-05 | Phase 3 | Pending |
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

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after initial definition*
