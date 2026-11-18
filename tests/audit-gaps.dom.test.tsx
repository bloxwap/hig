// @vitest-environment jsdom
/** The defects and small gaps the browser and native audits of the consuming apps found (Unreleased). */
import React from 'react';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as blocks from '../packages/hig/react/src/blocks';
import {MarketRow} from '../packages/hig/react/src/blocks/market-row';
import {ScreenHeader} from '../packages/hig/react/src/blocks/screen-header';
import {ListRow} from '../packages/hig/react/src/list-group';
import {Button} from '../packages/hig/react/src/button';
import {Usd} from '../packages/hig/react/src/data';
import {GestureSheet} from '../packages/hig/react/src/gesture-sheet';
import {FromPickerBlock} from '../packages/hig/react/src/blocks/pickers';
import type {SwapToken} from '../packages/hig/react/src/blocks/swap-block';
beforeEach(()=>{vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));});
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
const css=readFileSync('packages/hig/react/src/styles.css','utf8');
// The rule whose selector list names the selector (rules shared by several components list them all).
const rule=(selector:string)=>css.split('\n').find(line=>line.startsWith(`${selector} {`)||(line.includes(' { ')&&line.slice(0,line.indexOf(' { ')).split(',').includes(selector)))??'';
const rect=(top:number)=>({top,bottom:top+44,left:0,right:0,width:0,height:44,x:0,y:top,toJSON:()=>({})}) as DOMRect;

describe('MarketRow in action mode is one line (defect fix)',()=>{
 it('keeps the identity on the leading edge and the trailing content on the trailing edge, without wrapping',()=>{
  render(<MarketRow symbol='BTC' name='Bitcoin' detail='40×' icon={<img alt='' src='/btc.svg'/>} trailing={<span data-testid='pnl'>+$12.00</span>} selected data-testid='row' onSelect={()=>{}}/>);
  const row=screen.getByTestId('row');
  // The name sits in its own span so it truncates; the detail stays in the button and in its name.
  const button=screen.getByRole('button',{name:'Bitcoin (BTC) 40×'});expect(button.querySelector('.hig-market-label')!.textContent).toBe('Bitcoin (BTC)');
  expect(row.firstElementChild!.className).toBe('hig-market-identity');expect([...row.children].map(child=>[...child.classList].find(name=>name.startsWith('hig-')))).toEqual(['hig-market-identity','hig-market-trailing','hig-market-check']);
  expect(rule(".hig-market-row[data-mode='action']")).toContain('padding-inline-end:20px');
  expect(css).toContain(".hig-market-row[data-mode='action'] { flex-wrap:nowrap;padding-block:6px; }");
  // The identity has a floor (favourite + icon + a 5em name button) instead of collapsing to nothing.
  expect(css).toContain(".hig-market-row[data-mode='action'] .hig-market-identity { display:flex;align-items:center;flex:1 1 0;min-width:min-content; }");
  expect(rule(".hig-market-row[data-mode='action'] .hig-market-identity > .hig-button")).toContain('flex:1 1 0;min-width:5em;contain:inline-size;');
  expect(css).toMatch(/\.hig-market-row\[data-mode='action'\] :is\(\.hig-market-label,\.hig-market-detail\) \{ overflow:hidden;text-overflow:ellipsis;white-space:nowrap; \}/);
  // The action-mode flow rule must not reopen the identity's floor (presentation only).
  expect(css).not.toContain('.hig-market-row[data-flow] .hig-market-identity');
  // A row without a detail line truncates its name the same way.
  cleanup();render(<MarketRow symbol='ETH' name='Ether' price={1} change={1} onSelect={()=>{}}/>);
  expect(screen.getByRole('button',{name:'Ether (ETH)'}).querySelector('.hig-market-label')).toBeTruthy();
 });
 it('groups the figures so whole figures drop from the end when the row is narrow, before the trailing content is clipped',()=>{
  render(<MarketRow symbol='BTC' name='Bitcoin' detail='40×' icon={<img alt='' src='/btc.svg'/>} price={64321.12} change={-1.23} volume='$1.2B' trailing={<span>+$12.00</span>} selected data-testid='row' onSelect={()=>{}}/>);
  const row=screen.getByTestId('row');
  expect([...row.children].map(child=>[...child.classList].find(name=>name.startsWith('hig-')))).toEqual(['hig-market-identity','hig-market-figures','hig-market-trailing','hig-market-check']);
  expect([...row.querySelector('.hig-market-figures')!.children].map(child=>child.className)).toEqual(['hig-market-price','hig-market-change','hig-market-volume']);
  const figures=rule(".hig-market-row[data-mode='action'] .hig-market-figures");
  for(const part of ['flex-wrap:wrap','flex:0 1000 auto','min-width:0','height:var(--hig-button)','overflow:hidden'])expect(figures).toContain(part);
  expect(rule(".hig-market-row[data-mode='action'] .hig-market-figures::before")).toContain("content:'';flex:none;width:0");
  expect(rule(".hig-market-row[data-mode='action'] .hig-market-trailing")).toContain('flex:0 1 auto;justify-content:safe flex-end;min-width:0;');
  // Presentation mode keeps one grid column per figure.
  cleanup();render(<MarketRow mode='presentation' symbol='BTC' name='Bitcoin' price={1} change={1} data-testid='p'/>);
  expect([...screen.getByTestId('p').children].map(child=>[...child.classList].find(name=>name.startsWith('hig-')))).toEqual(['hig-market-identity','hig-market-price','hig-market-change']);
 });
});

