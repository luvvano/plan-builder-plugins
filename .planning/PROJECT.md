# GSD for OpenClaw

## What This Is

A plugin that brings the full GSD (Get Shit Done) spec-driven development system to OpenClaw. Users install this plugin via ClawHub or manually, and get access to all GSD slash commands, agents, workflows, and templates — enabling structured project initialization, planning, execution, and verification inside OpenClaw's runtime.

## Core Value

OpenClaw users can run `/gsd:new-project`, `/gsd:plan-phase`, `/gsd:execute-phase`, and all other GSD commands with the same quality and workflow as Claude Code users — full spec-driven development with parallel agent orchestration, context engineering, and atomic commits.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Port all GSD slash commands (~24) to OpenClaw SKILL.md format
- [ ] Port all GSD agent definitions (~10) to OpenClaw-compatible agent prompts
- [ ] Port GSD templates (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, etc.) for use within OpenClaw
- [ ] Port GSD workflows (new-project, plan-phase, execute-phase, etc.) to OpenClaw skill orchestration
- [ ] Port GSD hooks (context-monitor, check-update, statusline) to OpenClaw service/event system
- [ ] Port GSD bin utilities (gsd-tools.cjs) for OpenClaw runtime
- [ ] Create OpenClaw plugin manifest and installation mechanism (ClawHub-compatible)
- [ ] Ensure multi-agent orchestration works within OpenClaw's agent/tool system
- [ ] Provide install/uninstall scripts for OpenClaw users
- [ ] Write documentation for OpenClaw-specific usage

### Out of Scope

- Claude Code plugin improvements — existing claude-code-plugin stays as-is
- Supporting other runtimes (Gemini CLI, Codex, OpenCode) — focus on OpenClaw only
- Modifying GSD's core logic or workflows — faithful port, not a redesign
- Building a custom UI — OpenClaw's existing UI/skill system is sufficient

## Context

- GSD is a spec-driven development system originally built for Claude Code with 24K+ GitHub stars
- OpenClaw is a personal AI assistant platform with 260K+ GitHub stars, supporting skills via SKILL.md format
- This repo already has a basic `plan-builder` plugin for both Claude Code and OpenClaw, but it only covers a tiny fraction of GSD's functionality (just `/plan` and `/plan-status`)
- The full GSD system includes: 24+ slash commands, 10+ specialized agents, templates, workflows, hooks, and a Node.js tooling layer
- OpenClaw uses AgentSkills-compatible SKILL.md files with YAML frontmatter for its extension system
- OpenClaw plugins can register commands, tools, and services via `api.registerCommand()`, `api.registerTool()`, `api.registerService()`
- GSD's multi-agent orchestration (spawning parallel subagents) needs to be mapped to OpenClaw's agent/tool architecture
- GSD relies on git for atomic commits — OpenClaw has shell access so this should work directly

## Constraints

- **Platform**: Must work within OpenClaw's skill/plugin architecture (SKILL.md, openclaw.plugin.json)
- **Compatibility**: Must be installable via ClawHub or manual copy to `~/.openclaw/extensions/`
- **Faithfulness**: Port should preserve GSD's workflow fidelity — same stages, same outputs, same quality
- **Dependencies**: Minimize runtime dependencies — GSD's gsd-tools.cjs may need adaptation for OpenClaw's environment

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Port as OpenClaw plugin (not standalone) | Leverages OpenClaw's native skill/plugin system for discoverability and installation | — Pending |
| Use SKILL.md format for commands | OpenClaw's standard mechanism for slash commands | — Pending |
| Reuse gsd-tools.cjs where possible | Avoid rewriting working utility code | — Pending |

---
*Last updated: 2026-03-04 after initialization*
