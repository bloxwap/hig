// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
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
  let statusReads=0;
  const expired={...categories[0],opensAt:Date.now()-1000,get status(){statusReads++;return {label:'OPEN'};}};
  let rowReads=0;
  const markets=Array.from({length:100},(_,i)=>({...assets[3],id:String(i),get name(){rowReads++;return 'Gold';}}));
  markets.push({...assets[0],id:'expired',name:'Expired'});
  render(<HIGProvider><AssetsBlock assets={markets} categories={[expired,{id:'commodities',label:'Commodities',status:{label:'OPEN'},opensAt}]} onSelect={()=>{}}/></HIGProvider>);
  const badge=()=>document.querySelector('[data-countdown]');const shown=()=>badge()?.querySelector('.hig-animated-number-visual')?.textContent;
  expect(shown()).toBe('Opens in 2:14:33');
  expect(screen.getByRole('heading',{level:3,name:'Commodities, Opens in 2 hours 14 minutes'})).toBeTruthy();
  expect(statusReads).toBeGreaterThan(0);
  statusReads=0;rowReads=0;
  act(()=>{vi.advanceTimersByTime(1000);});
  expect(rowReads).toBe(0);
  expect(statusReads).toBe(0);
  expect(shown()).toBe('Opens in 2:14:32');
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
 it('reads the host clock, freezes while paused, and runs no timer while no countdown section is shown',async()=>{
  vi.useFakeTimers({toFake:['setInterval','clearInterval']});
  const {act}=await import('@testing-library/react');
  let clock=1_000_000;const now=()=>clock;const opensAt=clock+65_000;
  const spy=vi.spyOn(globalThis,'setInterval');
  const cats=[categories[0],{id:'commodities',label:'Commodities',status:{label:'OPEN'},opensAt}];
  const props={assets,categories:cats,onSelect:()=>{},now};
  // Filtered to crypto, the countdown section is not on screen, so nothing ticks.
  const {rerender}=render(<HIGProvider><AssetsBlock {...props} category='crypto'/></HIGProvider>);
  expect(spy).not.toHaveBeenCalled();
  rerender(<HIGProvider><AssetsBlock {...props} category=''/></HIGProvider>);
  const badge=()=>document.querySelector('[data-countdown] .hig-animated-number-visual')?.textContent;
  expect(badge()).toBe('Opens in 0:01:05');expect(spy).toHaveBeenCalledTimes(1);
  act(()=>{clock+=1000;vi.advanceTimersByTime(1000);});expect(badge()).toBe('Opens in 0:01:04');
  rerender(<HIGProvider><AssetsBlock {...props} paused/></HIGProvider>);
  act(()=>{clock+=5000;vi.advanceTimersByTime(5000);});expect(badge()).toBe('Opens in 0:01:04');expect(spy).toHaveBeenCalledTimes(1);
  rerender(<HIGProvider><AssetsBlock {...props}/></HIGProvider>);expect(badge()).toBe('Opens in 0:00:59');
  // Paused past the opening, a host re-render (new assets) keeps the frozen text; unpausing shows the status.
  rerender(<HIGProvider><AssetsBlock {...props} paused/></HIGProvider>);clock+=120_000;
  rerender(<HIGProvider><AssetsBlock {...props} assets={[...assets]} paused/></HIGProvider>);expect(badge()).toBe('Opens in 0:00:59');
  rerender(<HIGProvider><AssetsBlock {...props}/></HIGProvider>);expect(badge()).toBeUndefined();
  expect(screen.getByRole('heading',{name:/^Commodities/}).getAttribute('aria-label')).toBe('Commodities, OPEN');
  spy.mockRestore();vi.useRealTimers();
 });
 it('rolls the countdown digits each tick, and while paused neither ticks nor rolls, even when the opening moves',async()=>{
  vi.useFakeTimers({toFake:['setInterval','clearInterval']});
  const {act}=await import('@testing-library/react');
  // jsdom has no Web Animations; a stub that never finishes leaves each roll observable.
  const original=Element.prototype.animate;const animate=vi.fn(()=>({cancel:vi.fn(),onfinish:null}) as unknown as Animation);Element.prototype.animate=animate;
  try{
   let clock=1_000_000;const now=()=>clock;const opensAt=clock+65_000;
   const spy=vi.spyOn(globalThis,'setInterval');
   const cats=(at:number)=>[categories[0],{id:'commodities',label:'Commodities',status:{label:'OPEN'},opensAt:at}];
   const tree=(props:Partial<React.ComponentProps<typeof AssetsBlock>>)=><HIGProvider reducedMotion={false}><AssetsBlock assets={assets} categories={cats(opensAt)} onSelect={()=>{}} now={now} {...props}/></HIGProvider>;
   const {rerender}=render(tree({}));
   const reading=()=>document.querySelector('[data-countdown] .hig-sr-only')?.textContent;
   expect(reading()).toBe('Opens in 0:01:05');expect(animate).not.toHaveBeenCalled();
   act(()=>{clock+=1000;vi.advanceTimersByTime(1000);});
   expect(reading()).toBe('Opens in 0:01:04');expect(animate).toHaveBeenCalled();
   const rolled=animate.mock.calls.length;
   rerender(tree({paused:true}));
   act(()=>{clock+=5000;vi.advanceTimersByTime(5000);});
   expect(reading()).toBe('Opens in 0:01:04');expect(animate).toHaveBeenCalledTimes(rolled);
   // The host moves the opening while paused: the text follows against the frozen clock, settled at once with no roll.
   rerender(tree({paused:true,categories:cats(opensAt+10_000)}));
   expect(reading()).toBe('Opens in 0:01:14');expect(animate).toHaveBeenCalledTimes(rolled);expect(spy).toHaveBeenCalledTimes(1);
   expect(document.querySelector('[data-countdown] [data-hig-animated-number-change]')).toBeNull();
   // Unpaused, the clock is read again and the timer resumes.
   rerender(tree({categories:cats(opensAt+10_000)}));
   expect(reading()).toBe('Opens in 0:01:09');expect(spy).toHaveBeenCalledTimes(2);
   spy.mockRestore();
  }finally{Element.prototype.animate=original;vi.useRealTimers();}
 });
});
describe('AssetsBlock empty action, selected disc and keyboard',()=>{
 it('draws emptyAction under the empty text only while the list is empty and not loading',async()=>{
  const press=vi.fn();const action={label:'Browse all markets',onPress:press,testID:'browse-all'};
  mount({view:'positions',category:'commodities',emptyAction:action});
  const button=screen.getByRole('button',{name:'Browse all markets'});
  expect(button.getAttribute('data-testid')).toBe('browse-all');expect(button.classList.contains('hig-button')).toBe(true);
  expect(screen.getByRole('status').nextElementSibling).toBe(button);
  await userEvent.click(button);expect(press).toHaveBeenCalledOnce();
  cleanup();mount({assets:[],loading:true,emptyAction:action});expect(screen.queryByRole('button',{name:'Browse all markets'})).toBeNull();
  cleanup();mount({emptyAction:action});expect(screen.queryByRole('button',{name:'Browse all markets'})).toBeNull();
 });
 it('lines the section heading up with the row content and runs the capsules out to the sheet gutter',async()=>{
  const {readFileSync}=await import('node:fs');
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  // The heading and badge sit 8 in, as the row's padding (`.hig-assets-row { ...padding:8px }`), so they align with the icon and the disc.
  expect(css).toContain('.hig-assets-section-header { display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:32px;padding-inline:8px; }');
  expect(css).toContain('.hig-assets-row { position:relative;min-height:64px;padding:8px; }');
  // The capsule row bleeds by --hig-filter-bleed (8 in AssetsBlock, the sheet content gutter) and insets its first and last capsule by as much.
  expect(css).toContain('.hig-assets-block { --hig-filter-bleed:8px; }');
  expect(css).toContain('margin:-4px calc(-4px - var(--hig-filter-bleed,0px));padding:4px calc(4px + var(--hig-filter-bleed,0px));scroll-padding-inline:var(--hig-filter-bleed,0px);');
  // The block leaves the inline variable to the stylesheet, so a host can set it on the block.
  mount({style:{'--hig-filter-bleed':'0px'} as React.CSSProperties});
  const strip=screen.getByRole('radiogroup',{name:'Market categories'});expect(strip.getAttribute('style')).toBeNull();
  expect(strip.closest('.hig-assets-block')?.getAttribute('style')).toContain('--hig-filter-bleed: 0px');
  cleanup();
  const {Filter}=await import('../packages/hig/react/src/selection');
  render(<HIGProvider><Filter label='Chains' bleed={20} options={[{value:'',label:'All'},{value:'1',label:'Ethereum'}]}/></HIGProvider>);
  expect(screen.getByRole('radiogroup',{name:'Chains'}).style.getPropertyValue('--hig-filter-bleed')).toBe('20px');
 });
 it('steps the empty disc up to the raised fill on a filled row',async()=>{
  const {readFileSync}=await import('node:fs');
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  expect(css).toContain(".hig-assets-row:is(:active,[aria-current='true'],[data-active]) .hig-assets-signal:not([data-signal]) { background:var(--hig-fill-raised); }");
  mount({selectedId:'XRP'});
  const xrp=screen.getByRole('button',{name:'Ripple, XRP'});
  expect(xrp.matches("[aria-current='true']")).toBe(true);expect(xrp.querySelector('.hig-assets-signal:not([data-signal])')).toBeTruthy();
 });
 it('moves an active row with the arrow keys from the search field, skips disabled rows, and chooses it with Enter',async()=>{
  const select=vi.fn();
  const {container}=mount({onSelect:select,assets:[assets[0],{...assets[1],disabled:true},assets[2],assets[3]]});
  expect([...container.querySelectorAll('[data-asset-id]')].map(row=>row.getAttribute('data-asset-id'))).toEqual(['BTC','ETH','XRP','GOLD']);
  const search=screen.getByRole('searchbox');search.focus();
  const active=()=>container.querySelector('[data-active]');
  // Focus stays in the field, so the active row is spoken through a polite live line, not an aria-activedescendant the rows cannot honour.
  const spoken=()=>container.querySelector('.hig-assets-cursor[aria-live="polite"]')?.textContent;
  expect(active()).toBeNull();expect(spoken()).toBe('');expect(search.hasAttribute('aria-activedescendant')).toBe(false);
  await userEvent.keyboard('{ArrowDown}');expect(active()?.getAttribute('data-asset-id')).toBe('BTC');
  expect(spoken()).toBe(active()?.getAttribute('aria-label'));expect(search.hasAttribute('aria-activedescendant')).toBe(false);
  await userEvent.keyboard('{ArrowDown}');expect(active()?.getAttribute('data-asset-id')).toBe('XRP');
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');expect(active()?.getAttribute('data-asset-id')).toBe('GOLD');
  await userEvent.keyboard('{ArrowUp}');expect(active()?.getAttribute('data-asset-id')).toBe('XRP');
  await userEvent.keyboard('{Enter}');expect(select).toHaveBeenCalledWith(assets[2]);
  expect(document.activeElement).toBe(search);
  // Typing resets the cursor; Enter then chooses the only match.
  await userEvent.type(search,'gold');expect(active()).toBeNull();
  await userEvent.keyboard('{Enter}');expect(select).toHaveBeenLastCalledWith(assets[3]);
 });
 it('keeps the active row on its market when the host reorders or drops rows',async()=>{
  const select=vi.fn();const crypto=[assets[0],assets[1],assets[2]];
  const props={categories,onSelect:select};
  const {container,rerender}=render(<HIGProvider><AssetsBlock {...props} assets={crypto}/></HIGProvider>);
  const active=()=>container.querySelector('[data-active]')?.getAttribute('data-asset-id');
  screen.getByRole('searchbox').focus();
  await userEvent.keyboard('{ArrowDown}{ArrowDown}');expect(active()).toBe('ETH');
  // A live update moves ETH to the end: the cursor follows it.
  rerender(<HIGProvider><AssetsBlock {...props} assets={[assets[2],assets[0],assets[1]]}/></HIGProvider>);
  expect(active()).toBe('ETH');await userEvent.keyboard('{Enter}');expect(select).toHaveBeenLastCalledWith(assets[1]);
  // ETH drops out, leaving one row: no highlight, and Enter does not pick the market the user never reached.
  select.mockClear();rerender(<HIGProvider><AssetsBlock {...props} assets={[assets[0]]}/></HIGProvider>);
  expect(active()).toBeUndefined();await userEvent.keyboard('{Enter}');expect(select).not.toHaveBeenCalled();
  // The arrows still work from there.
  await userEvent.keyboard('{ArrowDown}');expect(active()).toBe('BTC');
 });
 it('with enterChoosesFirst, Enter chooses the first enabled match of a query the arrows have not entered',async()=>{
  const select=vi.fn();
  const {container}=mount({onSelect:select,enterChoosesFirst:true,assets:[{...assets[0],disabled:true},assets[1],assets[2],assets[3]]});
  const search=screen.getByRole('searchbox');
  // No query: Enter is not a choice.
  search.focus();await userEvent.keyboard('{Enter}');expect(select).not.toHaveBeenCalled();
  // Two matches, the first disabled: the first enabled one is the top hit.
  await userEvent.type(search,'t');
  expect([...container.querySelectorAll('[data-asset-id]')].map(row=>row.getAttribute('data-asset-id'))).toEqual(['BTC','ETH']);
  await userEvent.keyboard('{Enter}');expect(select).toHaveBeenLastCalledWith(assets[1]);
  // The arrows still win once they move.
  await userEvent.clear(search);await userEvent.type(search,'r');
  expect([...container.querySelectorAll('[data-asset-id]')].map(row=>row.getAttribute('data-asset-id'))).toEqual(['ETH','XRP']);
  await userEvent.keyboard('{ArrowDown}{ArrowDown}');expect(container.querySelector('[data-active]')?.getAttribute('data-asset-id')).toBe('XRP');
  await userEvent.keyboard('{Enter}');expect(select).toHaveBeenLastCalledWith(assets[2]);
 });
 it('without enterChoosesFirst, Enter does not choose among several matches',async()=>{
  const select=vi.fn();mount({onSelect:select});
  const search=screen.getByRole('searchbox');await userEvent.type(search,'r');
  await userEvent.keyboard('{Enter}');expect(select).not.toHaveBeenCalled();
 });
 it('moves focus between enabled rows with the arrow keys once a row has focus, and back to the field from the first',async()=>{
  const {container}=mount({assets:[assets[0],{...assets[1],disabled:true},assets[2],assets[3]]});
  const row=(id:string)=>container.querySelector<HTMLButtonElement>(`[data-asset-id="${id}"]`)!;
  row('BTC').focus();
  await userEvent.keyboard('{ArrowDown}');expect(document.activeElement).toBe(row('XRP'));
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');expect(document.activeElement).toBe(row('GOLD'));
  await userEvent.keyboard('{ArrowUp}{ArrowUp}');expect(document.activeElement).toBe(row('BTC'));
  await userEvent.keyboard('{ArrowUp}');expect(document.activeElement).toBe(screen.getByRole('searchbox'));
  expect(container.querySelector('[data-active]')).toBeNull();
 });
 it('ignores Enter while an IME composition is open',()=>{
  const select=vi.fn();mount({onSelect:select,query:'gold'});
  const search=screen.getByRole('searchbox');
  fireEvent.keyDown(search,{key:'Enter',isComposing:true});fireEvent.keyDown(search,{key:'Enter',keyCode:229});
  expect(select).not.toHaveBeenCalled();
  fireEvent.keyDown(search,{key:'Enter'});expect(select).toHaveBeenCalledWith(assets[3]);
 });
 it('focuses the search field on mount with autoFocusSearch and a fine pointer, and not by default',()=>{
  const media=vi.fn(()=>({matches:true,addEventListener(){},removeEventListener(){}}));Object.defineProperty(window,'matchMedia',{configurable:true,value:media});
  mount();expect(document.activeElement).not.toBe(screen.getByRole('searchbox'));
  cleanup();mount({autoFocusSearch:true});expect(document.activeElement).toBe(screen.getByRole('searchbox'));
  expect(media).toHaveBeenCalledWith('(pointer: fine)');
  Reflect.deleteProperty(window,'matchMedia');
 });
});

