---
description: Write Ava's diary entry for this session now
argument-hint: "[--dry-run]"
allowed-tools: Bash
---

Write Ava's diary entry for this session now, with
`node "${CLAUDE_PLUGIN_ROOT}/scripts/ava-diary.mjs" $ARGUMENTS`.

- Run it with Bash `run_in_background: true`. The writer reads the transcript and takes a
  minute or two, and the session continues meanwhile.
- `AVA_COMPANION_SESSION_ID` and `AVA_COMPANION_TRANSCRIPT` come from the plugin's
  SessionStart hook. If they are empty (the plugin was enabled mid-session), pass
  `--cwd "<the session's starting directory>"` and the newest transcript of that
  directory is used.
- When it finishes, say in one line where the entry landed and whether it was committed.
  Do not paste the entry. Guillaume reads it in the diary.

`--dry-run` prints what would be sent and where it would land, without writing.
