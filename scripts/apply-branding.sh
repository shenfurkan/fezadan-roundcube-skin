#!/usr/bin/env bash
# Overlays a branding directory onto the neutral skin.
set -eu
name="${1:-}"
root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
[ -n "$name" ] && [ -d "$root/branding/$name" ] || { echo "usage: $0 <name>" >&2; exit 1; }
cp -R "$root/branding/$name/." "$root/skin/"
echo "Applied branding: $name"
