#!/usr/bin/env bash
# tmux-resurrect-repair-save.sh
# tmux-resurrect post-save-layout hook: repair pane lines whose empty title shifted the fields.
#
# tmux-resurrect reads its tab-separated fields with `IFS=$'\t' read` (scripts/save.sh:192 and
# scripts/restore.sh:178, upstream master cff343c). A tab is whitespace to `read`, so an empty
# field merges into the next one. A pane whose title is empty - Claude Code clears its title
# when it exits - is saved with its folder where the title goes and its full command read
# from the wrong pid, and the restore opens it in whatever folder the tmux server started in.
# Measured on gaia on 2026-09-28: 10 panes came back in /a/src/gaia/linux_migration.
#
# For each such line this writes a one-space title (a space is not in IFS=$'\t', so `read`
# keeps it), puts the folder back in its field, and reads the full command from the pane's
# own child process, the way the linux_procfs strategy does.
#
# Installed by 14-tmux-resurrect.sh as @resurrect-hook-post-save-layout, which passes the save
# file path as the only argument. jgwill/gaia#89.

set -u

file="${1:-}"
[ -n "$file" ] && [ -f "$file" ] || exit 0

child_command() {
    local pane_pid="$1" child
    child=$(cut -d' ' -f1 "/proc/${pane_pid}/task/${pane_pid}/children" 2>/dev/null)
    [ -n "$child" ] && [ -r "/proc/${child}/cmdline" ] || return 0
    xargs -0 bash -c 'printf "%q " "$0" "$@"' < "/proc/${child}/cmdline" 2>/dev/null
}

tmp="${file}.repair.$$"
repaired=0
while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" == pane$'\t'* ]]; then
        # Split on tabs with a separator `read` does not treat as whitespace, so empty fields stay.
        IFS=$'\x1f' read -r -a f <<< "${line//$'\t'/$'\x1f'}"
        if [ "${#f[@]}" -eq 11 ] && [[ "${f[6]}" == :* ]] && [[ "${f[7]}" != :* ]] && [[ "${f[9]}" =~ ^[0-9]+$ ]]; then
            full=$(child_command "${f[9]}")
            printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t:%s\n' \
                "${f[0]}" "${f[1]}" "${f[2]}" "${f[3]}" "${f[4]}" "${f[5]}" \
                " " "${f[6]}" "${f[7]}" "${f[8]}" "${full% }" >> "$tmp"
            repaired=$((repaired + 1))
            continue
        fi
    fi
    printf '%s\n' "$line" >> "$tmp"
done < "$file"

if [ "$repaired" -gt 0 ]; then
    mv -f "$tmp" "$file"
else
    rm -f "$tmp"
fi
exit 0
