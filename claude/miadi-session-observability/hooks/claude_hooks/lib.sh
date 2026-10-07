#!/usr/bin/env bash

_CLAUDE_HOOKS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=../secret_capture_sanitizer.sh
. "$_CLAUDE_HOOKS_ROOT/secret_capture_sanitizer.sh"

# Portable capture-output root — one source of truth for every claude hook.
# Honors the shared env alias set by etc/bash_env_common (MIADI_SESSION_DIR ->
# MIADI_SESSIONDATA_ROOT -> SESSION_DATA_ROOT). With no env loaded it falls back to
# /src/_sessiondata on hosts that have /src (servers; /src -> /a/src on Eury), else the
# repo-local _sessiondata beside the scripts (Termux/Android, containers without env).
if [ -z "${CLAUDE_SESSIONDATA_ROOT:-}" ]; then
    CLAUDE_SESSIONDATA_ROOT="${MIADI_SESSION_DIR:-${MIADI_SESSIONDATA_ROOT:-${SESSION_DATA_ROOT:-}}}"
    if [ -z "$CLAUDE_SESSIONDATA_ROOT" ]; then
        if [ -d "/src/_sessiondata" ]; then
            CLAUDE_SESSIONDATA_ROOT="/src/_sessiondata"
        else
            CLAUDE_SESSIONDATA_ROOT="$(cd "$_CLAUDE_HOOKS_ROOT/.." && pwd)/_sessiondata"
        fi
    fi
fi
export CLAUDE_SESSIONDATA_ROOT

claude_write_jsonl() {
    local file="$1"
    local text="$2"
    hook_secret_write_line "$file" "$text"
}

claude_write_json() {
    local file="$1"
    local text="$2"
    hook_secret_overwrite_line "$file" "$text"
}

# Atomic: sanitize into a temp file beside dest, then rename over it. Claude
# Code kills hooks on exit; writing dest in place left 0-byte transcript
# copies. The rename also replaces a symlink at dest instead of writing
# through it into its target.
claude_sanitize_file_to() {
    local src="$1"
    local dest="$2"
    [ -f "$src" ] || return 0
    local tmp="$dest.tmp.$$"
    if hook_secret_sanitize_stream < "$src" > "$tmp" && [ -s "$tmp" ]; then
        mv -f "$tmp" "$dest"
    else
        rm -f "$tmp"
    fi
}

claude_sanitize_text() {
    hook_secret_sanitize_text "$1"
}

# --- Transcript archive -----------------------------------------------------
# Claude Code deletes a session's transcript, its subagent transcripts and its
# tool-results after cleanupPeriodDays (default 30). These functions keep
# sanitized copies in the session folder, which outlive that cleanup.

# Run a command detached from Claude Code: the hook returns at once, and the
# command survives Claude Code killing its hooks on exit.
claude_detach() {
    if command -v setsid >/dev/null 2>&1; then
        setsid "$@" </dev/null >/dev/null 2>&1 &
    else
        nohup "$@" </dev/null >/dev/null 2>&1 &
    fi
}

# Run the rest of the arguments holding an exclusive lock on <lockfile>, so a
# Stop, a SubagentStop, a SessionEnd and a sweep never write one copy at once.
# Without flock (Termux) the command runs unlocked.
claude_with_lock() {
    local lock="$1"; shift
    if command -v flock >/dev/null 2>&1; then
        ( flock -w 900 9 || exit 0; "$@" ) 9>"$lock"
    else
        "$@"
    fi
}

_claude_byte_count() {
    local n
    n=$(wc -c 2>/dev/null < "$1") || n=0
    echo "${n//[[:space:]]/}"
}

_claude_line_count() {
    local n
    n=$(wc -l 2>/dev/null < "$1") || n=0
    echo "${n//[[:space:]]/}"
}

