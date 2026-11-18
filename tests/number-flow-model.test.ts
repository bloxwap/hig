import {describe,expect,it,vi} from 'vitest';
import {tokens} from '../packages/hig/tokens/src/index';
import {numberFlowBezier,numberFlowBezierAt,numberFlowCurve,numberFlowDefaults,numberFlowDelta,numberFlowDeltas,numberFlowDigitLength,numberFlowEasingCSS,numberFlowEasingSamples,numberFlowGlyph,numberFlowLoopStart,numberFlowMaxDuration,numberFlowNeutral,resolveNumberFlowTiming,resolveNumberFlowTimings,sampleNumberFlowEasing,type NumberFlowPlace} from '../packages/hig/contracts/src/number-flow';
import {createAnimatedNumberModel,createFormattedAnimatedNumberModel,numberFlowAnchorSide,numberFlowPlaces,numberFlowTokenKeys} from '../packages/hig/react/src/animated-number-model';

/** The digits of a whole number as places, most significant first, as both renderers hand them over. */
const places=(text:string):NumberFlowPlace[]=>{const [whole,fraction='']=text.split('.');return [...Array.from(whole,(digit,index)=>({key:`i${whole.length-1-index}`,digit:Number(digit),place:whole.length-1-index})),...Array.from(fraction,(digit,index)=>({key:`f${index}`,digit:Number(digit),place:-1-index}))];};

describe('how far a place turns',()=>{
 it.each([3,8,9,24])('matches re-ordered keys, missing keys and repeated previous keys for %i places',count=>{
  const previous=places('1'.repeat(count));
  previous[count-1]={...previous[0],digit:7};
  const next=[{...previous[1],digit:3},{...previous[0],digit:9},{key:'new',place:null,digit:4}];
  expect([...numberFlowDeltas(previous,next,{trend:1}).values()]).toEqual([2,2,4]);
 });
 it.each([6,12])('matches keyed turns when unique places grow, shrink or move at %i digits',count=>{
  const previous=places('1'.repeat(count)+'.39');
  const grown=places('2'.repeat(count+1)+'.48');
  const shrunk=places('3'.repeat(count-1)+'.5');
  const reordered=[...grown].reverse();
  for(const next of [grown,shrunk,reordered]){
   const options={trend:1,continuous:true};
   expect(numberFlowDeltas(previous,next,{...options,uniqueKeys:true})).toEqual(numberFlowDeltas(previous,next,options));
  }
 });
 it('takes the short way its own digits point when the change has no direction',()=>{
  expect(numberFlowDelta(2,7,0)).toBe(5);expect(numberFlowDelta(7,2,0)).toBe(-5);expect(numberFlowDelta(4,4,0)).toBe(0);
 });
 it('keeps turning with the trend and wraps past the last glyph',()=>{
  // 9 to 0 going up is one step on, not nine back; 0 to 9 going down is one step back.
  expect(numberFlowDelta(9,0,1)).toBe(1);expect(numberFlowDelta(0,9,-1)).toBe(-1);
  expect(numberFlowDelta(7,2,1)).toBe(5);expect(numberFlowDelta(2,7,-1)).toBe(-5);
  // A digit that already moves the trend's way is not wrapped.
  expect(numberFlowDelta(2,7,1)).toBe(5);expect(numberFlowDelta(7,2,-1)).toBe(-5);
 });
 it('wraps at a place’s own limit',()=>{
  // The tens of a seconds counter: 0 down to 5 is one step, and 5 up to 0 is one step.
  expect(numberFlowDelta(0,5,-1,6)).toBe(-1);expect(numberFlowDelta(5,0,1,6)).toBe(1);
  expect(numberFlowDigitLength({1:{max:5}},1)).toBe(6);expect(numberFlowDigitLength({1:{max:5}},0)).toBe(10);expect(numberFlowDigitLength(undefined,1)).toBe(10);
  // A limit applies to integer places only, never hides a digit it cannot show, and ignores nonsense.
  expect(numberFlowDigitLength({1:{max:5}},null)).toBe(10);expect(numberFlowDigitLength({1:{max:5}},1,7)).toBe(10);
  for(const max of [0,10,2.5,Number.NaN,-1])expect(numberFlowDigitLength({0:{max}},0)).toBe(10);
 });
 it('turns an unchanged place once round only when asked to loop with a trend',()=>{
  expect(numberFlowDelta(3,3,1,10,true)).toBe(10);expect(numberFlowDelta(3,3,-1,6,true)).toBe(-6);expect(numberFlowDelta(3,3,0,10,true)).toBe(0);expect(numberFlowDelta(3,3,1)).toBe(0);
 });
 it('names the glyph of any position, however many times the reel has turned',()=>{
  expect([0,9,10,19,-1,-10,-11].map(position=>numberFlowGlyph(position))).toEqual([0,9,0,9,9,0,9]);
  expect([5,6,-1].map(position=>numberFlowGlyph(position,6))).toEqual([5,0,5]);
 });
});

