# `claude/miadi-session-observability/` — the session capture plugin

Version 0.1.0, built on 2026-09-28 by T1 session continuity (A9 on the Session Observability
Plugin page, https://claude.ai/artifact/8mGQMnj4niSUdVayYSDYk8). Tracked in
jgwill/miadi-orchestration-kit#56. The README says how to install it and how teams resolve.

## What is here

- `hooks/hooks.json`: the 12 events and 14 commands that `/opt/binscripts/hooks/claude_hooks`
  wires by hand in `settings.json`, with every path through `${CLAUDE_PLUGIN_ROOT}`.
- `hooks/claude_hooks/`: the capture scripts, with `terminal_binding.sh` (the binding line,
  its name history, and the team).
- `hooks/secret_capture_sanitizer.sh`, `hooks/git_command_validator.sh`: bundled copies.
- `skills/session-continuity/`: T1's practice.
- `tests/team-resolution.sh`: the team rules, 13 checks.

## This is the canonical copy

Change the hooks here first. `/opt/binscripts/hooks/claude_hooks` stays a live copy for the
hosts and users that still wire it in `settings.json`. Carry each change there, byte for byte,
until nothing wires it any more.

## What the port must keep

- **The capture layout.** `<root>/<session_id>/` under `CLAUDE_SESSIONDATA_ROOT` (`lib.sh`
  resolves `MIADI_SESSION_DIR`, `MIADI_SESSIONDATA_ROOT`, `SESSION_DATA_ROOT`, then
  `/src/_sessiondata`). `_sessiondata/scripts/token_counter.py` (jgwill/src), the Miadi
  `/token-usage` page, plan-insight and the session observers all read that layout.
- **The three copies the token counter depends on.** `_responses_progressive.jsonl` (Stop),
  `_transcript_final.jsonl` (SessionEnd), and `agents/<id>.transcript.jsonl` (SubagentStop).
  Each is written to a temp file and renamed into place, so a killed hook keeps the previous
  copy. Claude Code deletes its own transcripts after `cleanupPeriodDays`, and these copies are
  what remains. Earned in jgwill/binscripts@2064dd07858668206702214d0a8949d36c48befc.
- **Nothing on stdout.** Claude Code injects the stdout of SessionStart and UserPromptSubmit
  hooks into the conversation. The binding writer prints nothing.

## Where it is installed

- gaia, mia: installed on 2026-09-28 from this kit's marketplace, with the `hooks` block removed
  from `~/.claude/settings.json` (backup: `~/.claude/settings.json.bak.260928-before-a9-cutover`).
  Checked: a new session wrote each event once, with its pane and team.
- gaia, jgi and ava: still wired to `/opt/binscripts/hooks/claude_hooks` in their own
  `settings.json`, until each of them switches.

An installed plugin is a copy in `~/.claude/plugins/cache/`. A change here reaches an installed
host only after the version in `.claude-plugin/plugin.json` and in the kit's
`.claude-plugin/marketplace.json` goes up, followed by
`claude plugin marketplace update miadi-orchestration-kit` and
`claude plugin update miadi-session-observability@miadi-orchestration-kit` on that host. Sessions
pick it up when they start.

## Cutover rule

When a host enables this plugin, remove the `hooks` block from that host's `settings.json`.
With both wired, every event fires twice. Cut over one user at a time, and only on that user's
word: their `settings.json` is theirs.
