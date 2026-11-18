/**
 * NumberFlow's arithmetic, shared by the web and native renderers so both roll the same digits the same way: how far a place
 * turns, which way, through how many glyphs, for how long and along which curve. Nothing here touches a DOM or a view.
 */

/** A named curve, or cubic-bezier control points `[x1, y1, x2, y2]`. `'number-flow'` is NumberFlow's own settle; `'standard'` is HIG's. */
export type NumberFlowEasing='number-flow'|'standard'|'linear'|'ease'|'ease-in'|'ease-out'|'ease-in-out'|readonly [number,number,number,number];
/** One part of the motion: how long it takes, in milliseconds, and its curve. Either may be left to the default. */
export interface NumberFlowTiming {duration?:number;easing?:NumberFlowEasing}
export interface NumberFlowResolvedTiming {duration:number;easing:NumberFlowEasing}
export interface NumberFlowTimings {
 /** Digits rolling to their new value. */
 spin:NumberFlowResolvedTiming;
 /** Places sliding sideways when the figure gains or loses a place. */
 transform:NumberFlowResolvedTiming;
 /** Places fading in and out. */
 opacity:NumberFlowResolvedTiming}
/** Per-place limits, keyed by integer place (0 is the ones). `{1:{max:5}}` makes the tens of a seconds counter wrap 5 to 0. */
export type NumberFlowDigits=Readonly<Record<number,{readonly max?:number}>>;
/** One digit of a figure: its stable key, its value, and its place (0 ones, 1 tens, -1 tenths; `null` outside the number, as in an exponent). */
export interface NumberFlowPlace {key:string;digit:number;place:number|null}

/** NumberFlow's default settle, sampled at equal steps of time (number-flow, MIT). */
export const numberFlowCurve:readonly number[]=[0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1];
/** No part of the motion runs longer than this, whatever the host asks for. */
export const numberFlowMaxDuration=500;
/** NumberFlow's defaults: 500 ms on its settle for movement, 250 ms ease-out for fades. */
export const numberFlowDefaults:{readonly transform:NumberFlowResolvedTiming;readonly opacity:NumberFlowResolvedTiming}={transform:{duration:500,easing:'number-flow'},opacity:{duration:250,easing:'ease-out'}};

const beziers:Readonly<Record<string,readonly [number,number,number,number]>>={standard:[0.22,1,0.36,1],linear:[0,0,1,1],ease:[0.25,0.1,0.25,1],'ease-in':[0.42,0,1,1],'ease-out':[0,0,0.58,1],'ease-in-out':[0.42,0,0.58,1]};
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
const validEasing=(easing:unknown):easing is NumberFlowEasing=>easing==='number-flow'||(typeof easing==='string'&&easing in beziers)||(Array.isArray(easing)&&easing.length===4&&easing.every(finite)&&easing[0]>=0&&easing[0]<=1&&easing[2]>=0&&easing[2]<=1);

/** The control points of a curve, or `null` for `'number-flow'`, which is sampled rather than a bezier. */
export function numberFlowBezier(easing:NumberFlowEasing):readonly [number,number,number,number]|null{
 if(easing==='number-flow')return null;
 return typeof easing==='string'?beziers[easing]??beziers.standard:easing;
}
let sampledEasingCSS:string|undefined;
/** The curve as a CSS easing function, for the Web Animations API. `linear()` needs a browser from 2023; pass `sampled=false` for the nearest bezier instead. */
export function numberFlowEasingCSS(easing:NumberFlowEasing,sampled=true):string{
 const bezier=numberFlowBezier(easing);
 if(!bezier)return sampled?(sampledEasingCSS??=`linear(${numberFlowCurve.join(',')})`):`cubic-bezier(${beziers.standard.join(',')})`;
 return `cubic-bezier(${bezier.join(',')})`;
}
/** A cubic bezier's progress at time `x` (both 0 to 1): Newton's method, then bisection where the slope is too flat. */
export function numberFlowBezierAt(points:readonly [number,number,number,number],x:number):number{
 const [x1,y1,x2,y2]=points;if(x<=0)return 0;if(x>=1)return 1;
 const cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx,cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by;
 const at=(t:number)=>((ax*t+bx)*t+cx)*t;let t=x;
 for(let index=0;index<8;index++){const error=at(t)-x;if(Math.abs(error)<1e-6)return ((ay*t+by)*t+cy)*t;const slope=(3*ax*t+2*bx)*t+cx;if(Math.abs(slope)<1e-6)break;t-=error/slope;}
 let low=0,high=1;t=x;
 for(let index=0;index<32;index++){const error=at(t)-x;if(Math.abs(error)<1e-6)break;if(error>0)high=t;else low=t;t=(low+high)/2;}
 return ((ay*t+by)*t+cy)*t;
}
const sampleCache=new Map<string,readonly number[]>();
/**
 * The curve as progress values at equal steps of time, first 0 and last 1. A renderer that cannot hand the curve to its
 * animation engine (a UI-thread worklet) reads its progress from this table with `sampleNumberFlowEasing`.
 */
