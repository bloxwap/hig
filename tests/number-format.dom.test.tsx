// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {presentNumberFormat} from '../packages/hig/contracts/src/index';
import {HIGProvider,type HIGProviderProps} from '../packages/hig/react/src/provider';
import {Usd,Percent} from '../packages/hig/react/src/data';
import {AnimatedNumberReadout} from '../packages/hig/react/src/animated-number';
import {AssetBalanceRow} from '../packages/hig/react/src/asset-balance-row';
import {BarPnl} from '../packages/hig/react/src/bar-pnl';
import {AccountBlock} from '../packages/hig/react/src/blocks/account-block';
import {TokenActionBlock} from '../packages/hig/react/src/blocks/token-action-block';
import {ManagePositionBlock} from '../packages/hig/react/src/blocks/manage-position-block';
import {TargetBlock} from '../packages/hig/react/src/blocks/target-block';
import {RewardBlock} from '../packages/hig/react/src/blocks/reward-block';
import {TradeHistoryListBlock} from '../packages/hig/react/src/blocks/trade-history-list-block';
import {SwapPanelBlock} from '../packages/hig/react/src/blocks/swap-panel-block';
afterEach(cleanup);
const french:HIGProviderProps={locale:'fr-FR',numberFormat:{currencyDisplay:'narrowSymbol'}};
const nbsp=/[  ]/g,plain=(text:string|null|undefined)=>(text??'').replace(nbsp,' ');
const reading=(root:ParentNode=document)=>[...root.querySelectorAll('.hig-sr-only')].map(node=>plain(node.textContent));
describe('presentNumberFormat',()=>{
 it('merges the presentation under currency options only, and the options win',()=>{
  const usd={style:'currency',currency:'USD'} as const;
  expect(presentNumberFormat(usd)).toBe(usd);expect(presentNumberFormat(undefined,{currencyDisplay:'code'})).toBeUndefined();
  const percent={style:'percent'} as const;expect(presentNumberFormat(percent,{useGrouping:false})).toBe(percent);
  expect(presentNumberFormat(usd,{currencyDisplay:'narrowSymbol',useGrouping:'always'})).toEqual({currencyDisplay:'narrowSymbol',useGrouping:'always',style:'currency',currency:'USD'});
  expect(presentNumberFormat({...usd,currencyDisplay:'code',maximumFractionDigits:undefined},{currencyDisplay:'narrowSymbol'})).toEqual({style:'currency',currency:'USD',currencyDisplay:'code'});
 });
});
describe('HIGProvider numberFormat',()=>{
 it('leaves every format as it was without the setting: French dollars read $US',()=>{
  render(<HIGProvider locale='fr-FR'><Usd value={12.5}/><AccountBlock assets={[]} balance={1042.09}/></HIGProvider>);
  expect(plain(document.querySelector('.hig-number')?.textContent)).toBe('12,50 $US');
  expect(reading()).toContain('Total balance: 1 042,09 $US');
 });
 it('reads dollars the host way in the blocks, rows, bars and readouts, and the per-call options still win',()=>{
  render(<HIGProvider {...french}>
   <Usd value={12.5}/><Usd value={12.5} options={{currencyDisplay:'code'}}/><Percent value={5}/>
   <AnimatedNumberReadout value={3} options={{style:'currency',currency:'EUR'}}/>
   <AccountBlock assets={[{id:'sol',name:'Solana',symbol:'SOL',value:203}]} balance={1042.09}/>
   <TokenActionBlock symbol='HYPE' name='Hyperliquid' value={759} assets={[]} chains={[]} actions={[]}/>
   <AssetBalanceRow name='Hyperliquid' symbol='HYPE' value={759} balance={13.2}/>
   <BarPnl entry={100} mark={110} labels={{liquidation:'L',mark:'M',entry:'E'}}/>
  </HIGProvider>);
  const numbers=[...document.querySelectorAll('.hig-number')].map(node=>plain(node.querySelector('.hig-sr-only')?.textContent??node.textContent));
  expect(numbers.slice(0,4)).toEqual(['12,50 $','12,50 USD','5 %','3,00 €']);
  const all=reading();
  expect(all).toContain('Total balance: 1 042,09 $');expect(all).toContain('203,00 $');expect(all).toContain('759,00 $');expect(all).toContain('110,00 $');expect(all).toContain('13,2');
  expect(all.some(text=>text.includes('$US'))).toBe(false);
 });
 it('reaches the figures blocks format as text: legends, presets, captions and spoken rows',()=>{
  render(<HIGProvider {...french}>
   <ManagePositionBlock labels={{title:'P',margin:'Margin',notional:'Notional',liquidation:'L',mark:'M',entry:'E',long:'Up',short:'Down',toLiquidation:p=>p}} side='long' entry={100} mark={101} liquidation={90} margin={10} notional={400} actions={[]}/>
   <TargetBlock kind='take-profit' labels={{title:'T',submit:'Set',entry:'E',trigger:'Tr',custom:'C',unit:'U',units:{dollar:'$',price:'P',percent:'%'}}} position='X' entry={100} unit='dollar' value={1} presets={[1,2]} onValueChange={()=>{}} onSubmit={()=>{}}/>
   <RewardBlock title='R' promo={{eyebrow:'Season',amount:4037,goal:250000,caption:goal=>`of ${goal}`}} entries={[]}/>
   <TradeHistoryListBlock labels={{title:'H',long:'Up',short:'Down',empty:'None'}} trades={[{id:'t',name:'Amazon',side:'short',pnl:1.412}]} onSelect={()=>{}}/>
  </HIGProvider>);
  expect(plain(document.body.textContent)).toContain('10,00 $');expect(plain(document.body.textContent)).toContain('400,00 $');
  expect(screen.getAllByRole('button').map(button=>plain(button.textContent))).toEqual(expect.arrayContaining(['+1 $','+2 $']));
  expect(plain(document.body.textContent)).toContain('of 250 000 $');
  expect(plain(screen.getByRole('button',{name:/Amazon/}).getAttribute('aria-label'))).toContain('+1,412 $');
  expect(plain(document.body.textContent)).not.toContain('$US');
 });
 it('applies to the swap pieces and is inherited by nested providers unless they set their own',()=>{
  const token={id:'hype',symbol:'HYPE',name:'Hyperliquid',chain:'Hyperliquid',chainId:999,balance:2,price:10};
  render(<HIGProvider {...french}><HIGProvider locale='fr-FR' density='compact'><SwapPanelBlock tokens={[token]} defaultFrom={token} denomination='token' amount='1' onSubmit={()=>{}}/></HIGProvider><HIGProvider numberFormat={{currencyDisplay:'code'}}><Usd value={1}/></HIGProvider></HIGProvider>);
  const all=reading();
  expect(all).toContain('10,00 $');expect(all.some(text=>text.includes('$US'))).toBe(false);
  // The locale is the nested provider's own (en-US by default); the money presentation is replaced, not merged.
  expect(plain([...document.querySelectorAll('.hig-number')].at(-1)?.textContent)).toBe('USD 1.00');
 });
});
describe('numberFormat.locale and formattedValue (Unreleased)',()=>{
 it('formats numbers in the number locale while the interface keeps its own',()=>{
  const usd=()=>plain(document.querySelector('[data-usd] .hig-number')?.textContent);
  const {container}=render(<HIGProvider locale='de-DE' numberFormat={{locale:'en-US'}}><span data-usd><Usd value={1234.5}/></span><AnimatedNumberReadout value={1234.5}/></HIGProvider>);
  expect(usd()).toBe('$1,234.50');expect(reading()).toEqual(['1,234.5']);expect(container.querySelector('[lang]')!.getAttribute('lang')).toBe('de-DE');
  cleanup();render(<HIGProvider locale='de-DE'><span data-usd><Usd value={1234.5}/></span></HIGProvider>);expect(usd()).toBe('1.234,50 $');
  cleanup();render(<HIGProvider locale='de-DE' numberFormat={{locale:' '}}><span data-usd><Usd value={1234.5}/></span></HIGProvider>);expect(usd()).toBe('1.234,50 $');
 });
 it('draws host-formatted text static by default and place by place with animateFormatted',()=>{
  const view=render(<AnimatedNumberReadout value={90} formattedValue='01:30'/>);
  expect(reading()).toEqual(['01:30']);expect(document.querySelectorAll('.hig-animated-number-visual > span')).toHaveLength(1);
  view.rerender(<AnimatedNumberReadout value={1234.5} formattedValue='1 234,50 $' animateFormatted prefix='≈ '/>);
  expect(reading()).toEqual(['≈ 1 234,50 $']);
  const places=[...document.querySelectorAll('.hig-animated-number-visual > span')].map(node=>node.textContent);
  expect(places).toEqual(['1',' ','2','3','4',',','5','0',' $']);
  // Unknown values still read as the dash whatever the host text says.
  view.rerender(<AnimatedNumberReadout value={null} formattedValue='0' animateFormatted/>);expect(reading()).toEqual(['—']);
 });
});
