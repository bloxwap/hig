// Compares two assembled native-sim runs of the same packed candidate (#68): the RN 0.81.5 / Expo 54 control and the
// RN 0.83.10 / Expo 55 run. Same checks, same simulator/emulator, same scripts; only the consumer profile differs.
// Usage: node scripts/native-sim/compare-runs.mjs <control-dir> <candidate-dir> [--out <file>]
// Each dir holds ios/, android/ and gesture/ as written by assemble-evidence.mjs. Run-step outcomes must match; result JSON is
// compared after dropping timing samples and per-process identifiers; captures are pixel-compared with scripts/visual-diff.mjs.
import {readFileSync,readdirSync,existsSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {compareVisual} from '../visual-diff.mjs';
const argv=process.argv.slice(2),outAt=argv.indexOf('--out');
const out=outAt>=0?resolve(argv[outAt+1]):undefined;
const [control,candidate]=(outAt>=0?argv.filter((_,i)=>i!==outAt&&i!==outAt+1):argv).map(p=>resolve(p));
/** Timing and process identity change on every run, including two runs of one build. */
export const volatileKeys=new Set(['samples','elapsedMs','elapsedSeconds','gfx','frameStats','latency']);
export function normalize(value){
 if(Array.isArray(value))return value.map(normalize);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!volatileKeys.has(k)).map(([k,v])=>[k,normalize(v)]));
 if(typeof value==='string')return value.replace(/pid: \d+/g,'pid: N').replace(/elementID: [\d.]+/g,'elementID: N').replace(/0x[0-9a-f]+/g,'0xN').replace(/\d+(?:\.\d+)?ms/g,'Nms').replace(/\b\d{10,}\b/g,'T');
 return value;
}
/** Leaf-level differences between two JSON values, as {path, control, candidate}. */
export function diffJson(a,b,path='$'){
 if(Array.isArray(a)&&Array.isArray(b)){const d=[];for(let i=0;i<Math.max(a.length,b.length);i++)d.push(...diffJson(a[i],b[i],`${path}[${i}]`));return d;}
 if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){const d=[];for(const k of [...new Set([...Object.keys(a),...Object.keys(b)])].sort())d.push(...diffJson(a[k],b[k],`${path}.${k}`));return d;}
 return JSON.stringify(a)===JSON.stringify(b)?[]:[{path,control:a,candidate:b}];
}
/** Run-summary lines reduced to "<step> -> <outcome>" so the two runs can be matched step by step. */
export function steps(text){return text.trim().split('\n').filter(Boolean).map(line=>{const [step,outcome]=line.split(' -> ');return {step:step.trim(),outcome:(outcome??'').trim()};});}
function comparePlatform(platform){
 const a=join(control,platform),b=join(candidate,platform);
 if(!existsSync(a)||!existsSync(b))return {missing:[a,b].filter(p=>!existsSync(p))};
 const sa=steps(readFileSync(join(a,'run-summary.txt'),'utf8')),sb=steps(readFileSync(join(b,'run-summary.txt'),'utf8'));
 const stepResults=sb.map((s,i)=>({step:s.step,control:sa[i]?.outcome,candidate:s.outcome,same:sa[i]?.step===s.step&&sa[i]?.outcome===s.outcome}));
 const results={};
 for(const file of readdirSync(b).filter(f=>f.endsWith('.json')).sort()){
  if(!existsSync(join(a,file))){results[file]={onlyInCandidate:true};continue;}
  const diffs=diffJson(normalize(JSON.parse(readFileSync(join(a,file),'utf8'))),normalize(JSON.parse(readFileSync(join(b,file),'utf8'))));
  results[file]=diffs.length?{differences:diffs.length,diffs}:{same:true};
 }
 const captures={};
 if(existsSync(join(a,'captures'))&&existsSync(join(b,'captures')))for(const file of readdirSync(join(b,'captures')).filter(f=>f.endsWith('.png')).sort()){
  if(!existsSync(join(a,'captures',file))){captures[file]='only in candidate';continue;}
  try{const r=compareVisual(readFileSync(join(b,'captures',file)),readFileSync(join(a,'captures',file)),{maxChangedRatio:1});captures[file]=Number((r.changedRatio*100).toFixed(2));}
  catch(error){captures[file]=String(error.message);}
 }
 const changed=Object.entries(captures).filter(([,v])=>typeof v!=='number'||v>2);
 return {steps:{total:stepResults.length,same:stepResults.filter(s=>s.same).length,differing:stepResults.filter(s=>!s.same)},
  results:{files:Object.keys(results).length,same:Object.values(results).filter(r=>r.same).length,differing:Object.fromEntries(Object.entries(results).filter(([,r])=>!r.same))},
  captures:{compared:Object.keys(captures).length,channelTolerance:24,over2PercentChanged:Object.fromEntries(changed),maxChangedPercent:Math.max(0,...Object.values(captures).filter(v=>typeof v==='number'))}};
}
if(control&&candidate){
 // GestureSheet (run-gesture.sh): the same summary lines (exit codes, Android sheet positions and dismissals) on both.
 const gestureSummary=dir=>existsSync(join(dir,'gesture/summary.txt'))?readFileSync(join(dir,'gesture/summary.txt'),'utf8').trim().split('\n'):[];
 const ga=gestureSummary(control),gb=gestureSummary(candidate);
 const report={control,candidate,ios:comparePlatform('ios'),android:comparePlatform('android'),gesture:{lines:gb.length,same:ga.length===gb.length&&ga.every((l,i)=>l===gb[i]),candidate:gb}};
 const text=JSON.stringify(report,null,2)+'\n';
 if(out)writeFileSync(out,text);else process.stdout.write(text);
}