describe('switch rows read their name once (defect fix)',()=>{
 it('names the ListRow switch by its visible label and draws no second copy',()=>{
  render(<ListRow label='Live Mode' description='Trade with real funds' defaultChecked/>);
  const control=screen.getByRole('switch',{name:'Live Mode',description:'Trade with real funds'});
  const label=document.querySelector('.hig-list-row-label')!;
  expect(control.getAttribute('aria-labelledby')).toBe(label.id);expect(label.id).not.toBe('');
  expect(document.querySelector('.hig-list-row')!.textContent!.match(/Live Mode/g)).toHaveLength(1);
  expect(control.closest('label')!.textContent).toBe('');
 });
 it('names ProfileBlock switch rows the same way',async()=>{
  const live=vi.fn();
  render(<blocks.ProfileBlock name='Joe' sections={[{id:'s',rows:[{id:'live',label:'Live Mode',checked:false,onCheckedChange:live},{id:'paper',label:'Papertrade',checked:true,onCheckedChange:()=>{}}]}]}/>);
  for(const name of ['Live Mode','Papertrade']){
   const control=screen.getByRole('switch',{name});const row=control.closest('.hig-list-row')!;
   expect(row.textContent!.match(new RegExp(name,'g'))).toHaveLength(1);expect(document.getElementById(control.getAttribute('aria-labelledby')!)!.textContent).toBe(name);
  }
  await userEvent.click(screen.getByText('Live Mode'));expect(live).toHaveBeenCalledWith(true);
 });
});

