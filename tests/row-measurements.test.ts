import {expect,it} from 'vitest';
import {rowMeasurements} from '../packages/hig/react/src/row-measurements';

it('locates variable-height rows across exact boundaries and repeated measurements',()=>{
 for(const count of [0,1,2,7,8,9,511,512,513]){
  const metrics=rowMeasurements(count,44);
  const heights=Array<number>(count).fill(44);
  for(const pass of [0,1,2]){
   for(let index=pass;index<count;index+=3){
    heights[index]=pass===2?44:8+(index%73)*1.25;
    metrics.measure(index,heights[index]);
   }
   let top=0;
   expect(metrics.rowAt(-50)).toBe(0);
   for(let index=0;index<count;index++){
    expect(metrics.rowAt(top)).toBe(index);
    top+=heights[index];
    expect(metrics.rowAt(top-0.01)).toBe(index);
   }
   expect(metrics.rowAt(top+100)).toBe(Math.max(0,count-1));
  }
 }
});

it('uses the rendered offset at non-binary fractional boundaries',()=>{
 const metrics=rowMeasurements(1000,44);
 for(let i=0;i<1000;i++)metrics.measure(i,10+(i%63)/7);
 for(let i=1;i<1000;i++){
  const top=metrics.offset(i);
  expect(metrics.rowAt(top)).toBe(i);
  expect(metrics.rowAt(top-Number.EPSILON*top)).toBe(i-1);
 }
});
