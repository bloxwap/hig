// @vitest-environment jsdom
import React from 'react';
import {readFileSync} from 'node:fs';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {VerticalAddress,addressKind,addressRows} from '../packages/hig/react/src/data';
import {WalletAddress} from '../packages/hig/react/src/wallet-address';
import {Toaster,dismissToast} from '../packages/hig/react/src/toast';
afterEach(()=>{dismissToast();cleanup();});
const eth='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688',sol='6uRAouaynVhU87V9iMaWy616295tf2ZnZQv2YxAcPnhQ';
const rowsOf=(root:ParentNode)=>[...root.querySelectorAll('.hig-vertical-address > [aria-hidden] > span')].map(row=>row.textContent);
const anchorsOf=(root:ParentNode)=>[...root.querySelectorAll('.hig-vertical-address [data-anchor]')].map(node=>node.textContent).join('');
describe('VerticalAddress',()=>{
 it('lays out a 34-character vertical Bitcoin address in five columns and seven rows',()=>{
  const bitcoin='1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
  const view=render(<VerticalAddress address={bitcoin} kind='bitcoin'/>);
  const rows=rowsOf(view.container);
  expect(rows.join('')).toBe(bitcoin);
  expect(rows).toEqual(['1A1zP','1eP5Q','Gefi2','DMPTf','TL5SL','mv7Di','vfNa']);
  expect(anchorsOf(view.container)).toBe('1A1zvfNa');
 });
 it('lays Ethereum-style addresses out in 7 rows of 6 and Solana in 11 rows of 4',()=>{
  expect(addressKind(eth)).toBe('ethereum');expect(addressKind(sol)).toBe('solana');
  expect(addressRows(eth,'ethereum')).toEqual(['0x9e0f','D06228','74ca1c','Bf79DA','087BaF','4622Fa','f77688']);
  expect(addressRows(sol,'solana')).toEqual(['6uRA','ouay','nVhU','87V9','iMaW','y616','295t','f2Zn','ZQv2','YxAc','PnhQ']);
  const view=render(<><VerticalAddress address={eth}/><VerticalAddress address={sol}/></>);
  const [first,second]=[...view.container.querySelectorAll('.hig-vertical-address')];
  expect(first.getAttribute('data-kind')).toBe('ethereum');expect(second.getAttribute('data-kind')).toBe('solana');
  expect([...first.querySelectorAll('[aria-hidden] > span')].length).toBe(7);expect([...second.querySelectorAll('[aria-hidden] > span')].length).toBe(11);
 });
 it('emphasises the leading row and the trailing four characters, and exposes the plain address once',()=>{
  const view=render(<VerticalAddress address={eth} rowHeight={28}/>);
  expect(rowsOf(view.container).join('')).toBe(eth);expect(anchorsOf(view.container)).toBe('0x9e0f7688');
  const root=view.container.querySelector('.hig-vertical-address') as HTMLElement;
  expect(root.querySelector('.hig-sr-only')?.textContent).toBe(eth);expect(root.getAttribute('dir')).toBe('ltr');expect(root.getAttribute('translate')).toBe('no');
  expect(root.style.getPropertyValue('--hig-address-row')).toBe('28px');
  view.unmount();
  const solana=render(<VerticalAddress address={sol}/>);expect(anchorsOf(solana.container)).toBe('6uRAPnhQ');
  solana.unmount();
  // `kind` overrides the inference, for a chain whose addresses are not 0x-prefixed but should group in sixes.
  const forced=render(<VerticalAddress address={sol} kind='ethereum'/>);expect(rowsOf(forced.container)[0]).toBe('6uRAou');
 });
});
describe('WalletAddress',()=>{
 it('draws HIG\'s QR code beside the address, sized so the column matches the code',()=>{
  const view=render(<WalletAddress address={eth} size={140}/>);
  const root=view.container.querySelector('.hig-wallet-address') as HTMLElement;
  expect(root.tagName).toBe('DIV');expect(root.style.getPropertyValue('--hig-qr')).toBe('140px');
  const code=screen.getByRole('img',{name:'QR code'});expect(code.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');expect(code.querySelectorAll('svg path,svg rect').length).toBeGreaterThan(0);
  expect((root.querySelector('.hig-vertical-address') as HTMLElement).style.getPropertyValue('--hig-address-row')).toBe('20px');
  // Not a button and no hint without a clipboard adapter.
  expect(screen.queryByRole('button')).toBeNull();expect(screen.queryByText('Tap to copy')).toBeNull();
  view.unmount();
  const solana=render(<WalletAddress address={sol} size={220}/>);
  expect((solana.container.querySelector('.hig-vertical-address') as HTMLElement).style.getPropertyValue('--hig-address-row')).toBe('20px');
 });
 it('encodes qrValue instead of the address and places an arena image in the centre',()=>{
  const plain=render(<WalletAddress address={eth}/>);const base=plain.container.querySelector('svg')!.innerHTML;plain.unmount();
  const view=render(<WalletAddress address={eth} qrValue={`ethereum:${eth}@8453`} arena='/eth.png'/>);
  const svg=view.container.querySelector('svg')!;expect(svg.innerHTML).not.toBe(base);
  // The arena is an HTML box over the drawing, so every browser paints the image.
  expect(view.container.querySelector('.hig-qr-code-arena img')?.getAttribute('src')).toBe('/eth.png');expect(rowsOf(view.container).join('')).toBe(eth);
 });
 it('copies through the host adapter as one button, with a hint and a notice',async()=>{
  const copy=vi.fn();render(<HIGProvider><WalletAddress address={eth} onCopy={copy}/><Toaster/></HIGProvider>);
  const button=screen.getByRole('button',{name:`Copy address: ${eth}`});expect(button.textContent).toContain('Tap to copy');
  await userEvent.click(button);expect(copy).toHaveBeenCalledTimes(1);
  expect(await screen.findByRole('button',{name:'Dismiss Address copied'})).toBeTruthy();
 });
 it('announces the copy inline when no toaster is mounted and stays quiet when the copy fails',async()=>{
  render(<WalletAddress address={sol} onCopy={()=>{}}/>);
  await userEvent.click(screen.getByRole('button',{name:`Copy address: ${sol}`}));
  expect((await screen.findByText('Address copied')).className).toBe('hig-sr-only');
  cleanup();
  render(<WalletAddress address={sol} onCopy={()=>Promise.reject(new Error('denied'))}/>);
  await userEvent.click(screen.getByRole('button',{name:`Copy address: ${sol}`}));await Promise.resolve();
  expect(screen.queryByText('Address copied')).toBeNull();
 });
 it('uses the provider translations',()=>{
  render(<HIGProvider messages={{tapToCopy:'Toucher pour copier',copyAddress:'Copier l’adresse',qrCode:'Code QR'}}><WalletAddress address={eth} onCopy={()=>{}}/></HIGProvider>);
  expect(screen.getByRole('button',{name:`Copier l’adresse: ${eth}`}).textContent).toContain('Toucher pour copier');expect(screen.getByRole('img',{name:'Code QR'})).toBeTruthy();
 });
 it('needs no QR package: the code is HIG\'s own, on the one web path',()=>{
  for(const file of ['data.tsx','blocks/swap-block.tsx','blocks.tsx','wallet-address.tsx','qr-code.tsx'])expect(readFileSync(`packages/hig/react/src/${file}`,'utf8')).not.toMatch(/from 'cuer/);
  const manifest=JSON.parse(readFileSync('packages/hig/package.json','utf8'));
  expect(Object.keys({...manifest.peerDependencies,...manifest.peerDependenciesMeta})).not.toContain('cuer');
  expect(manifest.exports['./react/wallet-address-core']).toBeUndefined();expect(manifest.exports['./react/wallet-address']).toBeDefined();
 });
});