it('search observes edits and preserves repeated category sections',()=>{
 const asset={...assets[0],name:'Original',symbol:'OLD',keywords:'legacy'};
 const repeated=[categories[0],{...categories[0],label:'Repeated'}];
 const matches=filterAssets([asset],repeated,{query:'legacy'});
 expect(matches.map(section=>section.category)).toEqual(repeated);
 expect(matches[0].assets).not.toBe(matches[1].assets);
 asset.name='Renamed';
 asset.symbol='NEW';
 asset.keywords='révised';
 expect(filterAssets([asset],repeated,{query:'legacy'})).toHaveLength(0);
 for(const query of ['renamed','new','revised'])expect(filterAssets([asset],repeated,{query})).toHaveLength(2);
});

it('moves row focus past unmounted disabled markets in both directions',async()=>{
 const markets=Array.from({length:100},(_,i)=>({...assets[0],id:String(i),name:'Market '+i,disabled:i>0&&i<99}));
 const choose=vi.fn();
 render(<HIGProvider><AssetsBlock assets={markets} categories={categories} onSelect={choose}/></HIGProvider>);
 expect(document.querySelectorAll('.hig-assets-row').length).toBeLessThan(30);
 const first=document.querySelector<HTMLButtonElement>('[data-asset-id="0"]')!;
 first.focus();
 await userEvent.keyboard('{Tab}');
 expect(document.activeElement?.getAttribute('data-asset-id')).toBe('99');
 await userEvent.keyboard('{Enter}');
 expect(choose).toHaveBeenCalledWith(markets[99]);
 await userEvent.keyboard('{ArrowUp}');
 expect(document.activeElement).toBe(first);
});

