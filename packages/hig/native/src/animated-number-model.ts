import {numberFlowNeutral,type NumberFlowPlace} from '@bloxwap/hig/contracts/number-flow';
import {formatNumber} from './number-format.js';

export type NumberTrend=-1|0|1|((previousValue:number,value:number)=>-1|0|1);
export interface NumberReading {known:boolean;core:string;text:string}
export interface NumberReelToken {key:string;kind:'digit'|'static';type:string;value:string;partIndex:number;digit?:number;place?:number}
export interface NumberReelModel {canonical:string;digits:readonly string[];tokens:readonly NumberReelToken[]}

const supportedParts=new Set(['integer','fraction','decimal','group','plusSign','minusSign','percentSign','currency','unit','compact','literal','exponentSeparator','exponentInteger','exponentMinusSign','exponentPlusSign','approximatelySign']);
const nonAscii=/[\u0080-\uFFFF]/;

export function formatNumberReadout(value:number|null|undefined,locale:string,options?:Intl.NumberFormatOptions,formattedValue?:string,prefix?:string,suffix?:string):NumberReading{
 const known=typeof value==='number'&&Number.isFinite(value);if(!known)return {known:false,core:'—',text:'—'};
 // Without a sign to compose, the reading is the unsigned formatter's own, and that one is kept.
 let core:string;if(formattedValue)core=formattedValue;else{try{const sign=options?.signDisplay;core=sign===undefined||sign==='auto'?formatFor(locale,options).unsigned.format(value):formatNumber(value,locale,options);}catch{core=String(value);}}
 return {known:true,core,text:`${prefix??''}${core}${suffix??''}`};
}

export function numberTrendDirection(trend:NumberTrend|undefined,previousValue:number|null|undefined,value:number|null|undefined):-1|0|1{
 if(Object.is(previousValue,value)||typeof previousValue!=='number'||!Number.isFinite(previousValue)||typeof value!=='number'||!Number.isFinite(value))return 0;
 const resolved=typeof trend==='function'?trend(previousValue,value):trend;
 if(resolved===1||resolved===-1)return resolved;
 if(resolved===0)return 0;
 return value>previousValue?1:value<previousValue?-1:0;
}

export function safeNumberLayout(text:string,direction:string):boolean{
 return direction==='ltr'&&numberFlowNeutral(text);
}

const asciiDigits:readonly string[]=['0','1','2','3','4','5','6','7','8','9'];
// What Intl says about a locale and a set of options does not depend on the value: the numbering system, its ten digits, the
// formatter whose parts spell the reading and the decimal separator. A readout asked for all of it again on every render (five
// formatters and some twenty calls), and building a formatter is the dear part, so each answer is asked for once per format
// and kept. A different `Intl.NumberFormat` (a polyfill installed later, a test double) starts over, and so does a host that
// goes through more formats than fit. Nothing that failed is kept, so it is asked again as before.
interface KeptFormat {unsigned:Intl.NumberFormat;numberingSystem?:string|null;digits?:readonly string[]|null;parts?:Intl.NumberFormat|null;separators?:Map<readonly string[],string|null>}
let latestFormat:KeptFormat|undefined;
const keptFormats=new Map<string,KeptFormat>(),keptLocaleDigits=new Map<string,readonly string[]>();let keptFor:unknown;
const keptSystemDigits=new Map<string,readonly string[]>();
const keptSeparators=new Map<string,string>();
function current(){if(keptFor!==Intl.NumberFormat){keptFormats.clear();keptLocaleDigits.clear();keptSystemDigits.clear();keptSeparators.clear();keptFor=Intl.NumberFormat;}}
function formatFor(locale:string,options:Intl.NumberFormatOptions|undefined):KeptFormat{
 current();const key=`${locale}\u0000${options?JSON.stringify(options):''}`;let kept=keptFormats.get(key);
 if(!kept){
  // The numbering system is the unsigned format's: Hermes on iOS ignores `signDisplay`, and HIG composes the sign itself.
  const {signDisplay:_sign,...rest}=options??{},unsigned=new Intl.NumberFormat(locale,rest);kept={unsigned};
  if(keptFormats.size>=64)keptFormats.delete(keptFormats.keys().next().value!);
  keptFormats.set(key,kept);
 }else if(keptFormats.size===64&&kept!==latestFormat){
  keptFormats.delete(key);keptFormats.set(key,kept);
 }
 latestFormat=kept;
 return kept;
}
/** The ten digit glyphs of a locale's numbering system, or `null` when Intl cannot name them one character each. */
function localeDigits(locale:string):readonly string[]|null{
 current();const kept=keptLocaleDigits.get(locale);if(kept)return kept;
 try{
  const numberingSystem=new Intl.NumberFormat(locale).resolvedOptions().numberingSystem;
  const digitFormatter=new Intl.NumberFormat(locale,{numberingSystem,useGrouping:false,minimumFractionDigits:0,maximumFractionDigits:0});
  const digits=Array.from({length:10},(_,digit)=>{const formatted=digitFormatter.format(digit);return Array.from(formatted).length===1?formatted:'';});
  if(!digits.every(Boolean)||new Set(digits).size!==10)return null;
  if(keptLocaleDigits.size>=64)keptLocaleDigits.clear();keptLocaleDigits.set(locale,digits);return digits;
 }catch{return null;}
}
/**
 * Reels for host-formatted text: every digit of `text` (ASCII, or the locale's own digits) becomes a reel keyed by its place
 * counted from the end, and everything else stays as written. Used for a figure's `formattedValue` when the host formats
 * numbers itself, for example because the runtime's Intl does not match its number table.
 */
