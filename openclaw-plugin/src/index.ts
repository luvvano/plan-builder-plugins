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
import { existsSync } from "node:fs";
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

  // ── /gsd:help — colon-namespaced command (validates FOUND-05) ───────────
  api.registerCommand({
    name: "gsd:help",
    description: "List all GSD commands organized by workflow stage",
    acceptsArgs: false,
    requireAuth: false,
    handler() {
      return {
        text: [
          "**GSD for OpenClaw** - Spec-driven development workflows",
          "",
          "**Setup:**",
          "  /gsd:new-project      - Initialize a new GSD project",
          "",
          "**Planning:**",
          "  /gsd:discuss-phase    - Capture design decisions for a phase",
          "  /gsd:plan-phase       - Create executable plans for a phase",
          "  /gsd:research-phase   - Research a phase domain",
          "",
          "**Execution:**",
          "  /gsd:execute-phase    - Execute all plans in a phase",
          "",
          "**Verification:**",
          "  /gsd:verify-work      - Verify phase completion",
          "",
          "**Status:**",
          "  /gsd:status           - Show project status",
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