it('shares a visibility observer and measures only nearby categories while scrolling',async()=>{
 const {act}=await import('@testing-library/react');
 let notify!:(entries:Partial<IntersectionObserverEntry>[])=>void;
 const targets:Element[]=[];
 const disconnect=vi.fn();
 const observer=vi.fn(function(callback:typeof notify){
  notify=callback;
  return {observe:(element:Element)=>targets.push(element),unobserve:vi.fn(),disconnect};
 });
 vi.stubGlobal('IntersectionObserver',observer);
 vi.useFakeTimers({toFake:['requestAnimationFrame','cancelAnimationFrame']});
 try{
  const markets=Array.from({length:60},(_,i)=>({...assets[0],id:String(i),category:categories[i%3].id}));
  const {unmount}=render(<div data-testid='scroll-parent' style={{overflowY:'auto'}}><AssetsBlock assets={markets} categories={categories} categoryFilter={false} onSelect={()=>{}}/></div>);
  expect(observer).toHaveBeenCalledTimes(1);
  expect(targets).toHaveLength(3);
  const measures=targets.map(target=>vi.spyOn(target,'getBoundingClientRect'));
  act(()=>notify(targets.map((target,i)=>({target,isIntersecting:i===1}))));
  measures.forEach(spy=>spy.mockClear());
  act(()=>{window.dispatchEvent(new Event('scroll'));vi.advanceTimersByTime(32);});
  expect(measures.map(spy=>spy.mock.calls.length)).toEqual([0,1,0]);
  const clip=vi.spyOn(screen.getByTestId('scroll-parent'),'getBoundingClientRect');
  act(()=>notify(targets.map(target=>({target,isIntersecting:true}))));
  clip.mockClear();
  const raf=vi.spyOn(window,'requestAnimationFrame');
  act(()=>{for(let i=0;i<8;i++)window.dispatchEvent(new Event('scroll'));vi.advanceTimersByTime(32);});
  expect([clip.mock.calls.length,raf.mock.calls.length]).toEqual([1,1]);
  raf.mockRestore();
  unmount();expect(disconnect).toHaveBeenCalledTimes(1);
 }finally{cleanup();vi.useRealTimers();vi.unstubAllGlobals();}
});

