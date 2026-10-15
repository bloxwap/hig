import {verifyNativeReact,verifyExpoNativeModules} from './native-compatibility.mjs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,cpSync,readdirSync} from 'node:fs';
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
writeFileSync(join(dir,'index.js'),readFileSync('fixtures/native/index-gesture.js'));
execFileSync('npm',['run','bundle','--','--max-workers','2','--output-dir','dist-gesture'],{cwd:dir,stdio:'inherit'});
console.log('Packed optional gesture-sheet consumer exported Android/iOS with real Gorhom/Reanimated/Worklets peers');
console.log(`Packed native consumer exported both platforms from ${tarballs.length} independent tarballs`);
