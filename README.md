# plan-builder-plugins

Development workflow plugins for OpenClaw and Claude Code. The primary plugin is **GSD for OpenClaw** — a full spec-driven development system with 26 commands for planning, executing, and verifying coding workflows.

```
plan-builder-plugins/
├── openclaw-plugin/    -- GSD for OpenClaw (full spec-driven dev system)
└── claude-code-plugin/ -- Claude Code plugin (Markdown-based)
```

---

## Installation

```bash
git clone https://github.com/luvvano/plan-builder-plugins.git && cd plan-builder-plugins && ./install.sh
```

## Quick start

### OpenClaw (GSD plugin)

```bash
git clone https://github.com/luvvano/plan-builder-plugins.git
cp -r plan-builder-plugins/openclaw-plugin ~/.openclaw/extensions/gsd-for-openclaw
openclaw gateway restart
```

Then run `/gsd:help` in chat to see all commands.

See [OpenClaw plugin README](./openclaw-plugin/README.md) for the full installation guide.

### Claude Code

```bash
claude plugin install ./claude-code-plugin
```

See [Claude Code plugin README](./claude-code-plugin/README.md) for details.
