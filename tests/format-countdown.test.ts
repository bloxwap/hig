import {describe,expect,it,vi} from 'vitest';
import {formatCountdown} from '../packages/hig/contracts/src/index';
describe('formatCountdown',()=>{
 it('shows a clock under a day and days with a padded clock past one, rounding up to the second',()=>{
  expect(formatCountdown(((2*60+14)*60+33)*1000).visible).toBe('2:14:33');
  expect(formatCountdown(((2*60+14)*60+32)*1000+1).visible).toBe('2:14:33');
  expect(formatCountdown((((28*60)+12)*60+9)*1000).visible).toBe('1d 04:12:09');
  expect(formatCountdown(-5000).visible).toBe('0:00:00');
 });
 it('speaks the largest units in words without seconds, and seconds only under a minute',()=>{
  expect(formatCountdown(((2*60+14)*60+33)*1000).spoken).toBe('2 hours 14 minutes');
  expect(formatCountdown((((28*60)+0)*60+9)*1000).spoken).toBe('1 day 4 hours');
  expect(formatCountdown(3*60*1000).spoken).toBe('3 minutes');
  expect(formatCountdown(42000).spoken).toBe('42 seconds');
 });
 it('localizes the unit words',()=>{
  expect(formatCountdown(((2*60+14)*60)*1000,'fr-FR').spoken.replace(/\s/gu,' ')).toBe('2 heures 14 minutes');
 });
});

it('updates visible seconds while formatting the spoken units once per minute',()=>{
 const format=vi.spyOn(Intl.ListFormat.prototype,'format');
 try{
  const readings=Array.from({length:60},(_,i)=>formatCountdown((7199-i)*1000,'en-GB'));
  expect(new Set(readings.map(r=>r.visible)).size).toBe(60);
  expect(new Set(readings.map(r=>r.spoken)).size).toBe(1);
  expect(format).toHaveBeenCalledTimes(1);
  expect(formatCountdown(7139*1000,'en-GB').spoken).toBe('1 hour 58 minutes');
  expect(formatCountdown(60000,'en-GB').spoken).toBe('1 minute');
  expect(formatCountdown(59000,'en-GB').spoken).toBe('59 seconds');
  expect(formatCountdown(0,'en-GB').spoken).toBe('0 seconds');
  expect(format).toHaveBeenCalledTimes(5);
 }finally{format.mockRestore();}
});

it('refreshes cached countdown words when the runtime installs a list formatter',()=>{
 const original=Intl.ListFormat;
 try{
  Object.defineProperty(Intl,'ListFormat',{configurable:true,writable:true,value:undefined});
  expect(formatCountdown(3720000,'en-US').spoken).toBe('1 hour, 2 minutes');
 }finally{Object.defineProperty(Intl,'ListFormat',{configurable:true,writable:true,value:original});}
 expect(formatCountdown(3720000,'en-US').spoken).toBe('1 hour 2 minutes');
});
