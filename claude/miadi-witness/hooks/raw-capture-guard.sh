#!/usr/bin/env bash
# raw-capture-guard — the inventory-keeper reads a session through the interpreter, never
# through the raw capture. PreToolUse on Bash, Read and Grep.
#
# It acts only on tool calls whose payload names agent_type miadi-witness:inventory-keeper.
# Every other session and agent passes at the first test, without a subprocess.
#
# Measured 2026-10-07: three keepers reading the raw ledgers and transcripts ran 39 to 48
# turns and ended at 193k to 200k tokens of context. `miadi-hooks-interpret digest` answers
# the same questions for four sessions in 26 KB. A question the digest cannot answer is a
# field the digest is missing, so the keeper reports it instead of digging.

input=$(cat)
keeper='"agent_type"[[:space:]]*:[[:space:]]*"miadi-witness:inventory-keeper"'
[[ $input =~ $keeper ]] || exit 0

raw='(_claude_[A-Za-z_]+\.jsonl|last_claude_[A-Za-z_]+\.json|_responses_progressive|_transcript_final|_terminal_binding|terminal_bindings\.jsonl|/tool-results/|\.claude/projects/[^[:space:]"]*\.jsonl|/subagents/agent-)'
# Only what the tool was asked to touch. Every payload also carries the session's own
# transcript_path, which is not a read (the first version matched it and blocked every call).
target=$(jq -r '.tool_input // {} | [.command, .file_path, .path, .pattern] | map(select(type == "string")) | join("\n")' <<<"$input" 2>/dev/null)
[[ $target =~ $raw ]] || exit 0

cat >&2 <<'EOF'
Blocked for the inventory-keeper: session data is read through the interpreter, not the raw capture.
Use: miadi-hooks-interpret digest <session id>...   (several ids in one call)
It gives a person's prompts, the main session's last reply, the last text typed in, commits checked
against origin, pushes, pull requests and files written. The facts and the binding line come from
inventory.mjs (verify-names, plan, write). For a question neither answers, write it in your report
under "digest gaps:" and go on; each gap becomes a field of the digest.
EOF
exit 2