describe('the turns of a whole reading',()=>{
 it('gives every place of the new reading its turn and starts a new place from zero',()=>{
  const deltas=numberFlowDeltas(places('999'),places('1000'),{trend:1});
  // The ones, tens and hundreds carry up one step; the new thousands rolls up from zero.
  expect(Object.fromEntries(deltas)).toEqual({i3:1,i2:1,i1:1,i0:1});
  expect(Object.fromEntries(numberFlowDeltas(places('1000'),places('999'),{trend:-1}))).toEqual({i2:-1,i1:-1,i0:-1});
  expect(Object.fromEntries(numberFlowDeltas(places('12.50'),places('12.75'),{trend:0}))).toEqual({i1:0,i0:0,f0:2,f1:5});
 });
 it('applies a place limit to that place alone',()=>{
  // 10:00 to 09:59 as two counters: the seconds are `00` to `59`.
  expect(Object.fromEntries(numberFlowDeltas(places('00'),places('59'),{trend:-1,digits:{1:{max:5}}}))).toEqual({i1:-1,i0:-1});
  expect(Object.fromEntries(numberFlowDeltas(places('00'),places('59'),{trend:-1}))).toEqual({i1:-5,i0:-1});
 });
 it('aligns surviving places after a leading digit arrives, including a change at the other end',()=>{
  const previous=places('2'.repeat(160)),next=places('1'+'2'.repeat(159)+'3');
  const previousSearch=vi.spyOn(previous,'findIndex'),nextSearch=vi.spyOn(next,'findIndex');
  expect(numberFlowLoopStart(previous,next)).toBe(160);
  expect(numberFlowLoopStart(next,previous)).toBe(160);
  expect(previousSearch.mock.calls.length+nextSearch.mock.calls.length).toBeLessThanOrEqual(6);
 });
 it('finds a changed place across reordered and repeated places',()=>{
  const one={key:'ones',place:0,digit:1},fraction={key:'fraction',place:-1,digit:2};
  const previous=[one,fraction,{...one,digit:3}],next=[{...one,digit:3},one,fraction];
  expect(numberFlowLoopStart(previous,next)).toBeUndefined();
  expect(numberFlowLoopStart(previous,[...next,{...fraction,place:4}])).toBe(4);
 });
 it('loops the places below the highest one that changed when the figure is continuous',()=>{
  expect(numberFlowLoopStart(places('120'),places('130'))).toBe(1);expect(numberFlowLoopStart(places('120'),places('120'))).toBeUndefined();
  // 120 to 130 counting up: the tens moves one, and the ones, unchanged, goes once round.
  expect(Object.fromEntries(numberFlowDeltas(places('120'),places('130'),{trend:1,continuous:true}))).toEqual({i2:0,i1:1,i0:10});
  expect(Object.fromEntries(numberFlowDeltas(places('120'),places('130'),{trend:-1,continuous:true}))).toEqual({i2:0,i1:-9,i0:-10});
  // Without a trend there is no way to count, so nothing loops; an exponent's digits have no place and never loop.
  expect(Object.fromEntries(numberFlowDeltas(places('120'),places('130'),{trend:0,continuous:true}))).toEqual({i2:0,i1:1,i0:0});
  expect(numberFlowDeltas([{key:'e',digit:3,place:null},...places('1')],[{key:'e',digit:3,place:null},...places('2')],{trend:1,continuous:true}).get('e')).toBe(0);
 });
});

