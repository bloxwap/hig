// QRCode's shared model, timed in Node: the encoder (`encodeQR`) and the path builder (`qrGeometry`) separately, for byte
// payloads of 20, 42 (an EVM address), 100, 500 and 2000 bytes at each error correction level, then the wallet case end to
// end (`qrCodeGeometry` of an address under an arena, so high error correction). The source is bundled from
// packages/hig/contracts/src/qr.ts, so no build is needed.
//
//   node scripts/perf/qr-code-model.mjs             a table, then one JSON object on the last line
//   node --jitless scripts/perf/qr-code-model.mjs   the same with V8's interpreter only
//   HIG_QR_SOURCE=before=old/qr.ts,after=packages/hig/contracts/src/qr.ts
//                                                   copies of the source to time, each `label=path` or a path. With several,
//                                                   their samples are taken in interleaved rounds, so a busy machine disturbs
//                                                   a before and an after alike, and the object holds `sources`, one a copy
//
// This machine is not a phone. `phone5x` is the median multiplied by five, the figure asked for; a phone runs Hermes, which
// interprets bytecode without a JIT, so `--jitless` is the closer stand-in this machine can give. Neither is a device number.
// `load` is the machine's one-minute load average at the start and the end, beside its `cpus`: medians taken while it is near
// or above the core count are slower than the code is, and `minMs` is then the figure to read.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {cpus,loadavg} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const FRAME=1000/60,PHONE=5,jitless=process.execArgv.includes('--jitless'),startLoad=Math.round(loadavg()[0]*100)/100;
const levels=['low','medium','quartile','high'],address='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688';
const output=resolve('.validation-tmp/perf');mkdirSync(output,{recursive:true});
const sources=(process.env.HIG_QR_SOURCE??'packages/hig/contracts/src/qr.ts').split(',').map(entry=>{const [label,path]=entry.includes('=')?entry.split('='):[entry,entry];return {label,path};});
for(const [index,source] of sources.entries()){
 const bundle=await build({entryPoints:[resolve(source.path)],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
 source.file=`${output}/qr-model-${process.pid}-${index}.mjs`;writeFileSync(source.file,bundle.outputFiles[0].text);source.api=await import(pathToFileURL(source.file).href);
}
const round=(value,digits=4)=>Number(value.toFixed(digits));
const middle=(values)=>[...values].sort((a,b)=>a-b)[values.length>>1];
// A screen that shows one code pays the import and the first code of the process: both are timed in fresh processes, a copy in turn.
const probe=(file)=>`const start=process.hrtime.bigint(),model=await import(${JSON.stringify(pathToFileURL(file).href)}),loaded=process.hrtime.bigint();model.qrCodeGeometry('${address}',{arena:true});console.log(Number(loaded-start)/1e6,Number(process.hrtime.bigint()-loaded)/1e6)`;
const cold=sources.map(()=>({importMs:[],firstCallMs:[]}));
for(let turn=0;turn<9;turn++)for(const [index,source] of sources.entries()){
 const [importMs,firstCallMs]=execFileSync(process.execPath,[...process.execArgv,'--input-type=module','-e',probe(source.file)],{encoding:'utf8'}).trim().split(' ').map(Number);
 cold[index].importMs.push(importMs);cold[index].firstCallMs.push(firstCallMs);
}
/** A deterministic generator, so every run times the same payloads. */
function random(seed){let state=seed;return()=>{state=(state*1103515245+12345)&0x7fffffff;return state/0x7fffffff;};}
/** Printable ASCII with lower case in it, so the payload packs as bytes: one byte a character. */
function payload(bytes){if(bytes===42)return address;const next=random(bytes);let text='';for(let i=0;i<bytes;i++)text+=String.fromCharCode(33+Math.floor(next()*94));return text;}
/**
 * Times each of `runs` call by call after a warm-up, in five rounds that take the runs in turn: at least `floor` samples and
 * `budget` milliseconds of them each, fewer under the interpreter. `minMs` is the figure a busy machine disturbs least.
 */
function time(runs,{rounds=5,floor=jitless?40:300,budget=jitless?150:250,warm=jitless?5:200}={}){
 const samples=runs.map(()=>[]);
 for(const run of runs)for(let i=0;i<warm;i++)run();
 for(let turn=0;turn<rounds;turn++)for(const [index,run] of runs.entries()){
  const taken=samples[index],target=taken.length+floor/rounds;let spent=0;
  while(taken.length<target||spent<budget/rounds){const start=process.hrtime.bigint();run();const ms=Number(process.hrtime.bigint()-start)/1e6;taken.push(ms);spent+=ms;if(taken.length>=target+4000)break;}
 }
 return samples.map(taken=>{
  taken.sort((a,b)=>a-b);const median=taken[taken.length>>1];
  return {medianMs:round(median),p95Ms:round(taken[Math.min(taken.length-1,Math.floor(taken.length*0.95))]),minMs:round(taken[0]),opsPerSec:Math.round(1000/median),samples:taken.length};
 });
}
const commands=(path)=>path.match(/[a-zA-Z]/g).length;
const rows=sources.map(()=>[]);
for(const bytes of [20,42,100,500,2000])for(const errorCorrection of levels){
 const value=payload(bytes),fitting=[];
 for(const [index,{api}] of sources.entries()){
  try{fitting.push({index,api,matrix:api.encodeQR(value,{errorCorrection})});}catch(error){if(!(error instanceof api.QRCapacityError))throw error;rows[index].push({bytes,errorCorrection,fits:false});}
 }
 const encode=time(fitting.map(({api})=>()=>api.encodeQR(value,{errorCorrection}))),geometry=time(fitting.map(({api,matrix})=>()=>api.qrGeometry(matrix)));
 for(const [order,{index,api,matrix}] of fitting.entries()){
  const drawn=api.qrGeometry(matrix);
  rows[index].push({bytes,errorCorrection,fits:true,version:matrix.version,modules:matrix.size,mask:matrix.mask,encode:encode[order],geometry:geometry[order],pathLength:drawn.path.length,pathCommands:commands(drawn.path),dots:drawn.dots,arenaPathLength:api.qrGeometry(matrix,{arena:true}).path.length});
 }
}
// The wallet case: what one render of `<QRCode value={address} arena='/eth.png'/>` computes.
const walletTimes=time(sources.map(({api})=>()=>api.qrCodeGeometry(address,{arena:true})));
const reports=sources.map(({label,path,api},index)=>{
 const drawn=api.qrCodeGeometry(address,{arena:true}),timed=walletTimes[index];
 const wallet={value:address,errorCorrection:'high',arena:true,modules:drawn.size,dots:drawn.dots,pathLength:drawn.path.length,pathCommands:commands(drawn.path),importMs:round(middle(cold[index].importMs),3),firstCallMs:round(middle(cold[index].firstCallMs),3),...timed,
  phone5xMs:round(timed.medianMs*PHONE),phone5xShareOfFrame:round(timed.medianMs*PHONE/FRAME,3),phone5xP95Ms:round(timed.p95Ms*PHONE)};
 const implied=rows[index].filter(row=>row.fits).map(row=>({bytes:row.bytes,errorCorrection:row.errorCorrection,phone5xMs:round((row.encode.medianMs+row.geometry.medianMs)*PHONE,3),shareOfFrame:round((row.encode.medianMs+row.geometry.medianMs)*PHONE/FRAME,3)}));
 return {label,source:path,rows:rows[index],wallet,implied};
});
const result={benchmark:'qr-code-model',node:process.version,jitless,platform:`${process.platform} ${process.arch}`,cpus:cpus().length,load:[startLoad,round(loadavg()[0],2)],frameMs:round(FRAME,2),phoneFactor:PHONE};
if(reports.length===1){const {source,rows:only,wallet,implied}=reports[0];Object.assign(result,{source,rows:only,wallet,implied});}
else result.sources=Object.fromEntries(reports.map(({label,...report})=>[label,report]));

const pad=(text,width)=>String(text).padStart(width);
console.log(`QRCode model, ${process.version}${jitless?' --jitless (interpreter only)':''}, ${result.platform}, load ${result.load.join(' to ')} on ${result.cpus} cores`);
for(const {label,rows:table,wallet} of reports){
 console.log(`\n${label}`);
 console.log(`${pad('bytes',5)} ${pad('level',8)} ${pad('ver',3)} ${pad('side',4)} | ${pad('encode med',10)} ${pad('p95',8)} ${pad('min',8)} ${pad('ops/s',8)} | ${pad('path med',9)} ${pad('p95',8)} ${pad('min',8)} ${pad('ops/s',8)} | ${pad('d chars',7)} ${pad('cmds',6)} | ${pad('x5 ms',7)} ${pad('of frame',8)}`);
 for(const row of table){
  if(!row.fits){console.log(`${pad(row.bytes,5)} ${pad(row.errorCorrection,8)}   does not fit a version 40 symbol`);continue;}
  const total=(row.encode.medianMs+row.geometry.medianMs)*PHONE;
  console.log(`${pad(row.bytes,5)} ${pad(row.errorCorrection,8)} ${pad(row.version,3)} ${pad(row.modules,4)} | ${pad(row.encode.medianMs.toFixed(4),10)} ${pad(row.encode.p95Ms.toFixed(4),8)} ${pad(row.encode.minMs.toFixed(4),8)} ${pad(row.encode.opsPerSec,8)} | ${pad(row.geometry.medianMs.toFixed(4),9)} ${pad(row.geometry.p95Ms.toFixed(4),8)} ${pad(row.geometry.minMs.toFixed(4),8)} ${pad(row.geometry.opsPerSec,8)} | ${pad(row.pathLength,7)} ${pad(row.pathCommands,6)} | ${pad(total.toFixed(3),7)} ${pad(`${(total/FRAME*100).toFixed(1)}%`,8)}`);
 }
 console.log(`wallet (42-byte address, arena, high): ${wallet.modules} modules, ${wallet.dots} dots, ${wallet.pathLength} chars, ${wallet.pathCommands} commands`);
 console.log(`  fresh process: import ${wallet.importMs} ms, then the first code ${wallet.firstCallMs} ms; warm: median ${wallet.medianMs} ms, p95 ${wallet.p95Ms} ms, min ${wallet.minMs} ms, ${wallet.opsPerSec} ops/s`);
 console.log(`  on a CPU ${PHONE}x slower: ${wallet.phone5xMs} ms median (${(wallet.phone5xShareOfFrame*100).toFixed(1)}% of a ${result.frameMs} ms frame), ${wallet.phone5xP95Ms} ms p95`);
}
console.log(JSON.stringify(result));
