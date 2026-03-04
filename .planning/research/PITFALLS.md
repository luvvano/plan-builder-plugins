# Pitfalls Research

**Domain:** GSD-to-OpenClaw plugin port (development workflow system porting between AI coding platforms)
**Researched:** 2026-03-04
**Confidence:** MEDIUM — OpenClaw plugin API verified from live docs and existing working code; GSD internals verified from source; cross-platform porting pitfalls are MEDIUM (patterns inferred from architecture analysis, not community post-mortems)

---

## Critical Pitfalls

### Pitfall 1: Assuming GSD's `Task()` Tool Maps Directly to OpenClaw Sub-agents

**What goes wrong:**
GSD orchestration is built entirely around Claude Code's `Task()` primitive — a blocking call that spawns a named subagent with a specific model, system prompt, and tool set, then returns its output to the orchestrator. Developers porting GSD assume OpenClaw has an equivalent. OpenClaw sub-agents work differently: they are spawned with `/subagents spawn <agentId> <task>` or via the LLM Task tool, run in a fully isolated background session, and **announce results back to the chat channel** — they do not return a value to the spawning agent. There is no synchronous "wait for subagent, get return value" primitive in OpenClaw's current architecture.

**Why it happens:**
The existing plan-builder plugin (openclaw-plugin/src/index.ts) sidesteps this by generating instruction text that the agent manually follows. When porting the full GSD (24+ commands with nested orchestration), developers naturally reach for the same pattern as Claude Code's `Task()` call and discover OpenClaw's sub-agents are asynchronous and announcement-based, not result-returning.

**How to avoid:**
Do not model GSD's orchestration as a 1:1 port of `Task()` calls. Use one of two valid OpenClaw patterns:
1. **Inline instruction generation** (already proven in the existing plugin): tools return detailed markdown instruction strings that the main agent executes directly in its own context.
2. **OpenClaw LLM Task tool**: use the built-in `llm_task` tool for tasks that should run as isolated agent calls; accept that results come back through the channel, not as a return value. Design GSD workflows to be resumable from channel announcements.

Choose pattern 1 for workflows requiring tight orchestration (execute-phase with wave ordering). Choose pattern 2 for fire-and-forget tasks (parallel researchers).

**Warning signs:**
- SKILL.md files that call `Task(...)` directly in their instruction bodies (this is Claude Code syntax, silently ignored in OpenClaw)
- Workflow steps that block "waiting for subagent to return" — OpenClaw sub-agents announce, not return
- Phase execution that requires collecting all parallel outputs before proceeding (wave-based ordering breaks)

**Phase to address:** Phase 1 (architecture decisions) — before writing any workflow skill files.

---

### Pitfall 2: Hardcoded Absolute Path to gsd-tools.cjs

**What goes wrong:**
Every GSD workflow calls `node /Users/egorproskyrin/.claude/get-shit-done/bin/gsd-tools.cjs <command>` with an absolute path hardcoded to the developer's home directory. This path is baked into 24+ command files, 10+ agent definitions, and reference documents. When other users install the GSD OpenClaw plugin, gsd-tools.cjs either does not exist at that path or is in a completely different location. Shell commands silently fail with "no such file" errors, and because GSD workflows depend on the JSON output from these calls to determine state, the entire workflow collapses on first invocation.

**Why it happens:**
GSD was designed for Claude Code where `~/.claude/get-shit-done/` is the conventional install location for a single developer. The path was never parameterized because it never needed to be — it only ever ran on the machine that installed it. When porting to a distributable plugin, this assumption breaks.

**How to avoid:**
Before porting any workflow, solve the path resolution problem first. Options:
1. Bundle gsd-tools.cjs inside the OpenClaw plugin package and use a relative path from `__dirname` or `import.meta.dirname` in the TypeScript plugin entry point.
2. Use an environment variable `GSD_TOOLS_PATH` that the plugin sets at startup via `api.registerService()`, then expose it to skill shells via an environment injection hook.
3. Replace gsd-tools.cjs calls in SKILL.md with direct TypeScript tool calls registered via `api.registerTool()` — this is the most OpenClaw-native approach but requires rewriting the utility layer.

