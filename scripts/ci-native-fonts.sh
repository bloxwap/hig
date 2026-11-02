#!/usr/bin/env bash
# Reuse generated fonts locally on each mini; cache failures are non-fatal.
set -euo pipefail
cd "$(dirname "$0")/.."

cache_root="${HIG_FONT_CACHE_DIR:-$HOME/Library/Caches/bloxwap-hig/native-fonts}"

sha256() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$@"
  else
    sha256sum "$@"
  fi
}

restore_fonts() {
  [ -f "$cache_root/$key/.complete" ] || return 1
  [ -d "$cache_root/$key/native-fonts" ] || return 1
  [ -d "$cache_root/$key/og-fonts" ] || return 1
  for kind in native-fonts og-fonts; do
    mkdir -p "packages/hig/$kind" || return 1
    rm -rf "packages/hig/$kind/fonts" || return 1
    cp -R "$cache_root/$key/$kind" "packages/hig/$kind/fonts" || return 1
  done
  # Keep entries in use from aging out of the 14-day prune.
  touch "$cache_root/$key" || true
}

save_fonts() {
  local staging
  staging=$(mktemp -d "$cache_root/.tmp.XXXXXXXX") || return 1
  # Match the final basename so mv into the root fails if another writer won,
  # rather than moving our staging directory inside the winning entry.
  if mkdir "$staging/$key" &&
    cp -R packages/hig/native-fonts/fonts "$staging/$key/native-fonts" &&
    cp -R packages/hig/og-fonts/fonts "$staging/$key/og-fonts" &&
    touch "$staging/$key/.complete"; then
    mv "$staging/$key" "$cache_root/" 2>/dev/null || {
      [ -f "$cache_root/$key/.complete" ] || {
        rm -rf "$staging" || true
        return 1
      }
    }
  else
    rm -rf "$staging" || true
    return 1
  fi
  rm -rf "$staging"
}

prune_fonts() {
  local entry name
  for entry in "$cache_root"/*; do
    name=${entry##*/}
    [ "$name" != "$key" ] || continue
    [ "${#name}" -eq 64 ] || continue
    case "$name" in *[!0-9a-f]*) continue ;; esac
    # Do not follow symlinks or traverse beyond this immediate key directory.
    find "$entry" -prune -type d -mtime +14 -exec rm -rf {} + || return 1
  done
}

cache_ready=false
if key=$(sha256 scripts/generate-native-fonts.py package-lock.json | sha256 | awk '{print $1}') &&
  mkdir -p "$cache_root"; then
  cache_ready=true
  prune_fonts || echo 'Native font cache pruning failed; continuing.' >&2
  if restore_fonts; then
    echo 'Restored native/OG fonts from the local cache.'
    exit 0
  fi
fi

# Generator failures must still fail the job; only caching is best-effort.
bash scripts/ci-generate-fonts.sh
if [ "$cache_ready" = true ]; then
  save_fonts || echo 'Native font cache save failed; using generated fonts.' >&2
fi
