// Micro-benchmark of the shared confetti physics (packages/hig/contracts/src/confetti.ts), bundled from source.
// Run: node scripts/perf/confetti-model.mjs. It starts itself again with --expose-gc and a large young generation, so a
// heap reading between two forced collections is what the loop allocated. Prints one JSON object.
// It measures, for bursts of 100, 300 and 1000 pieces over the full default life (ticks 1 to 200):
//  create  createConfettiBurst, the launch
//  flight  confettiTravel once a frame and confettiFlight for every piece: what the web canvas runs each frame
//  pose    confettiPose for every piece: what each native piece's worklet runs each frame
//  style   confettiPose, confettiOpacity and the style object a native piece returns each frame. This repeats the body of
//          `Piece`'s useAnimatedStyle in packages/hig/native/src/confetti.tsx; keep the two in step.
// as pieces stepped per second and bytes allocated per piece step. With the Hermes binary React Native ships
// (node_modules/react-native/sdks/hermesc) it runs the same bundle there too: Hermes is the engine that runs native worklets,
// here as an interpreter on this machine's CPU. That shows what the engine allocates and how the costs compare. It is not a
// phone, and none of it is a frame rate.
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {runInThisContext} from 'node:vm';
import {build} from 'esbuild';

if(typeof globalThis.gc!=='function'){
 const again=spawnSync(process.execPath,['--expose-gc','--min-semi-space-size=64','--max-semi-space-size=64',...process.argv.slice(1)],{stdio:'inherit'});
 process.exit(again.status??1);
}
const source=`import {CONFETTI_FIRST_TICK,confettiBox,confettiFlight,confettiOpacity,confettiPose,confettiTravel,createConfettiBurst} from './packages/hig/contracts/src/confetti';
var palette=['a','b','c','d','e'];
/** A repeatable random source (mulberry32): every run steps the same pieces. */
function seeded(seed){return function(){seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
/** env: now() in milliseconds, allocated() in bytes since some fixed moment, collect() forces a collection, budget is the milliseconds each timing runs for and steps the piece steps each allocation reading covers. */
globalThis.confettiModelBench=function(env){
 // The results are summed into a typed array, so the benchmark itself allocates nothing: a sum kept in a variable is a new heap number each time in V8.
 var out={x:0,y:0,ux:0,uy:0,vx:0,vy:0,wobble:0},sink=new Float64Array(1);
 function flight(burst){var physics=burst.physics,particles=burst.particles,count=particles.length;for(var t=CONFETTI_FIRST_TICK;t<physics.ticks;t++){var travel=confettiTravel(physics,t);for(var index=0;index<count;index++){confettiFlight(particles[index],physics,t,travel,out);sink[0]+=out.x+out.ux;}}}
 function pose(burst){var physics=burst.physics,particles=burst.particles,count=particles.length;for(var t=CONFETTI_FIRST_TICK;t<physics.ticks;t++)for(var index=0;index<count;index++){var at=confettiPose(particles[index],physics,t);sink[0]+=at.x+at.scaleX;}}
 function style(burst){
  var physics=burst.physics,particles=burst.particles,count=particles.length,left=195,top=590;
  for(var t=CONFETTI_FIRST_TICK;t<physics.ticks;t++)for(var index=0;index<count;index++){
   var particle=particles[index],half=confettiBox(particle.shape,physics)/2,at=confettiPose(particle,physics,t);
   var made={opacity:confettiOpacity(physics,t),transform:[{translateX:left+at.x-half},{translateY:top+at.y-half},{rotate:at.rotate+'rad'},{scaleX:at.scaleX},{scaleY:at.scaleY}]};
   sink[0]+=made.opacity+made.transform.length;
  }
 }
 function measure(run,burst){
  var steps=burst.particles.length*(burst.physics.ticks-CONFETTI_FIRST_TICK),rounds=0,started=env.now(),elapsed=0;
  run(burst);run(burst);started=env.now();
  while(elapsed<env.budget){run(burst);rounds++;elapsed=env.now()-started;}
  // Allocation: one stretch short enough that no collection runs inside it, read between two forced collections.
  var few={physics:burst.physics,particles:burst.particles.slice(0,Math.max(1,Math.floor(env.steps/(burst.physics.ticks-CONFETTI_FIRST_TICK))))},fewSteps=few.particles.length*(burst.physics.ticks-CONFETTI_FIRST_TICK),bytes=0;
  for(var turn=0;turn<5;turn++){env.collect();var before=env.allocated();run(few);bytes=Math.max(bytes,env.allocated()-before);}
  return {piecesPerSecond:Math.round(steps*rounds/elapsed*1000),nanosecondsPerPiece:Math.round(elapsed/(steps*rounds)*1e7)/10,bytesPerPiece:Math.round(bytes/fewSteps*10)/10};
 }
 var result={};
 [100,300,1000].forEach(function(count){
  var burst=createConfettiBurst({particleCount:count},palette,seeded(1)),stars=createConfettiBurst({particleCount:count,shapes:['star']},palette,seeded(1));
  var rounds=0,started=env.now(),elapsed=0;while(elapsed<env.budget){sink[0]+=createConfettiBurst({particleCount:count},palette,seeded(rounds+2)).particles.length;rounds++;elapsed=env.now()-started;}
  env.collect();var before=env.allocated(),made=createConfettiBurst({particleCount:count},palette,seeded(1));var bytes=env.allocated()-before;sink[0]+=made.particles.length;
  result['pieces'+count]={create:{piecesPerSecond:Math.round(count*rounds/elapsed*1000),nanosecondsPerPiece:Math.round(elapsed/(count*rounds)*1e7)/10,bytesPerPiece:Math.round(bytes/count*10)/10},flight:measure(flight,burst),pose:measure(pose,burst),style:measure(style,burst),starPose:measure(pose,stars)};
 });
 return result;
};`;
const bundle=(await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'iife',target:'es2019'})).outputFiles[0].text;
runInThisContext(bundle);
const report={node:{version:process.version,...globalThis.confettiModelBench({now:()=>performance.now(),allocated:()=>process.memoryUsage().heapUsed,collect:()=>globalThis.gc(),budget:300,steps:100000})}};
const hermes='node_modules/react-native/sdks/hermesc/osx-bin/hermes';
if(process.platform==='darwin'&&existsSync(hermes)){
 mkdirSync('.validation-tmp/perf',{recursive:true});const file='.validation-tmp/perf/confetti-model-hermes.js';
 writeFileSync(file,`${bundle}\nprint(JSON.stringify(globalThis.confettiModelBench({now:function(){return Date.now();},allocated:function(){return HermesInternal.getInstrumentedStats().js_totalAllocatedBytes;},collect:function(){gc();},budget:400,steps:20000})));`);
 const run=spawnSync(hermes,['-O',file],{encoding:'utf8',maxBuffer:1<<24});
 report.hermes=run.status===0?{version:'the interpreter React Native ships, on this machine',...JSON.parse(run.stdout)}:{error:(run.stderr||run.stdout||'failed').slice(0,400)};
}else report.hermes={skipped:'no Hermes binary for this platform'};
console.log(JSON.stringify(report,null,1));