export function createFormattedReelModel(text:string,locale:string,direction:string):NumberReelModel|null{
 if(!text||!safeNumberLayout(text,direction))return null;
 let count=0;
 for(let index=0;index<text.length;index++){
  const code=text.charCodeAt(index);
  if(code>=48&&code<=57)count++;
 }
 const digits=count?asciiDigits:localeDigits(locale);if(!digits)return null;
 if(!count)for(const character of text)if(digits.includes(character))count++;
 if(!count)return null;
 const tokens:NumberReelToken[]=[];let run='',seen=0;
 const flush=()=>{if(run){tokens.push({key:`static:${tokens.length}`,kind:'static',type:'literal',value:run,partIndex:tokens.length});run='';}};
 for(const character of text){
  const digit=digits===asciiDigits?character.charCodeAt(0)-48:digits.indexOf(character);
  if(digit<0||digit>9){run+=character;continue;}
  flush();const place=count-++seen;
  tokens.push({key:`digit:${place}`,kind:'digit',type:'integer',value:character,partIndex:tokens.length,digit,place});
 }
 flush();
 return {canonical:text,digits,tokens};
}
interface NumberPart {type:string;value:string}
const minusSign=/[-−‐-―﹣－]/u;
/** The ten digit glyphs a reel rolls through: the numbering system's when Intl names it (each checked one glyph, and one integer part where `formatToParts` exists), else ASCII when the text uses it, else the locale's. */
function reelDigits(locale:string,kept:KeptFormat,text:string):readonly string[]|null{
 if(kept.numberingSystem===undefined)kept.numberingSystem=kept.unsigned.resolvedOptions().numberingSystem??null;
 const numberingSystem=kept.numberingSystem;
 if(!numberingSystem)return /[0-9]/.test(text)?asciiDigits:localeDigits(locale);
 return kept.digits===undefined?kept.digits=systemDigits(locale,numberingSystem):kept.digits;
}
function systemDigits(locale:string,numberingSystem:string):readonly string[]|null{
 const key=JSON.stringify([locale,numberingSystem]);
 const cached=keptSystemDigits.get(key);if(cached)return cached;
 const formatter=new Intl.NumberFormat(locale,{numberingSystem,useGrouping:false,minimumFractionDigits:0,maximumFractionDigits:0});
 const digits=Array.from({length:10},(_,digit)=>{
  const formatted=formatter.format(digit);if(Array.from(formatted).length!==1)return '';
  if(typeof formatter.formatToParts!=='function')return formatted;
  const parts=formatter.formatToParts(digit);
  return parts.length===1&&parts[0].type==='integer'&&parts[0].value===formatted?formatted:'';
 });
 if(!digits.every(Boolean)||new Set(digits).size!==10)return null;
 if(keptSystemDigits.size>=64)keptSystemDigits.clear();
 keptSystemDigits.set(key,digits);return digits;
}
/** Intl's own parts for the value, when the runtime has `formatToParts` and they spell `text` with at least one integer digit. */
function intlParts(value:number,locale:string,options:Intl.NumberFormatOptions|undefined,text:string,kept:KeptFormat):NumberPart[]|null{
 try{
  if(kept.parts===undefined){const sign=options?.signDisplay;const built=sign===undefined||sign==='auto'?kept.unsigned:new Intl.NumberFormat(locale,options);kept.parts=typeof built.formatToParts==='function'?built:null;}
  const formatter=kept.parts;if(!formatter)return null;
  const parts=formatter.formatToParts(value);
  let offset=0,hasInteger=false;
  for(const part of parts){
   if(!text.startsWith(part.value,offset))return null;
   offset+=part.value.length;
   if(part.type==='integer')hasInteger=true;
  }
  return hasInteger&&offset===text.length?parts:null;
 }catch{return null;}
}
/** The locale's decimal separator for these options, read from formatted text: whatever sits between the digits of `1.5`. */
function decimalSeparator(locale:string,options:Intl.NumberFormatOptions|undefined,digits:readonly string[]):string|null{
 const {style,currency,currencyDisplay,numberingSystem}=options??{};
 const probeOptions={...(style==='currency'&&currency?{style,currency,currencyDisplay}:null),...(numberingSystem?{numberingSystem}:null),useGrouping:false,minimumFractionDigits:1,maximumFractionDigits:1};
 const key=JSON.stringify([locale,probeOptions,digits]);
 const cached=keptSeparators.get(key);if(cached!==undefined)return cached;
 const probe=new Intl.NumberFormat(locale,probeOptions);
 const characters=Array.from(probe.format(1.5)),first=characters.findIndex(character=>digits.includes(character));
 let last=characters.length-1;while(last>first&&!digits.includes(characters[last]))last--;
 if(first<0||last<=first+1)return null;
 const separator=characters.slice(first+1,last).join('');
 if(keptSeparators.size>=64)keptSeparators.clear();
 keptSeparators.set(key,separator);return separator;
}
/**
 * Parts read from formatted text, for runtimes without `formatToParts` (Hermes on iOS): digits before the locale's decimal
 * separator are the integer, digits after it the fraction, anything else between the first and last digit a group separator,
 * and what lies outside them the sign (`-`, `−`, `+`) or literal text (currency, percent, compact and unit signs, spaces).
 * Scientific and engineering notation are left to Intl's parts.
 */
