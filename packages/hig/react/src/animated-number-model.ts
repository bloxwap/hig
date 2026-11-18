import type {NumberFlowPlace} from '@bloxwap/hig/contracts/number-flow';
export interface AnimatedNumberToken {key:string;text:string;digit:boolean;value?:number;place?:number;section?:'number'|'exponent'}
export interface AnimatedNumberModel {reading:string;tokens:readonly AnimatedNumberToken[];animatable:boolean;
 /** The ten digit glyphs of the reading's numbering system, zero first, when it moves place by place. A reel rolls through these. */
 digits?:readonly string[]}
export interface AnimatedNumberTransitionToken extends AnimatedNumberToken {oldText?:string;oldValue?:number;changed:boolean}
const asciiDigits:readonly string[]=['0','1','2','3','4','5','6','7','8','9'];
const staticModel=(reading:string):AnimatedNumberModel=>({reading,animatable:false,tokens:[{key:'static:0',text:reading,digit:false}]});
const keptSystemDigits=new Map<string,readonly string[]>();
function digitsFor(formatter:Intl.NumberFormat){
 const resolved=formatter.resolvedOptions();
 const key=JSON.stringify([resolved.locale,resolved.numberingSystem]);
 const cached=keptSystemDigits.get(key);if(cached)return cached;
 const digitFormatter=new Intl.NumberFormat(resolved.locale,{numberingSystem:resolved.numberingSystem,useGrouping:false});
 const glyphs=Array.from({length:10},(_,digit)=>{const text=digitFormatter.format(digit);const parts=digitFormatter.formatToParts(digit);return parts.length===1&&parts[0].type==='integer'&&parts[0].value===text?text:'';});
 if(new Set(glyphs).size!==10||!glyphs.every(Boolean))return null;
 if(keptSystemDigits.size>=64)keptSystemDigits.clear();
 const digits=glyphs.every((glyph,index)=>glyph===asciiDigits[index])?asciiDigits:glyphs;
 keptSystemDigits.set(key,digits);return digits;
}
// A formatter and its ten digit glyphs depend on the locale and the options alone, and building them is most of what a new
// value costs (two formatters and twenty calls into Intl), so each pair is built once and kept. A different `Intl.NumberFormat`
// (a polyfill installed later, a test double) starts over, and so does a host that goes through more formats than fit.
interface KeptFormat {formatter:Intl.NumberFormat;decimalModel?:AnimatedNumberModel;glyphs?:readonly string[]|null}
let latestFormat:KeptFormat|undefined;
const keptFormats=new Map<string,KeptFormat>();let keptFormatsFor:unknown;
function formatFor(locale:string,options?:Intl.NumberFormatOptions):KeptFormat{
 if(keptFormatsFor!==Intl.NumberFormat){keptFormats.clear();keptSystemDigits.clear();keptFormatsFor=Intl.NumberFormat;}
 const key=`${locale}\u0000${options?JSON.stringify(options):''}`;let kept=keptFormats.get(key);
 if(!kept){
  kept={formatter:new Intl.NumberFormat(locale,options)};
  if(keptFormats.size>=64)keptFormats.delete(keptFormats.keys().next().value!);
  keptFormats.set(key,kept);
 }else if(keptFormats.size===64&&kept!==latestFormat){
  keptFormats.delete(key);keptFormats.set(key,kept);
 }
 latestFormat=kept;
 return kept;
}
const glyphsFor=(kept:KeptFormat)=>kept.glyphs===undefined?kept.glyphs=digitsFor(kept.formatter):kept.glyphs;
function decodeDigits(text:string,glyphs:readonly string[]){
 const digits:{text:string;value:number}[]=[];let offset=0;
 while(offset<text.length){let match=-1;for(let digit=0;digit<10;digit++)if(text.startsWith(glyphs[digit],offset)&&(match<0||glyphs[digit].length>glyphs[match].length))match=digit;
  if(match<0)return null;digits.push({text:glyphs[match],value:match});offset+=glyphs[match].length;
 }
 return digits.length?digits:null;
}
export function animatedNumberReading(value:number|null|undefined,locale:string,options?:Intl.NumberFormatOptions){
 return value==null||!Number.isFinite(value)?'—':formatFor(locale,options).formatter.format(value);
}
// The formatter fixes grouping, decimal separators and affixes. A different literal or digit width needs new parts.
function matchDecimalModel(previous:AnimatedNumberModel,reading:string):AnimatedNumberModel|null{
 if(previous.reading.length!==reading.length)return null;
 const tokens:AnimatedNumberToken[]=[];
 let offset=0;
 for(const token of previous.tokens){
  if(token.digit){
   const value=reading.charCodeAt(offset)-48;
   if(value<0||value>9)return null;
   tokens.push(value===token.value?token:{...token,text:reading[offset],value});
  }else{
   if(!reading.startsWith(token.text,offset))return null;
   tokens.push(token);
  }
  offset+=token.text.length;
 }
 return {reading,tokens,animatable:true,digits:asciiDigits};
}
export function createAnimatedNumberModel(value:number|null|undefined,locale:string,options?:Intl.NumberFormatOptions,canonical?:string):AnimatedNumberModel{
 if(value==null||!Number.isFinite(value))return staticModel('—');
 const kept=formatFor(locale,options),formatter=kept.formatter,reading=canonical??formatter.format(value);
 if(Number.isInteger(value)&&!Number.isSafeInteger(value))return staticModel(reading);
 if(kept.decimalModel&&(canonical===undefined||formatter.format(value)===canonical)){
  const matched=matchDecimalModel(kept.decimalModel,reading);if(matched)return matched;
 }
 const parts=formatter.formatToParts(value);
 const glyphs=glyphsFor(kept);if(!glyphs)return staticModel(reading);
 const decoded=glyphs===asciiDigits?null:new Map<number,NonNullable<ReturnType<typeof decodeDigits>>>();
 let integerCount=0,exponentCount=0,offset=0;
 for(let index=0;index<parts.length;index++){
  const part=parts[index];
  if(!reading.startsWith(part.value,offset))return staticModel(reading);
  offset+=part.value.length;
  if(part.type!=='integer'&&part.type!=='fraction'&&part.type!=='exponentInteger')continue;
  let count=part.value.length;
  if(decoded){
   const digits=decodeDigits(part.value,glyphs);if(!digits)return staticModel(reading);
   decoded.set(index,digits);count=digits.length;
  }
  if(!count)return staticModel(reading);
  if(part.type==='integer')integerCount+=count;
  if(part.type==='exponentInteger')exponentCount+=count;
 }
 if(offset!==reading.length)return staticModel(reading);
 let integerIndex=0,fractionIndex=0,exponentIndex=0;const tokens:AnimatedNumberToken[]=[];
 for(let index=0;index<parts.length;index++){const part=parts[index];
  if(part.type!=='integer'&&part.type!=='fraction'&&part.type!=='exponentInteger'){tokens.push({key:`literal:${index}`,text:part.value,digit:false});continue;}
  const section=part.type==='exponentInteger'?'exponent':'number';
  for(const digit of decoded?.get(index)??part.value){
   const text=typeof digit==='string'?digit:digit.text,value=typeof digit==='string'?digit.charCodeAt(0)-48:digit.value;
   if(value<0||value>9)return staticModel(reading);
   let place:number;if(part.type==='integer')place=integerCount-integerIndex++-1;else if(part.type==='fraction')place=--fractionIndex;else place=exponentCount-exponentIndex++-1;
   tokens.push({key:`digit:${section}:${place}`,text,digit:true,value,place,section});
  }
 }
 if(!tokens.some(token=>token.digit))return staticModel(reading);
 const model={reading,tokens,animatable:true,digits:glyphs};
 if(glyphs===asciiDigits&&(!options?.notation||options.notation==='standard')&&(!options?.style||options.style==='decimal'||(options.style==='currency'&&options.currencyDisplay!=='name')))kept.decimalModel=model;
 return model;
}
/**
 * A model for host-formatted text. Without `animate` it is the text as one static token. With it, every digit of the text
 * (ASCII, or the locale's own digits) is a place keyed by its position counted from the end, so a host's own number table
 * still moves place by place; everything else stays as written.
 */
