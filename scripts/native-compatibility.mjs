import {createRequire} from 'node:module';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
export function assertNativeReactVersion(reactVersion,rendererVersion){if(reactVersion!==rendererVersion)throw Error(`Native React runtime mismatch: React ${reactVersion}; RN renderer ${rendererVersion}`);}
export function verifyNativeReact(directory){
 const require=createRequire(join(resolve(directory),'package.json'));
 const react=require('react/package.json').version;
 const nativeRoot=dirname(require.resolve('react-native/package.json'));
 const source=readFileSync(join(nativeRoot,'Libraries/Renderer/implementations/ReactNativeRenderer-dev.js'),'utf8');
 // RN <=0.81 renderers check the isomorphic React version at runtime; RN 0.83 dropped that check and only
 // embeds reconcilerVersion, so a mismatch no longer fails loudly and this guard is the only check left.
 const renderer=source.match(/if \("([^"]+)" !== isomorphicReactPackageVersion\)/)?.[1]??source.match(/reconcilerVersion: "([^"]+)"/)?.[1];
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
/** Peer ranges of the installed HIG packages that the consumer's installed versions do not satisfy (absent optional peers are skipped). */
export function peerGaps(packages,installed,satisfies){const gaps={};for(const [name,peers] of Object.entries(packages))for(const [peer,range] of Object.entries(peers)){const version=installed[peer];if(version!==undefined&&!satisfies(version,range))(gaps[name]??=[]).push(peer);}for(const list of Object.values(gaps))list.sort();return gaps;}
/** Certified consumers must satisfy every declared peer; an uncertified profile must differ in exactly its recorded peers, so a widened range or a new gap is noticed. */
export function assertPeerGaps(actual,expected={}){const normal=value=>JSON.stringify(Object.fromEntries(Object.entries(value).map(([k,v])=>[k,[...v].sort()]).sort()));if(normal(actual)!==normal(expected))throw Error(`Peer ranges do not match what is tested: found ${normal(actual)}, expected ${normal(expected)}`);return actual;}
export function verifyPeerGaps(directory,expected){
 const semver=createRequire(import.meta.url)('semver');
 // Read manifests from the consumer's node_modules: HIG `exports` deliberately do not expose ./package.json.
 const manifest=name=>{const file=join(resolve(directory),'node_modules',name,'package.json');return existsSync(file)?JSON.parse(readFileSync(file,'utf8')):undefined;};
 const packages={},installed={};
 for(const name of ['@bloxwap/hig-native','@bloxwap/hig-feedback','@bloxwap/hig-tokens','@bloxwap/hig-contracts']){const pkg=manifest(name);if(!pkg)continue;packages[name]=pkg.peerDependencies??{};for(const peer of Object.keys(packages[name])){const version=manifest(peer)?.version;if(version)installed[peer]=version;}}
 if(!packages['@bloxwap/hig-native'])throw Error('Packed @bloxwap/hig-native is not installed in the consumer');
 return assertPeerGaps(peerGaps(packages,installed,(v,range)=>semver.satisfies(v,range,{includePrerelease:true})),expected);
}
