#!/usr/bin/env bash
# Builds the packed-candidate native gallery as real iOS Simulator and Android emulator apps.
# Usage: scripts/native-sim/prepare-app.sh <app-dir> <simulator-udid> [profile]
# profile: rn-0.81 (default; RN 0.81.5 / Expo 54) or rn-0.83 (RN 0.83.10 / Expo 55), from fixtures/native/profiles.json (#68).
# Requires artifacts/release-candidate/*.tgz (native-fonts needs `npm run generate:fonts` first) (npm run release:dry-run -- --channel candidate),
# Xcode with an iOS Simulator runtime, JDK 17 and the Android SDK. Nothing is published.
set -euo pipefail
HIG="$(cd "$(dirname "$0")/../.." && pwd -P)"
APP="$1"; UDID="$2"; PROFILE="${3:-rn-0.81}"
mkdir -p "$APP"; APP="$(cd "$APP" && pwd -P)"
rsync -a --exclude node_modules --exclude dist --exclude .expo "$HIG/fixtures/native/" "$APP/"
node "$HIG/scripts/native-consumer.mjs" "$PROFILE" "$APP"
(cd "$APP" && npm install --no-audit --no-fund $(ls "$HIG"/artifacts/release-candidate/bloxwap-hig-{contracts,feedback,native,native-fonts,tokens}-*.tgz))
node --input-type=module -e "import {verifyNativeReact,verifyExpoNativeModules,verifyDeclaredPeers} from '$HIG/scripts/native-compatibility.mjs';console.log(verifyNativeReact('$APP'),verifyExpoNativeModules('$APP'),verifyDeclaredPeers('$APP'))"
(cd "$APP" && CI=1 npx expo prebuild --no-install) # idempotent; applies app.json changes
# Xcode 27 rejects pod resource targets below iOS 15.
grep -q "Xcode 27 rejects" "$APP/ios/Podfile" || ruby -e 'p=ARGV[0];s=File.read(p);s.sub!(/(:ccache_enabled => ccache_enabled\?\(podfile_properties\),\n    \)\n)/){$1+"    # Xcode 27 rejects pod resource targets below iOS 15.0.\n    installer.pods_project.targets.each { |t| t.build_configurations.each { |c| c.build_settings[%q(IPHONEOS_DEPLOYMENT_TARGET)] = %q(15.1) if c.build_settings[%q(IPHONEOS_DEPLOYMENT_TARGET)].to_f < 15.1 } }\n"};File.write(p,s)' "$APP/ios/Podfile"
(cd "$APP/ios" && pod install)
xcodebuild -workspace "$APP/ios/BloxwapHIGGallery.xcworkspace" -scheme BloxwapHIGGallery -configuration Release -sdk iphonesimulator \
  -destination "id=$UDID" -derivedDataPath "$APP/../dd-ios" CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES ARCHS=arm64 \
  ENTRY_FILE="$APP/index.js" PROJECT_ROOT="$APP" build
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
mkdir -p "$W/cmake/release/obj/arm64-v8a" && cp "$W"/cxx/RelWithDebInfo/*/obj/arm64-v8a/libworklets.so "$W/cmake/release/obj/arm64-v8a/"
# The bundle task does not track reinstalled tarballs; force it so the APK carries the new candidate.
./gradlew :app:createBundleReleaseJsAndAssets --rerun -PreactNativeArchitectures=arm64-v8a
./gradlew assembleRelease assembleReleaseAndroidTest -PreactNativeArchitectures=arm64-v8a
