#!/usr/bin/env bash
# Builds current workspace JS in a prepared RN 0.81/0.83 app and drives Android NumberFlow adoption checks.
# Usage: ANDROID_SERIAL=emulator-5554 bash scripts/native-sim/run-adoption-android.sh <prepared-app> <out-dir>
# Emulator accessibility-tree/final-label evidence only; no TalkBack speech, visual bidi or physical-device claim.
set -euo pipefail
HIG="$(cd "$(dirname "$0")/../.." && pwd -P)"
APP="$(cd "$1" && pwd -P)"; OUT="$(mkdir -p "$2" && cd "$2" && pwd -P)"
RAW="$HIG/.validation-tmp/native-adoption-android"; LOGS="$RAW/logs"
mkdir -p "$LOGS" "$RAW"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"; export PATH="$ANDROID_HOME/platform-tools:$PATH" JAVA_HOME="${JAVA_HOME_17:-/opt/homebrew/opt/openjdk@17}"
for package_name in contracts native native-fonts tokens; do
  rsync -a --delete "$HIG/packages/hig/$package_name/dist/" "$APP/node_modules/@bloxwap/hig/$package_name/dist/"
done
rsync -a "$HIG/packages/hig/native-fonts/fonts/" "$APP/node_modules/@bloxwap/hig/native-fonts/fonts/"
cp "$HIG/fixtures/native/adoption-check.tsx" "$APP/adoption-check.tsx"
cp "$HIG/fixtures/native/index-adoption.js" "$APP/index-adoption.js"
cp "$APP/index.js" "$RAW/index.original.js"
cp "$APP/metro.config.cjs" "$RAW/metro.original.cjs"
cp "$APP/index-adoption.js" "$APP/index.js"
printf "\nmodule.exports.cacheStores=[new(module.exports.cacheStores[0].constructor)({root:require('node:path').resolve(__dirname,'../adoption-android-metro-cache')})];\n" >> "$APP/metro.config.cjs"
restore() {
  cp "$RAW/index.original.js" "$APP/index.js"; cp "$RAW/metro.original.cjs" "$APP/metro.config.cjs"
  adb shell settings put system font_scale 1.0 >/dev/null 2>&1 || true
  adb shell settings put global transition_animation_scale 1 >/dev/null 2>&1 || true
  adb shell settings put global animator_duration_scale 1 >/dev/null 2>&1 || true
}
trap restore EXIT
(cd "$APP/android" && ./gradlew :app:createBundleReleaseJsAndAssets --rerun -PreactNativeArchitectures=arm64-v8a > "$LOGS/android-build.log" 2>&1 && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a >> "$LOGS/android-build.log" 2>&1)
adb install -r "$APP/android/app/build/outputs/apk/release/app-release.apk" >/dev/null
run() {
  local prefix="$1" mode="$2" scale="$3" animations="$4"; shift 4
  adb shell settings put system font_scale "$scale"
  adb shell settings put global transition_animation_scale "$animations"
  adb shell settings put global animator_duration_scale "$animations"
  env "$@" HIG_ADOPTION_OUT="$OUT/$prefix" HIG_ADOPTION_PREFIX="$prefix" HIG_ADOPTION_NUMBER_MODE="$mode" python3 "$HIG/scripts/native-sim/adoption-android.py" > "$LOGS/number-$prefix.log" 2>&1
  printf 'testNumberFlow %s passed\n' "$prefix" | tee -a "$OUT/summary.txt"
}
run default full 1.0 1
run font200 smoke 2.0 1 HIG_ADOPTION_MIN_FONT_SCALE=2
run reduce-motion smoke 1.0 0 HIG_ADOPTION_EXPECT_MOTION=reduced
adb shell settings put system font_scale 1.0
adb shell settings put global transition_animation_scale 1
adb shell settings put global animator_duration_scale 1
