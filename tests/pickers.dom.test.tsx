// @vitest-environment jsdom
import React,{useState} from 'react';
import {readFileSync} from 'node:fs';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {FromPickerBlock,ToPickerBlock} from '../packages/hig/react/src/blocks/pickers';
import type {SwapToken} from '../packages/hig/react/src/blocks/swap-block';
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

it('ranks each available hot token once while preserving the remaining catalog order',()=>{
 const props={tokens,onSelect:vi.fn()};
 const {rerender}=render(<ToPickerBlock {...props} hotTokenIds={['missing',aero.id,aero.id,eth.id]}/>);
 expect(rows()).toEqual([aero.name,eth.name,usdc.name]);
 rerender(<ToPickerBlock {...props} hotTokenIds={[aero.id,usdc.id,eth.id]}/>);
 expect(rows()).toEqual([eth.name,usdc.name,aero.name]);
});

it('windows a large token catalog while retaining named sections and full counts',()=>{
 const catalog=Array.from({length:1000},(_,i)=>({...eth,id:String(i),name:'Token '+i}));
 const hot=catalog.slice(-100).map(token=>token.id);
 render(<ToPickerBlock tokens={catalog} hotTokenIds={hot} onSelect={vi.fn()}/>);
 const lists=screen.getAllByRole('list');
 expect(lists).toHaveLength(2);
 expect(lists.map(list=>list.querySelector('[role=listitem]')?.getAttribute('aria-setsize'))).toEqual(['100','900']);
 expect(screen.getAllByRole('listitem').length).toBeLessThan(65);
});

it('scans a large catalog once per typing burst and resolves an immediate Enter against the field',()=>{
 vi.useFakeTimers();
 try{
  let reads=0;
  const catalog=Array.from({length:1000},(_,i)=>({...eth,id:String(i),get keywords(){reads++;return 'key'+i;}}));
  const select=vi.fn();
  const view=render(<ToPickerBlock tokens={catalog} onSelect={select}/>);
  const input=screen.getByRole('searchbox') as HTMLInputElement;
  for(const value of ['k','ke','key999'])fireEvent.change(input,{target:{value}});
  expect(input.value).toBe('key999');expect(reads).toBe(0);
  act(()=>vi.advanceTimersByTime(150));
  expect(reads).toBe(1000);expect(rows()).toHaveLength(1);
  fireEvent.change(input,{target:{value:'key888'}});
  fireEvent.keyDown(input,{key:'Enter'});
  expect(reads).toBe(1000);expect(select.mock.calls[0][0]).toBe(catalog[888]);
  const renamed=catalog.map(token=>({...token,keywords:'replaced'}));
  view.rerender(<ToPickerBlock tokens={renamed} onSelect={select}/>);
  expect(rows()).toHaveLength(0);
 }finally{vi.useRealTimers();}
});

it('keeps visible token rows stable while typing and redraws only changed selection and focus',()=>{
 const catalog=Array.from({length:1000},(_,i)=>({...eth,id:String(i)}));
 const tokenRowProps=vi.fn((token:SwapToken)=>({'data-token':token.id}));
 const props={tokens:catalog,onSelect:vi.fn(),tokenRowProps,onAddressChange:vi.fn()};
 const picker=(address:string,selected:SwapToken)=><ToPickerBlock {...props} address={address} selected={selected}/>;
 const view=render(picker('',catalog[0]));
 expect(tokenRowProps.mock.calls.length).toBeGreaterThan(1);
 tokenRowProps.mockClear();
 view.rerender(picker('0x1',catalog[0]));
 const address=tokenRowProps.mock.calls.length;
 tokenRowProps.mockClear();
 view.rerender(picker('0x1',catalog[1]));
 const selection=tokenRowProps.mock.calls.map(([token])=>token.id);
 tokenRowProps.mockClear();
 const input=screen.getByRole('searchbox');
 fireEvent.keyDown(input,{key:'ArrowDown'});
 const focus=tokenRowProps.mock.calls.map(([token])=>token.id);
 fireEvent.keyDown(input,{key:'ArrowUp'});
 tokenRowProps.mockClear();
 for(const value of ['e','et','eth'])fireEvent.change(input,{target:{value}});
 expect({address,selection,focus,typing:tokenRowProps.mock.calls.length}).toEqual({address:0,selection:['0','1'],focus:['0','1'],typing:0});
});

it('does no chain discovery for a hidden filter and reuses visible options while typing',()=>{
 let idReads=0,nameReads=0;
 const catalog=Array.from({length:1000},(_,i)=>({...eth,id:String(i),get chainId(){idReads++;return i%20;}}));
 const options=Array.from({length:20},(_,i)=>({chainId:i,get name(){nameReads++;return 'Chain '+i;}}));
 const props={tokens:catalog,onSelect:vi.fn()};
 const view=render(<ToPickerBlock {...props} chainFilter={false}/>);
 const hiddenReads=idReads;
 view.rerender(<ToPickerBlock {...props} chains={options}/>);
 expect(screen.getAllByRole('radio')).toHaveLength(21);
 nameReads=0;
 const input=screen.getByRole('searchbox');
 for(const value of ['e','et','eth'])fireEvent.change(input,{target:{value}});
 expect({hiddenReads,typedReads:nameReads}).toEqual({hiddenReads:0,typedReads:0});
 fireEvent.click(screen.getByRole('radio',{name:'Chain 2'}));
 expect(screen.getByRole('radio',{name:'Chain 2'})).toHaveProperty('checked',true);
});
