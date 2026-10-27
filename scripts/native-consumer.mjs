// Packed native consumer manifests (#68). fixtures/native/package.json is the RN 0.81.5 / Expo 54 consumer; every other
// profile in fixtures/native/profiles.json replaces only the versions it lists, so every consumer runs the same gallery source.
// CLI: node scripts/native-consumer.mjs <profile> <app-dir>   writes <app-dir>/package.json without @bloxwap/hig-* workspace deps.
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const fixture=fileURLToPath(new URL('../fixtures/native/',import.meta.url));
export const nativeProfiles=JSON.parse(readFileSync(join(fixture,'profiles.json'),'utf8'));
export function nativeConsumerManifest(profile='rn-0.81'){
 const chosen=nativeProfiles[profile];if(!chosen)throw Error(`Unknown native consumer profile ${profile}; expected ${Object.keys(nativeProfiles).join(', ')}`);
 const manifest=JSON.parse(readFileSync(join(fixture,'package.json'),'utf8'));
 for(const key of Object.keys(manifest.dependencies))if(key.startsWith('@bloxwap/hig-'))delete manifest.dependencies[key];
 for(const [name,version] of Object.entries(chosen.dependencies)){if(!(name in manifest.dependencies))throw Error(`Profile ${profile} overrides ${name}, which the fixture does not install`);manifest.dependencies[name]=version;}
 manifest.type='commonjs';manifest.higNativeProfile=profile;
 return manifest;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [profile,dir]=process.argv.slice(2);if(!profile||!dir)throw Error('Usage: node scripts/native-consumer.mjs <profile> <app-dir>');
 writeFileSync(join(dir,'package.json'),JSON.stringify(nativeConsumerManifest(profile),null,2)+'\n');
 console.log(`${dir}/package.json: ${profile} (${nativeProfiles[profile].stack})`);
}
