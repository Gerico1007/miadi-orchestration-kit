# miadi-session-observability

Session capture for Miadi hosts, as a Claude Code plugin. Install it once on a host and every
Claude Code session there is captured. Nobody edits `settings.json` by hand.
jgwill/miadi-orchestration-kit#56.

- **Capture.** Every event is written under `<root>/<session_id>/` exactly as
  `/opt/binscripts/hooks/claude_hooks` writes it. The token counter, the `/token-usage` page
  and the session observers keep working unchanged.
- **Binding line.** Every session start, end and rename appends one line to
  `<root>/data/terminal_bindings.jsonl`. The line holds the session id, the tmux
  `session:window.pane` and pane id, the agent's command line, its name and name history, and
  its team. tmux restore and `tide agents restore` read these lines to bring agents back.
- **Skill.** `session-continuity` carries T1's practice: the binding line, tmux save and
  restore, tide, and rebuilding what each pane held after a crash.

## Install

```bash
claude plugin marketplace add jgwill/miadi-orchestration-kit      # or the path of a checkout
claude plugin install miadi-session-observability@miadi-orchestration-kit
```

Then remove the `hooks` block from `~/.claude/settings.json` on that host, in the same step. If
both are wired, every event fires twice and every capture line is written twice.

Hooks load when a session starts and do not hot-swap. A session started before the install
keeps its old wiring until it is restarted.

To try the plugin without installing it: `claude --plugin-dir <path to this folder>`.

## Where captures go

`<root>` is `CLAUDE_SESSIONDATA_ROOT`, else `MIADI_SESSION_DIR`, `MIADI_SESSIONDATA_ROOT`,
`SESSION_DATA_ROOT`, else `/src/_sessiondata` when it exists, else `_sessiondata` beside this
folder (`hooks/claude_hooks/lib.sh`).

## Teams

The binding line's `team` is `{"id": "T1", "source": "session"}`. It is resolved in this
order:

1. a declared team: `MIADI_TEAM` in the agent's environment, or the tmux session option
   (`tmux set-option -t <session> @miadi-team T1`)
2. the session names in `teams/teams.json`, matched against the tmux session name and the agent
   session's name
3. its folders, where the agent's folder or one below it matches and the longest prefix wins
4. its name patterns
5. otherwise `unassigned`

The list is `MIADI_TEAMS_FILE`, else `$MIADI_ORCHESTRATION_KIT_ROOT/teams/teams.json`. An
installed plugin is a copy of this folder, so it cannot reach the kit by a relative path.
`teams/README.md` is the text people read, and the two are kept in step.

## Which copy is canonical

- `hooks/claude_hooks/` is canonical for Claude Code capture since version 0.1.0.
  `/opt/binscripts/hooks/claude_hooks` stays a live copy for hosts and users that have not
  switched. Change the plugin first, then carry the change there.
- `hooks/secret_capture_sanitizer.sh` and `hooks/git_command_validator.sh` are copies bundled
  from `/opt/binscripts/hooks/`. The plugin's copies are canonical for Claude capture.
  binscripts keeps its own for the other agents' suites until they join (A6,
  jgwill/binscripts#158).

## Host integrations it uses when present

- `/opt/binscripts/plan-insight/miette_claude_plan_perspective_claude.sh`, run in the
  background when a plan is presented. When it is missing, `trace.log` records the failure and
  nothing else changes.
- `jq` and `perl` are required. The sanitizer is written in perl.

## Check

```bash
bash tests/team-resolution.sh
CLAUDE_SESSIONDATA_ROOT=$(mktemp -d) claude --restricted --plugin-dir . --model haiku
```

`--restricted` ignores the user's settings files, so only this plugin's hooks run. One prompt
that starts a subagent, a `/rename` and an exit write the same files as today's capture, with
each event written once.
