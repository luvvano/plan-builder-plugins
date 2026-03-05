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
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

  // ── Helper: shell out to gsd-tools.cjs ──────────────────────────────
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

  // ── /gsd:help — colon-namespaced command (validates FOUND-05) ───────────
  api.registerCommand({
    name: "gsd:help",
    description: "List all GSD commands organized by workflow stage",
    acceptsArgs: false,
    requireAuth: false,
    handler() {
      return {
        text: [
          "**GSD for OpenClaw** — Spec-driven development workflows",
          "",
          "**Project Initialization:**",
          "  /gsd:new-project               — Full initialization: research → requirements → roadmap",
          "  /gsd:map-codebase              — Generate architectural map of existing codebase",
          "",
          "**Phase Planning:**",
          "  /gsd:discuss-phase <N>         — Capture design decisions before planning",
          "  /gsd:research-phase <N>        — Research phase domain (niche/complex)",
          "  /gsd:list-phase-assumptions <N> — Preview Claude's intended approach",
          "  /gsd:plan-phase <N>            — Research + plan + verify for a phase",
          "",
          "**Execution:**",
          "  /gsd:execute-phase <N>         — Execute all plans in a phase",
          "",
          "**Quick Mode:**",
          "  /gsd:quick                     — Ad-hoc task with GSD guarantees",
          "",
          "**Roadmap Management:**",
          "  /gsd:add-phase <description>   — Add phase to end of roadmap",
          "  /gsd:insert-phase <N> <desc>   — Insert phase at position",
          "  /gsd:remove-phase <N>          — Remove phase from roadmap",
          "",
          "**Milestones:**",
          "  /gsd:new-milestone <name>      — Start new milestone",
          "  /gsd:complete-milestone <ver>  — Complete and archive milestone",
          "  /gsd:progress                  — Show milestone/phase progress",
          "",
          "**Session Management:**",
          "  /gsd:resume-work               — Resume from last saved state",
          "  /gsd:pause-work                — Save state for later resumption",
          "",
          "**Debugging:**",
          "  /gsd:debug [issue]             — Systematic debugging workflow",
          "",
          "**Todos:**",
          "  /gsd:add-todo [description]    — Add TODO to STATE.md",
          "  /gsd:check-todos [area]        — Review pending TODOs",
          "",
          "**Verification:**",
          "  /gsd:verify-work [phase]       — Verify phase completion",
          "  /gsd:audit-milestone [version] — Full milestone audit",
          "  /gsd:plan-milestone-gaps       — Plan gap closure for unmet requirements",
          "",
          "**Testing:**",
          "  /gsd:add-tests                 — Add test coverage for code areas",
          "",
          "**Configuration:**",
          "  /gsd:settings                  — Display current GSD config",
          "  /gsd:set-profile <profile>     — Set model profile",
          "  /gsd:health                    — Project health check",
          "",
          "**Utility:**",
          "  /gsd:cleanup                   — Clean up GSD artifacts",
          "  /gsd:help                      — This help listing",
          "  /gsd:status                    — Show project status",
          "",
          `Planning directory: ${planningDir}`,
          `GSD_TOOLS_PATH: ${process.env.GSD_TOOLS_PATH ?? "(not set)"}`,
        ].join("\n"),
      };
    },
  });

  // ── /gsd:status — second colon-namespaced command ───────────────────────
  api.registerCommand({
    name: "gsd:status",
    description: "Show GSD project status",
    acceptsArgs: false,
    requireAuth: false,
    handler() {
      const hasPlanning = existsSync(planningDir);
      return {
        text: hasPlanning
          ? `GSD project found. Planning directory: ${planningDir}`
          : "No GSD project found. Run /gsd:new-project to initialize.",
      };
    },
  });
}
