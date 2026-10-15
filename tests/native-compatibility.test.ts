import {it,expect} from 'vitest';
// @ts-expect-error Executable native runtime guard.
import {assertNativeReactVersion,verifyNativeReact,assertExpoNativeModules,verifyExpoNativeModules} from '../scripts/native-compatibility.mjs';
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
