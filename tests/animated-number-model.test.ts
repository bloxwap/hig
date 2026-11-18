import {expect,it,vi} from 'vitest';
import {animatedNumberReading,createAnimatedNumberModel,createAnimatedNumberTransitions} from '../packages/hig/react/src/animated-number-model';

import {formatNumberReadout} from '../packages/hig/native/src/animated-number-model';

it.each([['React',animatedNumberReading],['React Native',formatNumberReadout]] as const)('%s retains recently used formats at the cache limit',(_name,read)=>{
 const Original=Intl.NumberFormat;
 const spy=vi.spyOn(Intl,'NumberFormat').mockImplementation(function(locale,options){return new Original(locale,options);});
 const format=(i:number)=>read(123.5,'en-US',{minimumIntegerDigits:1+i%16,minimumFractionDigits:Math.floor(i/16)});
 try{
  for(let i=0;i<64;i++)format(i);
  format(0);
  format(64);
  format(0);
  format(63);
  expect(spy).toHaveBeenCalledTimes(65);
  format(1);
  expect(spy).toHaveBeenCalledTimes(66);
 }finally{spy.mockRestore();}
});

it('uses the canonical Intl reading and lossless tokens for currency, grouping and scientific notation',()=>{
 const cases:[number,string,Intl.NumberFormatOptions][]=[[-12345.25,'ar-EG',{style:'currency',currency:'USD'}],[12345.25,'de-DE',{}],[1.25e10,'en-US',{notation:'scientific'}]];
 for(const [value,locale,options] of cases){const model=createAnimatedNumberModel(value,locale,options);expect(model.reading).toBe(new Intl.NumberFormat(locale,options).format(value));expect(model.tokens.map(token=>token.text).join('')).toBe(model.reading);expect(model.animatable).toBe(true);}
});
it('decodes positional digits through the resolved numbering system and keys them by numeric place',()=>{
 const locale='ar-EG',value=1203456789,model=createAnimatedNumberModel(value,locale,{useGrouping:false});const resolved=new Intl.NumberFormat(locale).resolvedOptions();const formatter=new Intl.NumberFormat(resolved.locale,{numberingSystem:resolved.numberingSystem,useGrouping:false});const glyphs=new Set(Array.from({length:10},(_,digit)=>formatter.format(digit)));const digits=model.tokens.filter(token=>token.digit);
 expect(model.animatable).toBe(true);expect(new Set(digits.map(token=>token.text))).toEqual(glyphs);expect(digits.map(token=>token.place)).toEqual([9,8,7,6,5,4,3,2,1,0]);
 const scientific=createAnimatedNumberModel(12.3,'en-US',{notation:'scientific'});expect(scientific.tokens.filter(token=>token.section==='number').map(token=>token.place)).toEqual([0,-1,-2]);expect(scientific.tokens.filter(token=>token.section==='exponent').map(token=>token.place)).toEqual([0]);expect(scientific.tokens.map(token=>token.text).join('')).toBe(scientific.reading);
});
it('keeps final tokens canonical when places enter and leave',()=>{
 const previous=createAnimatedNumberModel(100,'en-US'),next=createAnimatedNumberModel(9,'en-US'),tokens=createAnimatedNumberTransitions(previous,next);expect(tokens.map(token=>token.text).join('')).toBe('9');expect(tokens.filter(token=>token.changed&&token.text==='').map(token=>token.oldText)).toEqual(['1','0']);expect(tokens.find(token=>token.text==='9')?.oldText).toBe('0');
});
it('falls back statically for unknown, unsafe and unmappable readings',()=>{
 for(const value of [null,undefined,NaN,Infinity,-Infinity])expect(createAnimatedNumberModel(value,'en-US')).toMatchObject({reading:'—',animatable:false});
 expect(createAnimatedNumberModel(Number.MAX_SAFE_INTEGER+1,'en-US').animatable).toBe(false);
 const Original=Intl.NumberFormat,spy=vi.spyOn(Intl,'NumberFormat').mockImplementation(function(locale,options){const formatter=new Original(locale,options);if(options===undefined)return new Proxy(formatter,{get(target,property){if(property==='format')return()=> '??';if(property==='formatToParts')return()=>[{type:'integer',value:'??'}];const value=Reflect.get(target,property);return typeof value==='function'?value.bind(target):value;}});return formatter;});
 try{const model=createAnimatedNumberModel(12,'en-US');expect(model).toMatchObject({reading:'??',animatable:false});expect(model.tokens.map(token=>token.text).join('')).toBe('??');}finally{spy.mockRestore();}
});

it('keeps supplementary-plane digits at their numeric places',()=>{
 const model=createAnimatedNumberModel(1234.5,'en-US',{numberingSystem:'mathbold'});
 const digits=model.tokens.filter(token=>token.digit);
 expect(digits.map(token=>token.text)).toEqual(Array.from('𝟏𝟐𝟑𝟒𝟓'));
 expect(digits.map(token=>token.place)).toEqual([3,2,1,0,-1]);
});

it('reuses decimal part boundaries and checks changed widths, signs and supplied readings',()=>{
 const options:Intl.NumberFormatOptions={style:'currency',currency:'CAD',minimumFractionDigits:3};
 const model=(value:number,canonical?:string)=>createAnimatedNumberModel(value,'en-CA',options,canonical);
 model(1012.342);
 const parts=vi.spyOn(Intl.NumberFormat.prototype,'formatToParts');
 try{
  const next=model(2013.456);
  expect(parts).not.toHaveBeenCalled();
  expect(next.tokens.filter(token=>token.digit).map(token=>token.value)).toEqual([2,0,1,3,4,5,6]);
  expect(model(-2013.456).reading).toContain('-');
  expect(parts).toHaveBeenCalledTimes(1);
  model(-21345.678);
  expect(parts).toHaveBeenCalledTimes(2);
  expect(model(-21345.679,model(-21345.678).reading).animatable).toBe(false);
 }finally{parts.mockRestore();}
});