// A 60-market list in a fixed sheet's scroller, both 600px tall; every list sits at `listTop()`.
async function mountInFixedSheet(listTop:()=>number){
 const {act}=await import('@testing-library/react');
 vi.stubGlobal('IntersectionObserver',undefined);
 vi.useFakeTimers({toFake:['requestAnimationFrame','cancelAnimationFrame']});
 const box=(top:number,height:number)=>({x:0,y:top,top,left:0,right:390,bottom:top+height,width:390,height,toJSON:()=>({})}) as DOMRect;
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){
  if(this.tagName==='UL')return box(listTop(),20*68);
  return this.dataset.testid==='sheet'||this.dataset.testid==='scroller'?box(0,600):box(0,0);
 });
 vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockImplementation(function(this:HTMLElement){return this.dataset.testid==='sheet'||this.dataset.testid==='scroller'?600:0;});
 const markets=Array.from({length:60},(_,i)=>({...assets[0],id:String(i),category:categories[i%3].id}));
 render(<div data-testid='sheet' style={{position:'fixed',overflowY:'auto'}}><div data-testid='scroller' style={{overflowY:'auto'}}><AssetsBlock assets={markets} categories={categories} categoryFilter={false} onSelect={()=>{}}/></div></div>);
 return {act,rows:()=>document.querySelectorAll('[data-asset-id]').length};
}
const restoreFixedSheet=()=>{cleanup();document.body.style.overflowY='';vi.restoreAllMocks();vi.useRealTimers();vi.unstubAllGlobals();};

