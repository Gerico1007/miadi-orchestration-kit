## Environment variables

The plugin reads these variables. Claude Code sets `CLAUDE_PLUGIN_ROOT` itself. Everything else comes from the shell the agent starts in.

| variable | what the plugin does with it | on gaia |
|---|---|---|
| `CLAUDE_SESSIONDATA_ROOT` | Folder where captures are written, as `<root>/<session_id>/` and `<root>/data/terminal_bindings.jsonl`. If it is unset, the plugin uses `MIADI_SESSION_DIR`, then `MIADI_SESSIONDATA_ROOT`, then `SESSION_DATA_ROOT`, then `/src/_sessiondata` if that folder exists. Otherwise it uses `_sessiondata` next to the plugin. | unset, so `MIADI_SESSION_DIR=/src/_sessiondata` is used |
| `MIADI_ORCHESTRATION_KIT_ROOT` | Used to find `teams/teams.json`. An installed plugin is a copy in `~/.claude/plugins/cache/`, so it cannot find the kit without this. If neither this nor `MIADI_TEAMS_FILE` is set, every session's team is `unassigned`, with source `no teams file`. | `/workspace/repos/jgwill/miadi-orchestration-kit` |
| `MIADI_TEAMS_FILE` | Path to a different teams list. Replaces the kit's list. | unset |
| `MIADI_TEAM` | Sets the team for one agent. Takes precedence over every other team rule. | unset |
| `MIADI_LAUNCH_ALIAS` | Saved as `launch_alias` in the binding line. The launchers in `bash_aliases_common` export it (for example `claudeyolo`). | set per launcher |
| `MIADI_CHRONICLE_ROOT` | Folder that holds the episodes. A folder directly inside it named `<yyyy-mm-dd>-episode-<n>-<slug>` counts as an episode. | `/srv/miadi/episodes/miadi-chronicle` |
| `MIADI_CHRONICLE_PROD_EPISODE` | Last choice for the binding line's `episode`, used only when no `--add-dir` folder and no working folder is an episode. Every shell exports it, so on its own it names the production episode, not the session's episode. | `2026-06-28-episode-103-film-preprod-report-phase-2` |
| `MIADI_HOOKS_SCRIPT_DIR` | Folder where PreToolUse looks for `git_command_validator.sh`. Defaults to the plugin's own `hooks/` folder. | unset |
| `TMUX`, `TMUX_PANE` | Set by tmux. They give the binding line its `tmux` block (`session`, `window`, `pane`, `pane_id`, `socket`). | set inside tmux |

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
5. `unassigned`: no rule matched (`no rule matched`), no teams list was found (`no teams file`), or the list could not be read (`unreadable teams file`)

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
