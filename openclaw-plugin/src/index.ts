/**
 * Plan Builder — OpenClaw Plugin
 *
 * Generates PROJECT.md and ROADMAP.md for coding tasks via the plan_builder tool.
 * Register the /plan slash command for quick kicks and the plan_builder tool for
 * structured plan generation by a sub-agent.
 *
 * Config (openclaw.json → plugins.entries.plan-builder.config):
 *   outputDir     — where to write plan files (default: ".planning")
 *   defaultPhases — how many roadmap phases to generate (default: 4)
 */

export default function planBuilderPlugin(api: any): void {
  // ── Config ────────────────────────────────────────────────────────────────
  const cfg = api.config?.plugins?.entries?.["plan-builder"]?.config ?? {};
  const outputDir: string = cfg.outputDir ?? ".planning";
  const defaultPhases: number = cfg.defaultPhases ?? 4;

  api.logger.info("[plan-builder] plugin loaded, outputDir=" + outputDir);

  // ── /plan slash command ───────────────────────────────────────────────────
  /**
   * Usage:  /plan <task description>
   * Returns a prompt the user can drop into chat to kick off plan generation.
   */
  api.registerCommand({
    name: "plan",
    acceptsArgs: true,
    requireAuth: true,
    handler(_ctx: any, args: string): { text: string } {
      const task = args?.trim();

      if (!task) {
        return {
          text: [
            "**Plan Builder** — usage:",
            "",
            "  `/plan <task description>`",
            "",
            "Example:",
            "  `/plan Build a REST API with JWT auth and Postgres`",
            "",
            "Once you have a task, the agent will call `plan_builder` to generate",
            "`.planning/PROJECT.md` and `.planning/ROADMAP.md` in your project.",
          ].join("\n"),
        };
      }

      return {
        text:
          `⚡ Kick off: ask me to use \`plan_builder\` for: ${task}\n` +
          `_(paste the line above into chat to start)_`,
      };
    },
  });

  // ── plan_builder tool ─────────────────────────────────────────────────────
  /**
   * Called by the agent to build a sub-agent task string that instructs the
   * sub-agent to create PROJECT.md and ROADMAP.md in the target directory.
   *
   * The tool is marked optional so OpenClaw only exposes it when explicitly
   * allowed in the agent's tool list.
   */
  api.registerTool({
    name: "plan_builder",
    optional: true,
    description:
      "Generates PROJECT.md and ROADMAP.md for a coding task. " +
      "Returns sub-agent instructions — execute them to write the files.",
    parameters: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "Full task description — what needs to be built",
        },
        output_dir: {
          type: "string",
          description: `Output directory for plan files (default: "${outputDir}")`,
        },
        phases: {
          type: "number",
          description: `Number of phases in the roadmap (default: ${defaultPhases})`,
        },
      },
      required: ["task"],
    },

    execute(_id: string, params: Record<string, any>) {
      const task: string = params.task;
      const dir: string = params.output_dir ?? outputDir;
      const phaseCount: number = params.phases ?? defaultPhases;

      // Build numbered phase placeholders for the sub-agent to fill in.
      const phasePlaceholders = Array.from({ length: phaseCount }, (_, i) => {
        const n = i + 1;
        return [
          `## Phase ${n} — <Name>`,
          "",
          "- <Deliverable 1>",
          "- <Deliverable 2>",
          "- <Deliverable 3>",
        ].join("\n");
      }).join("\n\n");

      // Detailed instruction string for the sub-agent.
      const instructions = [
        `You are a planning sub-agent. Your job is to create structured plan files for the following task:`,
        ``,
        `TASK: ${task}`,
        ``,
        `## Instructions`,
        ``,
        `1. Create the directory \`${dir}/\` if it does not exist.`,
        ``,
        `2. Write \`${dir}/PROJECT.md\` using this exact template`,
        `   (fill in every section based on the task; be concrete and specific):`,
        ``,
        `\`\`\`markdown`,
        `# Project Name`,
        ``,
        `## Goal`,
        ``,
        `<!-- One paragraph: what this project builds and why. -->`,
        ``,
        `## Tech Stack`,
        ``,
        `<!-- Bullet list. Infer from the task description. -->`,
        `- `,
        ``,
        `## Constraints`,
        ``,
        `<!-- Known technical, time, or resource constraints. -->`,
        `- `,
        ``,
        `## Out of Scope (v1)`,
        ``,
        `<!-- Things explicitly NOT in the first version. -->`,
        `- `,
        `\`\`\``,
        ``,
        `3. Write \`${dir}/ROADMAP.md\` with exactly ${phaseCount} phases`,
        `   using this template (replace placeholders with real deliverables):`,
        ``,
        `\`\`\`markdown`,
        `# Roadmap`,
        ``,
        phasePlaceholders,
        `\`\`\``,
        ``,
        `   Rules for phases:`,
        `   - Give each phase a descriptive name (e.g. "Data Models", "Core API", "Auth", "Testing & Docs")`,
        `   - Each deliverable must be concrete and independently testable`,
        `   - Tailor phases to the project type:`,
        `     * API project   → Data models | Core endpoints | Auth | Testing & docs`,
        `     * CLI project   → Core commands | Config & flags | Error handling | Distribution`,
        `     * Frontend      → Components | State & routing | API integration | Polish & perf`,
        `     * Other         → Use your best judgment`,
        ``,
        `4. After writing both files, output a short confirmation:`,
        `   - Files created: \`${dir}/PROJECT.md\`, \`${dir}/ROADMAP.md\``,
        `   - 5-bullet summary of the plan`,
        `   - "Planning complete ✅"`,
      ].join("\n");

      return {
        content: [{ type: "text", text: instructions }],
      };
    },
  });

  // ── Background service ────────────────────────────────────────────────────
  /**
   * Minimal lifecycle hooks so OpenClaw can track the plugin as a service.
   * Add any startup/shutdown logic here (e.g. file watchers, caches).
   */
  api.registerService({
    id: "plan-builder-svc",
    start() {
      api.logger.info("[plan-builder] ready");
    },
    stop() {
      api.logger.info("[plan-builder] stopped");
    },
  });
}
