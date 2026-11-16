// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {AssetsBlock,filterAssets,type AssetCategory,type AssetItem} from '../packages/hig/react/src/blocks/assets-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const categories:AssetCategory[]=[{id:'crypto',label:'Crypto',status:{label:'OPEN'}},{id:'commodities',label:'Commodities',status:{label:'OPEN'}},{id:'stocks',label:'Stocks'}];
const assets:AssetItem[]=[
 {id:'BTC',name:'Bitcoin',symbol:'BTC',detail:'40×',category:'crypto',signal:'watch',position:true},
 {id:'ETH',name:'Ethereum',symbol:'ETH',detail:'25×',category:'crypto',signal:'up'},
 {id:'XRP',name:'Ripple',symbol:'XRP',category:'crypto',signal:null},
 {id:'GOLD',name:'Gold',symbol:'GOLD',category:'commodities',signal:null,keywords:'XAU'},
 {id:'ORPHAN',name:'Orphan',symbol:'ORP',category:'unlisted'},
];
const mount=(props:Partial<React.ComponentProps<typeof AssetsBlock>>={})=>render(<HIGProvider><AssetsBlock assets={assets} categories={categories} onSelect={()=>{}} {...props}/></HIGProvider>);
describe('filterAssets',()=>{
 it('groups by category in host order, drops empty and unlisted sections, and filters by view, category and query',()=>{
  const ids=(sections:ReturnType<typeof filterAssets>)=>sections.map(s=>[s.category.id,s.assets.map(a=>a.id)]);
  expect(ids(filterAssets(assets,categories))).toEqual([['crypto',['BTC','ETH','XRP']],['commodities',['GOLD']]]);
  expect(ids(filterAssets(assets,categories,{view:'positions'}))).toEqual([['crypto',['BTC']]]);
  expect(ids(filterAssets(assets,categories,{view:'trend'}))).toEqual([['crypto',['BTC','ETH']]]);
  expect(ids(filterAssets(assets,categories,{category:'commodities'}))).toEqual([['commodities',['GOLD']]]);
  expect(ids(filterAssets(assets,categories,{query:'xau'}))).toEqual([['commodities',['GOLD']]]);
  expect(ids(filterAssets(assets,categories,{query:' éth '}))).toEqual([['crypto',['ETH']]]);
 });
});
describe('AssetsBlock',()=>{
 it('draws the header, search, capsules, views and sections with status read in the heading',async()=>{
  const close=vi.fn();mount({onClose:close});
  expect(screen.getByRole('heading',{level:2,name:'Assets'})).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Close'}));expect(close).toHaveBeenCalledOnce();
  expect(screen.getByRole('searchbox',{name:'Search markets'})).toBeTruthy();
  expect(within(screen.getByRole('radiogroup',{name:'Market categories'})).getAllByRole('radio').map(r=>r.closest('label')?.textContent)).toEqual(['All','Crypto','Commodities','Stocks']);
  expect(within(screen.getByRole('group',{name:'View'})).getAllByRole('radio')).toHaveLength(3);
  expect(screen.getByRole('heading',{level:3,name:'Crypto, OPEN'})).toBeTruthy();
  expect(screen.queryByRole('heading',{name:/Stocks/})).toBeNull();
  expect(screen.queryByText('Orphan')).toBeNull();
 });
 it('names each row by market, symbol line and signal, and reports the press',async()=>{
  const select=vi.fn();mount({onSelect:select,selectedId:'BTC'});
  const btc=screen.getByRole('button',{name:'Bitcoin, BTC · 40×, Watch'});
  expect(btc.getAttribute('aria-current')).toBe('true');
  expect(screen.getByRole('button',{name:'Ethereum, ETH · 25×, Rising'})).toBeTruthy();
  expect(screen.getByRole('button',{name:'Ripple, XRP'}).querySelector('.hig-assets-signal')).toBeTruthy();
  await userEvent.click(btc);expect(select).toHaveBeenCalledWith(assets[0]);
 });
 it('switches views and categories, searches, and shows the empty text for each case',async()=>{
  const onView=vi.fn();mount({onViewChange:onView});
  const views=within(screen.getByRole('group',{name:'View'})),capsules=within(screen.getByRole('radiogroup',{name:'Market categories'}));
  await userEvent.click(views.getByRole('radio',{name:'Positions'}));
  expect(onView).toHaveBeenCalledWith('positions');
  expect(screen.queryByRole('button',{name:/Ethereum/})).toBeNull();
  await userEvent.click(capsules.getByRole('radio',{name:'Commodities'}));
  expect(screen.getByRole('status').textContent).toBe('No open positions');
  await userEvent.click(views.getByRole('radio',{name:'Trend'}));
  expect(screen.getByRole('status').textContent).toBe('No trending markets');
  await userEvent.click(views.getByRole('radio',{name:'All'}));await userEvent.click(capsules.getByRole('radio',{name:'All'}));
  await userEvent.type(screen.getByRole('searchbox'),'zzz');
  expect(screen.getByRole('status').textContent).toBe('No results');
 });
 it('draws host trailing content before the disc, read through trailingLabel, and clears the query when clearable',async()=>{
  const onQuery=vi.fn();
  const {container}=mount({assets:[{...assets[0],trailing:<b data-testid='pnl'>+$12.50</b>,trailingLabel:'open position'},assets[1]],query:'b',onQueryChange:onQuery});
  const btc=screen.getByRole('button',{name:'Bitcoin, BTC · 40×, open position, Watch'});
  const trailing=btc.querySelector('.hig-assets-trailing');
  expect(trailing?.getAttribute('aria-hidden')).toBe('true');expect(trailing?.textContent).toBe('+$12.50');
  expect(trailing?.nextElementSibling?.classList.contains('hig-assets-signal')).toBe(true);
  expect(container.querySelectorAll('.hig-assets-trailing')).toHaveLength(1);
  // Without clearable the field has no clear button; with it, the button empties the query.
  expect(screen.queryByRole('button',{name:'Clear search'})).toBeNull();
  cleanup();mount({clearable:true,query:'b',onQueryChange:onQuery});
  await userEvent.click(screen.getByRole('button',{name:'Clear search'}));
  expect(onQuery).toHaveBeenCalledWith('');
  expect(document.activeElement).toBe(screen.getByRole('searchbox'));
  cleanup();mount({clearable:true,query:''});expect(screen.queryByRole('button',{name:'Clear search'})).toBeNull();
 });
 it('takes controlled state, host translations and the blocks aggregate',()=>{
  render(<HIGProvider messages={{assetsTrend:'Tendance',signalUp:'En hausse'}}><blocks.AssetsBlock assets={assets} categories={categories} onSelect={()=>{}} view='trend' category='crypto' query='eth'/></HIGProvider>);
  expect(screen.getByRole('radio',{name:'Tendance'})).toHaveProperty('checked',true);
  expect(screen.getAllByRole('button',{name:/,/}).map(b=>b.getAttribute('aria-label'))).toEqual(['Ethereum, ETH · 25×, En hausse']);
 });
});
describe('AssetsBlock opening countdown',()=>{
 it('counts down to a legacy market reopening in place of status, reads it in words, then falls back to status',async()=>{
  vi.useFakeTimers({toFake:['setInterval','clearInterval','Date']});
  const {act}=await import('@testing-library/react');
  vi.setSystemTime(new Date('2026-11-16T12:00:00Z'));
  const opensAt=Date.now()+((2*60+14)*60+33)*1000;
  render(<HIGProvider><AssetsBlock assets={assets} categories={[categories[0],{id:'commodities',label:'Commodities',status:{label:'OPEN'},opensAt}]} onSelect={()=>{}}/></HIGProvider>);
  const badge=()=>document.querySelector('[data-countdown]');
  expect(badge()?.textContent).toBe('Opens in 2:14:33');
  expect(screen.getByRole('heading',{level:3,name:'Commodities, Opens in 2 hours 14 minutes'})).toBeTruthy();
  act(()=>{vi.advanceTimersByTime(1000);});
  expect(badge()?.textContent).toBe('Opens in 2:14:32');
  act(()=>{vi.setSystemTime(opensAt+1);vi.advanceTimersByTime(1000);});
  expect(badge()).toBeNull();
  expect(screen.getByRole('heading',{level:3,name:'Commodities, OPEN'})).toBeTruthy();
  vi.useRealTimers();
 });
 it('never renders a clock in server HTML',async()=>{
  const {renderToString}=await import('react-dom/server');
  const html=renderToString(<HIGProvider><AssetsBlock assets={assets} categories={[{id:'crypto',label:'Crypto',opensAt:Date.now()+60000}]} onSelect={()=>{}}/></HIGProvider>);
  expect(html).not.toContain('Opens in');
 });
 it('names its heading with headingId, pins the header with stickyHeader, and keeps each row one line',async()=>{
  const {readFileSync}=await import('node:fs');
  const {container}=mount({headingId:'assets-title',stickyHeader:true});
  expect(screen.getByRole('heading',{level:2,name:'Assets'}).id).toBe('assets-title');
  expect(container.querySelector('.hig-screen-header')?.hasAttribute('data-sticky')).toBe(true);
  cleanup();const plain=mount();expect(plain.container.querySelector('.hig-screen-header')?.hasAttribute('data-sticky')).toBe(false);
  // The name and the symbol line truncate rather than wrap.
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  expect(css).toContain('.hig-assets-text > * { overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }');
 });
});
