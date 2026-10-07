# Prompt Decomposition

> Engine: **claude** (sonnet)

## Four Directions

## Original Prompt

> Milestone: Miadi-Factory-Observability-Doc4Chronicle (jgwill/miadi-orchestration-kit#milestone-1). Due: 2026-10-29T00:00:00Z. State: open.
> 
> The goal is not just to document well the observability layer that has got a bump since the migration of the 'jgwill/binscripts' claude-code hooks into a plugin 'miadi-session-observability @ miadi-orchestration-kit'
> home_page: `https://github.com/jgwill/miadi-orchestration-kit/tree/main/claude/miadi-session-observability`
> 
> Plugin Installed components:
>    ● Skills: session-continuity
>    ● Hooks: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, Notification, SubagentStart, SubagentStop, 
>      PreCompact, Stop, SessionEnd
> 
> To this date it also do a new interesting thing into the `$MIADI_SESSION_DIR/data/terminal_bindings.jsonl` you get informations collected about the multiplexer running with the system services codename Ironsilk tide-runtime.
> 
> 
> I will be interested in this miadi-chronicle to explore the relation of that with these packages:
> * `https://www.npmjs.com/package/@miadi/tide`
> * `https://www.npmjs.com/package/@miadi/tide-contract`
> * `https://pypi.org/project/ironsilk/`
> * `https://www.npmjs.com/package/@miadi/annotate-core`
> * `https://www.npmjs.com/package/@miadi/annotate-ui`
> ## setup
> 
> The plugin is installed from GitHub:
> 
> ```bash
> claude plugin marketplace add jgwill/miadi-orchestration-kit
> claude plugin install miadi-session-observability@miadi-orchestration-kit
> ```
> 
> ## Environment variables
> 
> It reads these variables from the shell the agent starts in.
> 
> | variable | what it is for |
> |---|---|
> | `MIADI_SESSION_DIR` | Where captures are written: one folder per session, `$MIADI_SESSION_DIR/<session_id>/`, and one line per session start, end and rename in `$MIADI_SESSION_DIR/data/terminal_bindings.jsonl` |
> | `MIADI_ORCHESTRATION_KIT_ROOT` | A clone of `jgwill/miadi-orchestration-kit`. The plugin reads the team list from `teams/teams.json` in it. Without it, every session's team is `unassigned`. |
> | `MIADI_TEAM` | Optional. Sets the team for one agent, over every other rule. |
> | `MIADI_LAUNCH_ALIAS` | The name of the launcher that started the agent. Saved as `launch_alias` in the binding line. |
> | `MIADI_CHRONICLE_ROOT` | The Miadi Chronicle, one folder per episode, created with `mkepisode` from npm [`passages`](https://www.npmjs.com/package/passages). The folder name, `<yyyy-mm-dd>-episode-<n>-<slug>`, is the episode's key in [`@miadi/episodic-memory-schema`](https://www.npmjs.com/package/@miadi/episodic-memory-schema). When a session runs in an episode folder, or is given one with `--add-dir`, the binding line's `episode.id` is that name. |
> | `MIADI_CHRONICLE_PROD_EPISODE` | The episode in production. The binding line uses it only when the session's folders name no episode. |
> 
> Inside tmux, the binding line also records the pane: `session`, `window`, `pane` and `pane_id`.
> 
> ### Launchers
> 
> A launcher is a shell function or alias that starts an agent with its model, permissions, MCP servers and plugins. It sets `MIADI_LAUNCH_ALIAS` to its own name unless a launcher that called it already set one, so the binding line records the name that was typed.
> 
> The two most used on gaia (binding lines up to 2026-09-30: `claudeyolochroniclehoncho` 22, `claudeyolo` 18), for `~/.bashrc`:
> 
> ```bash
> # Claude Code without permission prompts
> claudeyolo() {
>   MIADI_LAUNCH_ALIAS="${MIADI_LAUNCH_ALIAS:-claudeyolo}" claude "$@" --dangerously-skip-permissions
> }
> 
> # claudeyolo with the chronicle's MCP servers (voice, medicine wheel), then with Honcho memory
> alias claudeyolochronicle='MIADI_LAUNCH_ALIAS=${MIADI_LAUNCH_ALIAS:-claudeyolochronicle} claudeyolo --mcp-config $MIADI_MCP_CONFIG_VOICE $MIADI_MCP_CONFIG_MW_CHRONICLE'
> alias claudeyolochroniclehoncho='MIADI_LAUNCH_ALIAS=${MIADI_LAUNCH_ALIAS:-claudeyolochroniclehoncho} claudeyolochronicle --mcp-config $MIADI_MCP_CONFIG_HONCHO'
> 
> export MIADI_MCP_CONFIG_VOICE=~/.config/miadi/mcp-config-voice.json
> export MIADI_MCP_CONFIG_MW_CHRONICLE=~/.config/miadi/mcp-config-mw-chronicle.json
> export MIADI_MCP_CONFIG_HONCHO=~/.config/miadi/mcp-config-honcho.json
> ```
> 
> The three MCP config files. Claude Code fills in `${VAR}` from the environment, so tokens stay in `~/.env`:
> 
> ```json
> { "mcpServers": { "miadi-voice": {
>   "command": "npx", "args": ["-y", "@miadi/voice-mcp"],
>   "env": { "MIADI_API_URL": "${MIADI_API_URL}", "MIADI_API_TOKEN_WRITER": "${MIADI_API_TOKEN_WRITER}",
>            "MIADI_CHRONICLE_ROOT": "${MIADI_CHRONICLE_ROOT}", "MW_API_URL": "${MIADI_CHRONICLE_MW_URL}",
>            "ASSEMBLY_VOICE_AUDIO_DIR": "${MIADI_ASSEMBLY_VOICE_AUDIO_DIR}" } } } }
> ```
> 
> ```json
> { "mcpServers": { "medicine-wheel-miadi-chronicle": {
>   "command": "npx", "args": ["-y", "@medicine-wheel/mcp"],
>   "env": { "MW_API_URL": "${MIADI_CHRONICLE_MW_URL}" } } } }
> ```
> 
> ```json
> { "mcpServers": { "honcho": {
>   "type": "http", "url": "${HONCHO_MCP_URL}",
>   "headers": { "Authorization": "Bearer ${HONCHO_API_KEY}" } } } }
> ```
> 
> After a reboot or a crash, `tide agents restore` (PyPI [`ironsilk`](https://pypi.org/project/ironsilk/) 0.9.35 or later) starts each agent again through the launcher named on its binding line, with `--resume <session_id>`. The agent comes back with the same tools. When no launcher is named, tide infers one from the command line, and otherwise resumes with the plain command.
> 
> ## Teams
> 
> ### Definition
> 
> A team is a group of terminal sessions with one human lead and one agent lead. Every session belongs to one team. The team is recorded as `team` in every binding line in `$MIADI_SESSION_DIR/data/terminal_bindings.jsonl`:
> 
> ```json
> "team": { "id": "T1", "source": "session" }
> ```
> 
> A team is defined twice, and both copies change together:
> 
> - `teams/teams.json` in `jgwill/miadi-orchestration-kit`, which the plugin reads
> - `teams/README.md` in the same kit, which people read
> 
> Entry in `teams/teams.json`:
> 
> ```json
> {
>   "id": "T4",
>   "name": "<what the team keeps working>",
>   "level": "<the machine | the application | between William and the teams that build>",
>   "human_lead": "<person>",
>   "agent_lead": "<session name of the lead agent>",
>   "sessions": ["<tmux session name or agent session name>"],
>   "folders": ["<absolute path: the agent's folder or any folder below it>"],
>   "name_patterns": ["<regular expression tested on the same two names>"]
> }
> ```
> 
> Section in `teams/README.md`: Level, Desired outcome, Leads, Makes, Uses, Sessions, Skill.
> 
> ### How a session's team is found
> 
> The first rule that matches decides. The binding line's `source` says which rule it was.
> 
> 1. `declared`: `MIADI_TEAM` in the agent's environment, or the tmux session option `@miadi-team`
> 2. `session`: the tmux session name or the agent session's name is listed in a team's `sessions`
> 3. `folder`: the agent's working folder is one of a team's `folders` or inside one. When several match, the longest path wins.
> 4. `name`: a team's `name_patterns` match the tmux session name or the agent session's name
> 5. `unassigned`: no rule matched
> 
> To set a team without editing the list:
> 
> ```bash
> export MIADI_TEAM=T1                                    # one agent
> tmux set-option -t gaia-screen-reboot @miadi-team T1    # every pane of one tmux session
> ```
> 
> ### Teams named so far (2026-09-28)
> 
> | id | name | level | agent lead |
> |---|---|---|---|
> | T1 | Session continuity | the machine | `gaia-tmux-rebooted-restore-finetuning-260928` |
> | T2 | Event path | the application | the episode 548 session |
> | T3 | Witness | between William and the teams that build | Mino, the `stcbot` seat |
> 
> ----
> 
> ## miadi-reviews
> * Related miadi-review to consider in what we will document, process and explore and do...
> 
> ### [MINO] Tmux Agent Restore & Session Continuity Architecture 260929-001 `https://miadi-review-service.vercel.app/review/cec27c7a-9b7d-40ae-8f48-7f4046e7b4a9`
> 
> ### [MINO] Engineering Review: The Witness Loop & Session Continuity 260929-002  `https://miadi-review-service.vercel.app/review/bf53f04c-c402-455f-8c1b-8c830156c420`

## Primary Intent

**Action:** document
**Target:** the Miadi session observability layer (miadi-session-observability plugin, terminal_bindings.jsonl, teams, launchers) as a Miadi Chronicle body of work, and explore its relation to the Ironsilk/tide and annotate packages
**Urgency:** persistent
**Confidence:** 85%

## Secondary Intents

1. **document** — plugin components: session-continuity skill and 12 hooks (SessionStart through SessionEnd) _(explicit)_
2. **document** — terminal_bindings.jsonl binding line: fields, pane info, launch_alias, team, episode.id, and what Ironsilk tide-runtime contributes _(explicit)_
   - depends on: document plugin components
3. **document** — environment variables (MIADI_SESSION_DIR, MIADI_ORCHESTRATION_KIT_ROOT, MIADI_TEAM, MIADI_LAUNCH_ALIAS, MIADI_CHRONICLE_ROOT, MIADI_CHRONICLE_PROD_EPISODE) and setup commands _(explicit)_
4. **document** — launchers (claudeyolo, claudeyolochronicle, claudeyolochroniclehoncho) and the three MCP config files _(explicit)_
   - depends on: document environment variables
5. **document** — team definition, the five-rule team resolution order, teams.json/README.md dual-definition, and teams T1-T3 _(explicit)_
6. **document** — restore flow: tide agents restore (ironsilk 0.9.35+) relaunching via the launcher on the binding line with --resume _(explicit)_
   - depends on: document terminal_bindings.jsonl binding line
7. **explore** — relation between the observability layer and @miadi/tide, @miadi/tide-contract, ironsilk, @miadi/annotate-core, @miadi/annotate-ui _(explicit)_
   - depends on: document terminal_bindings.jsonl binding line
8. **read and integrate** — the two MINO reviews (260929-001 restore and continuity architecture, 260929-002 witness loop and session continuity) _(explicit)_
9. **verify** — claims in the brief against the repo and packages (binding-line counts to 2026-09-30, version numbers, annotate package relation, which hooks write what) _(implicit)_
   - depends on: document plugin components
10. **record** — the work as a Chronicle episode with the five-stage gate (created, committed, pushed, registered, receipt-verified) before the 2026-10-29 due date _(implicit)_
11. **decompose** — the milestone scope so downstream issues thread as children _(implicit)_

## Context Requirements

### Files Needed
- claude/miadi-session-observability/ (plugin.json, hooks, skills/session-continuity/SKILL.md)
- teams/teams.json
- teams/README.md
- $MIADI_SESSION_DIR/data/terminal_bindings.jsonl
- /etc/claude-code/skills/chronicle-episode/SKILL.md or kit copy
- the two miadi-review URLs
- README or docs of the five npm/PyPI packages

### Tools Required
- miadi-review client (fetch the two reviews)
- chronicle-episode skill with mkepisode and the episode API
- gh for milestone and issue context
- tide CLI (tide agents list, tide agents restore)
- npm and pip metadata lookups
- jq for reading the JSONL
- miaco / mcp-pde for PDE storage in .pde/

### Assumptions
- the hooks migrated from jgwill/binscripts to the plugin are the source of the observability bump
- terminal_bindings.jsonl now carries multiplexer data from Ironsilk tide-runtime
- a relation exists between the binding data and the tide, tide-contract and annotate packages
- ironsilk 0.9.35 or later is what tide agents restore needs
- binding-line counts (claudeyolochroniclehoncho 22, claudeyolo 18) are accurate to 2026-09-30
- teams list T1 to T3 is current as of 2026-09-28
- the milestone is jgwill/miadi-orchestration-kit milestone 1, open, due 2026-10-29