export function numberFlowEasingSamples(easing:NumberFlowEasing):readonly number[]{
 const bezier=numberFlowBezier(easing);if(!bezier)return numberFlowCurve;
 const key=bezier.join(','),cached=sampleCache.get(key);if(cached)return cached;
 const steps=60,samples=Array.from({length:steps+1},(_,index)=>index===0?0:index===steps?1:numberFlowBezierAt(bezier,index/steps));
 sampleCache.set(key,samples);return samples;
}
/** Progress along a sampled curve at time `progress` (0 to 1), interpolated between the two nearest samples. */
export function sampleNumberFlowEasing(samples:readonly number[],progress:number):number{
 const scaled=Math.max(0,Math.min(1,progress))*(samples.length-1),index=Math.floor(scaled),start=samples[index],end=samples[index+1]??start;
 return start+(end-start)*(scaled-index);
}
/** A host timing over a fallback: a finite duration is kept within 0 and `numberFlowMaxDuration`, a known curve is kept, anything else falls back. */
export function resolveNumberFlowTiming(timing:NumberFlowTiming|undefined,fallback:NumberFlowResolvedTiming):NumberFlowResolvedTiming{
 const requested=finite(timing?.duration)?timing.duration:fallback.duration;
 const duration=Math.max(0,Math.min(numberFlowMaxDuration,requested));
 return {duration,easing:validEasing(timing?.easing)?timing.easing:fallback.easing};
}
/**
 * The three timings of one figure. `duration` is the shorthand: it sets how long digits roll and places slide, and fades take
 * half of it. `transformTiming` is also the roll's timing until `spinTiming` says otherwise, as in NumberFlow.
 */
export function resolveNumberFlowTimings({duration,spinTiming,transformTiming,opacityTiming}:{duration?:number;spinTiming?:NumberFlowTiming;transformTiming?:NumberFlowTiming;opacityTiming?:NumberFlowTiming}):NumberFlowTimings{
 const shorthand=finite(duration)?Math.min(numberFlowMaxDuration,duration):undefined,transform=resolveNumberFlowTiming(transformTiming,resolveNumberFlowTiming({duration:shorthand},numberFlowDefaults.transform));
 return {transform,spin:resolveNumberFlowTiming(spinTiming,transform),opacity:resolveNumberFlowTiming(opacityTiming,resolveNumberFlowTiming({duration:shorthand===undefined?undefined:shorthand/2},numberFlowDefaults.opacity))};
}
/** How many glyphs a place rolls through before it wraps: ten, or `max + 1` where `digits` limits an integer place, and never fewer than the digit it must show. */
export function numberFlowDigitLength(digits:NumberFlowDigits|undefined,place:number|null,digit=0):number{
 const max=place===null?undefined:digits?.[place]?.max,length=finite(max)&&Number.isInteger(max)&&max>=1&&max<=9?max+1:10;
 return digit>=length?10:length;
}
/**
 * How far a place turns, in glyphs: positive rolls up to higher digits, negative down. With a trend the place keeps turning
 * that way and wraps past its last glyph (9 to 0 going up is +1, not -9); without one it takes the short way its own digits
 * point. `loop` turns an unchanged place once all the way round, for a figure that counts continuously.
 */