it('draws the rows of a fixed sheet that a zero-height body with hidden overflow does not clip',async()=>{
 // Safari pins the body under an open sheet (position: fixed; height: auto), and a shell whose surfaces are all fixed
 // leaves it 0px tall. Overflow clips a fixed descendant only from its containing block, so the body is no clip.
 document.body.style.overflowY='hidden';
 try{
  const {rows}=await mountInFixedSheet(()=>400);
  expect(rows()).toBeGreaterThan(0);
 }finally{restoreFixedSheet();}
});

it('measures the window again when the sheet around it comes to rest',async()=>{
 // The sheet slides in with a transform, which fires no scroll or resize: the list is first measured below the screen.
 let top=2000;
 try{
  const {act,rows}=await mountInFixedSheet(()=>top);
  expect(rows()).toBe(0);
  top=100;
  act(()=>{screen.getByTestId('sheet').dispatchEvent(new Event('transitionend',{bubbles:true}));vi.advanceTimersByTime(32);});
  expect(rows()).toBeGreaterThan(0);
 }finally{restoreFixedSheet();}
});

it('reuses category labels across search edits',()=>{
 let reads=0;
 const groups=Array.from({length:40},(_,i)=>({id:String(i),get label(){reads++;return 'Category '+i;}}));
 render(<HIGProvider><AssetsBlock assets={[{...assets[0],category:'0'}]} categories={groups} onSelect={()=>{}}/></HIGProvider>);
 reads=0;const input=screen.getByRole('searchbox');
 for(const query of ['z','zz','zzz'])fireEvent.change(input,{target:{value:query}});
 expect(reads).toBe(0);
 expect(screen.getByRole('radio',{name:'Category 39'})).toBeTruthy();
});

