import {createRequire} from 'node:module';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
export function assertNativeReactVersion(reactVersion,rendererVersion){if(reactVersion!==rendererVersion)throw Error(`Native React runtime mismatch: React ${reactVersion}; RN renderer ${rendererVersion}`);}
/** The React versions an RN renderer build is pinned to. RN 0.81 (React 19.1) throws on a mismatch; RN 0.83 (React 19.2) dropped
 * that throw, so the devtools injection block, present in both, is also read. */
export function rendererReactVersions(source){return [...new Set([source.match(/if \("([^"]+)" !== isomorphicReactPackageVersion\)/)?.[1],...[...source.matchAll(/version: "([^"]+)",\s*rendererPackageName: "react-native-renderer"/g)].map(m=>m[1])].filter(Boolean))];}
export function verifyNativeReact(directory){
 const require=createRequire(join(resolve(directory),'package.json'));
 const react=require('react/package.json').version;
 const nativeRoot=dirname(require.resolve('react-native/package.json'));
 // Fabric and Paper, when the release still ships it, must be pinned to the installed React. RN 0.88 is Fabric-only.
 const rendererRoot=join(nativeRoot,'Libraries/Renderer/implementations');
 const files=['ReactNativeRenderer-dev.js','ReactFabric-dev.js'].filter(file=>existsSync(join(rendererRoot,file)));
 if(!files.length)throw Error('Cannot find an RN renderer build');
 const versions=[...new Set(files.flatMap(file=>{const found=rendererReactVersions(readFileSync(join(rendererRoot,file),'utf8'));if(!found.length)throw Error(`Cannot identify the pinned RN renderer version in ${file}`);return found;}))];
 if(versions.length!==1)throw Error(`RN renderers disagree on React: ${versions.join(', ')}`);
 const renderer=versions[0];
 assertNativeReactVersion(react,renderer);return {react,renderer,reactNative:require('react-native/package.json').version};
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
/** Every peer range a @bloxwap/hig-* native package declares must accept the version its consumer actually installed (#68). */
export function assertDeclaredPeers(packages,installed,satisfies){const mismatches=[];for(const [name,peers] of Object.entries(packages))for(const [peer,range] of Object.entries(peers)){const version=installed[peer];if(version&&!satisfies(version,range))mismatches.push(`${name} declares ${peer} ${range}; consumer installed ${version}`);}if(mismatches.length)throw Error(`Declared peer range mismatch: ${mismatches.join('; ')}`);return installed;}
export function verifyDeclaredPeers(directory){
 const require=createRequire(join(resolve(directory),'package.json'));
 const semver=createRequire(import.meta.url)('semver');
 // Read manifests from node_modules directly: export maps (hig-native's included) need not expose package.json.
 const manifest=name=>{for(const base of require.resolve.paths(name)??[]){const file=join(base,name,'package.json');if(existsSync(file))return JSON.parse(readFileSync(file,'utf8'));}return undefined;};
 const packages={},installed={};
 for(const name of ['@bloxwap/hig-native','@bloxwap/hig-feedback']){const own=manifest(name);if(!own)continue;packages[name]=own.peerDependencies??{};for(const peer of Object.keys(packages[name])){const version=manifest(peer)?.version;if(version)installed[peer]=version;}}
 if(!packages['@bloxwap/hig-native'])throw Error('Consumer does not install @bloxwap/hig-native');
 return assertDeclaredPeers(packages,installed,(version,range)=>semver.satisfies(version,range));
}
