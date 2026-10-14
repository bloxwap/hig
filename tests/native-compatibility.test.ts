import {it,expect} from 'vitest';
// @ts-expect-error Executable native runtime guard.
import {assertNativeReactVersion,verifyNativeReact} from '../scripts/native-compatibility.mjs';
it('verifies the actual native renderer React version and rejects the otherwise bundleable web version',()=>{
 expect(verifyNativeReact('fixtures/native')).toEqual({react:'19.1.0',renderer:'19.1.0'});
 expect(()=>assertNativeReactVersion('19.2.0','19.1.0')).toThrow('Native React runtime mismatch');
});
