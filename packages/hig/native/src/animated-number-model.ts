import {formatNumber} from './number-format.js';

export type NumberTrend=-1|0|1|((previousValue:number,value:number)=>-1|0|1);
export interface NumberReading {known:boolean;core:string;text:string}
export interface NumberReelToken {key:string;kind:'digit'|'static';type:string;value:string;partIndex:number;digit?:number;place?:number}
export interface NumberReelModel {canonical:string;digits:readonly string[];tokens:readonly NumberReelToken[]}

const supportedParts=new Set(['integer','fraction','decimal','group','plusSign','minusSign','percentSign','currency','unit','compact','literal','exponentSeparator','exponentInteger','exponentMinusSign','exponentPlusSign','approximatelySign']);
const bidiControls=/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u;

export function formatNumberReadout(value:number|null|undefined,locale:string,options?:Intl.NumberFormatOptions,formattedValue?:string,prefix?:string,suffix?:string):NumberReading{
 const known=typeof value==='number'&&Number.isFinite(value);if(!known)return {known:false,core:'—',text:'—'};
 let core:string;if(formattedValue)core=formattedValue;else{try{core=formatNumber(value,locale,options);}catch{core=String(value);}}
 return {known:true,core,text:`${prefix??''}${core}${suffix??''}`};
}

export function numberTrendDirection(trend:NumberTrend|undefined,previousValue:number|null|undefined,value:number|null|undefined):-1|0|1{
 if(Object.is(previousValue,value)||typeof previousValue!=='number'||!Number.isFinite(previousValue)||typeof value!=='number'||!Number.isFinite(value))return 0;
 const resolved=typeof trend==='function'?trend(previousValue,value):trend;
 if(resolved===1||resolved===-1)return resolved;
 if(resolved===0)return 0;
 return value>previousValue?1:value<previousValue?-1:0;
}

function strongRTL(character:string):boolean{
 const point=character.codePointAt(0);if(point===undefined)return false;
 if((point>=0x0660&&point<=0x0669)||(point>=0x06f0&&point<=0x06f9)||(point>=0x066a&&point<=0x066c))return false;
 return (point>=0x0590&&point<=0x08ff)||(point>=0xfb1d&&point<=0xfdff)||(point>=0xfe70&&point<=0xfefc)||(point>=0x10800&&point<=0x10fff)||(point>=0x1e800&&point<=0x1edff)||(point>=0x1ee00&&point<=0x1eeff);
}

export function safeNumberLayout(text:string,direction:string):boolean{
 if(direction!=='ltr')return false;
 for(const character of Array.from(text))if(bidiControls.test(character)||strongRTL(character))return false;
 return true;
}

const asciiDigits:readonly string[]=['0','1','2','3','4','5','6','7','8','9'];
/** The ten digit glyphs of a locale's numbering system, or `null` when Intl cannot name them one character each. */
function localeDigits(locale:string):readonly string[]|null{
 try{
  const numberingSystem=new Intl.NumberFormat(locale).resolvedOptions().numberingSystem;
  const digitFormatter=new Intl.NumberFormat(locale,{numberingSystem,useGrouping:false,minimumFractionDigits:0,maximumFractionDigits:0});
  const digits=Array.from({length:10},(_,digit)=>{const formatted=digitFormatter.format(digit);return Array.from(formatted).length===1?formatted:'';});
  return digits.every(Boolean)&&new Set(digits).size===10?digits:null;
 }catch{return null;}
}
/**
 * Reels for host-formatted text: every digit of `text` (ASCII, or the locale's own digits) becomes a reel keyed by its place
 * counted from the end, and everything else stays as written. Used for a figure's `formattedValue` when the host formats
 * numbers itself, for example because the runtime's Intl does not match its number table.
 */
