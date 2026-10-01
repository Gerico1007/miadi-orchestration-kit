#!/usr/bin/env bash
# The transcript archive keeps sanitized copies of what Claude Code deletes after
# cleanupPeriodDays: each call copies only the lines added since the last one, a partial
# line waits, a rewritten source starts over, an old complete copy is adopted, an old
# partial copy or symlink is replaced, and the sweep only writes into session folders that
# exist. Run: bash tests/transcript-archive.sh
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export CLAUDE_SESSIONDATA_ROOT="$WORK/root"
mkdir -p "$CLAUDE_SESSIONDATA_ROOT"
. "$HERE/hooks/claude_hooks/lib.sh"

failures=0
expect() {  # <label> <expected> <actual>
    if [ "$2" = "$3" ]; then
        echo "ok   $1"
    else
        echo "FAIL $1: expected $2, got $3"
        failures=$((failures + 1))
    fi
}
lines() { _claude_line_count "$1"; }
offset_of() { cut -d" " -f1 "$(dirname "$1")/.$(basename "$1").offset" 2>/dev/null; }

secret="sk-ant-api03-ABCDEFGHIJKLM""NOPQRSTUVWX"
src="$WORK/t.jsonl"; dest="$WORK/copy/_transcript_final.jsonl"; mkdir -p "$WORK/copy"
printf '{"n":1,"key":"%s"}\n{"n":2}\n' "$secret" > "$src"

claude_archive_jsonl "$src" "$dest"
expect "first call copies every line" 2 "$(lines "$dest")"
expect "the copy is sanitized" 0 "$(grep -c "$secret" "$dest")"
expect "the offset is the source size" "$(_claude_byte_count "$src")" "$(offset_of "$dest")"

printf '{"n":3}\n{"n":4,"partial"' >> "$src"
claude_archive_jsonl "$src" "$dest"
expect "a partial last line waits" 3 "$(lines "$dest")"

printf ':true}\n' >> "$src"
claude_archive_jsonl "$src" "$dest"
expect "the completed line is appended once" 4 "$(lines "$dest")"
expect "the copy matches the source" "$(hook_secret_sanitize_stream < "$src")" "$(cat "$dest")"

before=$(cat "$dest")
claude_archive_jsonl "$src" "$dest"
expect "an unchanged source changes nothing" "$before" "$(cat "$dest")"

printf '{"n":"rewritten"}\n' > "$src"
claude_archive_jsonl "$src" "$dest"
expect "a source that shrank starts the copy over" '{"n":"rewritten"}' "$(cat "$dest")"

# A copy from before offsets were kept.
src2="$WORK/t2.jsonl"; dest2="$WORK/copy/old.jsonl"
printf '{"a":1}\n{"a":2}\n' > "$src2"
hook_secret_sanitize_stream < "$src2" > "$dest2"
touch -d '@1' "$dest2"
claude_archive_jsonl "$src2" "$dest2"
expect "an old complete copy is adopted, not copied again" 1 "$(stat -c %Y "$dest2")"
printf '{"a":3}\n' >> "$src2"
claude_archive_jsonl "$src2" "$dest2"
expect "an adopted copy then grows" 3 "$(lines "$dest2")"

dest3="$WORK/copy/partial.jsonl"
printf '{"a":1}\n' > "$dest3"
claude_archive_jsonl "$src2" "$dest3"
expect "an old partial copy is copied again" 3 "$(lines "$dest3")"

dest4="$WORK/copy/link.jsonl"
ln -s "$src2" "$dest4"
claude_archive_jsonl "$src2" "$dest4"
printf '{"a":4}\n' >> "$src2"
claude_archive_jsonl "$src2" "$dest4"
expect "an old symlink copy becomes a file" "no" "$([ -L "$dest4" ] && echo yes || echo no)"
expect "the source behind the symlink is untouched" 4 "$(lines "$src2")"
expect "the file copy has every line" 4 "$(lines "$dest4")"

# A hook from 0.1.2, still loaded in a running session, rewrites the copy whole.
src5="$WORK/t5.jsonl"; dest5="$WORK/copy/other-writer.jsonl"
printf '{"b":1}\n{"b":2}\n' > "$src5"
claude_archive_jsonl "$src5" "$dest5"
printf '{"b":3}\n' >> "$src5"
hook_secret_sanitize_stream < "$src5" > "$dest5"
printf '{"b":4}\n' >> "$src5"
claude_archive_jsonl "$src5" "$dest5"
expect "a copy another writer replaced is copied again, no line twice" 4 "$(lines "$dest5")"

# A state kept by the first 0.1.3 sweep holds the offset only.
printf '%s\n' "$(_claude_byte_count "$src5")" > "$WORK/copy/.other-writer.jsonl.offset"
touch -d '@1' "$dest5"
claude_archive_jsonl "$src5" "$dest5"
expect "an offset-only state is upgraded without copying again" 1 "$(stat -c %Y "$dest5")"
expect "the upgraded state holds the copy size" "$(_claude_byte_count "$src5") $(_claude_byte_count "$dest5")" \
    "$(cat "$WORK/copy/.other-writer.jsonl.offset")"

# One session: transcript, subagents, tool-results.
projects="$WORK/projects"; sid=11111111-aaaa; other=22222222-bbbb
base="$projects/-a-src/$sid"
mkdir -p "$base/subagents" "$base/tool-results"
printf '{"s":1}\n' > "$base.jsonl"
printf '{"sub":1,"token":"%s"}\n' "$secret" > "$base/subagents/agent-abc123.jsonl"
printf '{"agentType":"Explore"}' > "$base/subagents/agent-abc123.meta.json"
printf 'big output\n' > "$base/tool-results/r1.txt"
printf '{"forked":1}\n' > "$WORK/forked-from.jsonl"
ln -s "$WORK/forked-from.jsonl" "$base/subagents/agent-lnk.jsonl"
printf '{"o":1}\n' > "$projects/-a-src/$other.jsonl"
mkdir -p "$CLAUDE_SESSIONDATA_ROOT/$sid"

bash "$HERE/hooks/claude_hooks/transcript_archive.sh" sweep "$projects"
out="$CLAUDE_SESSIONDATA_ROOT/$sid"
expect "sweep copies the transcript" '{"s":1}' "$(cat "$out/_transcript_final.jsonl" 2>/dev/null)"
expect "sweep copies a subagent transcript" 1 "$(lines "$out/agents/abc123.transcript.jsonl")"
expect "the subagent copy is sanitized" 0 "$(grep -c "$secret" "$out/agents/abc123.transcript.jsonl")"
expect "sweep copies the subagent meta" '{"agentType":"Explore"}' "$(cat "$out/agents/abc123.meta.json" 2>/dev/null)"
expect "sweep copies tool-results" 'big output' "$(cat "$out/tool-results/r1.txt" 2>/dev/null)"
expect "a forked session's linked subagent is copied as a file" "file" \
    "$([ -f "$out/agents/lnk.transcript.jsonl" ] && [ ! -L "$out/agents/lnk.transcript.jsonl" ] && echo file || echo no)"
expect "sweep skips a session with no folder here" "no" "$([ -e "$CLAUDE_SESSIONDATA_ROOT/$other" ] && echo yes || echo no)"

printf '{"s":2}\n' >> "$base.jsonl"
bash "$HERE/hooks/claude_hooks/transcript_archive.sh" session "$base.jsonl" "$out"
expect "a session run brings the copy up to date" 2 "$(lines "$out/_transcript_final.jsonl")"

echo
if [ "$failures" -eq 0 ]; then
    echo "all transcript archive checks passed"
else
    echo "$failures check(s) failed"
    exit 1
fi
