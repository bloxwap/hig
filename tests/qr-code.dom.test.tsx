// @vitest-environment jsdom
import React from 'react';
import {readFileSync} from 'node:fs';
import {afterEach,describe,expect,it,vi,type Mock} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import * as qr from '../packages/hig/contracts/src/qr';
import {qrCodeGeometry} from '@bloxwap/hig/contracts/qr';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {QRCode} from '../packages/hig/react/src/qr-code';
import {WalletAddress as WalletAddressCore} from '../packages/hig/react/src/wallet-address-core';
// The package entry the component imports, with the encoding step counted. The expectations use the source module.
vi.mock('@bloxwap/hig/contracts/qr',async original=>{const actual=await original<typeof import('@bloxwap/hig/contracts/qr')>();return {...actual,qrCodeGeometry:vi.fn(actual.qrCodeGeometry)};});
const encode=qrCodeGeometry as Mock<typeof qrCodeGeometry>;
afterEach(cleanup);
const eth='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688',sol='6uRAouaynVhU87V9iMaWy616295tf2ZnZQv2YxAcPnhQ';
const fill=(node:Element|null)=>(node as SVGElement|null)?.style.fill;
describe('QRCode',()=>{
 it('draws one inline SVG with a single path for the whole code, named QR code',()=>{
  const view=render(<QRCode value={eth}/>);
  const svg=screen.getByRole('img',{name:'QR code'});
  expect(svg.tagName.toLowerCase()).toBe('svg');expect(view.container.children).toHaveLength(1);expect(svg.getAttribute('class')).toBe('hig-qr-code');
  expect(svg.getAttribute('width')).toBe('196');expect(svg.getAttribute('height')).toBe('196');expect(svg.getAttribute('focusable')).toBe('false');
  // Version 3 (29 modules) at medium error correction, inside the four-module quiet zone.
  expect(svg.getAttribute('viewBox')).toBe('-4 -4 37 37');
  const paths=svg.querySelectorAll('path');expect(paths).toHaveLength(1);
  expect(paths[0].getAttribute('d')).toBe(qr.qrCodeGeometry(eth)!.path);expect(fill(paths[0])).toBe('var(--hig-text,currentColor)');
  // The tile covers the quiet zone, in the background role, with its corners rounded by half the zone.
  const tiles=svg.querySelectorAll('rect');expect(tiles).toHaveLength(1);
  expect(['x','y','width','height','rx'].map(name=>tiles[0].getAttribute(name))).toEqual(['-4','-4','37','37','2']);expect(fill(tiles[0])).toBe('var(--hig-background,transparent)');
  // Nothing but the tile and the path: no element per module, no image.
  expect(svg.children).toHaveLength(2);
 });
 it('takes the size, the colours and the quiet zone from the host',()=>{
  const view=render(<QRCode value={eth} size={120} color='color(display-p3 0 0 0)' background='color(display-p3 1 1 1)' quietZone={2}/>);
  const svg=view.container.querySelector('svg')!;
  expect(svg.getAttribute('width')).toBe('120');expect(svg.getAttribute('viewBox')).toBe('-2 -2 33 33');
  expect(fill(svg.querySelector('path'))).toBe('color(display-p3 0 0 0)');expect(fill(svg.querySelector('rect'))).toBe('color(display-p3 1 1 1)');expect(svg.querySelector('rect')!.getAttribute('rx')).toBe('1');
  // No tile and no quiet zone, for a host surface that keeps the margin itself.
  view.rerender(<QRCode value={eth} background='none' quietZone={0}/>);
  expect(svg.querySelector('rect')).toBeNull();expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');
  view.rerender(<QRCode value={eth} background='transparent' quietZone={-1}/>);expect(svg.querySelector('rect')).toBeNull();expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');
 });
 it('uses high error correction and clears the centre when an arena image is shown',()=>{
  const view=render(<QRCode value={eth} arena='/eth.png' quietZone={0}/>);
  const svg=view.container.querySelector('svg')!;
  // High error correction needs version 5 (37 modules); the cleared square is 9 modules and the image sits half a module inside it.
  expect(svg.getAttribute('viewBox')).toBe('0 0 37 37');expect(svg.querySelector('path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(eth,{arena:true})!.path);
  const image=svg.querySelector('image')!;
  expect(['href','x','y','width','height','preserveAspectRatio'].map(name=>image.getAttribute(name))).toEqual(['/eth.png','14.5','14.5','8','8','xMidYMid slice']);
  const clip=svg.querySelector('clipPath')!;expect(image.getAttribute('clip-path')).toBe(`url(#${clip.id})`);expect(clip.id).toMatch(/^hig-qr-[A-Za-z0-9_-]+$/);
  expect(['x','y','width','height','rx'].map(name=>clip.querySelector('rect')!.getAttribute(name))).toEqual(['14.5','14.5','8','8','1']);
  expect(svg.querySelectorAll('path')).toHaveLength(1);
  // The host's level is used when it is strong enough for a covered centre; a weaker one is raised to quartile.
  view.rerender(<QRCode value={eth} arena='/eth.png' errorCorrection='quartile' quietZone={0}/>);expect(svg.getAttribute('viewBox')).toBe('0 0 33 33');
  view.rerender(<QRCode value={eth} arena='/eth.png' errorCorrection='low' quietZone={0}/>);expect(svg.getAttribute('viewBox')).toBe('0 0 33 33');
  view.rerender(<QRCode value={eth} errorCorrection='low' quietZone={0}/>);expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');
  // No arena: nothing is cleared and the level returns to medium.
  view.rerender(<QRCode value={eth} arena='' quietZone={0}/>);expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');expect(svg.querySelector('image')).toBeNull();
 });
 it('lays a host node out in the arena box, in CSS pixels',()=>{
  const view=render(<QRCode value={sol} size={370} quietZone={0} arena={<b data-testid='mark'>S</b>}/>);
  const svg=view.container.querySelector('svg')!;expect(svg.getAttribute('viewBox')).toBe('0 0 37 37');
  const nested=svg.querySelector('svg')!;
  // 10px a module: the 8-module box is 80px, drawn through a nested viewport so the node keeps its own pixel sizes.
  expect(['x','y','width','height','viewBox'].map(name=>nested.getAttribute(name))).toEqual(['14.5','14.5','8','8','0 0 80 80']);
  const box=nested.querySelector('foreignObject > div') as HTMLElement;
  expect(box.className).toBe('hig-qr-code-arena');expect(box.style.width).toBe('80px');expect(box.style.height).toBe('80px');expect(box.style.borderRadius).toBe('10px');
  expect(screen.getByTestId('mark').parentElement).toBe(box);expect(svg.querySelector('image')).toBeNull();
 });
 it('is named by the host, by the provider, or hidden when the host names it elsewhere',()=>{
  const view=render(<HIGProvider messages={{qrCode:'Code QR'}}><QRCode value={eth}/></HIGProvider>);
  expect(screen.getByRole('img',{name:'Code QR'})).toBeTruthy();
  view.rerender(<HIGProvider messages={{qrCode:'Code QR'}}><QRCode value={eth} label='Deposit address'/></HIGProvider>);expect(screen.getByRole('img',{name:'Deposit address'})).toBeTruthy();
  view.rerender(<QRCode value={eth} decorative/>);
  const svg=view.container.querySelector('svg')!;expect(svg.getAttribute('aria-hidden')).toBe('true');expect(svg.getAttribute('role')).toBeNull();expect(svg.getAttribute('aria-label')).toBeNull();
 });
 it('passes host attributes to the SVG and is not mirrored by a right-to-left page',()=>{
  const view=render(<div dir='rtl'><QRCode value={eth} className='mine' data-kind='deposit' style={{margin:4}}/></div>);
  const svg=view.container.querySelector('svg')!;
  expect(svg.getAttribute('class')).toBe('hig-qr-code mine');expect(svg.getAttribute('data-kind')).toBe('deposit');expect((svg as unknown as HTMLElement).style.margin).toBe('4px');
  // The modules are absolute coordinates in one path: direction has nothing to flip.
  expect(svg.querySelector('path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(eth)!.path);expect(svg.getAttribute('dir')).toBeNull();
 });
 it('encodes once per value and options: a new size, colour, quiet zone or parent render recomputes nothing',()=>{
  encode.mockClear();
  const Host=({size,tick}:{size:number;tick:number})=><div data-tick={tick}><QRCode value={eth} size={size} color={tick?'red':undefined} quietZone={tick?1:undefined}/></div>;
  const view=render(<Host size={196} tick={0}/>);
  expect(encode).toHaveBeenCalledTimes(1);expect(encode).toHaveBeenLastCalledWith(eth,{errorCorrection:undefined,arena:false});
  const first=view.container.querySelector('path')!.getAttribute('d');
  view.rerender(<Host size={196} tick={0}/>);view.rerender(<Host size={300} tick={1}/>);view.rerender(<Host size={64} tick={2}/>);
  expect(encode).toHaveBeenCalledTimes(1);expect(view.container.querySelector('path')!.getAttribute('d')).toBe(first);
  expect(view.container.querySelector('svg')!.getAttribute('viewBox')).toBe('-1 -1 31 31');expect(view.container.querySelector('svg')!.getAttribute('width')).toBe('64');
  view.rerender(<div><QRCode value={sol} size={64}/></div>);
  expect(encode).toHaveBeenCalledTimes(2);expect(view.container.querySelector('path')!.getAttribute('d')).not.toBe(first);
 });
 it('draws an empty, unnamed square for a value no QR code can hold',()=>{
  const view=render(<QRCode value={'a'.repeat(3000)} size={100}/>);
  const svg=view.container.querySelector('svg')!;
  expect(svg.getAttribute('width')).toBe('100');expect(svg.hasAttribute('data-empty')).toBe(true);expect(svg.getAttribute('aria-hidden')).toBe('true');expect(screen.queryByRole('img')).toBeNull();
  expect(svg.querySelector('path')).toBeNull();expect(svg.querySelector('rect')).toBeNull();
 });
 it('needs no QR package: the entry imports only HIG',()=>{
  const source=readFileSync('packages/hig/react/src/qr-code.tsx','utf8');
  expect([...source.matchAll(/from '([^']+)'/g)].map(match=>match[1]).sort()).toEqual(['./provider.js','@bloxwap/hig/contracts/messages','@bloxwap/hig/contracts/qr','@bloxwap/hig/contracts/qr','react']);
  expect(readFileSync('packages/hig/contracts/src/qr.ts','utf8')).not.toMatch(/\bimport\b|\brequire\(/);
  // Published as its own entries on both platforms, over one shared model.
  const exportsMap=JSON.parse(readFileSync('packages/hig/package.json','utf8')).exports as Record<string,{types:string;import:string}>;
  expect(exportsMap['./react/qr-code']).toMatchObject({types:'./react/dist/qr-code.d.ts',import:'./react/dist/qr-code.js'});
  expect(exportsMap['./native/qr-code']).toMatchObject({types:'./native/dist/qr-code.d.ts',import:'./native/dist/qr-code.js'});
  expect(exportsMap['./contracts/qr']).toMatchObject({types:'./contracts/dist/qr.d.ts',import:'./contracts/dist/qr.js'});
 });
});
describe('WalletAddress from wallet-address-core',()=>{
 it('draws HIG’s own QRCode when the host passes none, with no tile or quiet zone, named once by the wrapper',()=>{
  const view=render(<WalletAddressCore address={eth} size={140}/>);
  const named=screen.getAllByRole('img');expect(named).toHaveLength(1);expect(named[0].className).toBe('hig-wallet-address-qr');expect(named[0].getAttribute('aria-label')).toBe('QR code');
  const svg=named[0].querySelector('svg')!;
  expect(svg.getAttribute('class')).toBe('hig-qr-code');expect(svg.getAttribute('aria-hidden')).toBe('true');expect(svg.getAttribute('width')).toBe('140');expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');
  expect(svg.querySelector('rect')).toBeNull();expect(svg.querySelector('path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(eth)!.path);
  expect((view.container.querySelector('.hig-vertical-address') as HTMLElement).style.getPropertyValue('--hig-address-row')).toBe('20px');
 });
 it('encodes qrValue and shows an arena at high error correction; a host qr replaces the code',()=>{
  const view=render(<WalletAddressCore address={sol} qrValue={`solana:${sol}?amount=1`} arena='/sol.png'/>);
  const svg=view.container.querySelector('.hig-wallet-address-qr svg')!;
  expect(svg.querySelector('path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(`solana:${sol}?amount=1`,{arena:true})!.path);expect(svg.querySelector('image')!.getAttribute('href')).toBe('/sol.png');
  view.rerender(<WalletAddressCore address={sol} qr={null}/>);expect(view.container.querySelector('.hig-qr-code path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(sol)!.path);
  view.rerender(<WalletAddressCore address={sol} qrValue='unused' arena='/unused.png' qr={<svg data-testid='host-qr' aria-hidden='true'/>}/>);
  expect(screen.getByTestId('host-qr')).toBeTruthy();expect(view.container.querySelector('.hig-qr-code')).toBeNull();
 });
});