function textParts(text:string,locale:string,options:Intl.NumberFormatOptions|undefined,digits:readonly string[],kept:KeptFormat):NumberPart[]|null{
 if(options?.notation==='scientific'||options?.notation==='engineering')return null;
 const characters=nonAscii.test(text)?Array.from(text):text;
 const isDigit=(character:string)=>digits.includes(character);
 let first=0;
 while(first<characters.length&&!isDigit(characters[first]))first++;
 if(first===characters.length)return null;
 let last=characters.length-1;while(!isDigit(characters[last]))last--;
 const separators=kept.separators??=new Map();let found=separators.get(digits);
 if(found===undefined){found=decimalSeparator(locale,options,digits);separators.set(digits,found);}
 const separator=found??'';
 let point=-1,separatorLength=separator.length;
 if(separator){
  if(typeof characters==='string'||separator.length===1){
   const index=characters.indexOf(separator,first+1);
   if(index>=0&&index+separator.length<=last)point=index;
  }else{
   const glyphs=Array.from(separator);separatorLength=glyphs.length;
   for(let index=first+1;index+glyphs.length<=last;index++){
    if(glyphs.every((glyph,offset)=>characters[index+offset]===glyph)){point=index;break;}
   }
  }
 }
 const parts:NumberPart[]=[];
 const push=(type:string,value:string)=>{const previous=parts[parts.length-1];if(previous&&previous.type===type&&type!=='decimal')previous.value+=value;else parts.push({type,value});};
 for(let index=0;index<characters.length;index++){
  const character=characters[index];
  if(index===point){push('decimal',separator);index+=separatorLength-1;continue;}
  if(isDigit(character))push(point>=0&&index>point?'fraction':'integer',character);
  else if(index>first&&index<last)push('group',character);
  else push(minusSign.test(character)?'minusSign':character==='+'?'plusSign':'literal',character);
 }
 return parts;
}
/** The reels of a reading, or `null` where it is drawn static. `reading` is the readout's own text for the value (`formatNumberReadout(...).core`) when the caller already has it, so it is not formatted twice. */
export function createNumberReelModel(value:number|null|undefined,locale:string,options:Intl.NumberFormatOptions|undefined,formattedValue:string|undefined,direction:string,animateFormatted=false,reading?:string):NumberReelModel|null{
 if(typeof value==='number'&&Number.isFinite(value)&&formattedValue&&animateFormatted&&typeof Intl!=='undefined')return createFormattedReelModel(formattedValue,locale,direction);
 if(typeof value!=='number'||!Number.isFinite(value)||formattedValue||direction!=='ltr'||typeof Intl==='undefined'||typeof Intl.NumberFormat!=='function')return null;
 try{
  // The reels draw the readout's own text, whose sign HIG composes (Hermes on iOS ignores `signDisplay`). Intl's parts are used
  // when they spell exactly that text; otherwise (no `formatToParts`, or parts without the composed sign) the parts are read
  // from the text itself, so iOS and Android roll the same reels.
  const canonical=reading??formatNumberReadout(value,locale,options).core,kept=formatFor(locale,options);
  const digits=reelDigits(locale,kept,canonical);
  if(!digits||!safeNumberLayout(canonical,direction))return null;
  const parts=intlParts(value,locale,options,canonical,kept)??textParts(canonical,locale,options,digits,kept);if(!parts)return null;
  // Each validated glyph is one code point. Count places from the right, including supplementary-plane digits.
  let integerCount=0,exponentCount=0;
  const glyphWidth=digits[0].length,uniformWidth=digits.every(glyph=>glyph.length===glyphWidth);
  for(const part of parts){
   if(part.type!=='integer'&&part.type!=='exponentInteger')continue;
   const count=uniformWidth?part.value.length/glyphWidth:Array.from(part.value).length;
   if(part.type==='integer')integerCount+=count;
   else exponentCount+=count;
  }
  let integerIndex=0,fractionIndex=0,exponentIndex=0;
  const tokens:NumberReelToken[]=[];
  for(let partIndex=0;partIndex<parts.length;partIndex++){
   const part=parts[partIndex];if(!supportedParts.has(part.type))return null;
   if(part.type!=='integer'&&part.type!=='fraction'&&part.type!=='exponentInteger'){
    tokens.push({key:`part:${partIndex}:${part.type}`,kind:'static',type:part.type,value:part.value,partIndex});continue;
   }
   for(const character of part.value){
    const digit=digits.indexOf(character);if(digit<0)return null;
    let key:string,place:number;
    if(part.type==='integer'){place=integerCount-integerIndex++-1;key=`integer:${place}`;}
    else if(part.type==='fraction'){place=fractionIndex++;key=`fraction:${place}`;}
    else{place=exponentCount-exponentIndex++-1;key=`exponentInteger:${place}`;}
    tokens.push({key,kind:'digit',type:part.type,value:character,partIndex,digit,place});
   }
  }
  return {canonical,digits,tokens};
 }catch{return null;}
}

