// @vitest-environment jsdom
import React,{useState} from 'react';
import {readFileSync} from 'node:fs';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {FromPickerBlock,ToPickerBlock} from '../packages/hig/react/src/blocks/pickers';
import type {SwapToken} from '../packages/hig/react/src/blocks/swap-panel-block';
afterEach(cleanup);
const eth:SwapToken={id:'1-eth',symbol:'ETH',name:'Ether',chain:'Ethereum',chainId:1,balance:2,price:2000};
const usdc:SwapToken={id:'1-usdc',symbol:'USDC',name:'USD Coin',chain:'Ethereum',chainId:1,keywords:'0xa0b8'};
const aero:SwapToken={id:'8453-aero',symbol:'AERO',name:'Aerodrome',chain:'Base',chainId:8453};
const tokens=[eth,usdc,aero];
const rows=()=>screen.queryAllByRole('listitem').map(item=>item.querySelector('strong')?.textContent);
describe('ToPickerBlock',()=>{
 it('is a destination address field with a scan button on its own',async()=>{
  const scan=vi.fn();
  function Host(){const [address,setAddress]=useState('');return <><ToPickerBlock address={address} onAddressChange={setAddress} addressPlaceholder='DMzeeN…Xb32' onScan={scan}/><output>{address}</output></>;}
  render(<Host/>);
  const field=screen.getByRole('textbox',{name:'Recipient address'}) as HTMLInputElement;
  // The standard rounded HIG input, not a bespoke field.
  expect(field.className).toContain('hig-input');expect(field.placeholder).toBe('DMzeeN…Xb32');expect(field.getAttribute('autocapitalize')).toBe('none');
  await userEvent.type(field,'0xabc');expect(document.querySelector('output')?.textContent).toBe('0xabc');
  await userEvent.click(screen.getByRole('button',{name:'Scan QR code'}));expect(scan).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('searchbox')).toBeNull();expect(screen.queryByRole('list')).toBeNull();
  cleanup();
  render(<ToPickerBlock address='' onAddressChange={()=>{}}/>);
  expect(screen.queryByRole('button',{name:'Scan QR code'})).toBeNull();expect((screen.getByRole('textbox') as HTMLInputElement).placeholder).toBe('Recipient address');
 });
 it('adds the token list with the chain filter, search and a Hot section',async()=>{
  const select=vi.fn();render(<ToPickerBlock address='' onAddressChange={()=>{}} tokens={tokens} hotTokenIds={['8453-aero']} selected={usdc} onSelect={select}/>);
  expect(screen.getByRole('group',{name:'To'})).toBeTruthy();expect(rows()).toEqual(['Aerodrome','Ether','USD Coin']);expect(screen.getByText('Hot')).toBeTruthy();
  // Each section is its own named list holding only rows; headings and the empty text sit outside the lists.
  expect(within(screen.getByRole('list',{name:'Hot'})).getAllByRole('listitem')).toHaveLength(1);expect(within(screen.getByRole('list',{name:'All tokens'})).getAllByRole('listitem')).toHaveLength(2);
  for(const element of screen.getAllByRole('list'))expect([...element.children].every(child=>child.getAttribute('role')==='listitem')).toBe(true);
  expect(screen.getByText('Ethereum · Selected')).toBeTruthy();
  const search=screen.getByRole('searchbox',{name:'Search name or paste address'}) as HTMLInputElement;expect(search.className).toContain('hig-input');expect(search.placeholder).toBe('Search name or paste address');
  await userEvent.click(within(screen.getByRole('radiogroup',{name:'Chains'})).getByRole('radio',{name:'Base'}));expect(rows()).toEqual(['Aerodrome']);
  await userEvent.click(screen.getByRole('radio',{name:'All'}));await userEvent.type(search,'0xa0b8');expect(rows()).toEqual(['USD Coin']);
  await userEvent.clear(search);await userEvent.type(search,'zzz');expect(screen.getByRole('status').textContent).toBe('No tokens found');expect(screen.queryByRole('list')).toBeNull();
  await userEvent.clear(search);await userEvent.type(search,'eth{ArrowDown}{Enter}');expect(select).toHaveBeenLastCalledWith(usdc);
  await userEvent.click(screen.getAllByRole('listitem')[0].querySelector('button')!);expect(select).toHaveBeenLastCalledWith(eth);
 });
 it('leaves the chain filter out when asked, or when there is only one chain',()=>{
  const view=render(<ToPickerBlock tokens={tokens} chainFilter={false} onSelect={()=>{}}/>);
  expect(screen.queryByRole('radiogroup')).toBeNull();expect(rows()).toHaveLength(3);expect(screen.queryByRole('textbox',{name:'Recipient address'})).toBeNull();
  view.unmount();
  render(<ToPickerBlock tokens={[eth,usdc]} onSelect={()=>{}}/>);expect(screen.queryByRole('radiogroup')).toBeNull();
 });
});
describe('FromPickerBlock',()=>{
 it('offers Connect wallet and a Generate address switch while no wallet is connected',async()=>{
  const connect=vi.fn(),generate=vi.fn(),select=vi.fn();
  const view=render(<FromPickerBlock wallet={{connected:false}} onConnect={connect} generateAddress={false} onGenerateAddressChange={generate} tokens={tokens} onSelect={select}/>);
  expect(screen.getByRole('group',{name:'From'})).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Connect wallet'}));expect(connect).toHaveBeenCalledTimes(1);
  const toggle=screen.getByRole('switch',{name:'Generate address'}) as HTMLInputElement;expect(toggle.checked).toBe(false);
  // The switch only reports: the host owns the state, and nothing is selected by toggling it.
  await userEvent.click(toggle);expect(generate).toHaveBeenCalledWith(true);expect(select).not.toHaveBeenCalled();
  view.rerender(<FromPickerBlock wallet={{connected:false}} onConnect={connect} generateAddress onGenerateAddressChange={generate} tokens={tokens} onSelect={select}/>);
  expect((screen.getByRole('switch',{name:'Generate address'}) as HTMLInputElement).checked).toBe(true);
  await userEvent.click(screen.getAllByRole('listitem')[2].querySelector('button')!);expect(select).toHaveBeenCalledWith(aero);
  view.rerender(<FromPickerBlock wallet={{connected:false}} onConnect={connect} tokens={tokens} onSelect={select}/>);expect(screen.queryByRole('switch')).toBeNull();
  view.rerender(<FromPickerBlock wallet={{connected:false}} tokens={tokens} onSelect={select}/>);expect(screen.queryByRole('button',{name:'Connect wallet'})).toBeNull();expect(document.querySelector('.hig-swap-wallet')).toBeNull();
 });
 it('shows a connected wallet, with the disconnect button only when the host passes a handler',async()=>{
  const disconnect=vi.fn();
  const view=render(<FromPickerBlock wallet={{connected:true,address:'DMzeeNq7UYBu4tYbJdc3bVzBhXb32'}} onDisconnect={disconnect} onConnect={()=>{}} onGenerateAddressChange={()=>{}} tokens={tokens} onSelect={()=>{}}/>);
  expect(document.querySelector('.hig-swap-wallet-id')?.textContent).toBe('DMzeeN…Xb32');expect(screen.queryByRole('button',{name:'Connect wallet'})).toBeNull();expect(screen.queryByRole('switch')).toBeNull();
  await userEvent.click(screen.getByRole('button',{name:'Disconnect wallet'}));expect(disconnect).toHaveBeenCalledTimes(1);
  // Balances show for held tokens.
  const drawn=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
  expect(drawn(screen.getAllByRole('listitem')[0])).toBe('ETHEtherEthereum2$4,000.00');
  // A balance that changes while the list is open rolls its changed places.
  Object.defineProperty(HTMLElement.prototype,'animate',{value:()=>({cancel(){}}),configurable:true});
  view.rerender(<FromPickerBlock wallet={{connected:true,address:'DMzeeNq7UYBu4tYbJdc3bVzBhXb32'}} onDisconnect={disconnect} onConnect={()=>{}} onGenerateAddressChange={()=>{}} tokens={[{...tokens[0],balance:3},...tokens.slice(1)]} onSelect={()=>{}}/>);
  expect(drawn(screen.getAllByRole('listitem')[0])).toBe('ETHEtherEthereum3$6,000.00');expect(screen.getAllByRole('listitem')[0].querySelectorAll('.hig-animated-number-old').length).toBeGreaterThan(1);delete (HTMLElement.prototype as {animate?:unknown}).animate;
  view.rerender(<FromPickerBlock wallet={{connected:true,address:'DMzeeNq7UYBu4tYbJdc3bVzBhXb32'}} tokens={tokens} onSelect={()=>{}}/>);
  expect(screen.queryByRole('button',{name:'Disconnect wallet'})).toBeNull();expect(document.querySelector('.hig-swap-wallet-id')).toBeTruthy();
 });
 it('lists a whitelist with no wallet row, and says so when a wallet holds nothing or is still loading',()=>{
  const view=render(<FromPickerBlock tokens={[eth,usdc]} chainFilter={false} onSelect={()=>{}}/>);
  expect(document.querySelector('.hig-swap-wallet')).toBeNull();expect(rows()).toEqual(['Ether','USD Coin']);
  view.rerender(<FromPickerBlock wallet={{connected:true,address:'0xabc'}} tokens={[]} chains={[{chainId:1,name:'Ethereum'},{chainId:8453,name:'Base'}]} onSelect={()=>{}}/>);
  expect(screen.getByRole('status').textContent).toBe('No tokens found');expect(screen.getByRole('radiogroup',{name:'Chains'})).toBeTruthy();
  view.rerender(<FromPickerBlock wallet={{connected:true,address:'0xabc'}} tokens={[]} loading onSelect={()=>{}}/>);expect(screen.getByRole('status').textContent).toBe('Loading…');
 });
 it('is free of overlay and sheet backends, so a host can place it in any container',()=>{
  expect(readFileSync('packages/hig/react/src/blocks/pickers.tsx','utf8')).not.toMatch(/dialog|gesture-sheet|radix|vaul/);
 });
});
