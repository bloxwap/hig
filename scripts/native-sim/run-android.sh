#!/usr/bin/env bash
# Drives the packed-candidate gallery on a booted Android emulator through instrumentation
# (UiAutomation accessibility client), adb settings, uiautomator dumps and TalkBack.
# Usage: ANDROID_SERIAL=emulator-5580 scripts/native-sim/run-android.sh <app-dir> <out-dir>
# Observations are Android emulator only: no physical speaker, vibration motor or touch panel.
set -uo pipefail
APP="$1"; OUT="$(mkdir -p "$2" && cd "$2" && pwd -P)"
HIG="$(cd "$(dirname "$0")/../.." && pwd -P)"
export PATH="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools:$PATH"
PKG=com.bloxwap.hig.gallery
COMPONENTS="$(node -e "console.log(require('$HIG/fixtures/native/gallery-manifest.json').examples.map(e=>e.name).join(','))")"
SUBSET="Button,Text,Select,Field,AmountInput,Checkbox,Switch,RadioGroup,SegmentedControl,Slider,Tabs,Alert,Toast,NumberReadout,AnimatedNumberReadout,MarketRow,BalanceCard,TradeEntry,EmptyState"
mkdir -p "$OUT/logs" "$OUT/host"
adb install -r "$APP/android/app/build/outputs/apk/release/app-release.apk" >/dev/null
adb install -r "$APP/android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk" >/dev/null
adb shell pm clear $PKG >/dev/null # start from default (sound/haptics off) preferences
adb shell settings put system font_scale 1.0
adb shell settings put global transition_animation_scale 1; adb shell settings put global animator_duration_scale 1
adb shell cmd locale set-app-locales $PKG --locales "" >/dev/null 2>&1 || true
adb shell settings put secure show_ime_with_hard_keyboard 1
run() { # run <method> [key value ...]
  local method="$1"; shift; local args=()
  while [ $# -gt 1 ]; do args+=(-e "$1" "'$2'"); shift 2; done # quoted for the device shell
  adb shell am instrument -w -r ${args[@]+"${args[@]}"} -e class "$PKG.NativeVerificationTest#$method" "$PKG.test/androidx.test.runner.AndroidJUnitRunner" > "$OUT/logs/$method-$(date +%s).log" 2>&1
  echo "$method ${args[*]+"${args[*]}"} -> $(grep -hE 'OK \(|FAILURES' "$OUT"/logs/$method-*.log | tail -1)" | tee -a "$OUT/logs/summary.txt"
}
adb logcat -c
run galleryCaptures components "$COMPONENTS" prefix android
run snapshot name baseline
run sliderAccessibilityActions
run sliderActionLabels catalogs en,fr,ko # #87: increase/decrease labels from the host catalog
run busyButtonName catalogs en,fr,ko # #94: busy content description keeps the label
run overlayFocusAndBack
run listScrolling
adb shell dumpsys gfxinfo $PKG > "$OUT/host/gfxinfo-after-list.txt"
adb shell dumpsys vibrator_manager > "$OUT/host/vibrator-before-feedback.txt"
run feedbackCalls
adb shell dumpsys vibrator_manager > "$OUT/host/vibrator-after-feedback.txt"
adb shell dumpsys audio > "$OUT/host/audio-after-feedback.txt"
run keyboardAvoidance
# HIG per-root RTL, then OS RTL through an Arabic per-app locale (Android 13+).
run galleryCaptures components "$SUBSET" prefix android-rtl query "&dir=rtl"
adb shell am force-stop $PKG; adb shell cmd locale set-app-locales $PKG --locales ar-EG
run snapshot name os-arabic expectDirection rtl # #86: the gallery passes direction from expo-localization
run galleryCaptures components "Button,Select,Field,Tabs,MarketRow,TradeEntry" prefix android-os-arabic
adb shell am force-stop $PKG; adb shell cmd locale set-app-locales $PKG --locales ""
# OS font scale 2.0 (largest Android setting).
adb shell settings put system font_scale 2.0
run snapshot name font-scale-200
run galleryCaptures components "$SUBSET" prefix android-font200
# #67: scroll the Text/Switch/Alert examples into view at 200% and measure the capped readout against prose.
run exampleCapture name font200-example-text query "component=Text&state=default" scrollTo "Review the amount" measure 'BLOXWAP|한국어|Price: 67,234.56|Review the amount'
run exampleCapture name font200-example-switch query "component=Switch&state=default" scrollTo "Preference preview" measure "Preference preview|Info tone preview"
run exampleCapture name font200-example-alert-error query "component=Alert&state=error" scrollTo "Data unavailable" measure "Data unavailable"
adb shell settings put system font_scale 1.0
# Remove animations (Android's reduce-motion signal for React Native).
adb shell settings put global transition_animation_scale 0; adb shell settings put global animator_duration_scale 0
run snapshot name reduce-motion query "component=AnimatedNumberReadout&state=default&diag=1"
adb shell settings put global transition_animation_scale 1; adb shell settings put global animator_duration_scale 1
# TalkBack (installed in the Google Play image): initial/return focus with a real screen reader running.
TB=com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService
adb shell pm grant com.google.android.marvin.talkback android.permission.POST_NOTIFICATIONS 2>/dev/null # avoid a first-run prompt holding focus
adb shell settings put secure enabled_accessibility_services $TB; adb shell settings put secure accessibility_enabled 1
sleep 15
run snapshot name talkback
run overlayFocusAndBack prefix android-talkback
adb shell settings delete secure enabled_accessibility_services; adb shell settings put secure accessibility_enabled 0
adb logcat -d -s ReactNativeJS:V AndroidRuntime:E > "$OUT/host/logcat.txt"
adb shell am force-stop $PKG
adb pull "/sdcard/Android/data/$PKG/files/native-sim/." "$OUT/" >/dev/null
