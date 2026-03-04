# plan-builder-plugins

Plan builder plugin for **OpenClaw** and **Claude Code**.

Takes a task description → generates `.planning/PROJECT.md` + `.planning/ROADMAP.md`.

```
plan-builder-plugins/
├── openclaw-plugin/   ← OpenClaw TypeScript plugin
└── claude-code-plugin/ ← Claude Code plugin (Markdown-based)
```

---

## Quick start

- [OpenClaw plugin →](./openclaw-plugin/README.md)
- [Claude Code plugin →](./claude-code-plugin/README.md)

---

## OpenClaw: установка с нуля

### 1. Клонируй репо

```bash
git clone git@github.com:luvvano/plan-builder-plugins.git
cd plan-builder-plugins
```

### 2. Скопируй плагин в extensions

OpenClaw загружает плагины из нескольких мест. Самый простой — глобальный extensions:

```bash
mkdir -p ~/.openclaw/extensions/plan-builder
cp -r openclaw-plugin/src/index.ts ~/.openclaw/extensions/plan-builder/
cp openclaw-plugin/openclaw.plugin.json ~/.openclaw/extensions/plan-builder/
```

### 3. Добавь плагин в allowlist и config

Открой `~/.openclaw/openclaw.json` и добавь:

```json
{
  "plugins": {
    "allow": ["plan-builder"],
    "entries": {
      "plan-builder": {
        "enabled": true,
        "config": {
          "outputDir": ".planning",
          "defaultPhases": 4
        }
      }
    }
  }
}
```

Через CLI:

```bash
openclaw config set plugins.allow '["plan-builder"]'
openclaw config set plugins.entries.plan-builder.enabled true
openclaw config set plugins.entries.plan-builder.config.outputDir '".planning"'
openclaw config set plugins.entries.plan-builder.config.defaultPhases 4
```

### 4. Включи инструмент для агента

Чтобы агент мог вызывать `plan_builder` tool, добавь его в allowlist:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "allow": ["plan_builder"]
        }
      }
    ]
  }
}
```

### 5. (Опционально) Добавь скилл

```bash
mkdir -p ~/.openclaw/workspace/skills/planning
cp openclaw-plugin/skills/planning/SKILL.md ~/.openclaw/workspace/skills/planning/
```

### 6. Перезапусти Gateway

```bash
openclaw gateway restart
```

### 7. Проверь установку

```bash
# Плагин должен быть в списке
openclaw plugins list

# Проверь логи
tail -f /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log | grep plan-builder

# В чате:
# /plan build a REST API with JWT auth
```

### Как работает

1. `/plan <task>` — мгновенная команда, не вызывает LLM, просит тебя использовать tool
2. `plan_builder` tool — агент вызывает его, tool возвращает инструкции для суб-агента
3. Суб-агент создаёт `.planning/PROJECT.md` и `.planning/ROADMAP.md`

---

## Claude Code: установка с нуля

### 1. Глобальная установка (все проекты)

```bash
claude plugin install ./claude-code-plugin
```

### 2. Проверь

```bash
claude plugin list
# Должен показать: plan-builder-cc v1.0.0
```

### 3. Использование

```bash
# В Claude Code сессии:
/plan-builder-cc:plan build a todo app with React and Go backend

# Или проект-локально — скопируй в .claude/:
mkdir -p .claude/commands .claude/agents
cp claude-code-plugin/commands/*.md .claude/commands/
cp claude-code-plugin/agents/*.md .claude/agents/
# Теперь: /plan <task> (без namespace)
```

---

## Структура файлов

```
openclaw-plugin/
├── openclaw.plugin.json   ← манифест (required)
├── package.json           ← ESM, openclaw.extensions pointer
├── tsconfig.json
├── src/
│   └── index.ts           ← /plan command + plan_builder tool + background service
├── skills/
│   └── planning/
│       └── SKILL.md       ← скилл для автотриггеринга
└── README.md

claude-code-plugin/
├── .claude-plugin/
│   └── plugin.json        ← манифест
├── commands/
│   ├── plan.md            ← /plan <task>
│   └── plan-status.md     ← /plan-status
├── agents/
│   ├── plan-builder.md    ← основной агент
│   └── phase-executor.md  ← выполнение фаз
├── hooks/
│   ├── hooks.json         ← SessionStart hook
│   └── load-plan-context.sh
├── skills/
│   └── planning/
│       └── planning.md
└── README.md
```

---

## Что генерирует система

```
.planning/
├── PROJECT.md    ← цель, стек, ограничения, out of scope
└── ROADMAP.md    ← 4 фазы с конкретными deliverables
```

Пример `.planning/PROJECT.md`:

```markdown
# Project: REST API with JWT Auth

## Goal
HTTP REST API с JWT-авторизацией, CRUD для users и tasks.

## Tech Stack
- Go + Gin
- PostgreSQL
- JWT (golang-jwt/jwt)

## Constraints
- Stateless auth (no sessions)
- Docker-ready

## Out of Scope (v1)
- OAuth
- Rate limiting
- Admin panel
```
