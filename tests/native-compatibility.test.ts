import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
// @ts-expect-error Executable native runtime guard.
import {assertNativeReactVersion,verifyNativeReact,assertExpoNativeModules,verifyExpoNativeModules,rendererReactVersions,assertDeclaredPeers,verifyDeclaredPeers} from '../scripts/native-compatibility.mjs';
// @ts-expect-error Executable packed consumer manifest helper.
import {nativeConsumerManifest,nativeProfiles} from '../scripts/native-consumer.mjs';
const semver=createRequire(import.meta.url)('semver') as {satisfies:(v:string,r:string)=>boolean;minVersion:(r:string)=>{version:string}};
const peers=(name:string)=>JSON.parse(readFileSync(`packages/${name}/package.json`,'utf8')).peerDependencies as Record<string,string>;
it('verifies the actual native renderer React version and rejects the otherwise bundleable web version',()=>{
 expect(verifyNativeReact('fixtures/native')).toEqual({react:'19.1.0',renderer:'19.1.0',reactNative:'0.81.5'});
 expect(()=>assertNativeReactVersion('19.2.0','19.1.0')).toThrow('Native React runtime mismatch');
});
it('reads the renderer React pin from RN 0.81 guards and from RN 0.83 renderers that dropped the throw',()=>{
 // RN 0.81.5 ReactNativeRenderer-dev.js: explicit guard plus devtools block.
 expect(rendererReactVersions('if ("19.1.0" !== isomorphicReactPackageVersion)\n throw Error();\n internals = {\n bundleType: 1,\n version: "19.1.0",\n rendererPackageName: "react-native-renderer",')).toEqual(['19.1.0']);
 // RN 0.83.10 ReactFabric-dev.js / ReactNativeRenderer-dev.js: devtools block only.
 expect(rendererReactVersions('var internals = {\n        bundleType: 1,\n        version: "19.2.0",\n        rendererPackageName: "react-native-renderer",')).toEqual(['19.2.0']);
 expect(rendererReactVersions('no renderer here')).toEqual([]);
});
it('resolves Expo native modules from the SDK 54 set so autolinking does not drop ExpoAsset',()=>{
 // A hoisted expo-asset 57 (pulled by expo-audio's "*" peer) is not a CocoaPod for SDK 54 and crashed the iOS Simulator launch.
 const installed=verifyExpoNativeModules('fixtures/native');
 expect(installed['expo-asset']).toMatch(/^12\.0\./);
 expect(Object.keys(installed)).toEqual(expect.arrayContaining(['expo-asset','expo-audio','expo-font','expo-haptics']));
 const exact=(version:string,range:string)=>version===range;
 expect(()=>assertExpoNativeModules({'expo-asset':'57.0.19'},{'expo-asset':'12.0.13'},exact)).toThrow('expo-asset@57.0.19 (Expo SDK expects 12.0.13)');
});
it('builds the RN 0.83 / Expo 55 and RN 0.88 / Expo 58 packed consumers from the same fixture with only versions replaced',()=>{
 const base=nativeConsumerManifest('rn-0.81'),next=nativeConsumerManifest('rn-0.83'),latest=nativeConsumerManifest('rn-0.88');
 expect(Object.keys(base.dependencies).some((k:string)=>k.startsWith('@bloxwap/hig-'))).toBe(false);
 expect(Object.keys(next.dependencies).sort()).toEqual(Object.keys(base.dependencies).sort());
 expect(Object.keys(latest.dependencies).sort()).toEqual(Object.keys(base.dependencies).sort());
 expect(base.dependencies).toMatchObject({'react-native':'0.81.5',react:'19.1.0',expo:'~54.0.13'});
 expect(next.dependencies).toMatchObject({'react-native':'0.83.10',react:'19.2.0','react-dom':'19.2.0',expo:'~55.0.31'});
 expect(latest.dependencies).toMatchObject({'react-native':'0.88.0',react:'19.3.0','react-dom':'19.3.0',expo:'~58.0.19','react-native-gesture-handler':'~3.3.0','react-native-reanimated':'4.7.1','react-native-safe-area-context':'~5.10.1','react-native-svg':'15.16.0','react-native-worklets':'0.13.0','@react-native-community/slider':'5.2.1','expo-audio':'~58.0.10','expo-haptics':'~58.0.7'});
 expect(()=>nativeConsumerManifest('rn-0.82')).toThrow('Unknown native consumer profile');
});
it('declares native peer ranges that accept exactly the tested RN minors and their Expo SDK modules (#68)',()=>{
 const declared={'@bloxwap/hig-native':peers('native'),'@bloxwap/hig-feedback':peers('feedback')};
 for(const profile of Object.keys(nativeProfiles)){
  const deps=nativeConsumerManifest(profile).dependencies as Record<string,string>;
  const installed=Object.fromEntries(Object.entries(deps).map(([name,range])=>[name,semver.minVersion(range).version]));
  expect(assertDeclaredPeers(declared,installed,semver.satisfies),profile).toBe(installed);
 }
 // Untested React Native minors stay outside the range.
 for(const untested of ['0.80.2','0.82.1','0.84.0','0.85.3','0.86.0','0.87.0','0.89.0'])expect(semver.satisfies(untested,declared['@bloxwap/hig-native']['react-native']),untested).toBe(false);
 expect(()=>assertDeclaredPeers({'@bloxwap/hig-native':{'react-native':'^0.81.5'}},{'react-native':'0.83.10'},semver.satisfies)).toThrow('@bloxwap/hig-native declares react-native ^0.81.5; consumer installed 0.83.10');
 expect(verifyDeclaredPeers('fixtures/native')).toMatchObject({'react-native':'0.81.5'});
});
