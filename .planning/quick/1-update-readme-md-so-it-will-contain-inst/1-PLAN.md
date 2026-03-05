---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
  - openclaw-plugin/README.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "User can follow README steps to install the GSD plugin into an OpenClaw environment"
    - "README explains what the plugin provides (26 commands, agents, skills)"
    - "Both root README.md and openclaw-plugin/README.md are updated and consistent"
  artifacts:
    - path: "README.md"
      provides: "Root repo README with overview and links"
    - path: "openclaw-plugin/README.md"
      provides: "Detailed OpenClaw installation guide"
  key_links:
    - from: "README.md"
      to: "openclaw-plugin/README.md"
      via: "Link to detailed install guide"
---

<objective>
Rewrite README.md and openclaw-plugin/README.md to contain a clear, English-language installation guide for installing the GSD plugin into an OpenClaw environment.

Purpose: The current READMEs are outdated (describe old plan-builder plugin, contain Russian text). Users need clear English instructions for installing the full GSD plugin.
Output: Two updated README files with installation steps, configuration, and usage overview.
</objective>

<context>
@.planning/PROJECT.md
Key facts for the README:
- Plugin ID: `gsd-for-openclaw` (from openclaw.plugin.json)
- Plugin entry: `src/index.ts` (from package.json `openclaw.extensions`)
- Peer dependency: `openclaw >= 2026.2.3-1`
- Dev dependencies: `@sinclair/typebox`, `typescript`
- Skills directory: `skills/` (planning + 26 workflow commands under skills/workflows/)
- Agents directory: `agents/` (12 agent definitions)
- Templates directory: `templates/`
- Workflows directory: `workflows/` (reference markdown files)
- Bin directory: `bin/` (gsd-tools.cjs)
- Config schema: `planningDir` (string, default ".planning")
- Registered tools: gsd_phase_status, gsd_config_get, gsd_roadmap_summary, gsd_state_snapshot
- Registered commands: /gsd:help, /gsd:status
- Service: gsd-lifecycle (sets GSD_TOOLS_PATH and GSD_HOME env vars)
- 26 slash commands available via SKILL.md files in skills/workflows/
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite openclaw-plugin/README.md with full installation guide</name>
  <files>openclaw-plugin/README.md</files>
  <action>
Rewrite openclaw-plugin/README.md in English. Structure:

1. **Header**: "GSD for OpenClaw" — one-line description: spec-driven development plugin providing 26 commands for planning, executing, and verifying coding workflows.

2. **Prerequisites**: OpenClaw >= 2026.2.3-1, Node.js (for gsd-tools.cjs)

3. **Installation** (step-by-step):
   - Step 1: Clone the repo
     ```bash
     git clone https://github.com/luvvano/plan-builder-plugins.git
     ```
   - Step 2: Copy the openclaw-plugin directory into OpenClaw extensions:
     ```bash
     cp -r plan-builder-plugins/openclaw-plugin ~/.openclaw/extensions/gsd-for-openclaw
     ```
   - Step 3: Restart the gateway:
     ```bash
     openclaw gateway restart
     ```
   - Step 4: Verify installation:
     ```bash
     openclaw plugins list
     ```
     Should show `gsd-for-openclaw`. Then in chat: `/gsd:help` should list all commands.

4. **Configuration** (optional):
   Add to `~/.openclaw/openclaw.json` under `plugins.entries`:
   ```json
   {
     "plugins": {
       "entries": {
         "gsd-for-openclaw": {
           "config": {
             "planningDir": ".planning"
           }
         }
       }
     }
   }
   ```
   Table of config options: planningDir (string, default ".planning", directory for GSD planning files).

5. **Enabling tools for agents** (optional):
   The plugin registers 4 tools (gsd_phase_status, gsd_config_get, gsd_roadmap_summary, gsd_state_snapshot) with `optional: true`. To allow an agent to use them:
   ```json
   {
     "agents": {
       "list": [{ "id": "main", "tools": { "allow": ["gsd_phase_status", "gsd_config_get", "gsd_roadmap_summary", "gsd_state_snapshot"] } }]
     }
   }
   ```

