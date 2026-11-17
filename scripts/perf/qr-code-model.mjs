// QRCode's shared model, timed in Node: the encoder (`encodeQR`) and the path builder (`qrGeometry`) separately, for byte
// payloads of 20, 42 (an EVM address), 100, 500 and 2000 bytes at each error correction level, then the wallet case end to
// end (`qrCodeGeometry` of an address under an arena, so high error correction). The source is bundled from
// packages/hig/contracts/src/qr.ts, so no build is needed; HIG_QR_SOURCE names another copy of it to time (a checkout of
// an earlier commit, for a before and after on one machine in one run).
//
//   node scripts/perf/qr-code-model.mjs             a table, then one JSON object on the last line
//   node --jitless scripts/perf/qr-code-model.mjs   the same with V8's interpreter only
//
// This machine is not a phone. `phone5x` is the median multiplied by five, the figure asked for; a phone runs Hermes, which
// interprets bytecode without a JIT, so `--jitless` is the closer stand-in this machine can give. Neither is a device number.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const source=resolve(process.env.HIG_QR_SOURCE??'packages/hig/contracts/src/qr.ts'),output=resolve('.validation-tmp/perf');mkdirSync(output,{recursive:true});
const bundle=await build({entryPoints:[source],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
const file=`${output}/qr-model-${process.pid}.mjs`;writeFileSync(file,bundle.outputFiles[0].text);
const {encodeQR,qrGeometry,qrCodeGeometry,QRCapacityError}=await import(pathToFileURL(file).href);

const FRAME=1000/60,PHONE=5,jitless=process.execArgv.includes('--jitless');
const levels=['low','medium','quartile','high'],address='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688';
/** A deterministic generator, so every run times the same payloads. */
function random(seed){let state=seed;return()=>{state=(state*1103515245+12345)&0x7fffffff;return state/0x7fffffff;};}
/** Printable ASCII with lower case in it, so the payload packs as bytes: one byte a character. */
function payload(bytes){if(bytes===42)return address;const next=random(bytes);let text='';for(let i=0;i<bytes;i++)text+=String.fromCharCode(33+Math.floor(next()*94));return text;}
const round=(value,digits=4)=>Number(value.toFixed(digits));
/** Times `run` call by call after a warm-up: at least `floor` samples and `budget` milliseconds of them, fewer under the interpreter. */
function time(run,{floor=jitless?40:300,budget=jitless?150:250,warm=jitless?5:200}={}){
 for(let i=0;i<warm;i++)run();
 const samples=[];let spent=0;
 while(samples.length<floor||spent<budget){const start=process.hrtime.bigint();run();const ms=Number(process.hrtime.bigint()-start)/1e6;samples.push(ms);spent+=ms;if(samples.length>=20000)break;}
 samples.sort((a,b)=>a-b);
 const median=samples[samples.length>>1],p95=samples[Math.min(samples.length-1,Math.floor(samples.length*0.95))];
 return {medianMs:round(median),p95Ms:round(p95),opsPerSec:Math.round(1000/median),samples:samples.length};
}
const rows=[];
for(const bytes of [20,42,100,500,2000])for(const errorCorrection of levels){
 const value=payload(bytes);let matrix;
 try{matrix=encodeQR(value,{errorCorrection});}catch(error){if(!(error instanceof QRCapacityError))throw error;rows.push({bytes,errorCorrection,fits:false});continue;}
 const geometry=qrGeometry(matrix),arena=qrGeometry(matrix,{arena:true});
 rows.push({bytes,errorCorrection,fits:true,version:matrix.version,modules:matrix.size,mask:matrix.mask,
  encode:time(()=>encodeQR(value,{errorCorrection})),geometry:time(()=>qrGeometry(matrix)),
  pathLength:geometry.path.length,pathCommands:geometry.path.match(/[a-zA-Z]/g).length,dots:geometry.dots,arenaPathLength:arena.path.length});
}
// The wallet case: what one render of `<QRCode value={address} arena='/eth.png'/>` computes. The first call is timed alone,
// before anything has compiled this size of symbol, because a screen that shows one code pays exactly that.
const cold=(()=>{const value=address.replace('9e','9f'),start=process.hrtime.bigint();qrCodeGeometry(value,{arena:true});return round(Number(process.hrtime.bigint()-start)/1e6);})();
const walletGeometry=qrCodeGeometry(address,{arena:true}),walletTime=time(()=>qrCodeGeometry(address,{arena:true}));
const wallet={value:address,errorCorrection:'high',arena:true,modules:walletGeometry.size,dots:walletGeometry.dots,pathLength:walletGeometry.path.length,pathCommands:walletGeometry.path.match(/[a-zA-Z]/g).length,firstCallMs:cold,...walletTime,
 phone5xMs:round(walletTime.medianMs*PHONE),phone5xShareOfFrame:round(walletTime.medianMs*PHONE/FRAME,3),phone5xP95Ms:round(walletTime.p95Ms*PHONE)};
const implied=rows.filter(row=>row.fits).map(row=>({bytes:row.bytes,errorCorrection:row.errorCorrection,phone5xMs:round((row.encode.medianMs+row.geometry.medianMs)*PHONE,3),shareOfFrame:round((row.encode.medianMs+row.geometry.medianMs)*PHONE/FRAME,3)}));
const result={benchmark:'qr-code-model',node:process.version,jitless,platform:`${process.platform} ${process.arch}`,source:process.env.HIG_QR_SOURCE??'packages/hig/contracts/src/qr.ts',frameMs:round(FRAME,2),phoneFactor:PHONE,rows,wallet,implied};

const pad=(text,width)=>String(text).padStart(width);
console.log(`QRCode model, ${process.version}${jitless?' --jitless (interpreter only)':''}, ${result.platform}`);
console.log(`${pad('bytes',5)} ${pad('level',8)} ${pad('ver',3)} ${pad('side',4)} | ${pad('encode med',10)} ${pad('p95',8)} ${pad('ops/s',8)} | ${pad('path med',9)} ${pad('p95',8)} ${pad('ops/s',8)} | ${pad('d chars',7)} ${pad('cmds',6)} | ${pad('x5 ms',7)} ${pad('of frame',8)}`);
for(const row of rows){
 if(!row.fits){console.log(`${pad(row.bytes,5)} ${pad(row.errorCorrection,8)}   does not fit a version 40 symbol`);continue;}
 const total=(row.encode.medianMs+row.geometry.medianMs)*PHONE;
 console.log(`${pad(row.bytes,5)} ${pad(row.errorCorrection,8)} ${pad(row.version,3)} ${pad(row.modules,4)} | ${pad(row.encode.medianMs.toFixed(4),10)} ${pad(row.encode.p95Ms.toFixed(4),8)} ${pad(row.encode.opsPerSec,8)} | ${pad(row.geometry.medianMs.toFixed(4),9)} ${pad(row.geometry.p95Ms.toFixed(4),8)} ${pad(row.geometry.opsPerSec,8)} | ${pad(row.pathLength,7)} ${pad(row.pathCommands,6)} | ${pad(total.toFixed(3),7)} ${pad(`${(total/FRAME*100).toFixed(1)}%`,8)}`);
}
console.log(`wallet (42-byte address, arena, high): ${wallet.modules} modules, ${wallet.dots} dots, ${wallet.pathLength} chars, ${wallet.pathCommands} commands`);
console.log(`  first call ${wallet.firstCallMs} ms; median ${wallet.medianMs} ms, p95 ${wallet.p95Ms} ms, ${wallet.opsPerSec} ops/s`);
console.log(`  on a CPU ${PHONE}x slower: ${wallet.phone5xMs} ms median (${(wallet.phone5xShareOfFrame*100).toFixed(1)}% of a ${result.frameMs} ms frame), ${wallet.phone5xP95Ms} ms p95`);
console.log(JSON.stringify(result));