/** The NumberFlow place of a reel: an integer reel's own place (0 is the ones), a negative one for a fraction reel (-1 is the tenths), `null` for an exponent's. */
export function numberReelPlace(token:Pick<NumberReelToken,'type'|'place'>):number|null{return token.type==='integer'?token.place??0:token.type==='fraction'?-1-(token.place??0):null;}
/** The reels of a model as NumberFlow places, in display order. */
export function numberReelPlaces(model:NumberReelModel):NumberFlowPlace[]{
 const places:NumberFlowPlace[]=[];
 for(const token of model.tokens){
  if(token.kind==='digit')places.push({key:token.key,digit:token.digit??0,place:numberReelPlace(token)});
 }
 return places;
}
/**
 * Where a reel's strip sits for a position that has turned any number of times either way. The strip is `length + 1` glyphs,
 * the last repeating the first, so every position between two digits (9 to 0 included) is two neighbouring rows. UI thread.
 */
export function numberFlowReelOffset(position:number,length:number,height:number):number{
 'worklet';
 return -(((position%length)+length)%length)*height;
}
/** Progress along a sampled curve (first sample 0, last 1) at time `progress`. The UI-thread twin of `sampleNumberFlowEasing`. */
export function sampleReelEasing(samples:readonly number[],progress:number):number{
 'worklet';
 const scaled=Math.max(0,Math.min(1,progress))*(samples.length-1),index=Math.floor(scaled),start=samples[index],end=index+1<samples.length?samples[index+1]:start;
 return start+(end-start)*(scaled-index);
}
export type NumberFlowTurn={delta:number;start:number;duration:number};
/** A Reanimated animation object: one reel position, which is its target less what every turn still in flight has left to go. */
export type NumberFlowRoll={type:'hig-number-flow';current:number;toValue:number;turns:NumberFlowTurn[];reduceMotion:false;
 onStart:(animation:NumberFlowRoll,value:number,now:number,previous?:{type?:string;toValue?:unknown;turns?:NumberFlowTurn[]}|null)=>void;
 onFrame:(animation:NumberFlowRoll,now:number)=>boolean};
