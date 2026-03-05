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
import { readFileSync } from "node:fs";
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

  // NOTE: All gsd:* slash commands are implemented as SKILL.md files under
  // skills/workflows/*/SKILL.md — OpenClaw's registerCommand API does not allow
  // colons in command names, so SKILL.md is the correct mechanism for gsd:* commands.
  // The registerTool calls above use underscores and work correctly.
}
