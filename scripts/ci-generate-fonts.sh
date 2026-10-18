#!/usr/bin/env bash
# Install pinned fonttools into $RUNNER_TEMP (no apt/sudo) and generate native/OG faces.
set -euo pipefail
cd "$(dirname "$0")/.."
scratch="${RUNNER_TEMP:-${TMPDIR:-$(pwd)/.tmp}}"
mkdir -p "$scratch"
venv="$scratch/hig-fonttools"
python3 --version
python3 -m venv "$venv"
"$venv/bin/pip" install --disable-pip-version-check "fonttools[woff]==4.61.1" "brotli==1.2.0"
PATH="$venv/bin:$PATH" npm run generate:fonts
