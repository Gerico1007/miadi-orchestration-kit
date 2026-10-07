#!/usr/bin/env bash
# prep/miadi-tmux.sh <stage>: build the tmux release miadi-tmux's Version names (3.7c-1 -> 3.7c)
# and install it into the package tree: /usr/bin/tmux and /usr/share/man/man1/tmux.1.gz.
# Needs build-essential, pkg-config, bison, libevent-dev, libncurses-dev and curl on the builder.
# The tarball is cached in ${XDG_CACHE_HOME:-~/.cache}/miadi-deb. Ref: jgwill/gaia#90
set -euo pipefail
stage="$1"
version=$(sed -n 's/^Version: //p' "$stage/DEBIAN/control")
release="${version%%-*}"
cache="${XDG_CACHE_HOME:-$HOME/.cache}/miadi-deb"
tarball="$cache/tmux-$release.tar.gz"
mkdir -p "$cache"
[ -s "$tarball" ] || curl -fsSL -o "$tarball" "https://github.com/tmux/tmux/releases/download/$release/tmux-$release.tar.gz"
build=$(mktemp -d)
trap 'rm -rf "$build"' EXIT
tar -xzf "$tarball" -C "$build"
(cd "$build/tmux-$release" && ./configure --prefix=/usr --quiet && make -j"$(nproc)" --quiet)
built=$("$build/tmux-$release/tmux" -V)
[ "$built" = "tmux $release" ] || { echo "prep/miadi-tmux.sh: built '$built', expected 'tmux $release'" >&2; exit 1; }
install -D -m 0755 "$build/tmux-$release/tmux" "$stage/usr/bin/tmux"
strip --strip-unneeded "$stage/usr/bin/tmux"
install -D -m 0644 "$build/tmux-$release/tmux.1" "$stage/usr/share/man/man1/tmux.1"
gzip -9n "$stage/usr/share/man/man1/tmux.1"
echo "miadi-tmux: $built" >&2
