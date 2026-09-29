#!/usr/bin/env bash
# terminal_binding.sh — join an agent session to the terminal it runs in.
#
# One line per session start, end, rename and first sighting, with the session's team, appended to
#   $CLAUDE_SESSIONDATA_ROOT/data/terminal_bindings.jsonl     every session, one file
#   $CLAUDE_SESSIONDATA_ROOT/<session_id>/_terminal_binding.jsonl
#
# Readers: the tmux save and restore hooks (jgwill/gaia), tide (jgwill/Miadi) and the
# session inventory (Mino). The tmux address is session:window.pane, because pane ids (%N)
# are renumbered every time the tmux server starts; pane_id is kept for joins while the
# server runs. argv is the agent's own command line with the flags its launch alias
# expanded to; launch_alias is MIADI_LAUNCH_ALIAS when a launcher exported it.
# jgwill/binscripts#158.
#
# Sourced after lib.sh (CLAUDE_SESSIONDATA_ROOT, claude_sanitize_text). Hooks inject their
# stdout into the conversation, so nothing here may print to stdout.

# The agent process: the nearest ancestor that Claude Code registered in
# ~/.claude/sessions/<pid>.json, else the nearest ancestor named claude.
# _TB_AGENT_PID, when set, is the answer already found by a hook that detached its work.
_tb_agent_pid() {
    if [ -n "${_TB_AGENT_PID:-}" ]; then
        printf '%s' "$_TB_AGENT_PID"
        return 0
    fi
    local pid="$PPID" first_claude="" comm i
    for i in 1 2 3 4 5 6 7 8; do
        case "$pid" in ''|0|1) break ;; esac
        if [ -f "$HOME/.claude/sessions/$pid.json" ]; then
            printf '%s' "$pid"
            return 0
        fi
        comm=$(cat "/proc/$pid/comm" 2>/dev/null)
        if [ -z "$first_claude" ] && [ "$comm" = "claude" ]; then
            first_claude="$pid"
        fi
        pid=$(awk '/^PPid:/ {print $2}' "/proc/$pid/status" 2>/dev/null)
    done
    printf '%s' "$first_claude"
}

