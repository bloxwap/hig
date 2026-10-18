#!/usr/bin/env bash
# Relocatable CPython 3.12 for self-hosted Apple silicon runners.
# GitHub's actions/setup-python macOS builds mkdir /Users/runner/hostedtoolcache
# and fail here with "Permission denied". Do not apt/sudo; install into $RUNNER_TEMP.
set -euo pipefail

python_is_new_enough() {
  command -v python3 >/dev/null 2>&1 || return 1
  python3 -c 'import sys, venv; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)'
}

if python_is_new_enough; then
  python3 --version
  exit 0
fi

scratch="${RUNNER_TEMP:-${TMPDIR:-$(pwd)/.tmp}}/hig-python"
mkdir -p "$scratch"

uv_version="0.13.1"
uname_s="$(uname -s)"
uname_m="$(uname -m)"
case "${uname_s}-${uname_m}" in
  Darwin-arm64)
    asset="uv-aarch64-apple-darwin"
    sha256="cfe454573412ff7380d15fc7dae5997ab53ffce72fce0a78e91ddbc84001acd2"
    ;;
  *)
    echo "ci-setup-python.sh: fonttools 4.61.1 needs Python 3.10+ with venv."
    echo "System python3 is too old, and the uv bootstrap is only wired for Darwin arm64 (got ${uname_s} ${uname_m})."
    python3 --version 2>/dev/null || true
    exit 1
    ;;
esac

tarball="$scratch/${asset}.tar.gz"
curl -fsSL "https://github.com/astral-sh/uv/releases/download/${uv_version}/${asset}.tar.gz" -o "$tarball"
actual="$(openssl dgst -sha256 "$tarball" | awk '{print $NF}')"
if [ "$actual" != "$sha256" ]; then
  echo "uv ${uv_version} tarball SHA-256 mismatch: expected ${sha256} got ${actual}"
  exit 1
fi

tar -xzf "$tarball" -C "$scratch"
uv_bin="$scratch/${asset}/uv"
chmod +x "$uv_bin"

export UV_PYTHON_INSTALL_DIR="$scratch/cpython"
export UV_CACHE_DIR="$scratch/cache"
mkdir -p "$UV_PYTHON_INSTALL_DIR" "$UV_CACHE_DIR"
"$uv_bin" python install 3.12

py=""
for candidate in "$UV_PYTHON_INSTALL_DIR"/*/bin/python3; do
  if [ -x "$candidate" ]; then
    py="$candidate"
    break
  fi
done
if [ -z "$py" ]; then
  echo "uv python install 3.12 did not produce python3 under $UV_PYTHON_INSTALL_DIR"
  ls -la "$UV_PYTHON_INSTALL_DIR" || true
  exit 1
fi

bindir="$(dirname "$py")"
if [ -n "${GITHUB_PATH:-}" ]; then
  echo "$bindir" >> "$GITHUB_PATH"
fi
PATH="$bindir:$PATH"
export PATH
hash -r 2>/dev/null || true
python3 --version
python3 -c 'import sys, venv; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)'