describe('timings',()=>{
 it('defaults to NumberFlow’s: 500 ms on its curve to move, 250 ms ease-out to fade, and the roll follows the slide',()=>{
  expect(resolveNumberFlowTimings({})).toEqual({transform:numberFlowDefaults.transform,spin:numberFlowDefaults.transform,opacity:numberFlowDefaults.opacity});
  expect(numberFlowDefaults).toEqual({transform:{duration:500,easing:'number-flow'},opacity:{duration:250,easing:'ease-out'}});
 });
 it('lets `duration` set the movement and half of it the fade, and each timing override its part',()=>{
  expect(resolveNumberFlowTimings({duration:320})).toMatchObject({transform:{duration:320,easing:'number-flow'},spin:{duration:320},opacity:{duration:160,easing:'ease-out'}});
  const timings=resolveNumberFlowTimings({duration:320,spinTiming:{duration:500,easing:'ease-out'},transformTiming:{easing:'standard'},opacityTiming:{duration:180}});
  expect(timings).toEqual({transform:{duration:320,easing:'standard'},spin:{duration:500,easing:'ease-out'},opacity:{duration:180,easing:'ease-out'}});
  // The roll follows `transformTiming` until `spinTiming` is given.
  expect(resolveNumberFlowTimings({transformTiming:{duration:700,easing:[0.2,0,0,1]}}).spin).toEqual({duration:500,easing:[0.2,0,0,1]});
 });
 it('keeps durations between zero and the cap and ignores what it cannot use',()=>{
  expect(resolveNumberFlowTimings({duration:3000})).toMatchObject({transform:{duration:500},spin:{duration:500},opacity:{duration:250}});
  const fallback={duration:500,easing:'number-flow'} as const;
  expect(resolveNumberFlowTiming({duration:-5},fallback).duration).toBe(0);expect(resolveNumberFlowTiming({duration:1e9},fallback).duration).toBe(numberFlowMaxDuration);
  expect(resolveNumberFlowTiming({duration:Number.NaN,easing:'bounce' as never},fallback)).toEqual(fallback);
  expect(resolveNumberFlowTiming({easing:[2,0,0,1]},fallback).easing).toBe('number-flow');expect(resolveNumberFlowTiming({easing:[0.3,-0.4,0.6,1.4]},fallback).easing).toEqual([0.3,-0.4,0.6,1.4]);
  expect(resolveNumberFlowTimings({duration:Number.POSITIVE_INFINITY})).toEqual(resolveNumberFlowTimings({}));
 });
});

describe('curves',()=>{
 it('names HIG’s standard curve and the CSS keywords',()=>{
  expect(numberFlowBezier('standard')).toEqual(tokens.easing.standard);expect(numberFlowBezier('ease-out')).toEqual([0,0,0.58,1]);expect(numberFlowBezier('number-flow')).toBeNull();
  expect(numberFlowEasingCSS('standard')).toBe('cubic-bezier(0.22,1,0.36,1)');expect(numberFlowEasingCSS([0.2,0,0,1])).toBe('cubic-bezier(0.2,0,0,1)');
  expect(numberFlowEasingCSS('number-flow')).toBe(`linear(${numberFlowCurve.join(',')})`);expect(numberFlowEasingCSS('number-flow',false)).toBe('cubic-bezier(0.22,1,0.36,1)');
 });
 it('samples a curve from 0 to 1 without going backwards, and reads between samples',()=>{
  for(const easing of ['number-flow','standard','ease-out','ease-in-out','linear'] as const){
   const samples=numberFlowEasingSamples(easing);expect(samples[0]).toBe(0);expect(samples.at(-1)).toBe(1);
   for(let index=1;index<samples.length;index++)expect(samples[index]).toBeGreaterThanOrEqual(samples[index-1]-1e-9);
   expect(numberFlowEasingSamples(easing)).toBe(samples);
  }
  expect(numberFlowEasingSamples('number-flow')).toBe(numberFlowCurve);
  const linear=numberFlowEasingSamples('linear');for(const progress of [0.1,0.37,0.5,0.93])expect(sampleNumberFlowEasing(linear,progress)).toBeCloseTo(progress,4);
  expect(sampleNumberFlowEasing(linear,-1)).toBe(0);expect(sampleNumberFlowEasing(linear,2)).toBe(1);
  // NumberFlow's settle has covered most of the distance by half time.
  expect(sampleNumberFlowEasing(numberFlowCurve,0.5)).toBeGreaterThan(0.9);
 });
 it('solves a bezier for time, including where its slope is flat',()=>{
  expect(numberFlowBezierAt([0,0,1,1],0.3)).toBeCloseTo(0.3,5);expect(numberFlowBezierAt([0.42,0,0.58,1],0.5)).toBeCloseTo(0.5,5);
  expect(numberFlowBezierAt([0,0,0.58,1],0.25)).toBeGreaterThan(0.25);expect(numberFlowBezierAt([0.42,0,1,1],0.25)).toBeLessThan(0.25);
  expect(numberFlowBezierAt([0,1,1,0],0.5)).toBeCloseTo(0.5,3);expect(numberFlowBezierAt([0.22,1,0.36,1],0)).toBe(0);expect(numberFlowBezierAt([0.22,1,0.36,1],1)).toBe(1);
 });
});

describe('what can be drawn place by place',()=>{
 it('accepts digits of any script and rejects right-to-left letters and bidi controls',()=>{
  expect(numberFlowNeutral('$1,234.56')).toBe(true);expect(numberFlowNeutral('١٬٢٣٤٫٥٦')).toBe(true);expect(numberFlowNeutral('১২৩')).toBe(true);
  expect(numberFlowNeutral('‏١٢٣ US$')).toBe(false);expect(numberFlowNeutral('١٢٣ ج.م.')).toBe(false);expect(numberFlowNeutral('‮123')).toBe(false);
 });
});

