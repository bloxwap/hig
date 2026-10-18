import {verifyNativeReact,verifyExpoNativeModules,verifyDeclaredPeers} from './native-compatibility.mjs';
import {nativeConsumerManifest,nativeProfiles} from './native-consumer.mjs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,cpSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {requireGeneratedFonts} from './font-preflight.mjs';
requireGeneratedFonts('smoke:packed-native');
// --profile rn-0.81 (default: RN 0.81.5 / Expo 54) or rn-0.83 (RN 0.83.10 / Expo 55); see fixtures/native/profiles.json.
const args=process.argv.slice(2);const profile=args[0]==='--profile'&&args[1]?args[1]:args.length?(()=>{throw Error('Usage: packed-native-smoke.mjs [--profile <name>]');})():'rn-0.81';
const manifest=nativeConsumerManifest(profile);
console.log(`Packed native consumer profile ${profile}: ${nativeProfiles[profile].stack}`);
const dir=mkdtempSync(join(tmpdir(),`hig-native-consumer-${profile}-`));
cpSync('fixtures/native',dir,{recursive:true,filter:s=>!s.includes('/node_modules')&&!s.includes('/dist')&&!s.includes('/.expo')});
writeFileSync(join(dir,'package.json'),JSON.stringify(manifest,null,2));
const tarballs=process.env.HIG_REGISTRY_VERSION?['contracts','tokens','feedback','native','native-fonts'].map(name=>`@bloxwap/hig-${name}@${process.env.HIG_REGISTRY_VERSION}`):readdirSync('artifacts').filter(n=>n.endsWith('.tgz')&&!n.includes('hig-react')&&!n.includes('hig-chart')&&!n.includes('hig-og-fonts')).map(n=>resolve('artifacts',n));
execFileSync('npm',['install','--no-audit','--no-fund',...tarballs],{cwd:dir,stdio:'pipe'});
const runtime=verifyNativeReact(dir);console.log('Native runtime versions',runtime);console.log('Expo native modules',verifyExpoNativeModules(dir));
// npm only warns on most peer conflicts in an Expo tree, so every declared HIG peer range must explicitly accept what was installed.
console.log('Declared peers satisfied',verifyDeclaredPeers(dir));
assert.equal(runtime.reactNative,manifest.dependencies['react-native'],`Consumer runs the ${profile} React Native version`);
execFileSync('npm',['run','bundle','--','--max-workers','2'],{cwd:dir,stdio:'inherit'});
// #64: native faces come from @bloxwap/hig-native-fonts with the generator's hashes; the web tokens package carries none.
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fontRoot=join(dir,'node_modules/@bloxwap/hig-native-fonts/fonts'),installedFonts=JSON.parse(readFileSync(join(fontRoot,'manifest.json'),'utf8')),sourceFonts=JSON.parse(readFileSync('packages/native-fonts/fonts/manifest.json','utf8'));
assert.deepEqual(installedFonts.outputs,sourceFonts.outputs);
for(const [asset,hash] of Object.entries(installedFonts.outputs))assert.equal(sha(readFileSync(join(fontRoot,asset))),hash,`Packed native font hash ${asset}`);
function walk(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(path,e.name)):[join(path,e.name)]);}
const exported=new Set(walk(join(dir,'dist')).filter(p=>statSync(p).size>100000).map(p=>sha(readFileSync(p))));
for(const asset of ['BloxwapSans.ttf','BloxwapSans-SemiBold.ttf','BloxwapMono.ttf'])assert.ok(exported.has(installedFonts.outputs[asset]),`Metro export registers ${asset} from @bloxwap/hig-native-fonts`);
assert.equal(walk(join(dir,'node_modules/@bloxwap/hig-tokens')).filter(p=>/\.(?:ttf|otf|woff2?)$/i.test(p)).length,0,'Web tokens package ships no font binaries');
console.log('Packed native fonts: hashes match the generator manifest and Metro bundles the registered faces');
writeFileSync(join(dir,'index.js'),readFileSync('fixtures/native/index-gesture.js'));
execFileSync('npm',['run','bundle','--','--max-workers','2','--output-dir','dist-gesture'],{cwd:dir,stdio:'inherit'});
console.log(`Packed optional gesture-sheet consumer (${profile}) exported Android/iOS with real Gorhom/Reanimated/Worklets peers`);
writeFileSync(join(dir,'index.js'),readFileSync('fixtures/native/index-adoption.js'));
execFileSync('npm',['run','bundle','--','--max-workers','2','--output-dir','dist-adoption'],{cwd:dir,stdio:'inherit'});
const adoptionAssets=new Set(walk(join(dir,'dist-adoption')).filter(p=>statSync(p).size>100000).map(p=>sha(readFileSync(p))));
for(const asset of ['BloxwapSansKR.ttf','BloxwapSansKR-SemiBold.ttf','BloxwapSansSC.ttf','BloxwapSansSC-SemiBold.ttf'])assert.ok(adoptionAssets.has(installedFonts.outputs[asset]),`Adoption entry bundles companion face ${asset}`);
console.log(`Packed native adoption consumer (${profile}) exported custom sheet, large-text toasts, styled readouts and multilingual choices`);
console.log(`Packed native consumer (${profile}: ${nativeProfiles[profile].stack}) exported Android and iOS from ${tarballs.length} independent tarballs`);
