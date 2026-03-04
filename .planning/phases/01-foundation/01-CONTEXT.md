# Phase 1: Foundation - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the OpenClaw plugin, bundle gsd-tools.cjs with portable path resolution, validate command naming convention (colon vs hyphen), and prove the orchestration pattern (inline agent context injection as Task() replacement) works end-to-end with one complete GSD workflow.

</domain>

<decisions>
## Implementation Decisions

### Plugin scaffold structure
- Rebuild `openclaw-plugin/` from scratch based on research findings (existing basic plugin is too minimal)
- Plugin entry point: `src/index.ts` exporting default function
- Use `openclaw >=2026.2.3-1` as peerDependency (never `workspace:*` per issue #14042)
- TypeScript source consumed directly by jiti — no build step, `tsc --noEmit` for type checking only
- Target ES2022, ESNext modules, bundler module resolution, strict mode

### gsd-tools.cjs bundling and path resolution
- Copy gsd-tools.cjs into `bin/` inside the plugin package
- Resolve path at runtime using `import.meta.dirname` (Node.js >=20)
- Expose as `GSD_TOOLS_PATH` environment variable via registered service `start()` method
- All SKILL.md files reference `$GSD_TOOLS_PATH` instead of hardcoded absolute paths
- Bundle the full `get-shit-done/` support directory (templates, references, workflows) alongside gsd-tools.cjs

### Command naming convention
- Test colon-namespaced commands first: `/gsd:new-project`
- Fallback to hyphen naming (`/gsd-new-project`) if colons are rejected by `registerCommand()`
- Lock convention before writing any SKILL.md files
- Naming decision applies to: SKILL.md `name` frontmatter, `registerCommand()` calls, all documentation

### Orchestration pattern validation
- Use inline instruction-generation pattern: workflow SKILL.md returns detailed instructions the main agent executes
- For sub-agent roles: inline-inject the agent SKILL.md content as context blocks within the workflow instructions
- Sequential execution only in v1 — no parallel sub-agent synchronization
- Validate with one complete workflow: `/gsd:new-project` (exercises research agents, roadmapper, state management)
- Auto mode (`--auto`) is the default for all OpenClaw commands (no AskUserQuestion dependency)

### OS gating
- All SKILL.md and HOOK.md files include `os: ["darwin", "linux"]` in YAML frontmatter
- Windows is explicitly unsupported in v1

### Claude's Discretion
- Exact service lifecycle implementation details
- How to surface the GSD_TOOLS_PATH to SKILL.md contexts (env var vs tool response vs both)
- Error messaging format when plugin fails to load
- Whether to keep the existing basic `openclaw-plugin/` code as a starting point or replace entirely

</decisions>

<specifics>
## Specific Ideas

- The existing `openclaw-plugin/src/index.ts` shows the correct `api.registerCommand()`/`registerTool()`/`registerService()` pattern — use as reference for the API shape
- gsd-tools.cjs is a self-contained Node.js CLI with 20+ subcommands (init, commit, state, roadmap, config-get, config-set, etc.) — it works as-is, just needs path portability
- Research confirmed OpenClaw v2026.3.2 is current stable; plugin SDK uses subpath imports (`openclaw/plugin-sdk/core`)
- Research flagged that `@sinclair/typebox` is the official pattern for tool parameter schemas

</specifics>

<deferred>
## Deferred Ideas

- Full command set (24 commands) — Phase 3
- Lifecycle services (update check, context monitor) — Phase 4
- ClawHub distribution packaging — Phase 4
- Parallel sub-agent wave execution — v2
- Model profile system for sub-agent model selection — v2

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-04*
