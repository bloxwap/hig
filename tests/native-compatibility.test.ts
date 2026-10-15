import {it,expect} from 'vitest';
// @ts-expect-error Executable native runtime guard.
import {assertNativeReactVersion,verifyNativeReact,assertExpoNativeModules,verifyExpoNativeModules,peerGaps,assertPeerGaps} from '../scripts/native-compatibility.mjs';
import {readFileSync} from 'node:fs';
it('verifies the actual native renderer React version and rejects the otherwise bundleable web version',()=>{
 expect(verifyNativeReact('fixtures/native')).toEqual({react:'19.1.0',renderer:'19.1.0'});
 expect(()=>assertNativeReactVersion('19.2.0','19.1.0')).toThrow('Native React runtime mismatch');
});
it('resolves Expo native modules from the SDK 54 set so autolinking does not drop ExpoAsset',()=>{
 // A hoisted expo-asset 57 (pulled by expo-audio's "*" peer) is not a CocoaPod for SDK 54 and crashed the iOS Simulator launch.
 const installed=verifyExpoNativeModules('fixtures/native');
 expect(installed['expo-asset']).toMatch(/^12\.0\./);
 expect(Object.keys(installed)).toEqual(expect.arrayContaining(['expo-asset','expo-audio','expo-font','expo-haptics']));
 const exact=(version:string,range:string)=>version===range;
 expect(()=>assertExpoNativeModules({'expo-asset':'57.0.19'},{'expo-asset':'12.0.13'},exact)).toThrow('expo-asset@57.0.19 (Expo SDK expects 12.0.13)');
});
it('pins the RN 0.83 profile to exactly its recorded uncertified peers (#68)',()=>{
 const semverLike=(version:string,range:string)=>range===version||(range.startsWith('^0.81')&&version.startsWith('0.81.'));
 const packages={'@bloxwap/hig-native':{'react-native':'^0.81.5','react-native-svg':'15.12.1','react-native-gesture-handler':'^2.28.0'}};
 expect(peerGaps(packages,{'react-native':'0.81.5','react-native-svg':'15.12.1'},semverLike)).toEqual({});
 const gaps=peerGaps(packages,{'react-native':'0.83.10','react-native-svg':'15.15.3'},semverLike);
 expect(gaps).toEqual({'@bloxwap/hig-native':['react-native','react-native-svg']});
 expect(()=>assertPeerGaps(gaps)).toThrow('Peer ranges do not match what is tested');
 expect(assertPeerGaps(gaps,{'@bloxwap/hig-native':['react-native-svg','react-native']})).toBe(gaps);
 // Widening a peer range (the gap disappears) must also be noticed until the profile is updated.
 expect(()=>assertPeerGaps({},{'@bloxwap/hig-native':['react-native']})).toThrow('found {}');
 const profile=JSON.parse(readFileSync('fixtures/native/profiles/rn-0.83.json','utf8'));
 expect(profile.dependencies['react-native']).toBe('0.83.10');expect(profile.dependencies.react).toBe('19.2.0');
 expect(JSON.parse(readFileSync('packages/native/package.json','utf8')).peerDependencies['react-native']).toBe('^0.81.5');
});