export function createFormattedReelModel(text:string,locale:string,direction:string):NumberReelModel|null{
 if(!text||!safeNumberLayout(text,direction))return null;
 const characters=Array.from(text),ascii=characters.some(character=>asciiDigits.includes(character));
 const digits=ascii?asciiDigits:localeDigits(locale);if(!digits)return null;
 const count=characters.filter(character=>digits.includes(character)).length;if(!count)return null;
 const tokens:NumberReelToken[]=[];let run='',seen=0;
 const flush=()=>{if(run){tokens.push({key:`static:${tokens.length}`,kind:'static',type:'literal',value:run,partIndex:tokens.length});run='';}};
 for(const character of characters){
  const digit=digits.indexOf(character);
  if(digit<0){run+=character;continue;}
  flush();const place=count-++seen;
  tokens.push({key:`digit:${place}`,kind:'digit',type:'integer',value:character,partIndex:tokens.length,digit,place});
 }
 flush();
 return {canonical:text,digits,tokens};
}
interface NumberPart {type:string;value:string}
const minusSign=/[-−‐-―﹣－]/u;
/** The ten digit glyphs a reel rolls through: the numbering system's when Intl names it (each checked one glyph, and one integer part where `formatToParts` exists), else ASCII when the text uses it, else the locale's. */
function reelDigits(locale:string,numberingSystem:string|undefined,text:string):readonly string[]|null{
 if(!numberingSystem)return Array.from(text).some(character=>asciiDigits.includes(character))?asciiDigits:localeDigits(locale);
 const formatter=new Intl.NumberFormat(locale,{numberingSystem,useGrouping:false,minimumFractionDigits:0,maximumFractionDigits:0});
 const digits=Array.from({length:10},(_,digit)=>{
  const formatted=formatter.format(digit);if(Array.from(formatted).length!==1)return '';
  if(typeof formatter.formatToParts!=='function')return formatted;
  const parts=formatter.formatToParts(digit);
  return parts.length===1&&parts[0].type==='integer'&&parts[0].value===formatted?formatted:'';
 });
 return digits.every(Boolean)&&new Set(digits).size===10?digits:null;
}
/** Intl's own parts for the value, when the runtime has `formatToParts` and they spell `text` with at least one integer digit. */
function intlParts(value:number,locale:string,options:Intl.NumberFormatOptions|undefined,text:string):NumberPart[]|null{
 try{
  const formatter=new Intl.NumberFormat(locale,options);if(typeof formatter.formatToParts!=='function')return null;
  const parts=formatter.formatToParts(value);
  return parts.length&&parts.some(part=>part.type==='integer')&&parts.map(part=>part.value).join('')===text?parts:null;
 }catch{return null;}
}
/** The locale's decimal separator for these options, read from formatted text: whatever sits between the digits of `1.5`. */
function decimalSeparator(locale:string,options:Intl.NumberFormatOptions|undefined,digits:readonly string[]):string|null{
 const {style,currency,currencyDisplay,numberingSystem}=options??{};
 const probe=new Intl.NumberFormat(locale,{...(style==='currency'&&currency?{style,currency,currencyDisplay}:null),...(numberingSystem?{numberingSystem}:null),useGrouping:false,minimumFractionDigits:1,maximumFractionDigits:1});
 const characters=Array.from(probe.format(1.5)),first=characters.findIndex(character=>digits.includes(character));
 let last=characters.length-1;while(last>first&&!digits.includes(characters[last]))last--;
 return first>=0&&last>first+1?characters.slice(first+1,last).join(''):null;
}
/**
 * Parts read from formatted text, for runtimes without `formatToParts` (Hermes on iOS): digits before the locale's decimal
 * separator are the integer, digits after it the fraction, anything else between the first and last digit a group separator,
 * and what lies outside them the sign (`-`, `−`, `+`) or literal text (currency, percent, compact and unit signs, spaces).
 * Scientific and engineering notation are left to Intl's parts.
 */
function textParts(text:string,locale:string,options:Intl.NumberFormatOptions|undefined,digits:readonly string[]):NumberPart[]|null{
 if(options?.notation==='scientific'||options?.notation==='engineering')return null;
 const characters=Array.from(text),isDigit=(character:string)=>digits.includes(character);
 const first=characters.findIndex(isDigit);if(first<0)return null;
 let last=characters.length-1;while(!isDigit(characters[last]))last--;
 const separator=Array.from(decimalSeparator(locale,options,digits)??'');let point=-1;
 if(separator.length)for(let index=first+1;index+separator.length<=last;index++)if(separator.every((character,offset)=>characters[index+offset]===character)){point=index;break;}
 const parts:NumberPart[]=[];
 const push=(type:string,value:string)=>{const previous=parts[parts.length-1];if(previous&&previous.type===type&&type!=='decimal')previous.value+=value;else parts.push({type,value});};
 for(let index=0;index<characters.length;index++){
  const character=characters[index];
  if(index===point){push('decimal',separator.join(''));index+=separator.length-1;continue;}
  if(isDigit(character))push(point>=0&&index>point?'fraction':'integer',character);
  else if(index>first&&index<last)push('group',character);
  else push(minusSign.test(character)?'minusSign':character==='+'?'plusSign':'literal',character);
 }
 return parts;
}
export function createNumberReelModel(value:number|null|undefined,locale:string,options:Intl.NumberFormatOptions|undefined,formattedValue:string|undefined,direction:string,animateFormatted=false):NumberReelModel|null{
 if(typeof value==='number'&&Number.isFinite(value)&&formattedValue&&animateFormatted&&typeof Intl!=='undefined')return createFormattedReelModel(formattedValue,locale,direction);
 if(typeof value!=='number'||!Number.isFinite(value)||formattedValue||direction!=='ltr'||typeof Intl==='undefined'||typeof Intl.NumberFormat!=='function')return null;
 try{
  // The reels draw the readout's own text, whose sign HIG composes (Hermes on iOS ignores `signDisplay`). Intl's parts are used
  // when they spell exactly that text; otherwise (no `formatToParts`, or parts without the composed sign) the parts are read
  // from the text itself, so iOS and Android roll the same reels.
  const canonical=formatNumberReadout(value,locale,options).core;
  const {signDisplay:_sign,...unsigned}=options??{};
  const numberingSystem=new Intl.NumberFormat(locale,unsigned).resolvedOptions().numberingSystem;
  const digits=reelDigits(locale,numberingSystem,canonical);
  if(!digits||!safeNumberLayout(canonical,direction))return null;
  const parts=intlParts(value,locale,options,canonical)??textParts(canonical,locale,options,digits);if(!parts)return null;
  const digitIndexes=new Map(digits.map((digit,index)=>[digit,index]));
  const count=(type:string)=>parts.filter(part=>part.type===type).reduce((total,part)=>total+Array.from(part.value).length,0);
  const integerCount=count('integer'),exponentCount=count('exponentInteger');let integerIndex=0,fractionIndex=0,exponentIndex=0;
  const tokens:NumberReelToken[]=[];
  for(let partIndex=0;partIndex<parts.length;partIndex++){
   const part=parts[partIndex];if(!supportedParts.has(part.type))return null;
   if(part.type!=='integer'&&part.type!=='fraction'&&part.type!=='exponentInteger'){
    tokens.push({key:`part:${partIndex}:${part.type}`,kind:'static',type:part.type,value:part.value,partIndex});continue;
   }
   for(const character of Array.from(part.value)){
    const digit=digitIndexes.get(character);if(digit===undefined)return null;
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