it('filters a burst of large-catalog edits once and flushes before a keyboard choice',async()=>{
 const {act}=await import('@testing-library/react');
 vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});
 try{
  let reads=0;
  const markets=Array.from({length:1000},(_,i)=>({...assets[0],id:String(i),name:'Market '+i,get category(){reads++;return 'crypto';}}));
  const choose=vi.fn(),changed=vi.fn();
  render(<HIGProvider><AssetsBlock assets={markets} categories={categories} onSelect={choose} onQueryChange={changed} defaultQuery='absent' enterChoosesFirst/></HIGProvider>);
  const input=screen.getByRole('searchbox') as HTMLInputElement;
  reads=0;
  for(const query of ['9','99','999']){fireEvent.change(input,{target:{value:query}});act(()=>vi.advanceTimersByTime(40));}
  expect(input.value).toBe('999');expect(changed.mock.calls.flat()).toEqual(['9','99','999']);expect(reads).toBe(0);
  act(()=>vi.advanceTimersByTime(110));expect(reads).toBe(1000);expect(document.querySelector('[data-asset-id="999"]')).toBeTruthy();
  fireEvent.change(input,{target:{value:'888'}});fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter'});
  expect(choose.mock.calls[0][0]).toBe(markets[888]);expect(reads).toBe(2000);
  act(()=>vi.advanceTimersByTime(200));expect(reads).toBe(2000);
 }finally{cleanup();vi.useRealTimers();}
});

