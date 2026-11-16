import {describe,expect,it} from 'vitest';
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
