import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {avatarColorRoles,avatarInitials,avatarSide,beamAvatar,beamEye,beamHash,beamInk,beamInks,beamSize} from '../packages/hig/contracts/src/avatar';
// Faces recorded from the SVG that boring-avatars 2.0.4 renders for its "beam" variant. The package is not a dependency of this
// repository, so the recording stands in for it: the model must reproduce every recorded face exactly.
const recorded=JSON.parse(readFileSync('tests/test-utils/boring-avatars-beam.json','utf8')) as {palettes:Record<string,string[]>;faces:Array<{seed:string;palette:string}&Record<string,unknown>>};

describe('beam avatar model',()=>{
 it('reproduces the faces boring-avatars draws for the same seed and palette',()=>{
  expect(recorded.faces.length).toBeGreaterThanOrEqual(32);
  for(const {seed,palette,...theirs} of recorded.faces){
   const {backgroundIndex,wrapperIndex,ink,...ours}=beamAvatar(seed,recorded.palettes[palette]!);
   expect(ours,`${JSON.stringify(seed)} in ${palette}`).toEqual(theirs);
   expect(recorded.palettes[palette]![wrapperIndex]).toBe(theirs.wrapperColor);expect(recorded.palettes[palette]![backgroundIndex]).toBe(theirs.backgroundColor);
   expect(beamInks[ink]).toBe(theirs.faceColor);
  }
 });
 it('hashes a seed the way boring-avatars does: 32-bit, positive, case-sensitive',()=>{
  expect(beamHash('')).toBe(0);expect(beamHash('a')).toBe(97);expect(beamHash('ab')).toBe(97*31+98);
  expect(beamHash('bloxwap')).toBe(beamHash('bloxwap'));expect(beamHash('0xAbC')).not.toBe(beamHash('0xabc'));
  for(const seed of ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045','日本語のなまえ','😀 emoji','x'.repeat(500)]){const hash=beamHash(seed);expect(Number.isInteger(hash)).toBe(true);expect(hash).toBeGreaterThanOrEqual(0);expect(hash).toBeLessThanOrEqual(2**31);}
 });
 it('is deterministic and describes the whole face in the 36-unit square',()=>{
  const colors=['#00ff3f','#35b5ff','#ff479c','#fffb38'];
  const face=beamAvatar('0x1111111111111111111111111111111111111111',colors);
  expect(beamAvatar('0x1111111111111111111111111111111111111111',[...colors])).toEqual(face);
  expect(beamSize).toBe(36);expect(beamEye).toEqual({y:14,width:1.5,height:2,radius:1});
  expect(face.wrapperTransform).toMatch(/^translate\(-?[\d.]+ -?[\d.]+\) rotate\(-?\d+ 18 18\) scale\([\d.]+\)$/);
  expect(face.faceTransform).toMatch(/^translate\(-?[\d.]+ -?[\d.]+\) rotate\(-?\d+ 18 18\)$/);
  expect([6,36]).toContain(face.wrapperRadius);expect(face.rightEyeX-face.leftEyeX).toBeGreaterThanOrEqual(6);
  expect(face.mouthPath).toMatch(face.mouthStroked?/^M15 \d+c2 1 4 1 6 0$/:/^M13,\d+ a1,0\.75 0 0,0 10,0$/);
 });
 it('picks palette positions from the palette length, so a seed keeps its colours only in the same palette',()=>{
  const four=['a','b','c','d'],five=[...four,'e'];
  for(const seed of ['anon','bloxwap','Demo account','0x1111111111111111111111111111111111111111']){
   const hash=beamHash(seed),small=beamAvatar(seed,four),large=beamAvatar(seed,five);
   expect([small.wrapperIndex,small.backgroundIndex]).toEqual([hash%4,(hash+13)%4]);expect([large.wrapperIndex,large.backgroundIndex]).toEqual([hash%5,(hash+13)%5]);
   expect(small.wrapperColor).toBe(four[small.wrapperIndex]);expect(large.backgroundColor).toBe(five[large.backgroundIndex]);
   // The shapes do not depend on the palette.
   expect({...small,wrapperIndex:0,backgroundIndex:0,wrapperColor:'',backgroundColor:''}).toEqual({...large,wrapperIndex:0,backgroundIndex:0,wrapperColor:'',backgroundColor:''});
   // Four and five colours never give a face the backdrop's own colour.
   expect(small.wrapperIndex).not.toBe(small.backgroundIndex);expect(large.wrapperIndex).not.toBe(large.backgroundIndex);
  }
 });
 it('an empty palette gives empty colours at position 0 instead of throwing; one colour is used for both',()=>{
  expect(beamAvatar('anon',[])).toMatchObject({wrapperIndex:0,backgroundIndex:0,wrapperColor:'',backgroundColor:'',ink:'dark'});
  expect(beamAvatar('anon',['#123456'])).toMatchObject({wrapperColor:'#123456',backgroundColor:'#123456',ink:'light',faceColor:'#FFFFFF'});
 });
 it('never writes a negative zero into a transform or a coordinate',()=>{
  for(let index=0;index<400;index++){const face=beamAvatar(`seed-${index}`,['#000000','#ffffff']);expect(JSON.stringify(face)).not.toContain('-0 ');for(const value of [face.leftEyeX,face.rightEyeX,face.wrapperRadius])expect(Object.is(value,-0)).toBe(false);}
 });
});

describe('beam ink',()=>{
 it('follows the YIQ rule of boring-avatars for hex colours',()=>{
  expect(beamInk('#FFFFFF')).toBe('dark');expect(beamInk('#000000')).toBe('light');
  expect(beamInk('#808080')).toBe('dark');expect(beamInk('#7f7f7f')).toBe('light');
  expect(beamInk('#00FF00')).toBe('dark');expect(beamInk('#FF14A0')).toBe('light');expect(beamInk('#C300FF')).toBe('light');
  expect(beamInk(' #FFFA00 ')).toBe('dark');expect(beamInk('#fffa00cc')).toBe('dark');
 });
 it('reads short hex, rgb() and color() as well, which boring-avatars does not',()=>{
  expect(beamInk('#fff')).toBe('dark');expect(beamInk('#000')).toBe('light');expect(beamInk('#000f')).toBe('light');
  expect(beamInk('rgb(255, 250, 0)')).toBe('dark');expect(beamInk('rgb(20 20 20 / 50%)')).toBe('light');expect(beamInk('rgba(100%, 100%, 100%, 1)')).toBe('dark');
  expect(beamInk('color(display-p3 0 1 0.24)')).toBe('dark');expect(beamInk('color(display-p3 0.7 0 1)')).toBe('light');expect(beamInk('color(srgb 0.1 0.1 0.1)')).toBe('light');
 });
 it('draws dark ink on a colour it cannot read',()=>{
  for(const color of ['var(--hig-action)','rebeccapurple','','#12','#12345','rgb(1 2)','color(display-p3 a b c)','color(0 1 0)','rgb(display-p3 0 0 0)'])expect(beamInk(color),color).toBe('dark');
 });
 it('every default role of both native colour tables takes the dark ink',async()=>{
  const {nativeSrgb,nativeDisplayP3}=await import('../packages/hig/tokens/dist/index.js');
  for(const table of [nativeSrgb,nativeDisplayP3])for(const role of ['action','info','negative','warning'] as const)expect(beamInk(table[role]),role).toBe('dark');
 });
 it('takes the host inks in place of black and white',()=>{
  const inks={dark:'var(--hig-background)',light:'var(--hig-text)'};
  expect(beamAvatar('a',['#00FF00'],inks)).toMatchObject({ink:'dark',faceColor:inks.dark});expect(beamAvatar('a',['#101010'],inks)).toMatchObject({ink:'light',faceColor:inks.light});
 });
});

describe('avatar frame arithmetic shared by web and native',()=>{
 it('names the default palette roles once, for both renderers',()=>{
  expect(avatarColorRoles).toEqual(['action','info','negative','warning']);
 });
 it('takes a size that can be drawn and ignores one that cannot',()=>{
  for(const size of [0,0.5,20,40,144,1e9])expect(avatarSide(size)).toBe(size);
  for(const size of [undefined,null,NaN,Infinity,-Infinity,-1,-0.01,'20',{},[],true])expect(avatarSide(size),String(size)).toBeUndefined();
 });
 it('draws the first two letters, and never half a character',()=>{
  expect(avatarInitials('Demo account')).toBe('De');expect(avatarInitials('J')).toBe('J');expect(avatarInitials('')).toBe('');
  expect(avatarInitials('日本語のなまえ')).toBe('日本');expect(avatarInitials('أحمد')).toBe('أح');
  // One astral character is two units, so it was always drawn whole.
  expect(avatarInitials('😀😀 x')).toBe('😀');expect(avatarInitials('😀')).toBe('😀');
  // A letter and an astral character: the cut used to fall inside the pair.
  expect(avatarInitials('A😀 x')).toBe('A😀');expect('A😀 x'.slice(0,2)).not.toBe('A😀');
  // An unpaired half is left as the host wrote it.
  expect(avatarInitials('A\ud83d')).toBe('A\ud83d');expect(avatarInitials('A\ud83dB')).toBe('A\ud83d');
 });
});