# {session, window, pane, pane_id, socket} for $TMUX_PANE, or null outside tmux and when
# the environment names a tmux server that is no longer the one listening on the socket.
_tb_tmux_json() {
    if [ -z "${TMUX_PANE:-}" ] || [ -z "${TMUX:-}" ] || ! command -v tmux >/dev/null 2>&1; then
        printf 'null'
        return 0
    fi
    local socket="${TMUX%%,*}" env_pid fields
    env_pid="${TMUX#*,}"
    env_pid="${env_pid%%,*}"
    fields=$(tmux -S "$socket" display-message -p -t "$TMUX_PANE" \
        "#{pid}"$'\t'"#{session_name}"$'\t'"#{window_index}"$'\t'"#{pane_index}"$'\t'"#{pane_id}" 2>/dev/null)
    if [ -z "$fields" ]; then
        printf 'null'
        return 0
    fi
    local t_pid t_session t_window t_pane t_pane_id
    IFS=$'\t' read -r t_pid t_session t_window t_pane t_pane_id <<< "$fields"
    if [ -n "$env_pid" ] && [ "$t_pid" != "$env_pid" ]; then
        printf 'null'
        return 0
    fi
    jq -cn --arg session "$t_session" --arg window "$t_window" --arg pane "$t_pane" \
        --arg pane_id "$t_pane_id" --arg socket "$socket" \
        '{session: $session, window: ($window | tonumber? // $window),
          pane: ($pane | tonumber? // $pane), pane_id: $pane_id, socket: $socket}' 2>/dev/null \
        || printf 'null'
}

# {name, source, since, former} from Claude Code's record of the process, or null.
_tb_name_json() {
    local f="$HOME/.claude/sessions/$1.json"
    if [ -z "$1" ] || [ ! -r "$f" ]; then
        printf 'null'
        return 0
    fi
    jq -c '{name: (.name // ""), source: (.nameSource // ""), since: (.nameSince // null),
            former: (.formerNames // [])}' "$f" 2>/dev/null || printf 'null'
}

# {id, source} for the session's team (jgwill/miadi-orchestration-kit#56, D9 and D10 on its page).
# Order: a declared team (MIADI_TEAM, or the tmux session option @miadi-team), then the list's
# session names, then its folders (the longest prefix wins), then its name patterns, else
# unassigned. The list is teams/teams.json in the kit: MIADI_TEAMS_FILE, else
# $MIADI_ORCHESTRATION_KIT_ROOT/teams/teams.json. An installed plugin is a copy of this folder,
# so it cannot reach the kit by a relative path. `source` says which rule answered.
_tb_team_json() {
    local cwd="$1" tmux_session="$2" agent_name="$3" declared="${MIADI_TEAM:-}" teams_file
    if [ -z "$declared" ] && [ -n "${TMUX_PANE:-}" ] && [ -n "${TMUX:-}" ] && command -v tmux >/dev/null 2>&1; then
        declared=$(tmux -S "${TMUX%%,*}" show-options -qv -t "$TMUX_PANE" @miadi-team 2>/dev/null)
    fi
    if [ -n "$declared" ]; then
        jq -cn --arg id "$declared" '{id: $id, source: "declared"}' 2>/dev/null || printf 'null'
        return 0
    fi
    teams_file="${MIADI_TEAMS_FILE:-}"
    if [ -z "$teams_file" ] && [ -n "${MIADI_ORCHESTRATION_KIT_ROOT:-}" ]; then
        teams_file="$MIADI_ORCHESTRATION_KIT_ROOT/teams/teams.json"
    fi
    if [ -z "$teams_file" ] || [ ! -r "$teams_file" ]; then
        printf '{"id":"unassigned","source":"no teams file"}'
        return 0
    fi
    jq -c --arg s "$tmux_session" --arg n "$agent_name" --arg cwd "$cwd" '
        ([$s, $n] | map(select(. != ""))) as $names
        | ([.teams[] | select(any(.sessions[]?; . as $x | $names | index($x)))] | first) as $by_session
        | ([.teams[] as $t | $t.folders[]? as $f
            | select($cwd != "" and ($cwd == $f or ($cwd | startswith($f + "/"))))
            | {team: $t, length: ($f | length)}] | sort_by(-.length) | first | .team?) as $by_folder
        | ([.teams[] | select(any(.name_patterns[]?; . as $p | any($names[]; test($p))))] | first) as $by_name
        | if $by_session then {id: $by_session.id, source: "session"}
          elif $by_folder then {id: $by_folder.id, source: "folder"}
          elif $by_name then {id: $by_name.id, source: "name"}
          else {id: "unassigned", source: "no rule matched"} end' "$teams_file" 2>/dev/null \
        || printf '{"id":"unassigned","source":"unreadable teams file"}'
}

# The agent's command line as a JSON array, [] when the process is gone.
_tb_argv_json() {
    if [ -n "$1" ] && [ -r "/proc/$1/cmdline" ]; then
        jq -Rsc 'split("\u0000") | map(select(length > 0))' < "/proc/$1/cmdline" 2>/dev/null \
            || printf '[]'
    else
        printf '[]'
    fi
}

_tb_append() {
    local session_id="$1" line
    line=$(claude_sanitize_text "$2")
    [ -n "$line" ] || return 0
    mkdir -p "$CLAUDE_SESSIONDATA_ROOT/data" "$CLAUDE_SESSIONDATA_ROOT/$session_id"
    printf '%s\n' "$line" >> "$CLAUDE_SESSIONDATA_ROOT/data/terminal_bindings.jsonl"
    printf '%s\n' "$line" >> "$CLAUDE_SESSIONDATA_ROOT/$session_id/_terminal_binding.jsonl"
}

# What the rename check compares against: the agent pid and the name last written.
_tb_remember() {
    local state="$CLAUDE_SESSIONDATA_ROOT/$1/_terminal_binding.state"
    jq -cn --arg pid "$2" --argjson name "${3:-null}" \
        '{pid: ($pid | tonumber? // null), name: ($name.name // ""), since: ($name.since // null)}' \
        > "$state.tmp.$$" 2>/dev/null && mv -f "$state.tmp.$$" "$state"
    rm -f "$state.tmp.$$"
}

# claude_write_terminal_binding <event> <hook input json>
# event: session.start | session.end | session.rename | session.observed
claude_write_terminal_binding() {
    local event="$1" input="$2" session_id
    session_id=$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null)
    [ -n "$session_id" ] || return 0

    local agent_pid tmux_json name_json argv_json="[]" line
    agent_pid=$(_tb_agent_pid)
    tmux_json=$(_tb_tmux_json)
    name_json=$(_tb_name_json "$agent_pid")
    # At session end Claude Code has already removed its pid file: keep the last name written.
    local state="$CLAUDE_SESSIONDATA_ROOT/$session_id/_terminal_binding.state"
    if [ "$name_json" = "null" ] && [ -r "$state" ]; then
        name_json=$(jq -c 'if (.name // "") == "" then null
            else {name: .name, source: "last-known", since: (.since // null), former: []} end' \
            "$state" 2>/dev/null)
        [ -n "$name_json" ] || name_json="null"
    fi
    if [ -n "${_TB_ARGV_JSON:-}" ]; then
        argv_json="$_TB_ARGV_JSON"
    else
        argv_json=$(_tb_argv_json "$agent_pid")
    fi
    local team_json
    team_json=$(_tb_team_json \
        "$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)" \
        "$(printf '%s' "${tmux_json:-null}" | jq -r '.session? // empty' 2>/dev/null)" \
        "$(printf '%s' "${name_json:-null}" | jq -r '.name? // empty' 2>/dev/null)")

    line=$(printf '%s' "$input" | jq -c \
        --arg at "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)" \
        --arg event "$event" \
        --arg host "$(hostname -s 2>/dev/null)" \
        --arg pid "$agent_pid" \
        --argjson argv "${argv_json:-[]}" \
        --arg launch_alias "${MIADI_LAUNCH_ALIAS:-}" \
        --argjson name "${name_json:-null}" \
        --argjson tmux "${tmux_json:-null}" \
        --argjson team "${team_json:-null}" \
        '{at: $at, event: $event, source: (.source // .reason // ""), agent: "claude",
          session_id: .session_id, cwd: (.cwd // ""), transcript_path: (.transcript_path // ""),
          host: $host, pid: ($pid | tonumber? // null), argv: $argv,
          launch_alias: $launch_alias, name: $name, tmux: $tmux, team: $team}' 2>/dev/null) || return 0
    [ -n "$line" ] || return 0

    _tb_append "$session_id" "$line"
    _tb_remember "$session_id" "$agent_pid" "$name_json"
    return 0
}

# claude_check_terminal_binding_rename <hook input json>
# No hook fires on /rename. Called from UserPromptSubmit and Stop, this compares Claude
# Code's current name for the process with the last one written, and appends a
# session.rename line when it changed. A session with no binding yet (started before this
# file existed) gets one session.observed line at its first turn.
claude_check_terminal_binding_rename() {
    local input="$1" session_id state pid verdict
    session_id=$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null)
    [ -n "$session_id" ] || return 0
    state="$CLAUDE_SESSIONDATA_ROOT/$session_id/_terminal_binding.state"
    if [ ! -r "$state" ]; then
        claude_write_terminal_binding "session.observed" "$input"
        return 0
    fi
    pid=$(jq -r '.pid // empty' "$state" 2>/dev/null)
    [ -n "$pid" ] && [ -r "$HOME/.claude/sessions/$pid.json" ] || return 0
    verdict=$(jq -rn --slurpfile st "$state" --slurpfile pf "$HOME/.claude/sessions/$pid.json" \
        'if (($st[0].name // "") == ($pf[0].name // "")) and (($st[0].since // null) == ($pf[0].nameSince // null))
         then "same" else "renamed" end' 2>/dev/null)
    if [ "$verdict" = "renamed" ]; then
        claude_write_terminal_binding "session.rename" "$input"
    fi
    return 0
}