**Warning signs:**
- Any SKILL.md or agent markdown file containing `/Users/` in shell commands
- Skills that work on the developer's machine but fail for all other users
- Shell errors that appear only at runtime, not during plugin load

**Phase to address:** Phase 1 (foundation setup) — the very first task before porting any individual command.

---

### Pitfall 3: Porting GSD's `AskUserQuestion` to Plain Text Assumptions

**What goes wrong:**
GSD relies on `AskUserQuestion` — a Claude Code-specific interactive UI primitive that presents structured multi-select dialogs with headers, descriptions, and option lists. This is used in 8+ critical workflow steps: choosing depth, parallelization, git tracking, model profile, research enable/disable, plan check, verifier, and roadmap approval. OpenClaw does not have an equivalent structured interactive dialog primitive. If you port GSD skills to OpenClaw by simply writing the same multi-select options as plain text, users get walls of text asking them to "type 1, 2, or 3" with no UI affordances. Worse, if you assume users will answer in the same format GSD expects, the workflow logic that parses the response breaks.

**Why it happens:**
`AskUserQuestion` is a first-class Claude Code tool that renders native UI. Developers porting skills copy the `AskUserQuestion` call syntax or its markdown equivalent without verifying that OpenClaw has this tool in its API surface (it does not).

**How to avoid:**
Design a clear substitute pattern for all interactive decision points before porting the first workflow:
1. Use markdown-formatted option lists with bold numbered choices and ask users to reply with the number.
2. Register OpenClaw commands that pre-configure settings (e.g., `/gsd:config depth=quick parallelization=on`) so interactive questioning can be replaced with explicit invocation.
3. Lean on `--auto` mode for OpenClaw users — pre-answer all questions with sensible defaults, surface a single "confirm config" message, and proceed.

The auto-mode path in GSD already exists and skips all `AskUserQuestion` calls. Making auto-mode the default for OpenClaw significantly reduces the interactive dialog problem surface.

**Warning signs:**
- Skills that reference `AskUserQuestion` in their instruction text
- User-facing step descriptions that include multi-select option tables with no alternative
- Workflow branching that depends on user selection values that cannot be parsed from free-form chat replies

**Phase to address:** Phase 1 (command design) — establish the interaction pattern before any workflow skills are written.

---

### Pitfall 4: Treating OpenClaw Hooks as Equivalent to Claude Code Hooks

**What goes wrong:**
Claude Code hooks use a `hooks.json` file with `SessionStart` matchers that trigger shell scripts when session keywords match — enabling the plan-builder to auto-inject `.planning/` context into every new session that mentions "plan", "roadmap", or "project". OpenClaw hooks use a completely different architecture: they are TypeScript `HookHandler` functions that respond to typed events (`command:new`, `command:reset`, `agent:*`, `gateway:*`, `message:*`). There is no keyword-matcher on session start that injects file content into context. Porting the Claude Code `SessionStart` hook by copying `hooks.json` into an OpenClaw plugin directory does nothing — it is silently ignored.

**Why it happens:**
Both platforms use the word "hooks" and both support automation triggers. Developers assume conceptual equivalence and copy the hook format. The actual event taxonomy, handler format, and injection mechanism are completely different.

**How to avoid:**
For the equivalent of GSD's context auto-injection, use OpenClaw's proper mechanism:
1. Register a `command:new` or `message` event hook via OpenClaw's HOOK.md format with a TypeScript handler that detects `.planning/` existence and prepends context to the session.
2. Alternatively, use OpenClaw's `bootstrap-extra-files` bundled hook pattern which is designed for injecting file content at session start.
3. Treat context injection as opt-in: document that users should reference `.planning/` files explicitly, rather than relying on automatic injection.

