/**
 * GSD for OpenClaw — Plugin Entry Point
 *
 * Spec-driven development workflows: plan, execute, and verify coding tasks.
 * Registers lifecycle service (GSD_TOOLS_PATH), commands, and loads skills.
 *
 * Config (openclaw.json -> plugins.entries.gsd-for-openclaw.config):
 *   planningDir — where GSD planning files live (default: ".planning")
 */

import { join } from "node:path";
import { execSync, spawn } from "node:child_process";
import { readFileSync, existsSync, cpSync } from "node:fs";
import { homedir } from "node:os";
import { Type } from "@sinclair/typebox";
import type { PluginContext } from "openclaw/plugin-sdk/core";

export default function gsdPlugin(api: PluginContext): void {
  const cfg = api.config?.plugins?.entries?.["gsd-for-openclaw"]?.config ?? {};
  const planningDir: string =
    (cfg as Record<string, unknown>).planningDir as string ?? ".planning";

  api.logger.info("[gsd] plugin loaded, planningDir=" + planningDir);

  // ── Lifecycle service: set GSD_TOOLS_PATH and GSD_HOME ──────────────────
  api.registerService({
    id: "gsd-lifecycle",
    start() {
      const toolsPath = join(import.meta.dirname, "..", "bin", "gsd-tools.cjs");
      const gsdHome = join(import.meta.dirname, "..");
      process.env.GSD_TOOLS_PATH = toolsPath;
      process.env.GSD_HOME = gsdHome;
      api.logger.info("[gsd] GSD_TOOLS_PATH=" + toolsPath);
      api.logger.info("[gsd] GSD_HOME=" + gsdHome);
    },
    stop() {
      delete process.env.GSD_TOOLS_PATH;
      delete process.env.GSD_HOME;
      api.logger.info("[gsd] cleanup complete");
    },
  });

  // ── Helper: shell out to gsd-tools.cjs (registerTool handlers) ──────────────
  function execGsdTools(subcommand: string): unknown {
    const toolsPath = process.env.GSD_TOOLS_PATH
      ?? join(import.meta.dirname, "..", "bin", "gsd-tools.cjs");
    try {
      const output = execSync(`node "${toolsPath}" ${subcommand}`, {
        encoding: "utf8",
        timeout: 15000,
        cwd: process.cwd(),
      });
      return JSON.parse(output);
    } catch (e) {
      return { error: String(e) };
    }
  }

  function readWaveStateIfExists(phaseDir: string): unknown {
    try {
      const raw = readFileSync(join(phaseDir, "wave-state.json"), "utf8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // ── State query tools ─────────────────────────────────────────────────

  api.registerTool(
    {
      name: "gsd_phase_status",
      description: "Get status of a GSD phase: plans found, completion state, wave-state.json contents",
      parameters: Type.Object({
        phase: Type.String({ description: "Phase number or identifier (e.g. '2', '02', '02-core-workflows')" }),
      }),
      async execute(_id, params) {
        const p = params as { phase: string };
        const result = execGsdTools(`init execute-phase ${p.phase}`);
        const phaseDir = (result as Record<string, unknown>).phase_dir as string | null;
        const waveState = phaseDir ? readWaveStateIfExists(phaseDir) : null;
        return {
          content: [{ type: "text", text: JSON.stringify({ ...result as object, wave_state: waveState }) }],
        };
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "gsd_config_get",
      description: "Get GSD project config (model_profile, workflow settings, commit_docs)",
      parameters: Type.Object({
        key: Type.Optional(Type.String({ description: "Specific config key to retrieve, or omit for full config" })),
      }),
      async execute(_id, params) {
        const p = params as { key?: string };
        const state = execGsdTools("state") as Record<string, unknown>;
        const config = (state.config ?? state) as Record<string, unknown>;
        const result = p.key ? { [p.key]: config[p.key] } : config;
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "gsd_roadmap_summary",
      description: "Get parsed roadmap with phase list, requirements, and progress",
      parameters: Type.Object({}),
      async execute() {
        const result = execGsdTools("roadmap analyze");
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "gsd_state_snapshot",
      description: "Get combined project snapshot: state, config, roadmap existence, current position",
      parameters: Type.Object({
        phase: Type.Optional(Type.String({ description: "Phase to include detailed status for" })),
      }),
      async execute(_id, params) {
        const p = params as { phase?: string };
        const state = execGsdTools("state");
        const phaseDetail = p.phase ? execGsdTools(`init execute-phase ${p.phase}`) : null;
        return {
          content: [{ type: "text", text: JSON.stringify({ state, phase_detail: phaseDetail }) }],
        };
      },
    },
    { optional: true },
  );

  // NOTE: All gsd:* slash commands are implemented as SKILL.md files under
  // skills/workflows/*/SKILL.md — OpenClaw's registerCommand API does not allow
  // colons in command names, so SKILL.md is the correct mechanism for gsd:* commands.
  // The registerTool calls above use underscores and work correctly.

  // ── Telegram markdown helpers ──────────────────────────────────────────────
  // OpenClaw renders `text` as markdown → Telegram HTML automatically.
  // Use **bold**, `code`, ```pre``` — NOT raw <b>/<code> HTML tags.

  function fmt(text: string): string {
    // Truncate to safe Telegram limit, add note
    return text.length > 3800 ? text.slice(0, 3800) + "\n\n_…truncated_" : text;
  }

  function tp(): string {
    return process.env.GSD_TOOLS_PATH
      ?? join(import.meta.dirname, "..", "bin", "gsd-tools.cjs");
  }

  /** Returns the most recently active GSD project path, or cwd as fallback. */
  function resolveActiveProjectDir(): string {
    try {
      const registryPath = join(homedir(), ".gsd", "projects.json");
      const registry = JSON.parse(readFileSync(registryPath, "utf8")) as { projects?: Array<{name: string; path: string; last_active: string}> };
      const projects = registry.projects ?? [];
      if (projects.length === 0) return process.cwd();
      // Sort by last_active descending, return the most recently active
      const sorted = [...projects].sort((a, b) => b.last_active.localeCompare(a.last_active));
      return sorted[0].path;
    } catch {
      return process.cwd();
    }
  }

  /** Execute gsd-tools in the active project directory. */
  function runTools(subcommand: string, cwd?: string): unknown {
    const toolsPath = tp();
    const workDir = cwd ?? resolveActiveProjectDir();
    try {
      const output = execSync(`node "${toolsPath}" ${subcommand}`, {
        encoding: "utf8",
        timeout: 15000,
        cwd: workDir,
      });
      return JSON.parse(output);
    } catch (e) {
      return { error: String(e) };
    }
  }

  function noProject(): string {
    const projectDir = resolveActiveProjectDir();
    // projectDir is cwd fallback if nothing tracked
    const hasGsd = existsSync(join(projectDir, ".planning"));
    if (!hasGsd) {
      return fmt(
        `⚠️ **No GSD project found.**\n\nActive directory: ${projectDir}\n\nRun **/gsd_new_project** to initialize a project here, or add your project with **/gsd_project_list add**`
      );
    }
    return "";  // project exists, no error
  }

  // ── /gsd_status ───────────────────────────────────────────────────────────
  api.registerCommand({
    name: "gsd_status",
    description: "Show GSD project status — milestone, phase, progress",
    acceptsArgs: false,
    requireAuth: false,
    handler() {
      try {
        const err = noProject(); if (err) return { text: err };
        const snap = runTools("state-snapshot") as Record<string, unknown>;
        if ((snap as Record<string, unknown>).error) return { text: noProject() || "No GSD project." };
        const cfg = ((snap as Record<string, unknown>).config ?? {}) as Record<string, unknown>;
        const progress = ((snap as Record<string, unknown>).progress ?? {}) as Record<string, unknown>;
        const milestone = (cfg.milestone ?? "v?") as string;
        const milestoneName = (cfg.milestone_name ?? "") as string;
        const total = (progress.total_plans ?? 0) as number;
        const done = (progress.completed_plans ?? 0) as number;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const filled = Math.round((pct / 100) * 10);
        const bar = "█".repeat(filled) + "░".repeat(10 - filled);
        const phase = (cfg.current_phase ?? (progress as Record<string, unknown>).current_phase ?? "—") as string;
        const status = (cfg.status ?? "active") as string;
        const name = resolveActiveProjectDir().split("/").pop() ?? "project";
        return { text: fmt([
          `**GSD Status — ${name}**`, ``,
          `Milestone: **${milestone}${milestoneName ? " · " + milestoneName : ""}**`,
          `Phase: ${phase}  Status: ${status}`,
          `Progress: [${bar}] ${done}/${total} (${pct}%)`,
        ].join("\n")) };
      } catch {
        return { text: noProject() || "Error reading project." };
      }
    },
  });

  // ── /gsd_progress ─────────────────────────────────────────────────────────
  api.registerCommand({
    name: "gsd_progress",
    description: "Show GSD phase progress breakdown",
    acceptsArgs: false,
    requireAuth: false,
    handler() {
      try {
        const err = noProject(); if (err) return { text: err };
        const roadmap = runTools("roadmap analyze") as Record<string, unknown>;
        if ((roadmap as Record<string, unknown>).error) return { text: "No GSD project or ROADMAP.md missing." };

        const allPhases = (roadmap.phases ?? []) as Array<Record<string, unknown>>;
        const total = (roadmap.total_plans ?? 0) as number;
        const done = (roadmap.total_summaries ?? 0) as number;
        const completedCount = (roadmap.completed_phases ?? 0) as number;
        const nextPhase = roadmap.next_phase as string | null;
        const pct = allPhases.length > 0 ? Math.round((completedCount / allPhases.length) * 100) : 0;
        const filled = Math.round((pct / 100) * 10);
        const bar = "█".repeat(filled) + "░".repeat(10 - filled);

        const rows = allPhases.map(p => {
          const disk = p.disk_status as string;
          const plans = (p.plan_count ?? 0) as number;
          const summaries = (p.summary_count ?? 0) as number;
          const isComplete = disk === "complete" && summaries === plans && plans > 0;
          const isNext = String(p.number) === String(nextPhase);
          const icon = isComplete ? "✅" : isNext ? "▶️" : "⏳";
          const detail = plans > 0 ? ` — ${summaries}/${plans} plans` : " — not started";
          return `${icon} Phase ${p.number}: ${p.name}${detail}`;
        });

        const lines: string[] = [
          `**GSD Progress — ${roadmap.completed_phases ?? 0}/${allPhases.length} phases done**`,
          `[${bar}] ${pct}% (${done}/${total} plans)`,
          ``,
          ...rows,
        ];

        if (nextPhase) {
          const np = allPhases.find(p => String(p.number) === String(nextPhase));
          if (np) {
            lines.push(``, `**Next up: Phase ${np.number} — ${np.name}**`);
            lines.push(`Run /gsd_discuss_phase ${np.number} to start`);
          }
        } else if (completedCount === allPhases.length && allPhases.length > 0) {
          lines.push(``, `🎉 **All phases complete!**`);
          lines.push(`Run /gsd_new_milestone to start the next milestone`);
        }

        return { text: fmt(lines.join("\n")) };
      } catch {
        return { text: "Error reading project progress." };
      }
    },
  });

  // ── /gsd_help ─────────────────────────────────────────────────────────────
  api.registerCommand({
    name: "gsd_help",
    description: "List all GSD commands available in Telegram",
    acceptsArgs: false,
    requireAuth: false,
    handler() {
      return { text: fmt([
        `**GSD Commands for Telegram**`,
        ``,
        `**Project:**`,
        `/gsd_new_project — Initialize new GSD project`,
        `/gsd_map_codebase — Generate codebase map`,
        ``,
        `**Phase Planning:**`,
        `/gsd_discuss_phase <N> — Capture design decisions`,
        `/gsd_research_phase <N> — Research phase domain`,
        `/gsd_list_phase_assumptions <N> — Preview approach`,
        `/gsd_plan_phase <N> — Plan a phase`,
        ``,
        `**Execution:**`,
        `/gsd_execute_phase <N> — Execute plans in phase`,
        `/gsd_quick <description> — Ad-hoc task`,
        ``,
        `**Roadmap:**`,
        `/gsd_add_phase <desc> — Add phase`,
        `/gsd_insert_phase <N> <desc> — Insert phase`,
        `/gsd_remove_phase <N> — Remove phase`,
        ``,
        `**Milestones:**`,
        `/gsd_new_milestone <version> — Start milestone`,
        `/gsd_complete_milestone <ver> — Archive milestone`,
        `/gsd_progress — Show progress`,
        ``,
        `**Session:**`,
        `/gsd_resume_work — Resume from saved state`,
        `/gsd_pause_work — Save state`,
        ``,
        `**Verification:**`,
        `/gsd_verify_work <N> — Verify phase`,
        `/gsd_audit_milestone <ver> — Full audit`,
        `/gsd_add_tests — Add test coverage`,
        ``,
        `**Todos & Debug:**`,
        `/gsd_add_todo <desc> — Add TODO`,
        `/gsd_check_todos — Review TODOs`,
        `/gsd_debug <issue> — Debug workflow`,
        ``,
        `**Config:**`,
        `/gsd_set_profile <profile> — Set model profile`,
        `/gsd_settings — Show config`,
        `/gsd_health — Health check`,
        ``,
        `**Utility:**`,
        `/gsd_status — Project status`,
        `/gsd_update — Update plugin from GitHub`,
        `/gsd_project_list — Tracked projects`,
        `/gsd_set_project <name|#N> — Switch active project`,
        `/gsd_cleanup — Clean up artifacts`,
        `/gsd_help — This listing`,
      ].join("\n")) };
    },
  });

  // ── /gsd_health ───────────────────────────────────────────────────────────
  api.registerCommand({
    name: "gsd_health",
    description: "Run GSD project health check",
    acceptsArgs: false,
    requireAuth: false,
    handler() {
      try {
        const result = runTools("validate health") as Record<string, unknown>;
        if ((result as Record<string, unknown>).error) return { text: noProject() };
        const healthy = (result.healthy ?? result.valid ?? false) as boolean;
        const issues = (result.issues ?? []) as string[];
        const warnings = (result.warnings ?? []) as string[];
        const lines = [
          `**GSD Health Check**`,
          ``,
          healthy ? `✅ Project is healthy` : `❌ Issues found`,
          ...issues.map((i: string) => `• ${i}`),
          ...(warnings.length > 0 ? [``, `⚠️ Warnings:`] : []),
          ...warnings.map((w: string) => `• ${w}`),
        ];
        return { text: fmt(lines.join("\n")) };
      } catch {
        return { text: noProject() };
      }
    },
  });

  // ── /gsd_project_list ─────────────────────────────────────────────────────
  api.registerCommand({
    name: "gsd_project_list",
    description: "List, add, or remove tracked GSD projects. Usage: [list|add|remove] [name/path]",
    acceptsArgs: true,
    requireAuth: false,
    handler(ctx) {
      const parts = ((ctx as {args?: string}).args ?? "").trim().split(/\s+/).filter(Boolean);
      const action = parts[0] || "list";
      const target = parts.slice(1).join(" ");
      const tPath = tp();

      if (action === "remove" && !target) {
        return { text: `Usage: **/gsd_project_list remove <name>**` };
      }

      try {
        let subcmd: string;
        if (action === "add") {
          subcmd = target ? `project-list add "${target}"` : `project-list add`;
        } else if (action === "remove") {
          subcmd = `project-list remove "${target}"`;
        } else {
          subcmd = `project-list list`;
        }

        const raw = execSync(`node "${tPath}" ${subcmd}`, { encoding: "utf8", timeout: 10000 });
        const result = JSON.parse(raw) as Record<string, unknown>;

        if (action === "list") {
          const projects = (result.projects ?? []) as Array<{name: string; path: string; added: string; last_active: string}>;
          if (projects.length === 0) {
            return { text: fmt(`**GSD Projects**\n\nNo projects tracked yet.\n\nAdd current project: **/gsd_project_list add**`) };
          }
          const rows = projects.map((p, i) =>
            `${i + 1}. **${p.name}**\n   ${p.path}\n   Added: ${p.added} · Active: ${p.last_active}`
          ).join("\n\n");
          return { text: fmt(`**GSD Projects** (${projects.length})\n\n${rows}\n\n/gsd_project_list add — register\n/gsd_project_list remove <name> — unregister`) };
        }
        if (action === "add") {
          return { text: `✅ Registered: **${result.name as string}**\n${result.path as string}` };
        }
        if (action === "remove") {
          return result.removed
            ? { text: `✅ Removed: **${target}**` }
            : { text: `Project not found: **${target}**\n\nRun **/gsd_project_list** to see tracked projects.` };
        }
        return { text: JSON.stringify(result, null, 2) };
      } catch (e) {
        return { text: `Error: ${String(e).slice(0, 300)}` };
      }
    },
  });

  // ── /gsd_set_project ──────────────────────────────────────────────────────
  api.registerCommand({
    name: "gsd_set_project",
    description: "Set the active GSD project by name or number. Usage: gsd_set_project <name|#N>",
    acceptsArgs: true,
    requireAuth: false,
    handler(ctx) {
      const query = ((ctx as {args?: string}).args ?? "").trim();
      if (!query) {
        // Show list with numbers for easy selection
        try {
          const tPath = tp();
          const raw = execSync(`node "${tPath}" project-list list`, { encoding: "utf8", timeout: 10000 });
          const result = JSON.parse(raw) as { projects?: Array<{name: string; path: string; last_active: string}> };
          const projects = result.projects ?? [];
          if (projects.length === 0) {
            return { text: `No projects tracked.\n\nAdd one: **/gsd_project_list add**` };
          }
          const rows = projects.map((p, i) => `${i + 1}. **${p.name}**\n   ${p.path}`).join("\n\n");
          return { text: fmt(`**Set Active Project**\n\nUsage: /gsd_set_project <name or #N>\n\n${rows}`) };
        } catch (e) {
          return { text: `Error: ${String(e).slice(0, 200)}` };
        }
      }
      try {
        const tPath = tp();
        const raw = execSync(`node "${tPath}" project-list list`, { encoding: "utf8", timeout: 10000 });
        const result = JSON.parse(raw) as { projects?: Array<{name: string; path: string}> };
        const projects = result.projects ?? [];

        let match: { name: string; path: string } | undefined;
        // Match by #N index
        const indexMatch = query.match(/^#?(\d+)$/);
        if (indexMatch) {
          const idx = parseInt(indexMatch[1], 10) - 1;
          match = projects[idx];
        } else {
          // Match by name (case-insensitive substring)
          match = projects.find(p => p.name.toLowerCase().includes(query.toLowerCase()));
        }

        if (!match) {
          return { text: `Project not found: **${query}**\n\nRun /gsd_set_project to see options.` };
        }

        // Update last_active to make it the "most recent"
        const registryPath = join(homedir(), ".gsd", "projects.json");
        const registry = JSON.parse(readFileSync(registryPath, "utf8")) as { version: number; projects: Array<{name: string; path: string; added: string; last_active: string}> };
        registry.projects = registry.projects.map(p =>
          p.path === match!.path
            ? { ...p, last_active: new Date().toISOString().slice(0, 10) }
            : p
        );
        const { writeFileSync } = require("fs") as typeof import("fs");
        writeFileSync(registryPath, JSON.stringify(registry, null, 2), "utf8");

        return { text: fmt(`✅ **Active project set:**\n\n**${match.name}**\n${match.path}\n\nRun /gsd_status to confirm.`) };
      } catch (e) {
        return { text: `Error: ${String(e).slice(0, 300)}` };
      }
    },
  });

  // ── /gsd_cleanup ──────────────────────────────────────────────────────────
  api.registerCommand({
    name: "gsd_cleanup",
    description: "Clean up GSD temp artifacts (research files)",
    acceptsArgs: false,
    requireAuth: false,
    handler() {
      try {
        const { readdirSync, unlinkSync, statSync, existsSync: fsExists } = require("fs") as typeof import("fs");
        const researchDir = join(process.cwd(), ".planning", "research");
        const cleaned: string[] = [];
        if (fsExists(researchDir)) {
          for (const f of readdirSync(researchDir)) {
            if (f.endsWith(".md")) {
              const fp = join(researchDir, f);
              if (statSync(fp).isFile()) { unlinkSync(fp); cleaned.push(f); }
            }
          }
        }
        return { text: fmt([
          `**GSD Cleanup**`,
          ``,
          cleaned.length > 0
            ? `✅ Removed ${cleaned.length} temp file(s):\n${cleaned.map((f: string) => `• ${f}`).join("\n")}`
            : `✅ Nothing to clean up — project is tidy`,
        ].join("\n")) };
      } catch (e) {
        return { text: `Error: ${String(e).slice(0, 200)}` };
      }
    },
  });

  // ── /gsd_update ───────────────────────────────────────────────────────────
  api.registerCommand({
    name: "gsd_update",
    description: "Pull latest GSD plugin from GitHub and reinstall",
    acceptsArgs: false,
    requireAuth: false,
    handler() {
      const home = homedir();
      const repoDir = join(home, "projects", "plan-builder-plugins");
      const pluginSrc = join(repoDir, "openclaw-plugin");
      const installDir = join(home, ".openclaw", "extensions", "gsd-for-openclaw");
      const log: string[] = [];

      let oldVersion = "unknown";
      try {
        const cur = JSON.parse(readFileSync(join(installDir, "openclaw.plugin.json"), "utf8")) as { version?: string };
        oldVersion = cur.version ?? "unknown";
      } catch { /* first install */ }

      try {
        if (existsSync(join(repoDir, ".git"))) {
          const pullOut = execSync(`git -C "${repoDir}" pull --ff-only`, { encoding: "utf8", timeout: 30000 });
          const msg = pullOut.trim() || "Already up to date.";
          log.push(`📡 ${msg}`);
        } else {
          log.push(`📡 Cloning repo...`);
          execSync(`git clone https://github.com/luvvano/plan-builder-plugins "${repoDir}"`, { encoding: "utf8", timeout: 60000 });
          log.push(`Cloned successfully.`);
        }
      } catch (e) {
        return { text: `❌ Git error: ${String(e).slice(0, 300)}` };
      }

      let commitHash = "";
      try { commitHash = execSync(`git -C "${repoDir}" rev-parse --short HEAD`, { encoding: "utf8" }).trim(); } catch { /* ignore */ }

      let newVersion = "unknown";
      try {
        const nxt = JSON.parse(readFileSync(join(pluginSrc, "openclaw.plugin.json"), "utf8")) as { version?: string };
        newVersion = nxt.version ?? "unknown";
      } catch { /* ignore */ }

      try {
        execSync(`rsync -a --exclude=node_modules "${pluginSrc}/" "${installDir}/"`, { encoding: "utf8", timeout: 30000 });
        log.push(`📦 Files copied (rsync)`);
      } catch {
        try {
          cpSync(pluginSrc, installDir, { recursive: true, filter: (s: string) => !s.includes("node_modules") });
          log.push(`📦 Files copied (cpSync)`);
        } catch (e2) {
          return { text: `❌ Copy error: ${String(e2).slice(0, 200)}` };
        }
      }

      try {
        // Detached spawn — outlives the gateway process being killed
        const child = spawn("openclaw", ["gateway", "restart"], {
          detached: true,
          stdio: "ignore",
        });
        child.unref();
        log.push(`🔄 Gateway restarting...`);
      } catch {
        log.push("⚠️ Gateway restart failed — run: openclaw gateway restart manually");
      }

      const versionLine = oldVersion === newVersion
        ? `Version: **${newVersion}**${commitHash ? ` @ ${commitHash}` : ""}`
        : `Version: **${oldVersion}** → **${newVersion}**${commitHash ? ` @ ${commitHash}` : ""}`;

      return { text: fmt([
        `✅ **GSD plugin updated**`, ``, versionLine, ``, ...log, ``, `Changes are live.`,
      ].join("\n")) };
    },
  });

  // ── /gsd_settings ─────────────────────────────────────────────────────────
  api.registerCommand({
    name: "gsd_settings",
    description: "Show current GSD project configuration",
    acceptsArgs: false,
    requireAuth: false,
    handler() {
      try {
        const configPath = join(resolveActiveProjectDir(), ".planning", "config.json");
        const raw = readFileSync(configPath, "utf8");
        const cfg = JSON.parse(raw) as Record<string, unknown>;
        return { text: "**GSD Settings**\n\n" + JSON.stringify(cfg, null, 2) };
      } catch {
        return { text: noProject() };
      }
    },
  });

  // ── Telegram bot command menu ──────────────────────────────────────────────
  const GSD_COMMANDS = [
    // Utility (Phase 4)
    { command: "gsd_status",              description: "Show GSD project status" },
    { command: "gsd_progress",            description: "Show phase progress and roadmap" },
    { command: "gsd_help",                description: "List all GSD commands" },
    { command: "gsd_health",              description: "Run project health check" },
    { command: "gsd_settings",            description: "Show project configuration" },
    { command: "gsd_cleanup",             description: "Clean up temp research files" },
    { command: "gsd_update",              description: "Update plugin from GitHub" },
    { command: "gsd_project_list",        description: "List or manage tracked projects" },
    { command: "gsd_set_project",         description: "Set the active GSD project" },
    // Workflow (Phase 5)
    { command: "gsd_quick",               description: "Run an ad-hoc GSD task" },
    { command: "gsd_new_project",         description: "Initialize a new GSD project" },
    { command: "gsd_discuss_phase",       description: "Capture design decisions for a phase" },
    { command: "gsd_plan_phase",          description: "Plan a phase with research" },
    { command: "gsd_execute_phase",       description: "Execute plans in a phase" },
    { command: "gsd_verify_work",         description: "Verify phase deliverables" },
    { command: "gsd_add_phase",           description: "Add a new phase to the roadmap" },
    { command: "gsd_insert_phase",        description: "Insert a phase at a position" },
    { command: "gsd_remove_phase",        description: "Remove a phase from the roadmap" },
    { command: "gsd_new_milestone",       description: "Start a new milestone" },
    { command: "gsd_complete_milestone",  description: "Archive and complete a milestone" },
    { command: "gsd_resume_work",         description: "Resume from saved project state" },
    { command: "gsd_pause_work",          description: "Save state and pause work" },
    { command: "gsd_debug",               description: "Debug a project workflow issue" },
    { command: "gsd_add_todo",            description: "Add a TODO item" },
    { command: "gsd_check_todos",         description: "Review and triage TODOs" },
    { command: "gsd_audit_milestone",     description: "Full milestone audit" },
    { command: "gsd_add_tests",           description: "Add test coverage to current phase" },
  ] as const;

  api.on("gateway_start", async () => {
    const channels = (api.config as Record<string, unknown>).channels as Record<string, unknown> | undefined;
    const tgCfg = channels?.telegram as Record<string, unknown> | undefined;
    const token = tgCfg?.botToken as string | undefined;
    if (!token) {
      api.logger.warn("[gsd] setMyCommands skipped: no Telegram botToken in config");
      return;
    }
    try {
      const url = `https://api.telegram.org/bot${token}/setMyCommands`;
      const body = JSON.stringify({ commands: GSD_COMMANDS });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json() as { ok: boolean; description?: string };
      if (data.ok) {
        api.logger.info(`[gsd] setMyCommands: registered ${GSD_COMMANDS.length} commands`);
      } else {
        api.logger.warn(`[gsd] setMyCommands failed: ${data.description ?? "unknown error"}`);
      }
    } catch (e) {
      api.logger.warn(`[gsd] setMyCommands error: ${String(e).slice(0, 200)}`);
    }
  });
}
