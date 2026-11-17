import {expect,it} from 'vitest';
import {decimal,decimalCompare,decimalMultiply,decimalDivide,numericRange,paginationValue,progressValue} from '../packages/hig/contracts/src/index';
import {createConfettiBurst} from '../packages/hig/contracts/src/confetti';
it('performs decimal arithmetic without losing transaction digits',()=>{
 expect(decimal('9007199254740993.123456789')).toBe('9007199254740993.123456789');
 expect(decimalDivide('1','1000000000')).toBe('0.000000001');
 expect(decimalMultiply('0.1','0.2')).toBe('0.02');
 expect(decimalCompare('9007199254740993','9007199254740992')).toBe(1);
 expect(decimal('1e-9')).toBe('0.000000001');expect(decimal('.25')).toBe('0.25');
});
it('validates ranges and normalizes progress and pagination consistently',()=>{
 expect(()=>numericRange(0,10,0)).toThrow(RangeError);
 expect(()=>numericRange(10,0,1)).toThrow(RangeError);
 expect(numericRange(0,10).clamp(NaN)).toBe(0);
 expect(progressValue(20,10)).toEqual({value:10,max:10});
 expect(progressValue(NaN,0)).toEqual({value:undefined,max:100});
 expect(paginationValue(99.5,4.9)).toEqual({page:4,total:4});
 expect(paginationValue(NaN,0)).toEqual({page:1,total:1});
});
it('bounds a burst before allocating its particles',()=>{
 expect(createConfettiBurst({particleCount:Number.MAX_SAFE_INTEGER},['red']).particles).toHaveLength(500);
});
