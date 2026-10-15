#!/usr/bin/env bash
# Rebuilds the prepared app with the optional GestureSheet entry (fixtures/native/index-gesture.js:
# Gorhom bottom sheet + Reanimated 4 + Worklets) and observes detent drag, canceled dismissal,
# drag dismissal and Android back on the iOS Simulator and Android emulator.
# Usage: run-gesture.sh <app-dir> <udid> <xctestrun> <out-dir>   (ANDROID_SERIAL selects the emulator)
set -uo pipefail
APP="$(cd "$1" && pwd -P)"; UDID="$2"; XCTESTRUN="$3"; OUT="$(mkdir -p "$4/gesture" && cd "$4/gesture" && pwd -P)"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"; export PATH="$ANDROID_HOME/platform-tools:$PATH" JAVA_HOME="${JAVA_HOME_17:-/opt/homebrew/opt/openjdk@17}"
# A freshly booted or loaded emulator can show a system "isn't responding" dialog; choose Wait so it cannot cover the app.
clear_anr() { for _ in 1 2 3; do adb shell uiautomator dump /sdcard/anr.xml >/dev/null 2>&1; local b; b="$(adb shell cat /sdcard/anr.xml | grep -o 'text="Wait"[^>]*bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' | sed -E 's/.*\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"/\1 \2 \3 \4/')"; [ -z "$b" ] && return; read -r a c d e <<<"$b"; adb shell input tap $(((a+d)/2)) $(((c+e)/2)); sleep 3; done; }
cp "$APP/index.js" "$OUT/index.gallery.js.bak"; cp "$APP/index-gesture.js" "$APP/index.js"
restore() { cp "$OUT/index.gallery.js.bak" "$APP/index.js"; }
trap restore EXIT
xcodebuild -workspace "$APP/ios/BloxwapHIGGallery.xcworkspace" -scheme BloxwapHIGGallery -configuration Release -sdk iphonesimulator \
  -destination "id=$UDID" -derivedDataPath "$APP/../dd-ios-gesture" CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES ARCHS=arm64 \
  ENTRY_FILE="$APP/index.js" PROJECT_ROOT="$APP" build > "$OUT/ios-build.log" 2>&1; echo "iOS gesture build exit $?" | tee "$OUT/summary.txt"
xcrun simctl install "$UDID" "$APP/../dd-ios-gesture/Build/Products/Release-iphonesimulator/BloxwapHIGGallery.app"
TEST_RUNNER_HIG_OUT="$OUT" TEST_RUNNER_HIG_GESTURE=1 xcodebuild test-without-building -collect-test-diagnostics never -xctestrun "$XCTESTRUN" -destination "id=$UDID" \
  -only-testing:HIGNativeSimUITests/NativeVerificationUITests/testGestureSheet > "$OUT/ios-test.log" 2>&1; echo "iOS testGestureSheet exit $?" | tee -a "$OUT/summary.txt"
(cd "$APP/android" && ./gradlew :app:createBundleReleaseJsAndAssets --rerun -PreactNativeArchitectures=arm64-v8a > "$OUT/android-build.log" 2>&1 && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a >> "$OUT/android-build.log" 2>&1); echo "Android gesture build exit $?" | tee -a "$OUT/summary.txt"
adb install -r "$APP/android/app/build/outputs/apk/release/app-release.apk" >/dev/null
adb shell pm grant com.google.android.marvin.talkback android.permission.POST_NOTIFICATIONS 2>/dev/null
adb shell cmd statusbar collapse; adb shell am force-stop com.bloxwap.hig.gallery; clear_anr; adb shell am start -n com.bloxwap.hig.gallery/.MainActivity >/dev/null; sleep 6; clear_anr
dump() { adb shell uiautomator dump /sdcard/g.xml >/dev/null 2>&1; adb pull /sdcard/g.xml "$OUT/android-$1.xml" >/dev/null; adb exec-out screencap -p > "$OUT/android-$1.png"; }
center() { grep -o "text=\"$2\"[^>]*bounds=\"\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]\"" "$OUT/android-$1.xml" | head -1 | sed -E 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]".*/\1 \2 \3 \4/' | awk '{print int(($1+$3)/2), int(($2+$4)/2)}'; }
top() { grep -o "text=\"Review details\"[^>]*bounds=\"\[[0-9]*,[0-9]*\]" "$OUT/android-$1.xml" | head -1 | sed -E 's/.*\[[0-9]+,([0-9]+)\]$/\1/'; }
dump 01-fixture
read -r X Y <<<"$(center 01-fixture 'Open detent sheet')"; adb shell input tap "$X" "$Y"; sleep 2; dump 02-open
T2="$(top 02-open)"; echo "Android sheet opened (title y=$T2)" | tee -a "$OUT/summary.txt"
adb shell input swipe 630 "$((T2+20))" 630 400 400; sleep 2; dump 03-drag-up
echo "Android after drag up title y=$(top 03-drag-up)" | tee -a "$OUT/summary.txt"
T3="$(top 03-drag-up)"; adb shell input swipe 630 "$((T3+20))" 630 "$((T3+140))" 500; sleep 2; dump 04-short-drag
echo "Android after short drag title y=$(top 04-short-drag) (still open: $(grep -c 'text="Review details"' "$OUT/android-04-short-drag.xml"))" | tee -a "$OUT/summary.txt"
adb shell input keyevent KEYCODE_BACK; sleep 2; dump 05-after-back
echo "Android back closed sheet: $([ "$(grep -c 'text="Review details"' "$OUT/android-05-after-back.xml")" = 0 ] && echo yes || echo no)" | tee -a "$OUT/summary.txt"
read -r X Y <<<"$(center 05-after-back 'Open detent sheet')"; adb shell input tap "$X" "$Y"; sleep 2; dump 06-reopen
T6="$(top 06-reopen)"; adb shell input swipe 630 "$((T6+20))" 630 2700 150; sleep 2; dump 07-drag-dismiss
echo "Android drag dismissed sheet: $([ "$(grep -c 'text="Review details"' "$OUT/android-07-drag-dismiss.xml")" = 0 ] && echo yes || echo no)" | tee -a "$OUT/summary.txt"
# Restore the gallery entry in both apps.
restore; trap - EXIT
xcrun simctl install "$UDID" "$APP/../dd-ios/Build/Products/Release-iphonesimulator/BloxwapHIGGallery.app"
(cd "$APP/android" && ./gradlew :app:createBundleReleaseJsAndAssets --rerun -PreactNativeArchitectures=arm64-v8a >/dev/null 2>&1 && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a >/dev/null 2>&1) && adb install -r "$APP/android/app/build/outputs/apk/release/app-release.apk" >/dev/null
