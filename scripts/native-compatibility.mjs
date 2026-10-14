import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
export function assertNativeReactVersion(reactVersion,rendererVersion){if(reactVersion!==rendererVersion)throw Error(`Native React runtime mismatch: React ${reactVersion}; RN renderer ${rendererVersion}`);}
export function verifyNativeReact(directory){
 const require=createRequire(join(resolve(directory),'package.json'));
 const react=require('react/package.json').version;
 const nativeRoot=dirname(require.resolve('react-native/package.json'));
 const renderer=readFileSync(join(nativeRoot,'Libraries/Renderer/implementations/ReactNativeRenderer-dev.js'),'utf8').match(/if \("([^"]+)" !== isomorphicReactPackageVersion\)/)?.[1];
 if(!renderer)throw Error('Cannot identify the pinned RN renderer version');
 assertNativeReactVersion(react,renderer);return {react,renderer};
}
