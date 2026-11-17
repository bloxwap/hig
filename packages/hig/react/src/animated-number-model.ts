import type {NumberFlowPlace} from '@bloxwap/hig/contracts/number-flow';
export interface AnimatedNumberToken {key:string;text:string;digit:boolean;value?:number;place?:number;section?:'number'|'exponent'}
export interface AnimatedNumberModel {reading:string;tokens:readonly AnimatedNumberToken[];animatable:boolean;
 /** The ten digit glyphs of the reading's numbering system, zero first, when it moves place by place. A reel rolls through these. */
 digits?:readonly string[]}
export interface AnimatedNumberTransitionToken extends AnimatedNumberToken {oldText?:string;oldValue?:number;changed:boolean}
const staticModel=(reading:string):AnimatedNumberModel=>({reading,animatable:false,tokens:[{key:'static:0',text:reading,digit:false}]});
function digitsFor(formatter:Intl.NumberFormat){
 const resolved=formatter.resolvedOptions();const digitFormatter=new Intl.NumberFormat(resolved.locale,{numberingSystem:resolved.numberingSystem,useGrouping:false});
 const glyphs=Array.from({length:10},(_,digit)=>{const text=digitFormatter.format(digit);const parts=digitFormatter.formatToParts(digit);return parts.length===1&&parts[0].type==='integer'&&parts[0].value===text?text:'';});
 return new Set(glyphs).size===10&&glyphs.every(Boolean)?glyphs:null;
}
// A formatter and its ten digit glyphs depend on the locale and the options alone, and building them is most of what a new
// value costs (two formatters and twenty calls into Intl), so each pair is built once and kept. A different `Intl.NumberFormat`
// (a polyfill installed later, a test double) starts over, and so does a host that goes through more formats than fit.
interface KeptFormat {formatter:Intl.NumberFormat;glyphs?:readonly string[]|null}
const keptFormats=new Map<string,KeptFormat>();let keptFormatsFor:unknown;
function formatFor(locale:string,options?:Intl.NumberFormatOptions):KeptFormat{
 if(keptFormatsFor!==Intl.NumberFormat){keptFormats.clear();keptFormatsFor=Intl.NumberFormat;}
 const key=`${locale}\u0000${options?JSON.stringify(options):''}`;let kept=keptFormats.get(key);
 if(!kept){if(keptFormats.size>=64)keptFormats.clear();kept={formatter:new Intl.NumberFormat(locale,options)};keptFormats.set(key,kept);}
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
export function createAnimatedNumberModel(value:number|null|undefined,locale:string,options?:Intl.NumberFormatOptions):AnimatedNumberModel{
 if(value==null||!Number.isFinite(value))return staticModel('—');
 const kept=formatFor(locale,options),formatter=kept.formatter,reading=formatter.format(value);
 if(Number.isInteger(value)&&!Number.isSafeInteger(value))return staticModel(reading);
 const parts=formatter.formatToParts(value);if(parts.map(part=>part.value).join('')!==reading)return staticModel(reading);
 const glyphs=glyphsFor(kept);if(!glyphs)return staticModel(reading);
 const decoded=parts.map(part=>part.type==='integer'||part.type==='fraction'||part.type==='exponentInteger'?decodeDigits(part.value,glyphs):null);
 if(decoded.some((digits,index)=>!digits&&(parts[index].type==='integer'||parts[index].type==='fraction'||parts[index].type==='exponentInteger')))return staticModel(reading);
 const count=(type:string)=>decoded.reduce((total,digits,index)=>total+(parts[index].type===type?digits?.length??0:0),0);
 const integerCount=count('integer'),exponentCount=count('exponentInteger');let integerIndex=0,fractionIndex=0,exponentIndex=0;const tokens:AnimatedNumberToken[]=[];
 for(let index=0;index<parts.length;index++){const part=parts[index],digits=decoded[index];
  if(!digits){tokens.push({key:`literal:${index}`,text:part.value,digit:false});continue;}
  const section=part.type==='exponentInteger'?'exponent':'number';
  for(const digit of digits){let place:number;if(part.type==='integer')place=integerCount-integerIndex++-1;else if(part.type==='fraction')place=--fractionIndex;else place=exponentCount-exponentIndex++-1;
   tokens.push({key:`digit:${section}:${place}`,text:digit.text,digit:true,value:digit.value,place,section});
  }
 }
 return tokens.some(token=>token.digit)?{reading,tokens,animatable:true,digits:glyphs}:staticModel(reading);
}
/**
 * A model for host-formatted text. Without `animate` it is the text as one static token. With it, every digit of the text
 * (ASCII, or the locale's own digits) is a place keyed by its position counted from the end, so a host's own number table
 * still moves place by place; everything else stays as written.
 */
export function createFormattedAnimatedNumberModel(text:string,locale:string,animate:boolean):AnimatedNumberModel{
 if(!animate)return staticModel(text);
 const ascii=['0','1','2','3','4','5','6','7','8','9'];let local:readonly string[]|null=null;
 try{local=glyphsFor(formatFor(locale));}catch{local=null;}
 const characters=Array.from(text),values=characters.map(character=>{const own=ascii.indexOf(character);return own>=0?own:local?local.indexOf(character):-1;});
 const count=values.filter(value=>value>=0).length;if(!count)return staticModel(text);
 const tokens:AnimatedNumberToken[]=[];let run='',seen=0;
 const flush=()=>{if(run){tokens.push({key:`literal:${tokens.length}`,text:run,digit:false});run='';}};
 characters.forEach((character,index)=>{const value=values[index];if(value<0){run+=character;return;}flush();const place=count-++seen;tokens.push({key:`digit:number:${place}`,text:character,digit:true,value,place,section:'number'});});
 flush();
 return {reading:text,tokens,animatable:true,digits:local&&!values.some((value,index)=>value>=0&&ascii[value]===characters[index])?local:ascii};
}
export function createAnimatedNumberTransitions(previous:AnimatedNumberModel|null,next:AnimatedNumberModel):readonly AnimatedNumberTransitionToken[]{
 if(!previous?.animatable||!next.animatable)return next.tokens.map(token=>({...token,changed:false}));
 const oldDigits=new Map(previous.tokens.filter(token=>token.digit).map(token=>[token.key,token]));const nextDigits=new Set(next.tokens.filter(token=>token.digit).map(token=>token.key));
 const result:AnimatedNumberTransitionToken[]=next.tokens.map(token=>{const old=token.digit?oldDigits.get(token.key):undefined;return {...token,oldText:old&&old.text!==token.text?old.text:undefined,oldValue:old?.value,changed:token.digit&&old?.text!==token.text};});
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
