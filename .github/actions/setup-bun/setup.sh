#!/usr/bin/env bash
set -euo pipefail
: "${RUNNER_TEMP:?RUNNER_TEMP is required}"
: "${GITHUB_PATH:?GITHUB_PATH is required}"
case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) package=@oven/bun-darwin-aarch64 ;;
  Linux-x86_64) package=@oven/bun-linux-x64 ;;
  *) echo 'Unsupported Bun runner platform' >&2; exit 1 ;;
esac
# Runner services can share a home directory. Never install into ~/.bun/bin.
install_dir=$(mktemp -d "$RUNNER_TEMP/hig-bun.XXXXXX")
npm install --prefix "$install_dir" --ignore-scripts --no-audit --no-fund --package-lock=false "$package@1.4.2"
mkdir -p "$install_dir/bin"
ln -s "$install_dir/node_modules/$package/bin/bun" "$install_dir/bin/bun"
ln -s "$install_dir/bin/bun" "$install_dir/bin/bunx"
test "$("$install_dir/bin/bun" --version)" = '1.4.2'
echo "$install_dir/bin" >> "$GITHUB_PATH"
