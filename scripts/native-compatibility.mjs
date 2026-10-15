import {createRequire} from 'node:module';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
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
/** Expo autolinking links the copy a project resolves from its root, so a hoisted module from another SDK compiles away and fails at launch ("Cannot find native module"). */
export function assertExpoNativeModules(installed,bundled,satisfies){const mismatches=Object.entries(installed).filter(([name,version])=>bundled[name]&&!satisfies(version,bundled[name])).map(([name,version])=>`${name}@${version} (Expo SDK expects ${bundled[name]})`);if(mismatches.length)throw Error(`Expo native module mismatch: ${mismatches.join(', ')}`);return installed;}
export function verifyExpoNativeModules(directory){
 const require=createRequire(join(resolve(directory),'package.json'));
 const bundled=require('expo/bundledNativeModules.json');
 const semver=createRequire(import.meta.url)('semver');
 const installed={};
 for(const name of Object.keys(bundled)){let manifest;try{manifest=require.resolve(`${name}/package.json`);}catch{continue;}const root=dirname(manifest);
  // Only packages that autolink native code matter; JS-only tooling cannot drop a native module.
  const native=existsSync(join(root,'expo-module.config.json'))||existsSync(join(root,'android','build.gradle'))||readdirSync(root).some(file=>file.endsWith('.podspec'));
  if(native)installed[name]=JSON.parse(readFileSync(manifest,'utf8')).version;}
 return assertExpoNativeModules(installed,bundled,(version,range)=>semver.satisfies(version,range,{includePrerelease:true}));
}
