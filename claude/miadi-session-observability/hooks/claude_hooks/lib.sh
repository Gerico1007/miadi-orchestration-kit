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