export function createFormattedAnimatedNumberModel(text:string,locale:string,animate:boolean):AnimatedNumberModel{
 if(!animate)return staticModel(text);
 let local:readonly string[]|null=null;
 if(/[\u0080-\uFFFF]/.test(text)){
  try{local=glyphsFor(formatFor(locale));}catch{local=null;}
 }
 let count=0,hasAscii=false;
 function valueOf(character:string){
  const ascii=character.charCodeAt(0)-48;
  return ascii>=0&&ascii<=9?ascii:local?.indexOf(character)??-1;
 }
 for(const character of text){
  const value=valueOf(character);
  if(value>=0){count++;if(character===asciiDigits[value])hasAscii=true;}
 }
 if(!count)return staticModel(text);
 const tokens:AnimatedNumberToken[]=[];let run='',place=count;
 const flush=()=>{if(run){tokens.push({key:`literal:${tokens.length}`,text:run,digit:false});run='';}};
 for(const character of text){
  const value=valueOf(character);if(value<0){run+=character;continue;}
  flush();place--;tokens.push({key:`digit:number:${place}`,text:character,digit:true,value,place,section:'number'});
 }
 flush();
 return {reading:text,tokens,animatable:true,digits:local&&!hasAscii?local:asciiDigits};
}
function transitionToken(token:AnimatedNumberToken,old:AnimatedNumberToken|undefined):AnimatedNumberTransitionToken{
 return {...token,oldText:old&&old.text!==token.text?old.text:undefined,oldValue:old?.value,changed:token.digit&&old?.text!==token.text};
}
export function createAnimatedNumberTransitions(previous:AnimatedNumberModel|null,next:AnimatedNumberModel):readonly AnimatedNumberTransitionToken[]{
 if(!previous?.animatable||!next.animatable)return next.tokens.map(token=>({...token,changed:false}));
 const before=previous.tokens;
 if(before.length===next.tokens.length&&next.tokens.every((token,index)=>token.key===before[index].key&&token.digit===before[index].digit)){
  return next.tokens.map((token,index)=>transitionToken(token,token.digit?before[index]:undefined));
 }
 const oldDigits=new Map(previous.tokens.filter(token=>token.digit).map(token=>[token.key,token]));const nextDigits=new Set(next.tokens.filter(token=>token.digit).map(token=>token.key));
 const result:AnimatedNumberTransitionToken[]=next.tokens.map(token=>transitionToken(token,token.digit?oldDigits.get(token.key):undefined));
 for(let index=0;index<previous.tokens.length;index++){const old=previous.tokens[index];if(!old.digit||nextDigits.has(old.key))continue;let insertion=-1;
  for(let nextIndex=index+1;nextIndex<previous.tokens.length;nextIndex++){const anchor=result.findIndex(token=>token.key===previous.tokens[nextIndex].key);if(anchor>=0){insertion=anchor;break;}}
  if(insertion<0)for(let nextIndex=index-1;nextIndex>=0;nextIndex--){const anchor=result.findIndex(token=>token.key===previous.tokens[nextIndex].key);if(anchor>=0){insertion=anchor+1;break;}}
  if(insertion>=0)result.splice(insertion,0,{...old,text:'',oldText:old.text,changed:true});
 }
 return result;
}
/** The digits of a model as NumberFlow places: the number's own digits carry their place, an exponent's carry none. */
export function numberFlowPlaces(model:AnimatedNumberModel):NumberFlowPlace[]{
 return model.tokens.filter(token=>token.digit).map(token=>({key:token.key,digit:token.value??0,place:token.section==='number'?token.place??null:null}));
}
/**
 * A stable key for every token, in order, so a part keeps its element while the figure around it changes. Digits keep their
 * place key. Text before the first digit is keyed outward from the number (`pre:0` sits against it), text after the last
 * digit likewise (`post:0`), and text between digits by the digit that follows it (`sep:number:2` is the separator before
 * the hundreds, `sep:number:-1` the decimal mark), so a separator stays itself when a place is added in front of it.
 */
