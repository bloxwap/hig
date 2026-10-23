import {describe,expect,it} from 'vitest';
import {resolvePrimaryColor} from '../packages/tokens/src/theme';

describe('primary colour resolution',()=>{
 it('normalizes short hex and selects readable text for light and dark brands',()=>{
  expect(resolvePrimaryColor('#F00')).toEqual({action:'#ff0000',focus:'#ff0000',onAction:'#000000'});
  expect(resolvePrimaryColor('#123456')).toEqual({action:'#123456',focus:'#123456',onAction:'#ffffff'});
 });
 it('converts sRGB into Display P3 channels instead of reinterpreting them',()=>{
  expect(resolvePrimaryColor('#ff0000','display-p3')).toEqual({action:'#ea3323',focus:'#ea3323',onAction:'#000000'});
  expect(resolvePrimaryColor('#fff','display-p3').action).toBe('#ffffff');
  expect(resolvePrimaryColor('#000','display-p3').action).toBe('#000000');
 });
 it.each(['red','','#1234','#12345678','#gg0000','var(--brand)','rgb(255 0 0)'])('rejects unsupported primary colour %s',color=>{
  expect(()=>resolvePrimaryColor(color)).toThrow('primaryColor');
 });
 it('keeps action labels above 4.5:1 across the sRGB cube',()=>{
  const luminance=(hex:string)=>hex.slice(1).match(/../g)!.map(channel=>parseInt(channel,16)/255).map(channel=>channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4).reduce((total,channel,index)=>total+channel*[.2126,.7152,.0722][index],0);
  for(let r=0;r<=255;r+=17)for(let g=0;g<=255;g+=17)for(let b=0;b<=255;b+=17){
   const color='#'+[r,g,b].map(channel=>channel.toString(16).padStart(2,'0')).join('');
   const {action,onAction}=resolvePrimaryColor(color);const fg=luminance(onAction),bg=luminance(action);
   expect((Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)).toBeGreaterThanOrEqual(4.5);
  }
 });
});
