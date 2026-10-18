#!/usr/bin/env bash
# iOS Simulator captures of the gallery on a Display P3 host build (#93): HIGProvider colorSpace display-p3 vs srgb.
# Usage: scripts/native-sim/capture-color-space.sh <booted-udid> <app-path> <out-dir>
# Build the app first: HIG_IOS_COLOR_SPACE=display-p3 HIG_SKIP_ANDROID=1 scripts/native-sim/prepare-app.sh <app-dir> <udid> rn-0.83
# Summarize: python3 -I scripts/native-sim/sample-accents.py <out-dir> <capture names...>
# iOS Simulator only: simctl screenshots are converted to sRGB, so colours wider than sRGB are clipped (#55 tracks displays).
set -euo pipefail
UDID="$1"; APP="$2"; OUT="$3"; mkdir -p "$OUT"
xcrun simctl ui "$UDID" appearance dark
xcrun simctl ui "$UDID" content_size large
xcrun simctl status_bar "$UDID" override --time 9:41 --batteryState charged --batteryLevel 100 --wifiBars 3 || true
xcrun simctl uninstall "$UDID" com.bloxwap.hig.gallery 2>/dev/null || true
xcrun simctl install "$UDID" "$APP"
shot() { # shot <name> <query>
  xcrun simctl terminate "$UDID" com.bloxwap.hig.gallery 2>/dev/null || true
  sleep 1
  xcrun simctl openurl "$UDID" "bloxwaphig://gallery?$2"
  sleep 6
  xcrun simctl io "$UDID" screenshot --type=png "$OUT/$1.png" >/dev/null 2>&1
  echo "$1 <- $2"
}
for cs in display-p3 srgb; do
  shot "ios-gallery-$cs" "colorSpace=$cs"
  shot "ios-alert-error-$cs" "component=Alert&state=error&colorSpace=$cs"
  shot "ios-switch-default-$cs" "component=Switch&state=default&colorSpace=$cs"
done
xcrun simctl terminate "$UDID" com.bloxwap.hig.gallery 2>/dev/null || true
xcrun simctl status_bar "$UDID" clear || true