# Keep <dest> a sanitized copy of <src>, a JSONL file Claude Code only appends
# to. Each call sanitizes only the lines added since the last call: the hidden
# .<dest>.offset beside it holds how many bytes of <src> are copied and how
# many bytes <dest> had then, so a turn costs the size of the turn, not of the
# transcript (sanitizing a 33 MB transcript whole takes 18 s). A partial last
# line waits for the next call. The copy starts over when <src> shrank, when
# the offset no longer ends a line, or when <dest> changed size since: another
# writer (a hook from 0.1.2 or earlier, still loaded in a running session)
# replaced it, and appending would duplicate lines. A copy made before offsets
# were kept is adopted when it has as many lines as <src>, and copied again
# when it does not (a SessionEnd killed mid-copy).
claude_archive_jsonl() {
    local src="$1" dest="$2"
    [ -f "$src" ] || return 0
    local state size offset=0 dest_size=""
    state="$(dirname "$dest")/.$(basename "$dest").offset"
    size=$(_claude_byte_count "$src")
    [ "$size" -gt 0 ] || return 0

    # Before 2026-09-27 the subagent copy was a symlink to Claude Code's own
    # file. Appending would write through it, so it is replaced.
    if [ -L "$dest" ]; then
        rm -f "$dest" "$state"
    fi

    if [ -f "$state" ]; then
        read -r offset dest_size < "$state"
        case "$offset" in ''|*[!0-9]*) offset=0 ;; esac
        if [ -z "$dest_size" ]; then
            # Kept by the first 0.1.3 sweep, offset only: check by lines.
            [ "$offset" -gt 0 ] && [ "$(_claude_line_count "$dest")" = "$(head -c "$offset" "$src" | wc -l | tr -d '[:space:]')" ] \
                || offset=0
        elif [ "$dest_size" != "$(_claude_byte_count "$dest")" ]; then
            offset=0
        fi
    elif [ -s "$dest" ] && [ -z "$(tail -c 1 "$src")" ] \
        && [ "$(_claude_line_count "$dest")" = "$(_claude_line_count "$src")" ]; then
        printf '%s %s\n' "$size" "$(_claude_byte_count "$dest")" > "$state"
        return 0
    fi

    if [ "$offset" -eq "$size" ]; then
        [ -n "$dest_size" ] || printf '%s %s\n' "$size" "$(_claude_byte_count "$dest")" > "$state"
        return 0
    fi
    if [ ! -s "$dest" ] || [ "$offset" -gt "$size" ] \
        || { [ "$offset" -gt 0 ] && [ -n "$(tail -c +"$offset" "$src" | head -c 1)" ]; }; then
        offset=0
    fi

    local chunk="$dest.chunk.$$" tmp="$dest.tmp.$$" added
    tail -c +"$((offset + 1))" "$src" \
        | perl -0777 -ne 'my $i = rindex($_, "\n"); print substr($_, 0, $i + 1) if $i >= 0' > "$chunk"
    added=$(_claude_byte_count "$chunk")
    if [ "$added" -eq 0 ]; then
        rm -f "$chunk"
        return 0
    fi
    if [ "$offset" -eq 0 ]; then
        if hook_secret_sanitize_stream < "$chunk" > "$tmp" && [ -s "$tmp" ]; then
            mv -f "$tmp" "$dest"
        else
            rm -f "$tmp" "$chunk"
            return 0
        fi
    elif ! hook_secret_sanitize_stream < "$chunk" >> "$dest"; then
        rm -f "$chunk"
        return 0
    fi
    rm -f "$chunk"
    printf '%s %s\n' "$((offset + added))" "$(_claude_byte_count "$dest")" > "$state"
}

# Copy a file Claude Code writes whole (tool-results, session-memory, a
# subagent's meta.json), sanitized, when the copy is missing or older.
claude_archive_file() {
    local src="$1" dest="$2"
    [ -f "$src" ] || return 0
    if [ -f "$dest" ] && [ ! -L "$dest" ] && [ ! "$src" -nt "$dest" ]; then
        return 0
    fi
    mkdir -p "$(dirname "$dest")"
    claude_sanitize_file_to "$src" "$dest"
}

# Archive one session into <output_dir>: its transcript to
# _transcript_final.jsonl, each subagent transcript to
# agents/<agent_id>.transcript.jsonl with agents/<agent_id>.meta.json beside
# it, and every other file Claude Code keeps beside the transcript
# (tool-results/, session-memory/) at the same relative path.
claude_archive_session() {
    local transcript="$1" output_dir="$2"
    [ -n "$transcript" ] && [ -n "$output_dir" ] || return 0
    mkdir -p "$output_dir"
    claude_archive_jsonl "$transcript" "$output_dir/_transcript_final.jsonl"

    local base="${transcript%.jsonl}" f rel name
    [ -d "$base" ] || return 0
    while IFS= read -r -d '' f; do
        rel="${f#"$base"/}"
        case "$rel" in
            subagents/agent-*.jsonl)
                name="${rel#subagents/agent-}"
                mkdir -p "$output_dir/agents"
                claude_archive_jsonl "$f" "$output_dir/agents/${name%.jsonl}.transcript.jsonl"
                ;;
            subagents/agent-*.meta.json)
                name="${rel#subagents/agent-}"
                claude_archive_file "$f" "$output_dir/agents/${name%.meta.json}.meta.json"
                ;;
            *)
                claude_archive_file "$f" "$output_dir/$rel"
                ;;
        esac
    # -type l too: Claude Code links a forked session's subagents to the
    # files of the session it forked from.
    done < <(find "$base" \( -type f -o -type l \) -print0 2>/dev/null)
}

# Archive every session in <projects_dir> (~/.claude/projects) that the hooks
# captured under this root. This catches what no hook copied: sessions killed
# or crashed before SessionEnd, turns after the last Stop, and sessions captured
# by the legacy /opt/binscripts hooks, whose SessionEnd copy was often empty.
# A session whose copies are current costs a few stat calls.
claude_archive_sweep() {
    local projects_dir="$1" t sid out
    [ -d "$projects_dir" ] || return 0
    for t in "$projects_dir"/*/*.jsonl; do
        [ -f "$t" ] || continue
        sid="$(basename "$t" .jsonl)"
        out="$CLAUDE_SESSIONDATA_ROOT/$sid"
        [ -d "$out" ] || continue
        claude_with_lock "$out/.archive.lock" claude_archive_session "$t" "$out"
    done
}