/**
 * One turn of a reel by `delta` glyphs, for `defineAnimation`. A new turn does not restart the reel: it is added to the turns
 * still in flight, each keeping its own clock and curve, which is what NumberFlow's additive animations do on web. So a reel
 * asked to move again while it moves keeps its speed instead of easing in from rest every time, and it always ends on the
 * digit the last turn asked for. With nothing in flight `onFrame` reports finished and the frame callback stops. HIG's
 * provider decides reduced motion, so the system setting is not consulted here. UI thread.
 */
export function createNumberFlowRoll(delta:number,duration:number,samples:readonly number[]):NumberFlowRoll{
 'worklet';
 // Reanimated drops an animation whose `current` already equals the value it is assigned to, before `onStart` runs (a timing
 // holds its target there). This roll only knows its target once it starts, so it starts as no number at all.
 return {type:'hig-number-flow',current:Number.NaN,toValue:0,turns:[],reduceMotion:false,
  onStart(animation,value,now,previous){
   'worklet';
   const continuing=!!previous&&previous.type==='hig-number-flow'&&typeof previous.toValue==='number';
   animation.turns=continuing&&previous?.turns?previous.turns.filter(turn=>now<turn.start+turn.duration):[];
   animation.toValue=(continuing?previous?.toValue as number:Math.round(value))+delta;
   if(duration>0&&delta!==0)animation.turns.push({delta,start:now,duration});
   animation.current=animation.turns.length?value:animation.toValue;
  },
  onFrame(animation,now){
   'worklet';
   let remaining=0,active=0;
   const turns=animation.turns;
   for(let index=0;index<turns.length;index++){
    const turn=turns[index],progress=(now-turn.start)/turn.duration;
    if(progress>=1)continue;
    remaining+=turn.delta*(1-sampleReelEasing(samples,progress));
    if(index!==active)turns[active]=turn;
    active++;
   }
   if(active!==turns.length)turns.length=active;
   animation.current=animation.toValue-remaining;
   return active===0;
  }};
}
