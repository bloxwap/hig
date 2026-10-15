#!/usr/bin/env bash
# Attempts a TalkBack reference flow on the Android emulator with TalkBack's keyboard commands
# (Alt+Right next item, Alt+Enter activate, Back) and records screenshots and hierarchy dumps, then
# captures landscape layout. Observed 2026-10-14: TalkBack did not act on adb-injected key combos (or
# injected taps), so this records a negative result; focus behavior is verified by run-android.sh. Usage: ANDROID_SERIAL=emulator-5580 talkback-flow.sh <out-dir>
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
OPENED="$(grep -c 'text="Close"' "$OUT/after-activate.xml")"
log "Dialog closed after Back: $([ "$OPENED" = 0 ] && echo 'not applicable (never opened)' || ([ "$(grep -c 'text="Close"' "$OUT/after-back.xml")" = 0 ] && echo yes || echo no))"
adb shell settings delete secure enabled_accessibility_services; adb shell settings put secure accessibility_enabled 0
# Landscape: user-rotation settings did not rotate this emulator; the console rotate command does.
adb shell settings put system accelerometer_rotation 1; adb emu rotate; sleep 4
adb shell am start -a android.intent.action.VIEW -d "bloxwaphig://gallery?component=Dialog\&state=default" $PKG >/dev/null; sleep 4
adb shell uiautomator dump /sdcard/tb.xml >/dev/null 2>&1; adb pull /sdcard/tb.xml "$OUT/landscape-dialog-example.xml" >/dev/null; shot 05-landscape-dialog-example
read -r X Y <<<"$(grep -o 'text="Open review order"[^>]*bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' "$OUT/landscape-dialog-example.xml" | sed -E 's/.*\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"/\1 \2 \3 \4/' | awk '{print int(($1+$3)/2), int(($2+$4)/2)}')"
adb shell input tap "$X" "$Y"; sleep 2; adb shell uiautomator dump /sdcard/tb.xml >/dev/null 2>&1; adb pull /sdcard/tb.xml "$OUT/landscape-dialog-open.xml" >/dev/null; shot 06-landscape-dialog-open
log "Landscape dialog opened: $(grep -c 'text="Close"' "$OUT/landscape-dialog-open.xml")"
adb shell input keyevent KEYCODE_BACK; sleep 2; adb shell uiautomator dump /sdcard/tb.xml >/dev/null 2>&1; adb pull /sdcard/tb.xml "$OUT/landscape-after-back.xml" >/dev/null
log "Landscape dialog closed by Back: $([ "$(grep -c 'text="Close"' "$OUT/landscape-after-back.xml")" = 0 ] && echo yes || echo no)"
adb emu rotate; adb emu rotate; adb emu rotate; sleep 3; adb shell settings put system accelerometer_rotation 0
