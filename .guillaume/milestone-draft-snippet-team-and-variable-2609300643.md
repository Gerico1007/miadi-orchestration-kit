## setup

The plugin is installed from GitHub:

```bash
claude plugin marketplace add jgwill/miadi-orchestration-kit
claude plugin install miadi-session-observability@miadi-orchestration-kit
```

## Environment variables

It reads these variables from the shell the agent starts in.

| variable | what it is for |
|---|---|
| `MIADI_SESSION_DIR` | Where captures are written: one folder per session, `$MIADI_SESSION_DIR/<session_id>/`, and one line per session start, end and rename in `$MIADI_SESSION_DIR/data/terminal_bindings.jsonl` |
| `MIADI_ORCHESTRATION_KIT_ROOT` | A clone of `jgwill/miadi-orchestration-kit`. The plugin reads the team list from `teams/teams.json` in it. Without it, every session's team is `unassigned`. |
| `MIADI_TEAM` | Optional. Sets the team for one agent, over every other rule. |
| `MIADI_LAUNCH_ALIAS` | The name of the launcher that started the agent. Saved as `launch_alias` in the binding line. |
| `MIADI_CHRONICLE_ROOT` | The Miadi Chronicle, one folder per episode, created with `mkepisode` from npm [`passages`](https://www.npmjs.com/package/passages). The folder name, `<yyyy-mm-dd>-episode-<n>-<slug>`, is the episode's key in [`@miadi/episodic-memory-schema`](https://www.npmjs.com/package/@miadi/episodic-memory-schema). When a session runs in an episode folder, or is given one with `--add-dir`, the binding line's `episode.id` is that name. |
| `MIADI_CHRONICLE_PROD_EPISODE` | The episode in production. The binding line uses it only when the session's folders name no episode. |

Inside tmux, the binding line also records the pane: `session`, `window`, `pane` and `pane_id`.

### Launchers

A launcher is a shell function or alias that starts an agent with its model, permissions, MCP servers and plugins. It sets `MIADI_LAUNCH_ALIAS` to its own name unless a launcher that called it already set one, so the binding line records the name that was typed.

The two most used on gaia (binding lines up to 2026-09-30: `claudeyolochroniclehoncho` 22, `claudeyolo` 18), for `~/.bashrc`:

```bash
# Claude Code without permission prompts
claudeyolo() {
  MIADI_LAUNCH_ALIAS="${MIADI_LAUNCH_ALIAS:-claudeyolo}" claude "$@" --dangerously-skip-permissions
}

# claudeyolo with the chronicle's MCP servers (voice, medicine wheel), then with Honcho memory
alias claudeyolochronicle='MIADI_LAUNCH_ALIAS=${MIADI_LAUNCH_ALIAS:-claudeyolochronicle} claudeyolo --mcp-config $MIADI_MCP_CONFIG_VOICE $MIADI_MCP_CONFIG_MW_CHRONICLE'
alias claudeyolochroniclehoncho='MIADI_LAUNCH_ALIAS=${MIADI_LAUNCH_ALIAS:-claudeyolochroniclehoncho} claudeyolochronicle --mcp-config $MIADI_MCP_CONFIG_HONCHO'

export MIADI_MCP_CONFIG_VOICE=~/.config/miadi/mcp-config-voice.json
export MIADI_MCP_CONFIG_MW_CHRONICLE=~/.config/miadi/mcp-config-mw-chronicle.json
export MIADI_MCP_CONFIG_HONCHO=~/.config/miadi/mcp-config-honcho.json
```

The three MCP config files. Claude Code fills in `${VAR}` from the environment, so tokens stay in `~/.env`:

```json
{ "mcpServers": { "miadi-voice": {
  "command": "npx", "args": ["-y", "@miadi/voice-mcp"],
  "env": { "MIADI_API_URL": "${MIADI_API_URL}", "MIADI_API_TOKEN_WRITER": "${MIADI_API_TOKEN_WRITER}",
           "MIADI_CHRONICLE_ROOT": "${MIADI_CHRONICLE_ROOT}", "MW_API_URL": "${MIADI_CHRONICLE_MW_URL}",
           "ASSEMBLY_VOICE_AUDIO_DIR": "${MIADI_ASSEMBLY_VOICE_AUDIO_DIR}" } } } }
```

```json
{ "mcpServers": { "medicine-wheel-miadi-chronicle": {
  "command": "npx", "args": ["-y", "@medicine-wheel/mcp"],
  "env": { "MW_API_URL": "${MIADI_CHRONICLE_MW_URL}" } } } }
```

```json
{ "mcpServers": { "honcho": {
  "type": "http", "url": "${HONCHO_MCP_URL}",
  "headers": { "Authorization": "Bearer ${HONCHO_API_KEY}" } } } }
```

After a reboot or a crash, `tide agents restore` (PyPI [`ironsilk`](https://pypi.org/project/ironsilk/) 0.9.35 or later) starts each agent again through the launcher named on its binding line, with `--resume <session_id>`. The agent comes back with the same tools. When no launcher is named, tide infers one from the command line, and otherwise resumes with the plain command.

## Teams

### Definition

A team is a group of terminal sessions with one human lead and one agent lead. Every session belongs to one team. The team is recorded as `team` in every binding line in `$MIADI_SESSION_DIR/data/terminal_bindings.jsonl`:

```json
"team": { "id": "T1", "source": "session" }
```

A team is defined twice, and both copies change together:

- `teams/teams.json` in `jgwill/miadi-orchestration-kit`, which the plugin reads
- `teams/README.md` in the same kit, which people read

Entry in `teams/teams.json`:

```json
{
  "id": "T4",
  "name": "<what the team keeps working>",
  "level": "<the machine | the application | between William and the teams that build>",
  "human_lead": "<person>",
  "agent_lead": "<session name of the lead agent>",
  "sessions": ["<tmux session name or agent session name>"],
  "folders": ["<absolute path: the agent's folder or any folder below it>"],
  "name_patterns": ["<regular expression tested on the same two names>"]
}
```

Section in `teams/README.md`: Level, Desired outcome, Leads, Makes, Uses, Sessions, Skill.

### How a session's team is found

The first rule that matches decides. The binding line's `source` says which rule it was.

1. `declared`: `MIADI_TEAM` in the agent's environment, or the tmux session option `@miadi-team`
2. `session`: the tmux session name or the agent session's name is listed in a team's `sessions`
3. `folder`: the agent's working folder is one of a team's `folders` or inside one. When several match, the longest path wins.
4. `name`: a team's `name_patterns` match the tmux session name or the agent session's name
5. `unassigned`: no rule matched

To set a team without editing the list:

```bash
export MIADI_TEAM=T1                                    # one agent
tmux set-option -t gaia-screen-reboot @miadi-team T1    # every pane of one tmux session
```

### Teams named so far (2026-09-28)

| id | name | level | agent lead |
|---|---|---|---|
| T1 | Session continuity | the machine | `gaia-tmux-rebooted-restore-finetuning-260928` |
| T2 | Event path | the application | the episode 548 session |
| T3 | Witness | between William and the teams that build | Mino, the `stcbot` seat |
