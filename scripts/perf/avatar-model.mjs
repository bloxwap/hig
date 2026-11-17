// Micro-benchmark of the shared Avatar model (packages/hig/contracts/src/avatar.ts): how many face descriptions a second,
// what a description allocates, and what the seed hash and the ink's colour reading cost inside it.
// It also times a cache the renderers do not have (a bounded Map keyed by seed and palette, and the ink remembered per colour),
// so the case for adding one can be read from the same run. Run after `node scripts/build.mjs`:
// node --expose-gc scripts/perf/avatar-model.mjs. Prints one JSON object.
// Every figure is the median of `rounds` passes over 10,000 distinct seeds, after a warm-up, on this machine: compare runs, not machines.
// HIG_PERF_STAT=min takes the fastest pass instead, which is the nearest to a quiet machine when this one is busy.
import {performance} from 'node:perf_hooks';
import {avatarColorRoles,beamAvatar,beamHash,beamInk} from '../../packages/hig/contracts/dist/avatar.js';
import {nativeSrgb} from '../../packages/hig/tokens/dist/index.js';

const count=10000,rounds=31,warmups=20;
/** A repeatable stream of 32-bit numbers (mulberry32), so every run benchmarks the same seeds. */
function random(state){return()=>{state=state+0x6d2b79f5|0;let t=Math.imul(state^state>>>15,1|state);t=t+Math.imul(t^t>>>7,61|t)^t;return (t^t>>>14)>>>0;};}
const next=random(20261117),hex='0123456789abcdef',given=['Ada','Joe','Mei','Ravi','Zoë','Omar','Ines','Kofi','Yuki','Lena'],family=['Lovelace','Blau','Tanaka','Okafor','Silva','Haddad','Novak','Mensah','Sato','Fischer'];
/** 10,000 distinct short names (a display name and a number) and 10,000 distinct 42-character addresses. */
const names=Array.from({length:count},(_,index)=>`${given[next()%given.length]} ${family[next()%family.length]} ${index}`);
const addresses=Array.from({length:count},()=>{let text='0x';for(let digit=0;digit<40;digit++)text+=hex[next()&15];return text;});
if(new Set(names).size!==count||new Set(addresses).size!==count||addresses.some(address=>address.length!==42))throw new Error('The seeds are not distinct.');
const palettes={
 // What both renderers pass by default: the provider's resolved roles, six-digit hex.
 tokens:avatarColorRoles.map(role=>nativeSrgb[role]),
 hex5:['#00FF00','#00BBFF','#FF14A0','#FFFA00','#C300FF'],
 displayP3:['color(display-p3 0 1 0.24)','color(display-p3 0.18 0.72 1)','color(display-p3 1 0.24 0.62)','color(display-p3 1 0.98 0.18)','color(display-p3 0.7 0 1)'],
 // A colour the model cannot read: no parse succeeds, the ink is the default.
 variables:avatarColorRoles.map(role=>`var(--hig-${role})`),
};
const inks={hex6:'#ff479c',hex3:'#f4a',rgb:'rgb(255, 71, 156)',displayP3:'color(display-p3 1 0.24 0.62)',variable:'var(--hig-negative)'};
const median=values=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[sorted.length>>1];};
const stat=process.env.HIG_PERF_STAT==='min'?'min':'median',pick=stat==='min'?values=>Math.min(...values):median;
let sink=0;
/** Milliseconds of one pass of `run` over `seeds`: the median pass, or the fastest. */
function time(seeds,run){
 for(let pass=0;pass<warmups;pass++)for(let index=0;index<seeds.length;index++)sink+=run(seeds[index]);
 const passes=[];
 for(let pass=0;pass<rounds;pass++){const start=performance.now();for(let index=0;index<seeds.length;index++)sink+=run(seeds[index]);passes.push(performance.now()-start);}
 return pick(passes);
}
/** Bytes of garbage one call leaves: the heap growth over a batch small enough that no collection runs inside it, after a full collection. Undefined without --expose-gc. */
function bytesPerCall(seeds,run){
 if(typeof globalThis.gc!=='function')return undefined;
 const batch=2000,samples=[];
 for(let at=0;at+batch<=seeds.length;at+=batch){
  globalThis.gc();const before=process.memoryUsage().heapUsed;
  for(let index=at;index<at+batch;index++)sink+=run(seeds[index]);
  samples.push((process.memoryUsage().heapUsed-before)/batch);
 }
 // A collection inside a batch shows as a growth of zero or less; those samples are dropped.
 const kept=samples.filter(value=>value>0);return kept.length?Math.round(median(kept)):0;
}
const figures=(seeds,run)=>{const ms=time(seeds,run),bytes=bytesPerCall(seeds,run);return {perSecond:Math.round(seeds.length/ms*1000),nsPerCall:Math.round(ms/seeds.length*1e6),bytesPerCall:bytes};};
const result={
 node:process.version,arch:`${process.platform}-${process.arch}`,seeds:count,rounds,stat,
 hash:{names:figures(names,seed=>beamHash(seed)),addresses:figures(addresses,seed=>beamHash(seed))},
 // The colour conversion a description does once, on its wrapper colour, to choose the ink.
 ink:Object.fromEntries(Object.entries(inks).map(([form,color])=>[form,figures(names,()=>beamInk(color)==='dark'?1:0)])),
 describe:Object.fromEntries(Object.entries(palettes).map(([name,palette])=>[name,{names:figures(names,seed=>beamAvatar(seed,palette).leftEyeX),addresses:figures(addresses,seed=>beamAvatar(seed,palette).leftEyeX)}])),
};
// Where a description's time goes with the default palette and an address: the hash, the ink, and the rest (the arithmetic and four template strings).
const whole=result.describe.tokens.addresses.nsPerCall,hash=result.hash.addresses.nsPerCall,ink=result.ink.hex6.nsPerCall;
result.share={describeNs:whole,hashNs:hash,inkNs:ink,restNs:whole-hash-ink};
// One frame at 60 Hz is 16.7 ms: how much of it 500 new descriptions take (a list mounting, every seed new).
result.list500Ms=Number((whole*500/1e6).toFixed(4));
// A cache that is not in the package, to price it. Keyed by the seed and the joined palette, as a renderer that holds the palette would key it;
// bounded, with the oldest entry dropped. `hit` holds all 10,000 seeds; `miss` holds 256, so every call misses and evicts, which is a leaderboard of distinct addresses mounting.
const cached=limit=>{const store=new Map();return (seed,colors,key)=>{const name=seed+key;let face=store.get(name);if(face===undefined){face=beamAvatar(seed,colors);if(store.size>=limit)store.delete(store.keys().next().value);store.set(name,face);}return face;};};
const hit=cached(count*2),miss=cached(256),tokens=palettes.tokens,key=`\n${tokens.join('\n')}`,inkOf=new Map(),rememberedInk=color=>{let found=inkOf.get(color);if(found===undefined){found=beamInk(color);inkOf.set(color,found);}return found;};
for(const seed of addresses)hit(seed,tokens,key);
const hitNs=figures(addresses,seed=>hit(seed,tokens,key).leftEyeX).nsPerCall,missNs=figures(addresses,seed=>miss(seed,tokens,key).leftEyeX).nsPerCall,inkNs=figures(names,()=>rememberedInk(inks.hex6)==='dark'?1:0).nsPerCall;
result.cacheNotInThePackage={hitNs,missAndEvictNs:missNs,savedPer500HitsMs:Number(((whole-hitNs)*500/1e6).toFixed(4)),lostPer500MissesMs:Number(((missNs-whole)*500/1e6).toFixed(4)),rememberedInkNs:inkNs,savedPer500RememberedInksMs:Number(((ink-inkNs)*500/1e6).toFixed(4))};
result.gcExposed=typeof globalThis.gc==='function';
void sink;
console.log(JSON.stringify(result,null,1));
