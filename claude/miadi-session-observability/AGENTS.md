# `claude/miadi-session-observability/` — intention, not yet a plugin

This directory holds one file today. It exists so the path is ready when the
migration starts. Tracked in jgwill/miadi-orchestration-kit#56.

## What it will be

A Claude Code plugin carrying the session capture hooks that live today in
`/opt/binscripts/hooks/claude_hooks/` (jgwill/binscripts). A new host will start an
observed session with:

```bash
claude --plugin-dir /workspace/repos/jgwill/miadi-orchestration-kit/claude/miadi-session-observability
```

The flag is `--plugin-dir`. There is no `--plugin` flag.

## The other end

`/opt/binscripts/hooks/claude_hooks/AGENTS.md` is the source side of this migration.
Until this plugin has a manifest and passes the verify step in
jgwill/miadi-orchestration-kit#56, `/opt/binscripts/hooks/claude_hooks/` is the only
live copy. `/src/scripts/claude_hooks` (jgwill/src) is retired: no `settings.json`
should point at it.

## What the port must keep

- **The capture layout.** `<root>/<session_id>/` under `CLAUDE_SESSIONDATA_ROOT`
  (`lib.sh` resolves `MIADI_SESSION_DIR` → `MIADI_SESSIONDATA_ROOT` →
  `SESSION_DATA_ROOT`, then `/src/_sessiondata`). `_sessiondata/scripts/token_counter.py`
  (jgwill/src), the Miadi `/token-usage` page, plan-insight and the session observers
  all read that layout.
- **The three copies the token counter depends on.** `_responses_progressive.jsonl`
  (Stop), `_transcript_final.jsonl` (SessionEnd), and `agents/<id>.transcript.jsonl`
  (SubagentStop). Each is written to a temp file and renamed into place: a killed hook
  keeps the previous copy. Claude Code deletes its own transcripts after
  `cleanupPeriodDays`, and these copies are what remains after that. Earned in
  jgwill/binscripts@2064dd07858668206702214d0a8949d36c48befc.
- **The shared dependencies.** `secret_capture_sanitizer.sh` and
  `git_command_validator.sh` sit at the hooks root, shared with the other harness
  suites. The plugin README must state which copy is canonical (lane rule 4 in
  `claude/AGENTS.md`).

## Cutover rule

When a host enables this plugin, remove the `hooks` block from that host's
`settings.json`. With both wired, every event fires twice.