**Warning signs:**
- `hooks.json` files copied into the OpenClaw plugin structure
- Shell scripts placed in an `openclaw-plugin/hooks/` directory expecting automatic execution
- Missing context-loading behavior: users report that the agent doesn't know about their planning files

**Phase to address:** Phase 2 (hooks and context) — after core commands work, before releasing to users.

---

### Pitfall 5: Assuming OpenClaw Skills Have Equivalent Model Selection

**What goes wrong:**
GSD's model profile system (`quality`, `balanced`, `budget`) controls which Claude model each agent uses by passing a `model` parameter to `Task()` calls. GSD's gsd-tools.cjs returns `executor_model`, `researcher_model`, `roadmapper_model` etc. from `init` commands, and orchestrators pass these to subagent spawning calls. OpenClaw sub-agents support a `--model <model>` flag when using `/subagents spawn`, but plugin SKILL.md files have no mechanism to dynamically read from `.planning/config.json` and pass that model selection to sub-agent invocations. The model profile system either silently defaults to a single model for all agents or requires custom tooling to implement.

**Why it happens:**
Model-per-agent selection in Claude Code is a first-class `Task()` parameter. In OpenClaw, it requires explicit orchestration that reads config and passes the flag through the LLM Task tool or sub-agent spawn command. SKILL.md files are passive instructions — they cannot read files and dynamically select parameters.

**How to avoid:**
Implement model selection as a TypeScript tool registered via `api.registerTool()`. The tool reads `.planning/config.json`, resolves the model profile, and returns the correct model identifier. Skills then instruct the agent to call this tool before spawning sub-agents. Alternatively, simplify by offering only "use current model" and "use cheapest model" options without the full profile matrix during the initial port.

**Warning signs:**
- Skills that reference `{executor_model}`, `{researcher_model}` variables with no mechanism to populate them
- All GSD agents running on the same model regardless of config
- Users reporting unexpectedly high costs (all agents defaulting to a premium model)

**Phase to address:** Phase 3 (agent system) — after basic command structure works.

---

## Moderate Pitfalls

### Pitfall 6: Colon-Namespaced Commands Break OpenClaw Registration

**What goes wrong:**
GSD uses colon-namespaced command names like `/gsd:new-project`, `/gsd:plan-phase`, `/gsd:execute-phase`. The existing OpenClaw plugin registers commands with plain names like `plan`. OpenClaw's `registerCommand()` API uses the `name` field which becomes the slash command identifier. It is not confirmed that OpenClaw's command registration supports colon-separated names. If colons are not valid in command names, all 24 GSD commands need renaming or a prefix-based approach (`/gsd-new-project`, etc.), which breaks any documentation, README, or user muscle memory that references the canonical GSD command names.

**How to avoid:**
Test command name registration with a colon before porting more than 1-2 commands. If colons are not supported, establish a naming convention early (e.g., `gsd_new_project` using underscores, or `gsd-new-project` using hyphens) and apply it consistently. Document the mapping from GSD canonical names to OpenClaw names.

**Warning signs:**
- Plugin load errors mentioning invalid command names
- Commands registering successfully but not triggering when users type `/gsd:new-project`
- Inconsistent naming across command files discovered mid-port

**Phase to address:** Phase 1 (foundation) — test before porting all commands.

---

### Pitfall 7: gsd-tools.cjs Module System Incompatibility

**What goes wrong:**
gsd-tools.cjs uses CommonJS module format (`.cjs` extension, `require()` calls). OpenClaw plugins are loaded as ES modules via `jiti` and TypeScript. Attempting to `import` or `require()` gsd-tools.cjs from within the OpenClaw TypeScript plugin may encounter interop issues depending on how jiti handles the CJS-to-ESM boundary. Additionally, gsd-tools.cjs uses Node.js built-ins (`fs`, `path`, `child_process`) that may behave differently depending on the Node version OpenClaw ships or sandboxes.

