// Copies raw iOS Simulator / Android emulator outputs into evidence/native-sim/ with
// downscaled captures, compact hierarchy dumps and a run summary used by native-sim.json.
// Usage: node scripts/native-sim/assemble-evidence.mjs <ios-out> <android-out> [--out <evidence-dir>]
// --out defaults to evidence/native-sim (the RN 0.81.5 runs); the RN 0.83 runs use evidence/native-sim/rn-0.83 (#68).
import {readdirSync,readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import sharp from 'sharp';
const argv=process.argv.slice(2),outAt=argv.indexOf('--out');
const root=resolve(outAt>=0?argv[outAt+1]:'evidence/native-sim');
const [iosOut,androidOut]=(outAt>=0?argv.filter((_,i)=>i!==outAt&&i!==outAt+1):argv).map(p=>resolve(p));
for(const platform of ['ios','android','gesture'])rmSync(join(root,platform),{recursive:true,force:true});
const json=file=>JSON.parse(readFileSync(file,'utf8'));
async function captures(from,to){mkdirSync(to,{recursive:true});let n=0;for(const file of readdirSync(from).filter(f=>f.endsWith('.png')).sort()){await sharp(join(from,file)).resize({width:420}).png({compressionLevel:9,palette:true}).toFile(join(to,file));n++;}return n;}
function trees(from,to,compact){mkdirSync(to,{recursive:true});let n=0;for(const file of readdirSync(from).sort()){const text=readFileSync(join(from,file),'utf8');writeFileSync(join(to,file),compact&&file.endsWith('.json')?JSON.stringify(JSON.parse(text))+'\n':text.replace(/0x[0-9a-f]+, /g,''));n++;}return n;}
function results(from,to,prefix){mkdirSync(to,{recursive:true});const out={};for(const file of readdirSync(from).filter(f=>f.startsWith(prefix)&&f.endsWith('.json')).sort()){copyFileSync(join(from,file),join(to,file));out[file.replace(/\.json$/,'')]=json(join(from,file));}return out;}
const summary={};
// Recursive copy for flow folders (TalkBack keyboard flow, gesture sheet): PNGs downscaled, text kept, build logs skipped.
async function copyTree(from,to){if(!existsSync(from))return 0;mkdirSync(to,{recursive:true});let n=0;for(const entry of readdirSync(from,{withFileTypes:true})){const source=join(from,entry.name),target=join(to,entry.name);
 if(entry.isDirectory()){if(entry.name!=='xcresult')n+=await copyTree(source,target);continue;}
 if(/\.log$|\.bak$/.test(entry.name))continue;
 if(entry.name.endsWith('.png')){await sharp(source).resize({width:420}).png({compressionLevel:9,palette:true}).toFile(target);}else copyFileSync(source,target);n++;}return n;}
if(iosOut&&existsSync(iosOut)){
 const raw=join(iosOut,'ios-raw');
 summary.ios={captures:await captures(join(raw,'captures'),join(root,'ios/captures')),hierarchyDumps:trees(join(raw,'trees'),join(root,'ios/trees'),false),results:Object.keys(results(raw,join(root,'ios'),'ios-')),runLog:readFileSync(join(iosOut,'logs/summary.txt'),'utf8').trim().split('\n')};
 writeFileSync(join(root,'ios/run-summary.txt'),summary.ios.runLog.join('\n')+'\n');
 summary.gesture={files:await copyTree(join(iosOut,'gesture'),join(root,'gesture'))};
}
if(androidOut&&existsSync(androidOut)){
 summary.android={captures:await captures(join(androidOut,'captures'),join(root,'android/captures')),hierarchyDumps:trees(join(androidOut,'trees'),join(root,'android/trees'),true),results:Object.keys(results(androidOut,join(root,'android'),'android-')),runLog:readFileSync(join(androidOut,'logs/summary.txt'),'utf8').trim().split('\n').map(l=>l.replace(/-e components '[^']*'/,"-e components '…'"))};
 mkdirSync(join(root,'android/host'),{recursive:true});
 for(const file of readdirSync(join(androidOut,'host'))){const text=readFileSync(join(androidOut,'host',file),'utf8');
  // Keep only the gallery's lines from system dumps (vibrator/audio/gfx) plus their section headers.
  const keep=file.startsWith('gfxinfo')||file==='logcat.txt'?text:text.split('\n').filter(l=>/bloxwap|Vibration|vibrat|requestAudioFocus|player/i.test(l)).join('\n');
  writeFileSync(join(root,'android/host',file),keep.trim()+'\n');}
 writeFileSync(join(root,'android/run-summary.txt'),summary.android.runLog.join('\n')+'\n');
 summary.talkbackFlow={files:await copyTree(join(androidOut,'talkback-flow'),join(root,'android/talkback-flow'))};
}
writeFileSync(join(root,'artifact-index.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(summary).map(([k,v])=>[k,v.results?{captures:v.captures,hierarchyDumps:v.hierarchyDumps,results:v.results.length}:v]))));
