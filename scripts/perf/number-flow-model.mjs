// NumberFlow's pure work, per update: the shared arithmetic in contracts and the model each renderer builds from a value
// (formatting included), timed in Node from the built output (run `node scripts/build.mjs` first). Prints one JSON object of
// operations per second and microseconds per operation.
//
//   node scripts/perf/number-flow-model.mjs            every case, 400 ms each
//   node scripts/perf/number-flow-model.mjs --ms=1000  longer samples
//
// This is V8 with full ICU. Hermes formats through the platform's number formatter, so the absolute cost of anything that
// touches Intl is different on a device; the ratios between cases (a formatter built per call against one kept) are what carry.
import {fileURLToPath} from 'node:url';
const dist=name=>import(fileURLToPath(new URL(`../../packages/hig/${name}`,import.meta.url)));
const flow=await dist('contracts/dist/number-flow.js'),contracts=await dist('contracts/dist/index.js'),web=await dist('react/dist/animated-number-model.js'),native=await dist('native/dist/animated-number-model.js');
const budget=Math.max(50,Number(process.argv.find(argument=>argument.startsWith('--ms='))?.slice(5))||400);
const usd={style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2},percent={style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'};
// Values a ticker would show: a new one each call, so nothing is answered from a cache keyed on the value alone.
const values=Array.from({length:512},(_,index)=>1000+Math.sin(index*1.7)*180+index*0.37),rates=values.map(value=>(value-1000)/9000);
let cursor=0;const next=list=>list[cursor++&511];
let sink=0;
function time(run){
 for(let warm=0;warm<200;warm++)sink+=run()?1:0;
 let operations=0;const started=performance.now();let elapsed=0;
 while(elapsed<budget){for(let batch=0;batch<50;batch++)sink+=run()?1:0;operations+=50;elapsed=performance.now()-started;}
 return {opsPerSec:Math.round(operations/elapsed*1000),usPerOp:Math.round(elapsed/operations*1e5)/100};
}
const kept=new Intl.NumberFormat('en-US',usd),webBefore=web.createAnimatedNumberModel(1234.56,'en-US',usd),webAfter=web.createAnimatedNumberModel(1240.61,'en-US',usd);
const nativeBefore=native.createNumberReelModel(1234.56,'en-US',usd,undefined,'ltr'),nativeAfter=native.createNumberReelModel(1240.61,'en-US',usd,undefined,'ltr');
const placesBefore=web.numberFlowPlaces(webBefore),placesAfter=web.numberFlowPlaces(webAfter),samples=flow.numberFlowEasingSamples('number-flow');
// A reel with three turns in flight, as one has when values arrive faster than it settles.
const roll=native.createNumberFlowRoll(3,900,samples);roll.onStart(roll,2,0,null);roll.turns.push({delta:2,start:100,duration:900},{delta:-1,start:200,duration:900});let clock=0;
const cases={
 // Formatting, the floor under every model.
 'Intl.NumberFormat: construct (currency)':()=>new Intl.NumberFormat('en-US',usd),
 'Intl.NumberFormat: construct + format (currency)':()=>new Intl.NumberFormat('en-US',usd).format(next(values)),
 'Intl.NumberFormat: format on a kept formatter':()=>kept.format(next(values)),
 'Intl.NumberFormat: formatToParts on a kept formatter':()=>kept.formatToParts(next(values)),
 'contracts formatNumber (currency)':()=>contracts.formatNumber(next(values),'en-US',usd),
 'contracts formatSignedNumber (percent, exceptZero)':()=>contracts.formatSignedNumber(next(rates),'en-US',percent),
 'contracts presentNumberFormat':()=>contracts.presentNumberFormat(usd,{currencyDisplay:'narrowSymbol'}),
 // Web, per changed value: the model, its keys and the turn of every place.
 'web createAnimatedNumberModel (currency)':()=>web.createAnimatedNumberModel(next(values),'en-US',usd),
 'web createAnimatedNumberModel (percent, exceptZero)':()=>web.createAnimatedNumberModel(next(rates),'en-US',percent),
 'web createFormattedAnimatedNumberModel':()=>web.createFormattedAnimatedNumberModel('$1,234.56','en-US',true),
 'web numberFlowTokenKeys':()=>web.numberFlowTokenKeys(webAfter.tokens),
 'web numberFlowPlaces':()=>web.numberFlowPlaces(webAfter),
 'web createAnimatedNumberTransitions':()=>web.createAnimatedNumberTransitions(webBefore,webAfter),
 'web signature JSON.stringify':()=>JSON.stringify(['en-US','ltr',usd,false,false]),
 // Native, per render of a readout: the reading, then the reels.
 'native formatNumberReadout (currency)':()=>native.formatNumberReadout(next(values),'en-US',usd),
 'native createNumberReelModel (currency)':()=>native.createNumberReelModel(next(values),'en-US',usd,undefined,'ltr'),
 'native createNumberReelModel (percent, exceptZero)':()=>native.createNumberReelModel(next(rates),'en-US',percent,undefined,'ltr'),
 'native createNumberReelModel (same value again)':()=>native.createNumberReelModel(1234.56,'en-US',usd,undefined,'ltr'),
 'native createFormattedReelModel':()=>native.createFormattedReelModel('$1,234.56','en-US','ltr'),
 'native numberReelPlaces':()=>native.numberReelPlaces(nativeAfter),
 // Shared arithmetic, per changed value on both renderers.
 'contracts resolveNumberFlowTimings':()=>flow.resolveNumberFlowTimings({duration:600}),
 'contracts numberFlowDeltas (6 places)':()=>flow.numberFlowDeltas(placesBefore,placesAfter,{trend:1}),
 'contracts numberFlowDeltas (continuous)':()=>flow.numberFlowDeltas(placesBefore,placesAfter,{trend:1,continuous:true}),
 'contracts numberFlowDigitLength':()=>flow.numberFlowDigitLength({1:{max:5}},1,4),
 'contracts numberFlowNeutral':()=>flow.numberFlowNeutral('$1,240.61'),
 'contracts numberFlowEasingSamples (bezier, cached)':()=>flow.numberFlowEasingSamples('ease-out'),
 'contracts numberFlowEasingCSS (number-flow)':()=>flow.numberFlowEasingCSS('number-flow'),
 // Native UI thread, per frame per reel in flight.
 'native roll onFrame (3 turns in flight)':()=>{roll.turns.length=0;roll.turns.push({delta:3,start:0,duration:900},{delta:2,start:100,duration:900},{delta:-1,start:200,duration:900});return roll.onFrame(roll,clock=(clock+16.7)%800)||true;},
 'native sampleReelEasing':()=>native.sampleReelEasing(samples,(cursor++&255)/255)+1,
 'native numberFlowReelOffset':()=>native.numberFlowReelOffset(next(values),10,24)||true,
};
const result={checkedAt:new Date().toISOString(),node:process.version,icu:process.versions.icu,msPerCase:budget,cases:{}};
for(const [name,run] of Object.entries(cases))result.cases[name]=time(run);
if(!Number.isFinite(sink))throw new Error('benchmark produced nothing');
console.log(JSON.stringify(result,null,1));