**How to avoid:**
Verify the import path works in a minimal test before building the full integration. Use dynamic `require()` with a try/catch in the plugin's TypeScript entry point to detect failures early. Consider using a thin wrapper registered as an OpenClaw tool that shells out to `node gsd-tools.cjs` instead of importing it directly — this avoids module format issues entirely.

**Warning signs:**
- Plugin startup errors about `require is not defined` or module resolution
- gsd-tools.cjs functions available in Node REPL but crashing inside OpenClaw
- Different behavior between `openclaw dev` and production plugin loading

**Phase to address:** Phase 1 (foundation) — verify before writing any dependent code.

---

### Pitfall 8: Parallel Agent Output Collection Has No Synchronization Primitive

**What goes wrong:**
GSD's execute-phase workflow spawns multiple executor agents in parallel for a wave, then collects their summaries before proceeding to the next wave. This requires knowing when all parallel agents are done and reading their outputs. In OpenClaw, sub-agents announce results to the channel. With 3-4 parallel sub-agents, the orchestrator receives 3-4 separate channel messages asynchronously. There is no built-in "wait for all" barrier, and the agent cannot reliably determine when all wave agents have completed without external state coordination.

**How to avoid:**
Design wave-based execution as sequential by default in the OpenClaw port, with an explicit note that full parallel execution requires the LLM Task tool's multi-invocation pattern or manual wave coordination. Implement a state file (`wave-state.json`) that sub-agents write to upon completion, allowing the orchestrator to poll for completion. Accept reduced parallelism as an acceptable tradeoff for the initial port.

**Warning signs:**
- Orchestrator advancing to wave 2 before wave 1 agents have finished
- Missing SUMMARY.md files because the orchestrator read them before agents wrote them
- Race conditions in STATE.md updates from concurrent agents

**Phase to address:** Phase 3 (execution system) — design before implementing execute-phase.

---

### Pitfall 9: Plugin Skills Not Auto-Loading Without Explicit Skill Configuration

**What goes wrong:**
OpenClaw loads skills from specific locations with precedence rules. Plugin-shipped skills (listed in `openclaw.plugin.json`) only participate in skill loading when the plugin is enabled and the skills directory is correctly declared. If a plugin ships 24 skill files but the `openclaw.plugin.json` doesn't enumerate the skills directory, or if the user's agent configuration doesn't include plugin skills in its allowed skill set, the skills exist on disk but are never loaded. Users install the plugin, see it listed as active, but `/gsd:new-project` doesn't exist in the agent's skill context.

**How to avoid:**
Validate the full skill-loading chain with a single test skill before porting all 24 commands. Confirm that `openclaw.plugin.json` correctly declares the skills path, and verify the skill actually appears in the agent's available commands. Write an install validation step in the plugin's README that lets users confirm skills loaded correctly.

**Warning signs:**
- Plugin reports as installed but commands don't appear in autocomplete
- Skills working in developer's local OpenClaw but not in user-installed instances
- No error on load — skills are simply absent

**Phase to address:** Phase 1 (foundation) — validate before porting additional skills.

---

### Pitfall 10: GSD State Files Assume Unix-Style Path Separators

**What goes wrong:**
gsd-tools.cjs constructs paths using Node's `path.join()` which is platform-aware, but the shell commands embedded in GSD SKILL.md files use Unix paths directly (`cat .planning/STATE.md`, `mkdir -p .planning/phase-01`). OpenClaw runs on macOS, Linux, and Windows. On Windows, these shell commands fail. While OpenClaw's primary users are likely on Unix-like systems, the `os` gating field in HOOK.md metadata allows restricting to `darwin` and `linux` explicitly, which is preferable to silently failing on Windows.

**How to avoid:**
Add `os: ["darwin", "linux"]` gating to all GSD skill/hook definitions. This surfaces a clear "not supported on Windows" message rather than silent failures. Document this limitation explicitly.

