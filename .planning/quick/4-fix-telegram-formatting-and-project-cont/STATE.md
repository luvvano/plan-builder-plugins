
## Behavior Rule Added (2026-03-05)
Before running `openclaw gateway restart`, always send a Telegram message first via `message` tool.
The gateway restart kills the session mid-execution — tool result never returns, user gets no feedback.
Pattern:
1. Do work (rsync, git)
2. `message(action=send, channel=telegram, target=87826058, message="⚙️ Deploying [X]... restarting gateway")`
3. `openclaw gateway restart`
