#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

input=$(cat -)
session_id=$(echo "$input" | jq -r .session_id)
session_dir="$CLAUDE_SESSIONDATA_ROOT"
mkdir -p "$session_dir/data"
session_common_data_file="$session_dir/data/session_starts_all.jsonl"
output_dir="$session_dir/$session_id"
mkdir -p "$output_dir"
claude_write_jsonl "$output_dir/_claude_session_starts.jsonl" "$input"
claude_write_json "$output_dir/last_claude_session_starts.jsonl" "$input"
claude_write_jsonl "$session_common_data_file" "$input" #so we have a common file with all session starts
#echo "" >> "$output_dir/_claude_session_starts.jsonl"

# Bind this session to its terminal (jgwill/binscripts#158).
. "$SCRIPT_DIR/terminal_binding.sh"
claude_write_terminal_binding "session.start" "$input"

# Copy what earlier sessions left uncopied before Claude Code's cleanup deletes
# it (lib.sh, claude_archive_sweep). Detached, and silent: SessionStart stdout
# goes into the conversation.
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty')
if [ -n "$transcript_path" ]; then
    claude_detach bash "$SCRIPT_DIR/transcript_archive.sh" sweep "$(dirname "$(dirname "$transcript_path")")"
fi
