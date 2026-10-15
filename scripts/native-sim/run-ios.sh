#!/usr/bin/env bash
# Drives the installed packed-candidate gallery on a booted iOS Simulator with XCUITest.
# Usage: scripts/native-sim/run-ios.sh <udid> <app-path> <xctestrun> <out-dir>
# Observations are iOS Simulator only: no VoiceOver, speaker or Taptic Engine is exercised.
set -uo pipefail
UDID="$1"; APP="$2"; XCTESTRUN="$3"; OUT="$(mkdir -p "$4" && cd "$4" && pwd -P)"
HIG="$(cd "$(dirname "$0")/../.." && pwd -P)"
COMPONENTS="$(node -e "console.log(require('$HIG/fixtures/native/gallery-manifest.json').examples.map(e=>e.name).join(','))")"
SUBSET="Button,Select,Field,AmountInput,Checkbox,Switch,RadioGroup,SegmentedControl,Slider,Tabs,Alert,Toast,NumberReadout,AnimatedNumberReadout,MarketRow,BalanceCard,TradeEntry,EmptyState"
xcrun simctl install "$UDID" "$APP"
run() { # run <test> [ENV=VALUE ...]
  local test="$1"; shift
  env "$@" TEST_RUNNER_HIG_OUT="$OUT" xcodebuild test-without-building -xctestrun "$XCTESTRUN" -destination "id=$UDID" \
    -only-testing:"HIGNativeSimUITests/NativeVerificationUITests/$test" -resultBundlePath "$OUT/xcresult/$test-$(date +%s).xcresult" \
    > "$OUT/logs/$test-$(date +%s).log" 2>&1
  echo "$test $* -> exit $?" | tee -a "$OUT/logs/summary.txt"
}
mkdir -p "$OUT/logs" "$OUT/xcresult"
xcrun simctl ui "$UDID" content_size large
xcrun simctl spawn "$UDID" defaults write com.apple.Accessibility ReduceMotionEnabled -bool false
run testGalleryCaptures TEST_RUNNER_HIG_COMPONENTS="$COMPONENTS" TEST_RUNNER_HIG_PREFIX=ios
run testSnapshot TEST_RUNNER_HIG_NAME=baseline
run testSliderAccessibilityActions
run testOverlays
run testListScrolling
run testFeedbackCalls
run testKeyboardAvoidance
# HIG per-root RTL and OS (Arabic) RTL.
run testGalleryCaptures TEST_RUNNER_HIG_COMPONENTS="$SUBSET" TEST_RUNNER_HIG_PREFIX=ios-rtl TEST_RUNNER_HIG_QUERY="&dir=rtl" TEST_RUNNER_HIG_AUDIT=0
run testSnapshot TEST_RUNNER_HIG_NAME=os-arabic "TEST_RUNNER_HIG_LAUNCH_ARGS=-AppleLanguages|(ar)|-AppleLocale|ar_EG" TEST_RUNNER_HIG_AUDIT=0
# Dynamic Type at the largest accessibility size.
xcrun simctl ui "$UDID" content_size accessibility-extra-extra-extra-large
run testSnapshot TEST_RUNNER_HIG_NAME=dynamic-type-ax5
run testGalleryCaptures TEST_RUNNER_HIG_COMPONENTS="$SUBSET" TEST_RUNNER_HIG_PREFIX=ios-ax5
xcrun simctl ui "$UDID" content_size large
# Reduce Motion through the Simulator's accessibility defaults.
xcrun simctl spawn "$UDID" defaults write com.apple.Accessibility ReduceMotionEnabled -bool true
xcrun simctl spawn "$UDID" notifyutil -p com.apple.accessibility.reduce.motion.status || true
run testSnapshot TEST_RUNNER_HIG_NAME=reduce-motion "TEST_RUNNER_HIG_QUERY=component=AnimatedNumberReadout&state=default&diag=1" TEST_RUNNER_HIG_AUDIT=0
xcrun simctl spawn "$UDID" defaults write com.apple.Accessibility ReduceMotionEnabled -bool false
xcrun simctl terminate "$UDID" com.bloxwap.hig.gallery || true