**Warning signs:**
- User reports of shell commands failing with path errors
- `mkdir` or `cat` commands not found on Windows-based OpenClaw installs

**Phase to address:** Phase 1 (foundation) — add OS gating as boilerplate from the start.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Generate instruction text instead of native tool calls for all 24 commands | Fast port — same pattern as existing plugin | Skills become brittle 2000-line instruction strings; hard to maintain | MVP only — refactor to native tools in v2 |
| Hard-require users to run `/gsd:config` before any command | Avoids complex state detection in skills | Bad UX; users forget and get confusing errors | Only if auto-detection is genuinely complex |
| Disable parallelization entirely in OpenClaw port | Eliminates wave-sync complexity | GSD's biggest execution advantage is lost | Acceptable for v1 — mark as known limitation |
| Use `--auto` mode as OpenClaw's only mode | Eliminates AskUserQuestion problem entirely | Users lose interactive questioning depth | Acceptable for v1; add interactive mode in v2 |
| Keep gsd-tools.cjs path as environment variable that users must set | Avoids bundling complexity | Users get confusing "GSD_TOOLS_PATH not set" errors | Never — bundle it or rewrite it |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenClaw Plugin SDK | Importing internal OpenClaw paths directly (`../../src/plugins/types.js`) | Always import from `openclaw/plugin-sdk` — the stable public API surface |
| gsd-tools.cjs shell calls | Calling `gsd-tools.cjs` from SKILL.md shell blocks with hardcoded paths | Register a TypeScript tool that shells out to gsd-tools.cjs using a runtime-resolved path |
| Sub-agent model selection | Passing `model: "opus"` directly to sub-agent spawn | Use `"inherit"` for opus-tier agents to avoid version conflicts (GSD's own recommendation) |
| ClawHub distribution | Publishing skill files without OpenClaw Plugin manifest | All skills must be declared in `openclaw.plugin.json` with correct paths for ClawHub installation |
| Git commit operations | Using `git commit` directly in skills that run on non-git projects | Always gate git operations on `has_git` check from gsd-tools.cjs init, or catch errors gracefully |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all 24 GSD skills into every agent context | Slow agent startup; high token usage on every message | Use skill gating (`config`, `env`, `bins` filters) to only load GSD skills when `.planning/` exists | With any project that doesn't use GSD — which is most projects |
| gsd-tools.cjs init call on every command invocation | 200-500ms delay at start of every GSD command | Cache init output within a session; only re-call when state changes | At high command frequency during active development |
| Bundling all GSD templates as embedded strings in TypeScript | Large plugin bundle size; slow plugin load | Keep templates as separate files and read them at runtime | When plugin grows beyond ~50KB bundle |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Skills executing arbitrary shell commands from user-provided task descriptions | Command injection if task description is used unsafely in shell context | Sanitize all user input before embedding in shell commands; prefer TypeScript logic over shell |
| Storing model API keys in `.planning/config.json` | Keys committed to git if `commit_docs: true` | Never store credentials in planning files; use environment variables only |
| Plugin shipping with `requireAuth: false` on powerful commands | Any OpenClaw user can invoke destructive GSD commands | Set `requireAuth: true` on all commands that write files or execute git operations |

---

## "Looks Done But Isn't" Checklist

- [ ] **Command registration**: All 24 commands registered — verify with `/gsd:help` listing all of them, not just testing 2-3
- [ ] **Agent definitions**: All 10+ agents are loadable as OpenClaw skill contexts — verify each is reachable, not just the executor
- [ ] **Path resolution**: gsd-tools.cjs path works for a user who installed the plugin to `~/.openclaw/extensions/` (not the developer's machine) — test with a fresh user account
- [ ] **Git integration**: `commit_docs: true` flow works end-to-end including creating the initial commit — test on a repo with no commits, not just an existing repo
- [ ] **Sub-agent workflow**: At least one full orchestration flow (new-project → plan-phase → execute-phase) completes without requiring Claude Code primitives
- [ ] **ClawHub installability**: Plugin installs correctly via ClawHub, not just via manual file copy — test the actual install mechanism

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Task() mapping misdesign | HIGH | Rearchitect orchestration layer; rewrite all workflow skills to use instruction-generation pattern; cannot be patched incrementally |
| Hardcoded gsd-tools.cjs paths shipped to users | MEDIUM | Release hotfix plugin version with path resolution; users must reinstall; path fix is mechanical but requires touching every workflow file |
| AskUserQuestion in shipped skills | LOW | Add `--auto` mode to all commands; deprecate interactive mode in OpenClaw variant; users redirect to auto flows |
| Broken hook format | LOW | Remove hooks from plugin; document manual context loading; re-add using correct HOOK.md format in next release |
| Colon command names rejected | MEDIUM | Mass-rename all commands; update all cross-references in SKILL.md files; re-publish to ClawHub |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Task() ≠ OpenClaw sub-agents | Phase 1: Architecture | Implement one full orchestration flow (new-project) before porting more commands |
| Hardcoded gsd-tools.cjs path | Phase 1: Foundation | Install plugin to a fresh user account and run one command successfully |
| AskUserQuestion has no equivalent | Phase 1: Command design | Complete one interactive workflow (new-project) without referencing AskUserQuestion |
| Claude Code hooks ≠ OpenClaw hooks | Phase 2: Hooks and context | Context auto-injection tested by starting a fresh session on a project with `.planning/` |
| Model selection system | Phase 3: Agent system | Verify different model profiles result in different model usage |
| Colon-namespaced command names | Phase 1: Foundation | Register `/gsd:new-project` or equivalent; verify it appears in autocomplete |
| gsd-tools.cjs module format | Phase 1: Foundation | Import or invoke gsd-tools.cjs from within OpenClaw plugin without errors |
| Parallel wave synchronization | Phase 3: Execution | Execute a phase with 3+ plans and verify wave ordering is respected |
| Skills not auto-loading | Phase 1: Foundation | Fresh install + verify all skills appear in agent context |
| Unix path assumptions | Phase 1: Foundation | Add `os` gating to all skill/hook definitions before any release |

---

## Sources

- OpenClaw Sub-agents documentation: https://docs.openclaw.ai/tools/subagents
- OpenClaw Hooks documentation: https://docs.openclaw.ai/automation/hooks
- OpenClaw Plugin Docs: https://docs.openclaw.ai/tools/plugin
- OpenClaw Plugin Manifest: https://docs.openclaw.ai/plugins/manifest
- OpenClaw Plugin Agent Tools: https://docs.openclaw.ai/plugins/agent-tools
- OpenClaw Deep Dive (4): Plugin SDK and Extension Development: https://dev.to/wonderlab/openclaw-deep-dive-4-plugin-sdk-and-extension-development-51ki
- GSD execute-phase workflow (source): `/Users/egorproskyrin/.claude/get-shit-done/workflows/execute-phase.md`
- GSD new-project workflow (source): `/Users/egorproskyrin/.claude/get-shit-done/workflows/new-project.md`
- GSD model profiles reference (source): `/Users/egorproskyrin/.claude/get-shit-done/references/model-profiles.md`
- GSD planning config reference (source): `/Users/egorproskyrin/.claude/get-shit-done/references/planning-config.md`
- Existing OpenClaw plugin (source): `/Users/egorproskyrin/Projects/luvvano/plan-builder-plugins/openclaw-plugin/src/index.ts`
- Existing Claude Code plugin hooks (source): `/Users/egorproskyrin/Projects/luvvano/plan-builder-plugins/claude-code-plugin/hooks/`

---
*Pitfalls research for: GSD-to-OpenClaw plugin port*
*Researched: 2026-03-04*