6. **Available commands**: Brief listing of all command categories (copy from /gsd:help output in index.ts — Project Initialization, Phase Planning, Execution, Quick Mode, Roadmap Management, Milestones, Session Management, Debugging, Todos, Verification, Testing, Configuration, Utility). Just list the command names and one-line descriptions, no lengthy explanations.

7. **Project structure**: Updated tree showing current directory layout:
   ```
   openclaw-plugin/
   ├── openclaw.plugin.json
   ├── package.json
   ├── tsconfig.json
   ├── src/
   │   └── index.ts
   ├── bin/
   │   └── gsd-tools.cjs
   ├── agents/
   │   └── (12 agent definitions)
   ├── skills/
   │   ├── planning/
   │   └── workflows/
   │       └── (26 workflow commands)
   ├── templates/
   ├── workflows/
   └── README.md
   ```

8. **How it works**: Brief explanation — plugin registers a lifecycle service that sets env vars, registers slash commands (/gsd:help, /gsd:status), registers query tools, and loads SKILL.md files from skills/ directory. Users interact via /gsd:* slash commands.

Do NOT include Russian text. Write everything in English.
  </action>
  <verify>cat openclaw-plugin/README.md | head -5 should show English header "# GSD for OpenClaw"</verify>
  <done>openclaw-plugin/README.md contains complete English installation guide with all 8 sections</done>
</task>

<task type="auto">
  <name>Task 2: Update root README.md</name>
  <files>README.md</files>
  <action>
Rewrite the root README.md in English. Structure:

1. **Header**: "plan-builder-plugins" — one paragraph: this repo contains development workflow plugins for OpenClaw and Claude Code. The primary plugin is GSD for OpenClaw — a full spec-driven development system with 26 commands.

2. **Repository structure**:
   ```
   plan-builder-plugins/
   ├── openclaw-plugin/    -- GSD for OpenClaw (full spec-driven dev system)
   └── claude-code-plugin/ -- Claude Code plugin (Markdown-based)
   ```

3. **Quick start** section with two subsections:

   **OpenClaw (GSD plugin)**:
   ```bash
   git clone https://github.com/luvvano/plan-builder-plugins.git
   cp -r plan-builder-plugins/openclaw-plugin ~/.openclaw/extensions/gsd-for-openclaw
   openclaw gateway restart
   ```
   Then: `/gsd:help` in chat to see all commands.
   Link: "See [OpenClaw plugin README](./openclaw-plugin/README.md) for full installation guide."

   **Claude Code**:
   ```bash
   claude plugin install ./claude-code-plugin
   ```
   Link: "See [Claude Code plugin README](./claude-code-plugin/README.md) for details."

4. Remove all Russian text. Remove the old detailed installation sections, "Что генерирует система", "Структура файлов", etc. Keep it concise — details belong in the per-plugin READMEs.
  </action>
  <verify>cat README.md | head -5 should show English header; grep -c "##" README.md should return 3-5 sections</verify>
  <done>Root README.md is concise English overview with quick-start for both plugins and links to detailed READMEs</done>
</task>

</tasks>

<verification>
- Both README files are in English, no Russian text
- openclaw-plugin/README.md contains step-by-step installation instructions
- Root README.md links to openclaw-plugin/README.md for details
- Plugin ID "gsd-for-openclaw" is used consistently
- Installation path ~/.openclaw/extensions/gsd-for-openclaw is correct
</verification>

<success_criteria>
A new user reading README.md can understand what this repo is and follow the link to openclaw-plugin/README.md, where they find complete step-by-step instructions to install the GSD plugin into their OpenClaw environment.
</success_criteria>

<output>
After completion, create `.planning/quick/1-update-readme-md-so-it-will-contain-inst/1-SUMMARY.md`
</output>