export function numberFlowDelta(previous:number,value:number,trend:number,length=10,loop=false):number{
 const difference=value-previous;
 if(!difference)return loop&&trend?length*Math.sign(trend):0;
 const direction=trend||Math.sign(difference);
 if(direction<0&&value>previous)return value-length-previous;
 if(direction>0&&value<previous)return length-previous+value;
 return difference;
}
/** The highest place that changed between two readings, in display order, or `undefined` when none did. Places at or below it loop when the figure is continuous. */
export function numberFlowLoopStart(previous:readonly NumberFlowPlace[],next:readonly NumberFlowPlace[]):number|undefined{
 // Growing or shrinking at the leading edge leaves a shared suffix in the same numeric places.
 let oldEnd=previous.length,newEnd=next.length;
 if(oldEnd!==newEnd){
  while(oldEnd&&newEnd){
   const old=previous[oldEnd-1],current=next[newEnd-1];
   if(old.place!==current.place||old.digit!==current.digit)break;
   oldEnd--;newEnd--;
  }
 }
 function firstChanged(places:readonly NumberFlowPlace[],end:number,other:readonly NumberFlowPlace[]){
  let offset=0;
  for(let index=0;index<end;index++){
   const {place,digit}=places[index];
   if(place===null)continue;
   const aligned=other[index+offset];
   if(aligned?.place===place&&aligned.digit===digit)continue;
   const match=other.findIndex(candidate=>candidate.place===place&&candidate.digit===digit);
   if(match<0)return place;
   // After an insertion or removal the next surviving place usually has the same displacement.
   offset=match-index;
  }
 }
 const removed=firstChanged(previous,oldEnd,next),added=firstChanged(next,newEnd,previous);
 return removed===undefined?added:added===undefined?removed:Math.max(removed,added);
}
interface NumberFlowTurnOptions {trend:number;digits?:NumberFlowDigits;continuous?:boolean;
 /** Each key occurs once in the previous reading, as in the React and native reel models. */
 uniqueKeys?:boolean;
}
/** Visit each new place with its starting digit, signed travel and reel length. */
export function forEachNumberFlowTurn(previous:readonly NumberFlowPlace[],next:readonly NumberFlowPlace[],{trend,digits,continuous=false,uniqueKeys=false}:NumberFlowTurnOptions,visit:(place:NumberFlowPlace,from:number,delta:number,length:number)=>void):void{
 // Typical prices have only a few places. For longer readings, index the previous places once.
 let before:Map<string,number>|undefined;
 const start=continuous&&trend?numberFlowLoopStart(previous,next):undefined;
 const offset=previous.length-next.length;
 for(let index=0;index<next.length;index++){
  const place=next[index],aligned=uniqueKeys?previous[index+offset]:undefined;
  let from=0;
  if(aligned?.key===place.key)from=aligned.digit;
  else if(previous.length>8&&next.length>1){
   if(!before){
    before=new Map();
    for(const old of previous)before.set(old.key,old.digit);
   }
   from=before.get(place.key)??0;
  }else for(let oldIndex=previous.length-1;oldIndex>=0;oldIndex--){
   if(previous[oldIndex].key===place.key){from=previous[oldIndex].digit;break;}
  }
  const length=digits?numberFlowDigitLength(digits,place.place,Math.max(place.digit,from)):10;
  const loop=start!==undefined&&place.place!==null&&start>=place.place;
  visit(place,from,numberFlowDelta(from,place.digit,trend,length,loop),length);
 }
}
/**
 * The turn of every place in the new reading, by key. A place the old reading did not have starts from zero, as it does in
 * NumberFlow. `trend` is the resolved direction of the whole change (-1, 0 or 1); places the new reading dropped are not listed.
 */
export function numberFlowDeltas(previous:readonly NumberFlowPlace[],next:readonly NumberFlowPlace[],options:NumberFlowTurnOptions):Map<string,number>{
 const deltas=new Map<string,number>();
 forEachNumberFlowTurn(previous,next,options,(place,_from,delta)=>deltas.set(place.key,delta));
 return deltas;
}
/** The glyph index a reel shows at a position that has turned any number of times either way. */
export function numberFlowGlyph(position:number,length=10):number{return ((Math.round(position)%length)+length)%length;}
// Arabic-script decimal digits and separators remain eligible for a left-to-right reel.
const reorderedNumberText=/[\u0590-\u065f\u066d-\u06ef\u06fa-\u08ff\u200e\u200f\u202a-\u202e\u2066-\u2069\ufb1d-\ufdff\ufe70-\ufefc\u{10800}-\u{10fff}\u{1e800}-\u{1eeff}]/u;
/** Whether text can be drawn place by place from left to right without reordering it: no bidi controls and no right-to-left letters (Arabic-script digits are fine). */
export function numberFlowNeutral(text:string):boolean{
 return !reorderedNumberText.test(text);
}
