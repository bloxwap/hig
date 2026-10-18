#!/usr/bin/env bash
# Prepared RN 0.83 consumer; release simulator touch/layout evidence, without VoiceOver claims.
# Usage: bash scripts/native-sim/run-inline-ios.sh <prepared-app> <booted-udid> <evidence-dir>
set -euo pipefail
HIG="$(cd "$(dirname "$0")/../.." && pwd -P)"
APP="$(cd "$1" && pwd -P)"; UDID="$2"; OUT="$(mkdir -p "$3" && cd "$3" && pwd -P)"
RAW="$HIG/.validation-tmp/native-inline"; HARNESS="$RAW/harness"; BUILD="$RAW/dd-harness"
mkdir -p "$RAW/logs" "$HARNESS"
for package_name in contracts native tokens; do
  rsync -a --delete "$HIG/packages/$package_name/dist/" "$APP/node_modules/@bloxwap/hig-$package_name/dist/"
done
cp "$APP/index.js" "$RAW/index.original.js"
cp "$HIG/fixtures/native/inline-sheet-check.tsx" "$APP/inline-sheet-check.tsx"
cp "$HIG/fixtures/native/index-inline-sheet.js" "$APP/index.js"
restore() { cp "$RAW/index.original.js" "$APP/index.js"; }
trap restore EXIT
rsync -a "$HIG/scripts/native-sim/ios/" "$HARNESS/"
(cd "$HARNESS" && xcodegen generate) > "$RAW/logs/harness-generate.log" 2>&1
xcodebuild -project "$HARNESS/HIGNativeSim.xcodeproj" -scheme HIGNativeSimUITests -configuration Debug -sdk iphonesimulator -destination "id=$UDID" -derivedDataPath "$BUILD" CODE_SIGNING_ALLOWED=NO build-for-testing > "$RAW/logs/harness-build.log" 2>&1
xcodebuild -workspace "$APP/ios/BloxwapHIGGallery.xcworkspace" -scheme BloxwapHIGGallery -configuration Release -sdk iphonesimulator -destination "id=$UDID" -derivedDataPath "$APP/../dd-ios" CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES ARCHS=arm64 ENTRY_FILE="$APP/index.js" PROJECT_ROOT="$APP" build > "$RAW/logs/ios-build.log" 2>&1
xcrun simctl install "$UDID" "$APP/../dd-ios/Build/Products/Release-iphonesimulator/BloxwapHIGGallery.app"
# Avoid Xcode reusing an installed test bundle from a previous fixture selection.
xcrun simctl uninstall "$UDID" com.bloxwap.hig.uitests.xctrunner >/dev/null 2>&1 || true
xcrun simctl uninstall "$UDID" com.bloxwap.hig.uitesthost >/dev/null 2>&1 || true
xcrun simctl install "$UDID" "$BUILD/Build/Products/Debug-iphonesimulator/HIGNativeSimUITests-Runner.app"
xcrun simctl install "$UDID" "$BUILD/Build/Products/Debug-iphonesimulator/HIGUITestHost.app"
XCTESTRUN="$(find "$BUILD/Build/Products" -maxdepth 1 -name '*.xctestrun' -print -quit)"
RESULT="$RAW/ios-$(date +%s).xcresult"
TEST_RUNNER_HIG_OUT="$OUT" xcodebuild test-without-building -collect-test-diagnostics never -xctestrun "$XCTESTRUN" -destination "id=$UDID" -only-testing:HIGNativeSimUITests/InlineSheetVerificationUITests -resultBundlePath "$RESULT" > "$RAW/logs/ios-test.log" 2>&1
xcrun xcresulttool get test-results summary --path "$RESULT" --format json > "$OUT/xcresult-summary.json"
