#!/bin/bash
# The transcript archive (lib.sh), run detached by the hooks so no turn waits
# for it.
#   transcript_archive.sh session <transcript_path> <output_dir>
#       Stop and SubagentStop: bring one session's copies up to date.
#   transcript_archive.sh sweep <projects_dir>
#       SessionStart: bring every captured session of this user up to date.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

case "${1:-}" in
    session)
        [ -n "${2:-}" ] && [ -n "${3:-}" ] || exit 0
        mkdir -p "$3"
        claude_with_lock "$3/.archive.lock" claude_archive_session "$2" "$3"
        ;;
    sweep)
        [ -n "${2:-}" ] || exit 0
        mkdir -p "$CLAUDE_SESSIONDATA_ROOT/data"
        # One sweep per user at a time; a session starting during one skips its own.
        if command -v flock >/dev/null 2>&1; then
            exec 8>"$CLAUDE_SESSIONDATA_ROOT/data/.transcript_sweep.$(id -u).lock"
            flock -n 8 || exit 0
        fi
        claude_archive_sweep "$2"
        ;;
esac
