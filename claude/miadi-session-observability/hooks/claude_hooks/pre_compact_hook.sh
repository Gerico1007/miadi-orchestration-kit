#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

input=$(cat -)
session_id=$(echo "$input" | jq -r .session_id)
output_dir="$CLAUDE_SESSIONDATA_ROOT/$session_id"
mkdir -p "$output_dir"
claude_write_jsonl "$output_dir/_claude_PreCompact.jsonl" "$input"
#echo "" >> "$output_dir/_claude_PreCompact.jsonl"
