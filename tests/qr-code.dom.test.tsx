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
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
// `qr` is the encoder and decoder behind Cuer, installed as its dependency: resolved from Cuer so the test does not lean on hoisting.
const fromCuer=createRequire(createRequire(import.meta.url).resolve('cuer/package.json'));
const {decodeQR}=await import(pathToFileURL(fromCuer.resolve('qr/decode.js')).href) as {decodeQR:(image:{width:number;height:number;data:Uint8Array})=>string};
// The package entry the component imports, with the encoding step counted. The expectations use the source module.
vi.mock('@bloxwap/hig/contracts/qr',async original=>{const actual=await original<typeof import('@bloxwap/hig/contracts/qr')>();return {...actual,qrCodeGeometry:vi.fn(actual.qrCodeGeometry)};});
const encode=qrCodeGeometry as Mock<typeof qrCodeGeometry>;
afterEach(cleanup);
const eth='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688',sol='6uRAouaynVhU87V9iMaWy616295tf2ZnZQv2YxAcPnhQ';
const fill=(node:Element|null)=>(node as SVGElement|null)?.style.fill;
/** The inline SVG as a renderer wrote it, rasterised by librsvg and read back by a software decoder. */
async function scan(svg:Element){
 const markup=svg.outerHTML.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ');
 const {data,info}=await sharp(Buffer.from(markup)).flatten({background:'#808080'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 return decodeQR({width:info.width,height:info.height,data:new Uint8Array(data)});
}
describe('QRCode',()=>{
 it('draws one inline SVG with a single path for the whole code, in a square named QR code',()=>{
  const view=render(<QRCode value={eth}/>);
  const root=screen.getByRole('img',{name:'QR code'});
  expect(root.tagName).toBe('SPAN');expect(view.container.children).toHaveLength(1);expect(root.className).toBe('hig-qr-code');
  // The size is a custom property the stylesheet reads, so host CSS can resize the square.
  expect(root.style.getPropertyValue('--hig-qr-code-size')).toBe('196px');expect(root.style.width).toBe('');
  expect(root.children).toHaveLength(1);const svg=root.children[0];
  expect(svg.tagName.toLowerCase()).toBe('svg');expect(svg.getAttribute('aria-hidden')).toBe('true');expect(svg.getAttribute('focusable')).toBe('false');
  expect(svg.getAttribute('width')).toBe('196');expect(svg.getAttribute('height')).toBe('196');
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
  const root=view.container.querySelector('.hig-qr-code') as HTMLElement,svg=root.querySelector('svg')!;
  expect(root.style.getPropertyValue('--hig-qr-code-size')).toBe('120px');expect(svg.getAttribute('width')).toBe('120');expect(svg.getAttribute('viewBox')).toBe('-2 -2 33 33');
  expect(fill(svg.querySelector('path'))).toBe('color(display-p3 0 0 0)');expect(fill(svg.querySelector('rect'))).toBe('color(display-p3 1 1 1)');expect(svg.querySelector('rect')!.getAttribute('rx')).toBe('1');
  // No tile and no quiet zone, for a host surface that keeps the margin itself.
  view.rerender(<QRCode value={eth} background='none' quietZone={0}/>);
  expect(svg.querySelector('rect')).toBeNull();expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');
  view.rerender(<QRCode value={eth} background='transparent' quietZone={-1}/>);expect(svg.querySelector('rect')).toBeNull();expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');
 });
 it('uses high error correction and clears the centre when an arena image is shown',()=>{
  const view=render(<QRCode value={eth} arena='/eth.png' quietZone={0} background='none'/>);
  const root=view.container.querySelector('.hig-qr-code') as HTMLElement,svg=root.querySelector('svg')!;
  // High error correction needs version 5 (37 modules); the cleared square is 9 modules and the image sits half a module inside it.
  expect(svg.getAttribute('viewBox')).toBe('0 0 37 37');expect(svg.querySelector('path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(eth,{arena:true})!.path);
  // The image is an HTML box over the SVG: 8 of 37 modules wide, 14.5 modules in, with one module of corner radius.
  expect(root.children).toHaveLength(2);const box=root.children[1] as HTMLElement;
  expect(box.tagName).toBe('SPAN');expect(box.className).toBe('hig-qr-code-arena');
  expect([box.style.left,box.style.top,box.style.width,box.style.height,box.style.borderRadius]).toEqual(['39.1892%','39.1892%','21.6216%','21.6216%','12.5%']);
  const image=box.querySelector('img')!;
  expect(box.children).toHaveLength(1);expect(image.className).toBe('hig-qr-code-image');expect(image.getAttribute('src')).toBe('/eth.png');expect(image.getAttribute('alt')).toBe('');expect(image.getAttribute('draggable')).toBe('false');
  // Nothing is drawn inside the SVG for the arena: the code stays one path, without a tile here.
  expect(svg.children).toHaveLength(1);expect(svg.querySelectorAll('path')).toHaveLength(1);expect(svg.querySelector('image,foreignObject,clipPath')).toBeNull();
  // The host's level is used when it is strong enough for a covered centre; a weaker one is raised to quartile.
  view.rerender(<QRCode value={eth} arena='/eth.png' errorCorrection='quartile' quietZone={0}/>);expect(svg.getAttribute('viewBox')).toBe('0 0 33 33');
  view.rerender(<QRCode value={eth} arena='/eth.png' errorCorrection='low' quietZone={0}/>);expect(svg.getAttribute('viewBox')).toBe('0 0 33 33');
  view.rerender(<QRCode value={eth} errorCorrection='low' quietZone={0}/>);expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');
  // No arena: nothing is cleared and the level returns to medium.
  view.rerender(<QRCode value={eth} arena='' quietZone={0}/>);expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');expect(root.querySelector('.hig-qr-code-arena')).toBeNull();
 });
 it('lays a host node out in the arena box over the SVG, never in a foreignObject',()=>{
  const view=render(<QRCode value={sol} size={370} arena={<b data-testid='mark' style={{position:'relative',opacity:.9}}>S</b>}/>);
  const root=view.container.querySelector('.hig-qr-code') as HTMLElement,svg=root.querySelector('svg')!;expect(svg.getAttribute('viewBox')).toBe('-4 -4 45 45');
  // WebKit paints positioned or translucent foreignObject content at the SVG's corner, over a finder pattern; an HTML box has no such fault.
  expect(svg.querySelector('foreignObject')).toBeNull();expect(svg.querySelector('[data-testid="mark"]')).toBeNull();
  const box=screen.getByTestId('mark').parentElement as HTMLElement;
  expect(box.className).toBe('hig-qr-code-arena');expect(box.parentElement).toBe(root);
  // 4 quiet modules and 14.5 modules in, of 45; 8 modules wide. Percentages, so the box follows a resized square.
  expect([box.style.left,box.style.top,box.style.width,box.style.height,box.style.borderRadius]).toEqual(['41.1111%','41.1111%','17.7778%','17.7778%','12.5%']);
  // Centred on the square: the offset and half the width add up to half.
  expect(parseFloat(box.style.left)+parseFloat(box.style.width)/2).toBeCloseTo(50,3);
  expect(box.querySelector('img')).toBeNull();
 });
 it('styles the square, the SVG and the arena box so the box sits over the cleared modules in either direction',()=>{
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  expect(css).toContain('.hig-qr-code { position:relative;display:block;flex:none;box-sizing:border-box;width:var(--hig-qr-code-size,196px);max-width:100%;aspect-ratio:1; }');
  expect(css).toContain('.hig-qr-code > svg { position:absolute;inset:0;display:block;width:100%;height:100%; }');
  expect(css).toContain('.hig-qr-code-arena { position:absolute;display:flex;align-items:center;justify-content:center;box-sizing:border-box;overflow:hidden; }');
  expect(css).toContain('.hig-qr-code-image { display:block;width:100%;height:100%;object-fit:cover; }');
  // Physical offsets in the component, and no logical ones in the stylesheet, so a right-to-left page cannot mirror the box.
  expect(css.match(/\.hig-qr-code[^{]*\{[^}]*\}/g)!.join('')).not.toMatch(/inset-inline|margin-inline|inline-start|inline-end/);
  // WalletAddress sizes HIG's code like a host's drawing.
  expect(css).toContain('.hig-wallet-address-qr > svg,.hig-wallet-address-qr > .hig-qr-code { display:block;width:100%;height:100%; }');
 });
 it('is named by the host, by the provider, or hidden when the host names it elsewhere',()=>{
  const view=render(<HIGProvider messages={{qrCode:'Code QR'}}><QRCode value={eth}/></HIGProvider>);
  expect(screen.getByRole('img',{name:'Code QR'})).toBeTruthy();
  view.rerender(<HIGProvider messages={{qrCode:'Code QR'}}><QRCode value={eth} label='Deposit address'/></HIGProvider>);expect(screen.getByRole('img',{name:'Deposit address'})).toBeTruthy();
  // One image: the drawing inside the named square is always hidden.
  expect(screen.getAllByRole('img')).toHaveLength(1);expect(view.container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  view.rerender(<QRCode value={eth} decorative arena='/eth.png'/>);
  const root=view.container.querySelector('.hig-qr-code')!;expect(root.getAttribute('aria-hidden')).toBe('true');expect(root.getAttribute('role')).toBeNull();expect(root.getAttribute('aria-label')).toBeNull();
  expect(screen.queryByRole('img')).toBeNull();
 });
 it('passes host attributes to the square and is not mirrored by a right-to-left page',()=>{
  const view=render(<div dir='rtl'><QRCode value={eth} className='mine' data-kind='deposit' id='code' style={{margin:4,width:300}} arena='/eth.png'/></div>);
  const root=view.container.querySelector('.hig-qr-code') as HTMLElement;
  expect(root.className).toBe('hig-qr-code mine');expect(root.getAttribute('data-kind')).toBe('deposit');expect(root.id).toBe('code');expect(root.style.margin).toBe('4px');
  // The host's style wins over the size, and the size stays available to the stylesheet.
  expect(root.style.width).toBe('300px');expect(root.style.getPropertyValue('--hig-qr-code-size')).toBe('196px');
  // The modules are absolute coordinates in one path and the arena is offset from the physical left: direction has nothing to flip.
  expect(root.querySelector('path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(eth,{arena:true})!.path);expect(root.getAttribute('dir')).toBeNull();
  const box=root.querySelector('.hig-qr-code-arena') as HTMLElement;expect(box.style.left).toBe('41.1111%');expect(box.style.right).toBe('');expect(box.style.insetInlineStart).toBeFalsy();
 });
 it('encodes once per value and options: a new size, colour, quiet zone or parent render recomputes nothing',()=>{
  encode.mockClear();
  const Host=({size,tick}:{size:number;tick:number})=><div data-tick={tick}><QRCode value={eth} size={size} color={tick?'red':undefined} quietZone={tick?1:undefined}/></div>;
  const view=render(<Host size={196} tick={0}/>);
  expect(encode).toHaveBeenCalledTimes(1);expect(encode).toHaveBeenLastCalledWith(eth,{errorCorrection:undefined,arena:false});
  const first=view.container.querySelector('path')!.getAttribute('d');
  view.rerender(<Host size={196} tick={0}/>);view.rerender(<Host size={300} tick={1}/>);view.rerender(<Host size={64} tick={2}/>);
  expect(encode).toHaveBeenCalledTimes(1);expect(view.container.querySelector('path')!.getAttribute('d')).toBe(first);
  expect(view.container.querySelector('svg')!.getAttribute('viewBox')).toBe('-1 -1 31 31');expect((view.container.querySelector('.hig-qr-code') as HTMLElement).style.getPropertyValue('--hig-qr-code-size')).toBe('64px');
  // A different arena node is still an arena: the code is not encoded again.
  view.rerender(<div><QRCode value={eth} size={64} arena={<i/>}/></div>);expect(encode).toHaveBeenCalledTimes(2);
  view.rerender(<div><QRCode value={eth} size={64} arena={<b/>}/></div>);view.rerender(<div><QRCode value={eth} size={64} arena='/eth.png'/></div>);expect(encode).toHaveBeenCalledTimes(2);
  view.rerender(<div><QRCode value={sol} size={64}/></div>);
  expect(encode).toHaveBeenCalledTimes(3);expect(view.container.querySelector('path')!.getAttribute('d')).not.toBe(first);
 });
 it('draws an empty, unnamed square for a value no QR code can hold',()=>{
  const view=render(<QRCode value={'a'.repeat(3000)} size={100} arena='/eth.png'/>);
  const root=view.container.querySelector('.hig-qr-code') as HTMLElement,svg=root.querySelector('svg')!;
  expect(root.style.getPropertyValue('--hig-qr-code-size')).toBe('100px');expect(root.hasAttribute('data-empty')).toBe(true);expect(root.getAttribute('aria-hidden')).toBe('true');expect(screen.queryByRole('img')).toBeNull();
  expect(svg.querySelector('path')).toBeNull();expect(svg.querySelector('rect')).toBeNull();expect(svg.getAttribute('viewBox')).toBeNull();
  // No code, so no arena either: nothing floats over an empty square.
  expect(root.querySelector('.hig-qr-code-arena')).toBeNull();
 });
 it('draws edge values without throwing: an empty value, a zero size, and a size that is not a number',()=>{
  const view=render(<QRCode value=''/>);
  // An empty value is a valid, empty symbol: version 1.
  expect(view.container.querySelector('svg')!.getAttribute('viewBox')).toBe('-4 -4 29 29');expect(screen.getByRole('img',{name:'QR code'})).toBeTruthy();
  view.rerender(<QRCode value={eth} size={0} arena='/eth.png'/>);
  const root=view.container.querySelector('.hig-qr-code') as HTMLElement;
  expect(root.style.getPropertyValue('--hig-qr-code-size')).toBe('0px');expect((root.querySelector('.hig-qr-code-arena') as HTMLElement).style.width).toBe('17.7778%');
  // Rapid changes of value each draw the latest code.
  for(const value of ['1','22','333',sol])view.rerender(<QRCode value={value}/>);
  expect(view.container.querySelector('path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(sol)!.path);
 });
 it('paints a code a decoder reads: the SVG as written, rasterised, dark on light and light on dark, with and without an arena',async()=>{
  for(const value of [eth,sol,`ethereum:${eth}@8453`,'https://bloxwap.com/invite/9e0fD0622874','Zażółć 日本語 🚀']){
   const view=render(<QRCode value={value} color='black' background='white'/>);
   expect(await scan(view.container.querySelector('svg')!),value).toBe(value);
   // The centre is cleared and left to the arena's box; the code still reads at the level an arena raises it to.
   view.rerender(<QRCode value={value} color='black' background='white' arena='/mark.png'/>);
   expect(await scan(view.container.querySelector('svg')!),`${value} with an arena`).toBe(value);
   // HIG's default is light modules on a dark tile.
   view.rerender(<QRCode value={value} color='#fafafa' background='#0a0a0a' size={240}/>);
   expect(await scan(view.container.querySelector('svg')!),`${value} reversed`).toBe(value);
   view.unmount();
  }
 },30000);
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
  const code=named[0].children[0] as HTMLElement,svg=code.querySelector('svg')!;
  expect(code.className).toBe('hig-qr-code');expect(code.getAttribute('aria-hidden')).toBe('true');expect(code.style.getPropertyValue('--hig-qr-code-size')).toBe('140px');expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');
  expect(svg.querySelector('rect')).toBeNull();expect(svg.querySelector('path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(eth)!.path);
  // As the Cuer code of the `wallet-address` entry is drawn: in the address's own text colour, so a host that recolours the component recolours the code.
  expect(fill(svg.querySelector('path'))).toBe('currentColor');
  expect((view.container.querySelector('.hig-vertical-address') as HTMLElement).style.getPropertyValue('--hig-address-row')).toBe('20px');
 });
 it('encodes qrValue and shows an arena at high error correction; a host qr replaces the code',()=>{
  const view=render(<WalletAddressCore address={sol} qrValue={`solana:${sol}?amount=1`} arena='/sol.png'/>);
  const code=view.container.querySelector('.hig-wallet-address-qr > .hig-qr-code')!;
  expect(code.querySelector('path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(`solana:${sol}?amount=1`,{arena:true})!.path);expect(code.querySelector('.hig-qr-code-arena > img')!.getAttribute('src')).toBe('/sol.png');
  view.rerender(<WalletAddressCore address={sol} qr={null}/>);expect(view.container.querySelector('.hig-qr-code path')!.getAttribute('d')).toBe(qr.qrCodeGeometry(sol)!.path);
  view.rerender(<WalletAddressCore address={sol} qrValue='unused' arena='/unused.png' qr={<svg data-testid='host-qr' aria-hidden='true'/>}/>);
  expect(screen.getByTestId('host-qr')).toBeTruthy();expect(view.container.querySelector('.hig-qr-code')).toBeNull();
 });
 it('copies as one button around HIG’s own code, which stays phrasing content inside it',async()=>{
  const view=render(<WalletAddressCore address={eth} arena='/eth.png' onCopy={()=>{}}/>);
  const button=screen.getByRole('button',{name:`Copy address: ${eth}`});
  // A button may hold only phrasing content: the code and its arena are spans, an svg and an img.
  expect([...button.querySelectorAll('.hig-wallet-address-qr *')].map(node=>node.tagName.toLowerCase()).filter(tag=>!['span','svg','path','img'].includes(tag))).toEqual([]);
  expect(view.container.querySelector('button div')).toBeNull();
 });
});
