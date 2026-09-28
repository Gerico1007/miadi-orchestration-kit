#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

input=$(cat -)

# First, before the slow transcript copy: Claude Code kills hooks on exit.
. "$SCRIPT_DIR/terminal_binding.sh"
claude_write_terminal_binding "session.end" "$input"
session_id=$(echo "$input" | jq -r .session_id)
transcript_path=$(echo "$input" | jq -r .transcript_path)
output_dir="$CLAUDE_SESSIONDATA_ROOT/$session_id"
mkdir -p "$output_dir"

# Archive complete transcript on session end
claude_sanitize_file_to "$transcript_path" "$output_dir/_transcript_final.jsonl"

claude_write_jsonl "$output_dir/_claude_SessionEnd.jsonl" "$input"
claude_write_json "$output_dir/last_claude_SessionEnd.jsonl" "$input"
