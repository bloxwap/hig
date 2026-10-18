#!/usr/bin/env bash
# Build current workspace JS in a prepared RN 0.81/0.83 app, then drive the optional adoption fixture.
# Usage: bash scripts/native-sim/run-adoption-ios.sh <prepared-app> <booted-udid> <out-dir>
# Reuses installed native dependencies/pods. This verifies current workspace code, not packed tarballs or VoiceOver.
set -euo pipefail
HIG="$(cd "$(dirname "$0")/../.." && pwd -P)"
APP="$(cd "$1" && pwd -P)"; UDID="$2"; OUT="$(mkdir -p "$3" && cd "$3" && pwd -P)"
HARNESS="$HIG/.validation-tmp/native-adoption/harness"; BUILD="$HIG/.validation-tmp/native-adoption/dd-harness"; RESULTS="$HIG/.validation-tmp/native-adoption"
LOGS="$RESULTS/logs"
mkdir -p "$LOGS" "$RESULTS" "$HARNESS"
for package_name in contracts native native-fonts tokens; do
  rsync -a --delete "$HIG/packages/$package_name/dist/" "$APP/node_modules/@bloxwap/hig-$package_name/dist/"
done
rsync -a "$HIG/packages/native-fonts/fonts/" "$APP/node_modules/@bloxwap/hig-native-fonts/fonts/"
cp "$HIG/fixtures/native/adoption-check.tsx" "$APP/adoption-check.tsx"
cp "$HIG/fixtures/native/index-adoption.js" "$APP/index-adoption.js"
cp "$APP/index.js" "$HARNESS/index.original.js"
cp "$APP/metro.config.cjs" "$HARNESS/metro.original.cjs"
cp "$APP/index-adoption.js" "$APP/index.js"
printf "\nmodule.exports.cacheStores=[new(module.exports.cacheStores[0].constructor)({root:require('node:path').resolve(__dirname,'../adoption-metro-cache')})];\n" >> "$APP/metro.config.cjs"
restore() { cp "$HARNESS/index.original.js" "$APP/index.js"; cp "$HARNESS/metro.original.cjs" "$APP/metro.config.cjs"; xcrun simctl ui "$UDID" content_size large >/dev/null; }
trap restore EXIT
# Prepared apps can retain a Node path from a previous workspace install.
printf 'export NODE_BINARY=%q\n' "$(command -v node)" > "$APP/ios/.xcode.env.local"
rsync -a "$HIG/scripts/native-sim/ios/" "$HARNESS/"
(cd "$HARNESS" && xcodegen generate) > "$LOGS/harness-generate.log" 2>&1
xcodebuild -project "$HARNESS/HIGNativeSim.xcodeproj" -scheme HIGNativeSimUITests -configuration Debug -sdk iphonesimulator -destination "id=$UDID" -derivedDataPath "$BUILD" CODE_SIGNING_ALLOWED=NO build-for-testing > "$LOGS/harness-build.log" 2>&1
xcodebuild -workspace "$APP/ios/BloxwapHIGGallery.xcworkspace" -scheme BloxwapHIGGallery -configuration Release -sdk iphonesimulator -destination "id=$UDID" -derivedDataPath "$APP/../dd-ios" CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES ARCHS=arm64 ENTRY_FILE="$APP/index.js" PROJECT_ROOT="$APP" build > "$LOGS/app-build.log" 2>&1
xcrun simctl install "$UDID" "$APP/../dd-ios/Build/Products/Release-iphonesimulator/BloxwapHIGGallery.app"
XCTESTRUN="$(find "$BUILD/Build/Products" -maxdepth 1 -name '*.xctestrun' -print -quit)"
run() {
  local check="$1"; local prefix="$2"
  local result_bundle="$RESULTS/$check-$prefix-$(date +%s).xcresult"
  TEST_RUNNER_HIG_OUT="$OUT/$prefix" TEST_RUNNER_HIG_ADOPTION_PREFIX="$prefix" xcodebuild test-without-building -collect-test-diagnostics never -xctestrun "$XCTESTRUN" -destination "id=$UDID" -only-testing:"HIGNativeSimUITests/AdoptionVerificationUITests/$check" -resultBundlePath "$result_bundle" > "$LOGS/$check-$prefix.log" 2>&1
  xcrun xcresulttool get test-results summary --path "$result_bundle" --format json > "$OUT/$prefix/$check-xcresult.json"
  printf '%s %s passed\n' "$check" "$prefix" | tee -a "$OUT/summary.txt"
}
xcrun simctl ui "$UDID" content_size large
run testTypographyAndBusySpacing default
run testToastRecoveryAndDismissal default
run testCustomSheetCardStack default
xcrun simctl ui "$UDID" content_size accessibility-extra-extra-extra-large
run testToastRecoveryAndDismissal ax5
node "$HIG/scripts/native-sim/adoption-evidence.mjs" "$APP" "$UDID" "$OUT"