describe('stickyHeader on the remaining blocks',()=>{
 const labels={title:'Manage Position',margin:'Margin',notional:'Notional',liquidation:'Liquidation',toLiquidation:(percent:string)=>`${percent} to liquidation`,mark:'Mark',entry:'Entry',long:'Long',short:'Short'};
 const cases:[string,React.ReactElement,string][]=[
  ['ProfileBlock',<blocks.ProfileBlock key='p' name='Joe' onClose={()=>{}} sections={[]} stickyHeader/>,'.hig-profile-bar'],
  ['ManagePositionBlock',<blocks.ManagePositionBlock key='m' labels={labels} side='long' entry={1} margin={10} notional={400} actions={[]} stickyHeader/>,'.hig-screen-header'],
  ['AccountBlock',<blocks.AccountBlock key='a' assets={[]} stickyHeader/>,'.hig-screen-header'],
  ['TokenActionBlock',<blocks.TokenActionBlock key='t' symbol='HYPE' actions={[]} stickyHeader/>,'.hig-screen-header'],
  ['LanguageBlock',<blocks.LanguageBlock key='l' languages={[]} onSelect={()=>{}} stickyHeader/>,'.hig-screen-header'],
 ];
 it.each(cases)('%s pins its header only with stickyHeader',(_,element,selector)=>{
  const view=render(element);expect(document.querySelector(selector)!.getAttribute('data-sticky')).toBe('true');view.unmount();
  render(React.cloneElement(element as React.ReactElement<{stickyHeader?:boolean}>,{stickyHeader:undefined}));expect(document.querySelector(selector)!.hasAttribute('data-sticky')).toBe(false);
 });
 it('pins a leading header where it rests, whatever padding sits between it and the scroller, and fills once it pins',()=>{
  render(<div data-testid='scroller' style={{overflowY:'auto',paddingTop:'12px'}}><div data-testid='pane' style={{padding:'16px'}}><blocks.AccountBlock assets={[]} stickyHeader/></div></div>);
  const header=document.querySelector<HTMLElement>('.hig-screen-header')!,scroller=screen.getByTestId('scroller'),content=header.parentElement!;
  // 16px of pane padding between the header and the scroller's content edge; the fill reaches 12px further, to the scroller's edge.
  expect(header.style.getPropertyValue('--hig-sticky-inset')).toBe('16px');expect(header.style.getPropertyValue('--hig-sticky-cover')).toBe('28px');expect(header.hasAttribute('data-sticky-inset')).toBe(true);
  // At rest the block's top sits 12 + 16 below the scroller's top: the header is where it pins, not yet scrolled.
  scroller.getBoundingClientRect=()=>rect(0);content.getBoundingClientRect=()=>rect(28);scroller.dispatchEvent(new Event('scroll'));expect(header.hasAttribute('data-scrolled')).toBe(false);
  // One pixel of scrolling puts content under it.
  content.getBoundingClientRect=()=>rect(27);scroller.dispatchEvent(new Event('scroll'));expect(header.hasAttribute('data-scrolled')).toBe(true);
  expect(css).toContain(":is(.hig-screen-header,.hig-profile-bar)[data-sticky][data-sticky-inset] { inset-block-start:var(--hig-sticky-inset,0px);animation:none; }");
  expect(css).toContain(":is(.hig-screen-header,.hig-profile-bar)[data-sticky]::before { content:'';position:absolute;inset-inline:0;inset-block-end:100%;block-size:var(--hig-sticky-cover,0px);background-color:inherit;pointer-events:none; }");
 });
 it('lets a header that follows other content scroll up to the edge before it pins, as before',()=>{
  vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){return this.dataset.testid==='intro'?{...rect(0),height:80}:rect(0);});
  render(<div style={{overflowY:'auto'}}><section style={{paddingTop:'16px'}}><p data-testid='intro'>Intro</p><ScreenHeader title='Later' stickyHeader/></section></div>);
  const header=document.querySelector<HTMLElement>('.hig-screen-header')!;
  expect(header.style.getPropertyValue('--hig-sticky-inset')).toBe('0px');expect(header.hasAttribute('data-sticky-inset')).toBe(false);
 });
 it('draws the profile bar fill like the screen header',()=>{
  expect(rule('.hig-profile-bar[data-sticky]')).toContain('position:sticky');expect(rule('.hig-profile-bar[data-sticky][data-scrolled]')).toContain('var(--hig-sticky-header-background');
 });
});

describe('numbers in a row value use the row face',()=>{
 it('inherits the interface face, not the mono face',()=>{
  render(<ListRow label='Leverage' value={<Usd value={1000}/>} valueLabel='$1,000.00'/>);
  expect(document.querySelector('.hig-list-row-value .hig-number')).toBeTruthy();
  expect(css.split('\n').find(line=>line.endsWith(' { font-family:inherit; }'))?.split(' {')[0].split(',')).toContain('.hig-list-row-value .hig-number');
 });
});

describe('picker token rows',()=>{
 const eth:SwapToken={id:'1-eth',symbol:'ETH',name:'Ether',chain:'Ethereum',chainId:1,balance:2,price:2000};
 const usdc:SwapToken={id:'1-usdc',symbol:'USDC',name:'USD Coin',chain:'Ethereum',chainId:1};
 it('marks the selected row aria-current and takes host attributes per token',()=>{
  render(<FromPickerBlock tokens={[eth,usdc]} selected={usdc} onSelect={()=>{}} tokenRowProps={token=>({'data-testid':`token-${token.id}`,title:token.symbol,...({'data-selected':'forged',onClick:()=>{},className:'x'} as object)})}/>);
  const selected=screen.getByTestId('token-1-usdc'),other=screen.getByTestId('token-1-eth');
  expect(selected.getAttribute('aria-current')).toBe('true');expect(other.hasAttribute('aria-current')).toBe(false);
  expect(selected.getAttribute('title')).toBe('USDC');expect(selected.className).toBe('hig-swap-row');expect(selected.getAttribute('data-selected')).toBe('true');expect(other.hasAttribute('data-selected')).toBe(false);
 });
});

