#!/usr/bin/env bash
# Drives a TalkBack reference flow on the Android emulator with TalkBack's keyboard commands
# (Alt+Right next item, Alt+Enter activate, Back) and records screenshots plus the focused node,
# then captures landscape layout. Usage: ANDROID_SERIAL=emulator-5580 talkback-flow.sh <out-dir>
# Emulator observation only: TalkBack speech is not captured and no physical touch is involved.
set -uo pipefail
OUT="$(mkdir -p "$1/talkback-flow" && cd "$1/talkback-flow" && pwd -P)"
export PATH="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools:$PATH"
PKG=com.bloxwap.hig.gallery
TB=com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService
shot() { adb exec-out screencap -p > "$OUT/$1.png"; }
log() { echo "$*" | tee -a "$OUT/flow.txt"; }
: > "$OUT/flow.txt"
# A first-run notification-permission prompt would hold window focus and make queued key events ANR.
for pkg in com.google.android.marvin.talkback $PKG; do adb shell pm grant $pkg android.permission.POST_NOTIFICATIONS 2>/dev/null; done
adb shell am force-stop $PKG
adb shell settings put secure enabled_accessibility_services $TB
adb shell settings put secure accessibility_enabled 1
sleep 6
adb shell am start -a android.intent.action.VIEW -d "bloxwaphig://gallery?component=Dialog\&state=default" $PKG >/dev/null
sleep 8; shot 01-dialog-example
adb shell uiautomator dump /sdcard/tb.xml >/dev/null 2>&1; adb pull /sdcard/tb.xml "$OUT/start.xml" >/dev/null
log "Gallery ready before keys: $(grep -c 'text="Open review order"' "$OUT/start.xml")"
log "TalkBack enabled: $(adb shell settings get secure enabled_accessibility_services)"
for i in $(seq 1 8); do
  adb shell input keycombination KEYCODE_ALT_LEFT KEYCODE_DPAD_RIGHT; sleep 1.2
  adb shell uiautomator dump /sdcard/tb.xml >/dev/null 2>&1
  shot "02-next-$i"
done
adb shell uiautomator dump /sdcard/tb.xml >/dev/null 2>&1; adb pull /sdcard/tb.xml "$OUT/before-activate.xml" >/dev/null
adb shell input keycombination KEYCODE_ALT_LEFT KEYCODE_ENTER; sleep 2
shot 03-after-activate
adb shell uiautomator dump /sdcard/tb.xml >/dev/null 2>&1; adb pull /sdcard/tb.xml "$OUT/after-activate.xml" >/dev/null
log "Dialog open after Alt+Enter: $(grep -c 'text="Close"' "$OUT/after-activate.xml")"
adb shell input keyevent KEYCODE_BACK; sleep 2
shot 04-after-back
adb shell uiautomator dump /sdcard/tb.xml >/dev/null 2>&1; adb pull /sdcard/tb.xml "$OUT/after-back.xml" >/dev/null
log "Dialog closed after Back: $([ "$(grep -c 'text="Close"' "$OUT/after-back.xml")" = 0 ] && echo yes || echo no)"
adb shell settings delete secure enabled_accessibility_services; adb shell settings put secure accessibility_enabled 0
# Landscape layout (user rotation 1) with the gallery's TradeEntry.
adb shell settings put system accelerometer_rotation 0; adb shell settings put system user_rotation 1
adb shell am start -a android.intent.action.VIEW -d "bloxwaphig://gallery?component=TradeEntry\&state=default" $PKG >/dev/null
sleep 3; shot 05-landscape-tradeentry
adb shell settings put system user_rotation 0
log "Landscape capture: 05-landscape-tradeentry.png"
