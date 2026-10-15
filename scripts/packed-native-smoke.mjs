import {verifyNativeReact,verifyExpoNativeModules} from './native-compatibility.mjs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,cpSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
const dir=mkdtempSync(join(tmpdir(),'hig-native-consumer-'));
const manifest=JSON.parse(readFileSync('fixtures/native/package.json','utf8'));
for(const key of Object.keys(manifest.dependencies)){if(key.startsWith('@bloxwap/hig-'))delete manifest.dependencies[key];}
manifest.type='commonjs';
cpSync('fixtures/native',dir,{recursive:true,filter:s=>!s.includes('/node_modules')&&!s.includes('/dist')&&!s.includes('/.expo')});
writeFileSync(join(dir,'package.json'),JSON.stringify(manifest,null,2));
const tarballs=readdirSync('artifacts').filter(n=>n.endsWith('.tgz')&&!n.includes('hig-react')).map(n=>resolve('artifacts',n));
execFileSync('npm',['install','--no-audit','--no-fund',...tarballs],{cwd:dir,stdio:'pipe'});
console.log('Native runtime versions',verifyNativeReact(dir));console.log('Expo native modules',verifyExpoNativeModules(dir));
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
console.log('Packed optional gesture-sheet consumer exported Android/iOS with real Gorhom/Reanimated/Worklets peers');
console.log(`Packed native consumer exported both platforms from ${tarballs.length} independent tarballs`);