describe('SwapBlock title',()=>{
 it('draws the shared ScreenHeader, named by headingId',async()=>{
  const back=vi.fn();
  render(<blocks.SwapBlock tokens={[]} onSubmit={()=>{}} title='Withdraw from Papertrade' headingId='withdraw-title' onBack={back}/>);
  const heading=screen.getByRole('heading',{level:2,name:'Withdraw from Papertrade'});
  expect(heading.id).toBe('withdraw-title');expect(heading.className).toBe('hig-screen-title');expect(heading.closest('.hig-screen-header')).toBeTruthy();
  expect(document.querySelector('.hig-swap-view-header')).toBeNull();
  await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
 });
});

describe('Button market fills',()=>{
 it('takes intent up or down, following the provider market colours',()=>{
  render(<><Button intent='up'>Long</Button><Button intent='down'>Short</Button></>);
  expect(screen.getByRole('button',{name:'Long'}).dataset.intent).toBe('up');expect(screen.getByRole('button',{name:'Short'}).dataset.intent).toBe('down');
  expect(rule(".hig-button")).toContain("background:color-mix(in srgb,var(--hig-glow,var(--hig-action)) 15%,transparent)");
  expect(rule(".hig-button[data-intent='up']")).toContain('color:var(--hig-up,var(--hig-buy))');
  expect(rule(".hig-button[data-intent='down']")).toContain('color:var(--hig-down,var(--hig-sell))');
 });
});

describe('headingId on blocks and labelledBy on GestureSheet',()=>{
 it('reaches each block heading',()=>{
  const history={title:'History',long:'Long',short:'Short',empty:'None'};
  const trade={title:'Trade',netPnl:'Net',onMargin:(p:string)=>p,long:'Long',short:'Short'};
  const named:[React.ReactElement,string][]=[
   [<blocks.AccountBlock key='a' assets={[]} headingId='h'/>,'Account'],
   [<blocks.TokenActionBlock key='t' symbol='HYPE' actions={[]} headingId='h'/>,'HYPE'],
   [<blocks.LanguageBlock key='l' languages={[]} onSelect={()=>{}} headingId='h'/>,'Language'],
   [<blocks.RewardBlock key='r' title='Rewards' entries={[]} headingId='h'/>,'Rewards'],
   [<blocks.NotificationsBlock key='n' title='Notifications' headingId='h'/>,'Notifications'],
   [<blocks.SignalsBlock key='s' title='Signals' groups={[]} headingId='h'/>,'Signals'],
   [<blocks.SoundHapticsBlock key='sh' title='Sound' sections={[]} headingId='h'/>,'Sound'],
   [<blocks.TradeHistoryListBlock key='hl' labels={history} trades={[]} headingId='h'/>,'History'],
   [<blocks.TradeHistoryDetailBlock key='hd' labels={trade} name='Amazon' side='long' pnl={1} details={[]} headingId='h'/>,'Trade'],
   [<blocks.ProfileBlock key='p' name='Joe' sections={[]} headingId='h'/>,'Joe'],
  ];
  for(const [element,name] of named){const view=render(element);expect([name,screen.getByRole('heading',{name}).id]).toEqual([name,'h']);view.unmount();}
 });
 it('names a GestureSheet by a heading inside it and hides its own title from assistive technology',()=>{
  render(<GestureSheet open onOpenChange={()=>{}} title='Profile' labelledBy='profile-name' contentMode='custom' closeButton={null}><blocks.ProfileBlock name='Joe' sections={[]} headingId='profile-name'/></GestureSheet>);
  const dialog=screen.getByRole('dialog');expect(dialog.getAttribute('aria-labelledby')).toBe('profile-name');
  expect(screen.getByRole('dialog',{name:'Joe'})).toBe(dialog);
  const title=[...dialog.querySelectorAll('h2')].find(node=>node.textContent==='Profile')!;expect(title.getAttribute('aria-hidden')).toBe('true');expect(title.className).toBe('hig-sr-only');
 });
});
