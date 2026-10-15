#!/usr/bin/env bash
# Builds the packed-candidate native gallery as real iOS Simulator and Android emulator apps.
# Usage: scripts/native-sim/prepare-app.sh <app-dir> <simulator-udid>
# Requires artifacts/release-candidate/*.tgz (npm run release:dry-run -- --channel candidate),
# Xcode with an iOS Simulator runtime, JDK 17 and the Android SDK. Nothing is published.
set -euo pipefail
HIG="$(cd "$(dirname "$0")/../.." && pwd -P)"
APP="$1"; UDID="$2"
mkdir -p "$APP"; APP="$(cd "$APP" && pwd -P)"
rsync -a --exclude node_modules --exclude dist --exclude .expo "$HIG/fixtures/native/" "$APP/"
node -e "const fs=require('fs');const p='$APP/package.json';const m=JSON.parse(fs.readFileSync(p));for(const k of Object.keys(m.dependencies))if(k.startsWith('@bloxwap/hig-'))delete m.dependencies[k];m.type='commonjs';fs.writeFileSync(p,JSON.stringify(m,null,2));"
(cd "$APP" && npm install --no-audit --no-fund $(ls "$HIG"/artifacts/release-candidate/bloxwap-hig-{contracts,feedback,native,tokens}-*.tgz))
node --input-type=module -e "import {verifyNativeReact,verifyExpoNativeModules} from '$HIG/scripts/native-compatibility.mjs';console.log(verifyNativeReact('$APP'),verifyExpoNativeModules('$APP'))"
[ -d "$APP/ios" ] || (cd "$APP" && CI=1 npx expo prebuild --no-install)
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
