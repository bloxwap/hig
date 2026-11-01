export interface AnimatedNumberToken {key:string;text:string;digit:boolean;value?:number;place?:number;section?:'number'|'exponent'}
export interface AnimatedNumberModel {reading:string;tokens:readonly AnimatedNumberToken[];animatable:boolean}
export interface AnimatedNumberTransitionToken extends AnimatedNumberToken {oldText?:string;oldValue?:number;changed:boolean}
const staticModel=(reading:string):AnimatedNumberModel=>({reading,animatable:false,tokens:[{key:'static:0',text:reading,digit:false}]});
function digitsFor(formatter:Intl.NumberFormat){
 const resolved=formatter.resolvedOptions();const digitFormatter=new Intl.NumberFormat(resolved.locale,{numberingSystem:resolved.numberingSystem,useGrouping:false});
 const glyphs=Array.from({length:10},(_,digit)=>{const text=digitFormatter.format(digit);const parts=digitFormatter.formatToParts(digit);return parts.length===1&&parts[0].type==='integer'&&parts[0].value===text?text:'';});
 return new Set(glyphs).size===10&&glyphs.every(Boolean)?glyphs:null;
}
function decodeDigits(text:string,glyphs:readonly string[]){
 const digits:{text:string;value:number}[]=[];let offset=0;
 while(offset<text.length){let match=-1;for(let digit=0;digit<10;digit++)if(text.startsWith(glyphs[digit],offset)&&(match<0||glyphs[digit].length>glyphs[match].length))match=digit;
  if(match<0)return null;digits.push({text:glyphs[match],value:match});offset+=glyphs[match].length;
 }
 return digits.length?digits:null;
}
export function createAnimatedNumberModel(value:number|null|undefined,locale:string,options?:Intl.NumberFormatOptions):AnimatedNumberModel{
 if(value==null||!Number.isFinite(value))return staticModel('—');
 const formatter=new Intl.NumberFormat(locale,options),reading=formatter.format(value);
 if(Number.isInteger(value)&&!Number.isSafeInteger(value))return staticModel(reading);
 const parts=formatter.formatToParts(value);if(parts.map(part=>part.value).join('')!==reading)return staticModel(reading);
 const glyphs=digitsFor(formatter);if(!glyphs)return staticModel(reading);
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
 return tokens.some(token=>token.digit)?{reading,tokens,animatable:true}:staticModel(reading);
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
