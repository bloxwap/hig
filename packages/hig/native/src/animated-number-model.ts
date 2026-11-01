import {formatNumber} from '@bloxwap/hig/contracts';

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

export function createNumberReelModel(value:number|null|undefined,locale:string,options:Intl.NumberFormatOptions|undefined,formattedValue:string|undefined,direction:string):NumberReelModel|null{
 if(typeof value!=='number'||!Number.isFinite(value)||formattedValue||direction!=='ltr'||typeof Intl==='undefined'||typeof Intl.NumberFormat!=='function')return null;
 try{
  const formatter=new Intl.NumberFormat(locale,options);if(typeof formatter.formatToParts!=='function')return null;
  const canonical=formatter.format(value);if(canonical!==formatNumberReadout(value,locale,options).core)return null;
  const parts=formatter.formatToParts(value);if(!parts.length||parts.map(part=>part.value).join('')!==canonical)return null;
  const numberingSystem=formatter.resolvedOptions().numberingSystem;if(!numberingSystem)return null;
  const digitFormatter=new Intl.NumberFormat(locale,{numberingSystem,useGrouping:false,minimumFractionDigits:0,maximumFractionDigits:0});if(typeof digitFormatter.formatToParts!=='function')return null;
  const digits=Array.from({length:10},(_,digit)=>{
   const formatted=digitFormatter.format(digit),parts=digitFormatter.formatToParts(digit);
   return parts.length===1&&parts[0].type==='integer'&&parts[0].value===formatted&&Array.from(formatted).length===1?formatted:'';
  });
  if(digits.some(digit=>!digit)||new Set(digits).size!==10||!safeNumberLayout(canonical,direction))return null;
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
