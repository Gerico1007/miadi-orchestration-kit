#!/usr/bin/env bash
# Move every kit plugin's pinned MCP server package to the version the registry
# serves, bump the plugin's version, prove its servers connect, commit by path
# and push. Covers every claude/*/.mcp.json.
#
#   scripts/kit-mcp-upgrade.sh --dry-run
#   scripts/kit-mcp-upgrade.sh --ref jgwill/miadi-orchestration-kit#64 [--ref jgwill/Miadi#N] [--no-push]
#
# The skill that runs it: miadi-factory-delivery (jgwill/Miadi, skills/), through scripts/ops/miadi-delivery.sh.
set -uo pipefail

KIT=$(cd "$(dirname "$0")/.." && pwd)
DRY=0
PUSH=1
REFS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --no-push) PUSH=0 ;;
    --ref) [ $# -ge 2 ] || { echo "ERROR: --ref needs owner/repo#N" >&2; exit 2; }; REFS+=("$2"); shift ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) echo "ERROR: unknown argument $1" >&2; exit 2 ;;
  esac
  shift
done

die() { echo "ERROR: $*" >&2; exit 1; }
git_kit() { git -C "$KIT" "$@"; }

if [ "$DRY" = 0 ]; then
  [ ${#REFS[@]} -gt 0 ] || die "a commit needs an issue: pass --ref owner/repo#N"
  [ "$(git_kit rev-parse --abbrev-ref HEAD)" = main ] || die "the kit checkout is not on main"
  # The kit is an authoring checkout: local commits are normal, so integrate, never fast-forward only.
  git_kit pull -q --no-rebase --no-edit origin main || die "origin/main conflicts with local main; resolve it, then run again"
fi

# plugin-dir <TAB> plugin-name <TAB> server <TAB> env-var or "-" <TAB> package <TAB> pinned-version
# (bash collapses empty tab fields, so an absent variable is "-")
pins() {
  node -e '
    const fs = require("fs"), path = require("path");
    const kit = process.argv[1];
    for (const d of fs.readdirSync(path.join(kit, "claude")).sort()) {
      const dir = path.join(kit, "claude", d), f = path.join(dir, ".mcp.json");
      if (!fs.existsSync(f)) continue;
      const name = JSON.parse(fs.readFileSync(path.join(dir, ".claude-plugin/plugin.json"), "utf8")).name;
      for (const [server, s] of Object.entries(JSON.parse(fs.readFileSync(f, "utf8")).mcpServers || {}))
        for (const a of s.args || []) {
          const m = a.match(/^(?:\$\{(\w+):-)?(@[\w.-]+\/[\w.-]+)@(\d+\.\d+\.\d+[\w.-]*)\}?$/);
          if (m) console.log([dir, name, server, m[1] || "-", m[2], m[3]].join("\t"));
        }
    }' "$KIT"
}

# exit 0 when $1 is a newer version than $2
newer() { node -e 'const p=v=>v.split(/[.-]/).slice(0,3).map(Number);const [a,b]=[p(process.argv[1]),p(process.argv[2])];for(let i=0;i<3;i++){if(a[i]!==b[i])process.exit(a[i]>b[i]?0:1)}process.exit(1)' "$1" "$2"; }

PINS=$(pins) || die "could not read the plugins' .mcp.json files"
[ -n "$PINS" ] || { echo "No pinned npm servers in $KIT/claude/*/.mcp.json."; exit 0; }

MOVES=()   # plugin-dir <TAB> package <TAB> old <TAB> new
STOP=0
while IFS=$'\t' read -r dir name server var pkg ver; do
  latest=$(npm view "$pkg" version --prefer-online 2>/dev/null < /dev/null) || die "npm view $pkg failed"
  exists=$(npm view "$pkg@$ver" version 2>/dev/null < /dev/null)
  if [ "$ver" = "$latest" ]; then
    state="current"
  elif newer "$latest" "$ver"; then
    state="moves -> $latest"
    MOVES+=("$dir"$'\t'"$pkg"$'\t'"$ver"$'\t'"$latest")
  else
    state="pinned $ver is newer than the registry's $latest: publish it, or move the pin back by hand"
    STOP=1
  fi
  [ -n "$exists" ] || state="$state (pinned $ver is NOT on the registry)"
  printf '%-30s %-32s %-28s %s\n' "$name" "$server" "$pkg@$ver" "$state"
  if [ "$var" != - ] && [ -n "${!var:-}" ]; then
    where=$(grep -ls "export $var=" /opt/binscripts/etc/* 2>/dev/null | head -1)
    case "${!var}" in
      *"@$latest") echo "  env $var=${!var} shadows the pin on this host (current)${where:+, set in $where}" ;;
      *) echo "  env $var=${!var} shadows the pin on this host and is not $latest${where:+: move it in $where}" ;;
    esac
  fi
done <<< "$PINS"

[ "$STOP" = 0 ] || die "a pin is ahead of the registry; nothing was changed"
if [ ${#MOVES[@]} -eq 0 ]; then echo "Every pin is current."; exit 0; fi
if [ "$DRY" = 1 ]; then echo "${#MOVES[@]} pin(s) would move. Dry run: nothing changed."; exit 0; fi

# --- apply -----------------------------------------------------------------
CHANGED_DIRS=$(printf '%s\n' "${MOVES[@]}" | cut -f1 | sort -u)
FILES=()
for dir in $CHANGED_DIRS; do
  for f in .mcp.json README.md .claude-plugin/plugin.json; do
    [ -f "$dir/$f" ] && FILES+=("${dir#$KIT/}/$f")
  done
done
FILES+=(.claude-plugin/marketplace.json)
dirty=$(git_kit status --porcelain -- "${FILES[@]}")
[ -z "$dirty" ] || die "tracked files are modified, someone's work is in them:"$'\n'"$dirty"

for m in "${MOVES[@]}"; do
  IFS=$'\t' read -r dir pkg old new <<< "$m"
  for f in "$dir/.mcp.json" "$dir/README.md"; do
    [ -f "$f" ] && FROM="$pkg@$old" TO="$pkg@$new" perl -pi -e 's/\Q$ENV{FROM}\E/$ENV{TO}/g' "$f"
  done
done

SUBJECT=()
for dir in $CHANGED_DIRS; do
  read -r name old_v new_v < <(node -e '
    const fs = require("fs"), path = require("path");
    const [dir, kit] = process.argv.slice(1);
    const pf = path.join(dir, ".claude-plugin/plugin.json");
    const text = fs.readFileSync(pf, "utf8"), j = JSON.parse(text);
    const v = j.version.split(".").map(Number); v[2] += 1;
    const nv = v.join(".");
    fs.writeFileSync(pf, text.replace(`"version": "${j.version}"`, `"version": "${nv}"`));
    const mf = path.join(kit, ".claude-plugin/marketplace.json");
    const esc = j.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`("name": "${esc}",[\\s\\S]*?"version": ")([^"]+)(")`);
    const mt = fs.readFileSync(mf, "utf8");
    if (re.test(mt)) fs.writeFileSync(mf, mt.replace(re, `$1${nv}$3`));
    console.log(j.name, j.version, nv);' "$dir" "$KIT")
  moved=$(printf '%s\n' "${MOVES[@]}" | awk -F'\t' -v d="$dir" '$1==d {printf "%s%s %s", (n++?", ":""), $2, $4}')
  SUBJECT+=("$name $new_v: $moved")
  echo "plugin $name $old_v -> $new_v"
done

# Prove with every pin variable unset, so the defaults are what connects.
UNSET=()
while IFS=$'\t' read -r _ _ _ var _ _; do [ "$var" != - ] && UNSET+=(-u "$var"); done <<< "$PINS"
SCRATCH=$(mktemp -d)
PROOF=()
for dir in $CHANGED_DIRS; do
  name=$(node -e 'console.log(require(process.argv[1]).name)' "$dir/.claude-plugin/plugin.json")
  want=$(node -e 'console.log(Object.keys(require(process.argv[1]).mcpServers).length)' "$dir/.mcp.json")
  ok=0
  for attempt in 1 2 3; do
    out=$(cd "$SCRATCH" && env "${UNSET[@]}" timeout 300 claude --plugin-dir "$dir" mcp list 2>&1 | grep "^plugin:$name:")
    got=$(printf '%s\n' "$out" | grep -c "Connected$")
    if [ "$got" = "$want" ] && ! printf '%s\n' "$out" | grep -q "Failed"; then ok=1; break; fi
    echo "  attempt $attempt: $got of $want servers connected; the registry may still be arriving"
    [ "$attempt" = 3 ] || sleep 30
  done
  printf '%s\n' "$out"
  if [ "$ok" = 0 ]; then
    git_kit checkout -- "${FILES[@]}"
    die "$name did not connect with the new pins; the kit is back at its last commit"
  fi
  PROOF+=("$name: $want of $want servers connected")
done
rm -rf "$SCRATCH"

BODY="The default pins move to the versions the registry serves. Proved from a scratch
directory with the pin variables unset (claude --plugin-dir … mcp list):
$(printf -- '- %s\n' "${PROOF[@]}")"
REFLINES=$(printf 'Ref: %s\n' "${REFS[@]}")
SUBJ=$(printf '%s; ' "${SUBJECT[@]}"); SUBJ=${SUBJ%; }
git_kit commit -q -m "$SUBJ" -m "$BODY" -m "$REFLINES" -- "${FILES[@]}" || die "commit failed"
echo "committed $(git_kit rev-parse --short HEAD): $SUBJ"

if [ "$PUSH" = 1 ]; then
  if ! git_kit push -q origin main; then
    git_kit pull -q --no-rebase origin main || die "origin/main conflicts with the commit; resolve, then push"
    git_kit push -q origin main || die "push failed after integrating origin/main"
  fi
  echo "pushed origin/main $(git_kit rev-parse --short HEAD)"
fi
echo "Upgrade complete. Running sessions keep the servers they started with; a new session starts the new pins."
