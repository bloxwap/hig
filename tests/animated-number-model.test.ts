import {expect,it,vi} from 'vitest';
import {createAnimatedNumberModel,createAnimatedNumberTransitions} from '../packages/hig/react/src/animated-number-model';

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
