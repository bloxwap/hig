#!/usr/bin/env bash
# Builds the packed-candidate native gallery as real iOS Simulator and Android emulator apps.
# Usage: scripts/native-sim/prepare-app.sh <app-dir> <simulator-udid> [profile]
# profile: rn-0.81 (default; RN 0.81.5 / Expo 54) or rn-0.83 (RN 0.83.10 / Expo 55), from fixtures/native/profiles.json (#68).
# HIG_IOS_COLOR_SPACE=display-p3 builds the iOS app as a Display P3 host (React Native default colour space, as a host's
# defaultColorSpace() override does) for HIGProvider colorSpace='display-p3' captures (#93); unset keeps sRGB.
# HIG_SKIP_ANDROID=1 stops after the iOS build; HIG_SKIP_IOS=1 skips the iOS build (pass - as the udid) and builds only Android.
# Requires artifacts/release-candidate/*.tgz (native-fonts needs `npm run generate:fonts` first) (npm run release:dry-run -- --channel candidate),
# Xcode with an iOS Simulator runtime, JDK 17 and the Android SDK. Nothing is published.
set -euo pipefail
HIG="$(cd "$(dirname "$0")/../.." && pwd -P)"
APP="$1"; UDID="$2"; PROFILE="${3:-rn-0.81}"
mkdir -p "$APP"; APP="$(cd "$APP" && pwd -P)"
rsync -a --exclude node_modules --exclude dist --exclude .expo "$HIG/fixtures/native/" "$APP/"
node "$HIG/scripts/native-consumer.mjs" "$PROFILE" "$APP"
# Use the report's exact artifacts: old candidates may coexist in the directory.
HIG_RELEASE_DIR="${HIG_NATIVE_ARTIFACTS:-$HIG/artifacts/release-candidate}"
HIG_NATIVE_TARBALLS=()
while IFS= read -r archive; do HIG_NATIVE_TARBALLS+=("$archive"); done < <(node --input-type=module -e '
import {readFileSync} from "node:fs"; import {resolve} from "node:path";
const directory=process.argv[1], report=JSON.parse(readFileSync(resolve(directory,"report.json"),"utf8"));
for(const name of ["contracts","feedback","native","native-fonts","tokens"]){const artifact=report.artifacts.find(a=>a.package===`@bloxwap/hig-${name}`);if(!artifact)throw Error(`Missing native release artifact: ${name}`);console.log(resolve(directory,artifact.file));}
' "$HIG_RELEASE_DIR")
[ "${#HIG_NATIVE_TARBALLS[@]}" -eq 5 ] || { echo 'Expected five native artifacts in the release report' >&2; exit 1; }
(cd "$APP" && npm install --no-audit --no-fund "${HIG_NATIVE_TARBALLS[@]}")
node --input-type=module -e "import {verifyNativeReact,verifyExpoNativeModules,verifyDeclaredPeers} from '$HIG/scripts/native-compatibility.mjs';console.log(verifyNativeReact('$APP'),verifyExpoNativeModules('$APP'),verifyDeclaredPeers('$APP'))"
(cd "$APP" && CI=1 npx expo prebuild --no-install) # idempotent; applies app.json changes
if [ "${HIG_SKIP_IOS:-0}" != 1 ]; then
# #93: Display P3 host. Inserted into (or removed from) the generated Swift ReactNativeDelegate on every run.
python3 - "$APP/ios/BloxwapHIGGallery/AppDelegate.swift" "${HIG_IOS_COLOR_SPACE:-srgb}" <<'EOF'
import sys
path,space=sys.argv[1],sys.argv[2];s=open(path).read()
block="  // HIG_DISPLAY_P3: hex/rgba style colours are Display P3 channels on iOS (#93).\n  override func defaultColorSpace() -> RCTColorSpace {\n    .displayP3\n  }\n\n"
s=s.replace(block,"")
if space=="display-p3":
  anchor="class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {\n"
  if anchor not in s: sys.exit("AppDelegate.swift has no ReactNativeDelegate; update prepare-app.sh for this Expo template")
  s=s.replace(anchor,anchor+block,1)
elif space!="srgb": sys.exit(f"HIG_IOS_COLOR_SPACE must be srgb or display-p3, got {space}")
open(path,"w").write(s)
EOF
# Xcode 27 rejects pod resource targets below iOS 15.
grep -q "Xcode 27 rejects" "$APP/ios/Podfile" || ruby -e 'p=ARGV[0];s=File.read(p);s.sub!(/(:ccache_enabled => ccache_enabled\?\(podfile_properties\),\n    \)\n)/){$1+"    # Xcode 27 rejects pod resource targets below iOS 15.0.\n    installer.pods_project.targets.each { |t| t.build_configurations.each { |c| c.build_settings[%q(IPHONEOS_DEPLOYMENT_TARGET)] = %q(15.1) if c.build_settings[%q(IPHONEOS_DEPLOYMENT_TARGET)].to_f < 15.1 } }\n"};File.write(p,s)' "$APP/ios/Podfile"
(cd "$APP/ios" && pod install)
xcodebuild -workspace "$APP/ios/BloxwapHIGGallery.xcworkspace" -scheme BloxwapHIGGallery -configuration Release -sdk iphonesimulator \
  -destination "id=$UDID" -derivedDataPath "$APP/../dd-ios" CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES ARCHS=arm64 \
  ENTRY_FILE="$APP/index.js" PROJECT_ROOT="$APP" build
fi
[ "${HIG_SKIP_ANDROID:-0}" = 1 ] && exit 0
# Android: instrumentation test runs against the release build.
GRADLE="$APP/android/app/build.gradle"
grep -q testInstrumentationRunner "$GRADLE" || python3 - "$GRADLE" <<'EOF'
import sys;p=sys.argv[1];s=open(p).read()
s=s.replace('        versionName "0.1.0"\n','        versionName "0.1.0"\n        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"\n',1)
s=s.replace('    buildTypes {\n        debug {','    testBuildType "release"\n    buildTypes {\n        debug {',1)
s=s.replace('    implementation("com.facebook.react:react-android")\n','    implementation("com.facebook.react:react-android")\n    androidTestImplementation("androidx.test:runner:1.6.2")\n    androidTestImplementation("androidx.test:rules:1.6.1")\n    androidTestImplementation("androidx.test.ext:junit:1.2.1")\n',1)
open(p,'w').write(s)
EOF
mkdir -p "$APP/android/app/src/androidTest/java/com/bloxwap/hig/gallery"
cp "$HIG/scripts/native-sim/android/NativeVerificationTest.java" "$APP/android/app/src/androidTest/java/com/bloxwap/hig/gallery/"
export JAVA_HOME="${JAVA_HOME_17:-/opt/homebrew/opt/openjdk@17}" ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
cd "$APP/android"
./gradlew :react-native-worklets:assembleRelease -PreactNativeArchitectures=arm64-v8a
# Reanimated 4.1 looks for libworklets.so in the pre-AGP-8 cmake layout on this host.
W="$APP/node_modules/react-native-worklets/android/build/intermediates"
mkdir -p "$W/cmake/release/obj/arm64-v8a"
for worklets_library in "$W"/cxx/RelWithDebInfo/*/obj/arm64-v8a/libworklets.so; do
  [ -f "$worklets_library" ] || continue
  # Newer Worklets already links the legacy layout to this same file.
  [ "$worklets_library" -ef "$W/cmake/release/obj/arm64-v8a/libworklets.so" ] || cp "$worklets_library" "$W/cmake/release/obj/arm64-v8a/"
done
# The bundle task does not track reinstalled tarballs; force it so the APK carries the new candidate.
./gradlew :app:createBundleReleaseJsAndAssets --rerun -PreactNativeArchitectures=arm64-v8a
./gradlew assembleRelease assembleReleaseAndroidTest -PreactNativeArchitectures=arm64-v8a
