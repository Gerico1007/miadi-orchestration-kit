---
description: Record the questions answered in this conversation in the operator desk ledger, hand off what the docs or tools could not answer, and grow the skill
argument-hint: "[the question to record, if not the last one]"
allowed-tools: Bash, Read, Edit, Write
---

Follow the `operator-desk` skill of this plugin.

Arguments: `$ARGUMENTS`

1. Collect the questions William asked in this conversation since the last `/desk-record`, or the one named in the arguments. Use his words.
2. For each one, append a line to `$MIADI_ORCHESTRATION_KIT_ROOT/claude/miadi-operator-desk/desk/ledger.jsonl`, using the skill's format. The tmux session is `tmux display -p '#S'`.
3. For each `gap`, make the handoff the skill describes.
4. If a question is now in the ledger twice, add it to the skill's **Questions that came back**, bump the version and add a line to the **Log**.
5. Commit only the files you changed, then push.
6. Report one line per question (answered, or gap and its handoff) and the commit.