it('updates only the two markets whose selection changed',()=>{
 const reads=new Set<number>();
 const markets=Array.from({length:50},(_,i)=>({...assets[0],id:String(i),get name(){reads.add(i);return 'Market '+i;}}));
 const onSelect=vi.fn();
 const tree=(selectedId:string)=><HIGProvider><AssetsBlock assets={markets} categories={categories} onSelect={onSelect} selectedId={selectedId}/></HIGProvider>;
 const {rerender}=render(tree('0'));
 reads.clear();
 rerender(tree('1'));
 expect([...reads]).toEqual([0,1]);
 expect(screen.getByRole('button',{current:true}).getAttribute('data-asset-id')).toBe('1');
});

it('moves between late catalog rows without scanning market IDs',async()=>{
 let idReads=0;
 const markets=Array.from({length:1000},(_,i)=>({...assets[0],get id(){idReads++;return String(i);},disabled:i>0&&i<998}));
 render(<HIGProvider><AssetsBlock assets={markets} categories={categories} onSelect={()=>{}}/></HIGProvider>);
 const mounted=document.querySelectorAll('.hig-assets-row').length;
 expect(mounted).toBeGreaterThan(0);
 expect(mounted).toBeLessThan(30);
 document.querySelector<HTMLButtonElement>('[data-asset-id="0"]')!.focus();
 await userEvent.keyboard('{Tab}');
 expect(document.activeElement?.getAttribute('data-asset-id')).toBe('998');
 idReads=0;
 await userEvent.keyboard('{ArrowDown}');
 expect(document.activeElement?.getAttribute('data-asset-id')).toBe('999');
 expect(idReads).toBeLessThan(200);
});

it('builds the cross-category keyboard order on first navigation and reuses it',()=>{
 const markets=Array.from({length:1000},(_,i)=>({...assets[0],id:String(i),category:i<500?'crypto':'stocks'}));
 const flatMap=Array.prototype.flatMap;
 let copied=0;
 const spy=vi.spyOn(Array.prototype,'flatMap').mockImplementation(function(this:unknown[],...args:Parameters<typeof flatMap>){
  const result=flatMap.apply(this,args);
  if(result[0]===markets[0]&&result[result.length-1]===markets[999])copied+=result.length;
  return result;
 });
 try{
  render(<HIGProvider><AssetsBlock assets={markets} categories={categories} onSelect={()=>{}}/></HIGProvider>);
  expect(copied).toBe(0);
  const field=screen.getByRole('searchbox');
  fireEvent.keyDown(field,{key:'ArrowDown'});
  fireEvent.keyDown(field,{key:'ArrowDown'});
  expect(copied).toBeLessThanOrEqual(1000);
  expect(document.querySelector('[data-active].hig-assets-row')?.getAttribute('data-asset-id')).toBe('1');
 }finally{spy.mockRestore();}
});