export function numberFlowTokenKeys(tokens:readonly AnimatedNumberToken[]):string[]{
 const first=tokens.findIndex(token=>token.digit);if(first<0)return tokens.map((_,index)=>`pre:${tokens.length-1-index}`);
 let last=tokens.length-1;while(!tokens[last].digit)last--;
 const keys:string[]=[],used=new Map<string,number>();
 for(let index=0;index<tokens.length;index++){const token=tokens[index];
  if(token.digit){keys.push(token.key);continue;}
  if(index<first){keys.push(`pre:${first-1-index}`);continue;}
  if(index>last){keys.push(`post:${index-last-1}`);continue;}
  let next=index+1;while(!tokens[next].digit)next++;
  const base=`sep:${tokens[next].section??'number'}:${tokens[next].place??0}`,count=used.get(base)??0;used.set(base,count+1);keys.push(count?`${base}:${count}`:base);
 }
 return keys;
}
/**
 * Which way a part looks for the neighbour it travels with when the figure changes width: `1` towards the parts after it
 * (integer places, their separators and what stands before the number, which are anchored at the decimal mark's left), `-1`
 * towards the parts before it (the decimal mark, fraction places and what follows the number).
 */
export function numberFlowAnchorSide(key:string):-1|1{
 if(key.startsWith('pre:')||key==='affix:prefix')return 1;
 const match=/^(?:digit|sep):number:(-?\d+)/.exec(key);
 return match&&Number(match[1])>=0?1:-1;
}