describe('the web model as NumberFlow sees it',()=>{
 const usd={style:'currency',currency:'USD'} as const;
 it('carries the ten glyphs of the reading’s numbering system',()=>{
  expect(createAnimatedNumberModel(12,'en-US').digits).toEqual(['0','1','2','3','4','5','6','7','8','9']);
  expect(createAnimatedNumberModel(12,'ar-EG').digits?.[1]).toBe('١');expect(createAnimatedNumberModel(null,'en-US').digits).toBeUndefined();
  expect(createFormattedAnimatedNumberModel('1.5 BTC','en-US',true).digits?.[5]).toBe('5');expect(createFormattedAnimatedNumberModel('١٫٥','ar-EG',true).digits?.[5]).toBe('٥');
 });
 it('gives every digit its place and an exponent’s digits none',()=>{
  expect(numberFlowPlaces(createAnimatedNumberModel(1234.5,'en-US')).map(place=>[place.place,place.digit])).toEqual([[3,1],[2,2],[1,3],[0,4],[-1,5]]);
  expect(numberFlowPlaces(createAnimatedNumberModel(1.25e10,'en-US',{notation:'scientific'})).filter(place=>place.place===null).map(place=>place.digit)).toEqual([1,0]);
 });
 it('keys a part by what it is, so it stays itself when a place is added in front of it',()=>{
  const keys=(value:number,options?:Intl.NumberFormatOptions)=>numberFlowTokenKeys(createAnimatedNumberModel(value,'en-US',options).tokens);
  expect(keys(999.5,usd)).toEqual(['pre:0','digit:number:2','digit:number:1','digit:number:0','sep:number:-1','digit:number:-1','digit:number:-2']);
  expect(keys(1999.5,usd)).toEqual(['pre:0','digit:number:3','sep:number:2','digit:number:2','digit:number:1','digit:number:0','sep:number:-1','digit:number:-1','digit:number:-2']);
  // A sign in front of the currency is further from the number than the currency is, so the currency keeps its key.
  expect(keys(-5,usd).slice(0,2)).toEqual(['pre:1','pre:0']);expect(keys(0.5,{style:'percent'}).at(-1)).toBe('post:0');
  expect(numberFlowTokenKeys(createAnimatedNumberModel(null,'en-US').tokens)).toEqual(['pre:0']);
  expect(new Set(keys(1234567.891,{maximumFractionDigits:3})).size).toBe('1,234,567.891'.length);
 });
 it('anchors integer places and what leads the number to the parts after them, and the rest to the parts before',()=>{
  for(const key of ['pre:0','affix:prefix','digit:number:0','digit:number:3','sep:number:2'])expect(numberFlowAnchorSide(key)).toBe(1);
  for(const key of ['sep:number:-1','digit:number:-1','post:0','affix:suffix','affix:stale','digit:exponent:0','sep:exponent:0'])expect(numberFlowAnchorSide(key)).toBe(-1);
 });
});

it('builds ASCII host-formatted reels without probing locale glyphs',()=>{
 const Original=Intl.NumberFormat;
 const formats=vi.spyOn(Intl,'NumberFormat').mockImplementation(function(locale,options){return new Original(locale,options);});
 try{
  const model=createFormattedAnimatedNumberModel('USD 12.05','ar-EG',true);
  expect(model.tokens.filter(token=>token.digit).map(token=>token.value)).toEqual([1,2,0,5]);
  expect(formats).not.toHaveBeenCalled();
  const mixed=createFormattedAnimatedNumberModel('📈 ١2٣4','ar-EG',true);
  expect(mixed.tokens.map(token=>[token.key,token.text])).toEqual([['literal:0','📈 '],['digit:number:3','١'],['digit:number:2','2'],['digit:number:1','٣'],['digit:number:0','4']]);
  expect(createFormattedAnimatedNumberModel('١ and 2','ar-EG',true).tokens.filter(token=>token.digit).map(token=>token.value)).toEqual([1,2]);
 }finally{formats.mockRestore();}
});

it('reuses the digit table across formats while keeping different numbering systems independent',()=>{
 const decimal=createAnimatedNumberModel(12,'en-US',{maximumFractionDigits:0});
 const currency=createAnimatedNumberModel(12,'en-US',{style:'currency',currency:'USD'});
 expect(currency.digits).toBe(decimal.digits);
 const arabic=createAnimatedNumberModel(12,'en-US',{numberingSystem:'arab'});
 expect(arabic.digits?.[1]).toBe('١');
 expect(arabic.digits).not.toBe(decimal.digits);
});
