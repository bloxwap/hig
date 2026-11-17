// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {BarPnl,barPnlLayout,barPnlCompactOptions} from '../packages/hig/react/src/bar-pnl';
import {HIGProvider} from '../packages/hig/react/src/provider';
afterEach(cleanup);
const labels={liquidation:'Liquidation',mark:'Mark',entry:'Entry'};
/** What is read once: the text without the decorative copy of each animated number. */
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const readouts=()=>[...document.querySelectorAll('.hig-bar-pnl-readouts > div')].map(spoken);
describe('barPnlLayout',()=>{
 it('centres entry between liquidation and its mirror, and orders the readouts by price',()=>{
  expect(barPnlLayout({entry:100,mark:105,liquidation:80})).toEqual({side:'long',result:'profit',positions:{entry:0.5,mark:0.625,liquidation:0},order:['liquidation','entry','mark']});
  expect(barPnlLayout({entry:100,mark:90,liquidation:80})).toMatchObject({result:'loss',positions:{mark:0.25},order:['liquidation','mark','entry']});
 });
 it('reads a liquidation above entry as a short, where a falling mark is profit',()=>{
  expect(barPnlLayout({entry:100,mark:90,liquidation:120})).toEqual({side:'short',result:'profit',positions:{entry:0.5,mark:0.25,liquidation:1},order:['mark','entry','liquidation']});
  expect(barPnlLayout({entry:100,mark:110,liquidation:120}).result).toBe('loss');
  expect(barPnlLayout({entry:100,mark:110,liquidation:80,side:'short'}).result).toBe('loss');
 });
 it('stretches for a mark beyond either end, and centres on entry without a liquidation price',()=>{
  expect(barPnlLayout({entry:100,mark:140,liquidation:80}).positions).toEqual({entry:1/3,mark:1,liquidation:0});
  expect(barPnlLayout({entry:100,mark:70,liquidation:80}).positions).toEqual({entry:0.6,mark:0,liquidation:0.2});
  expect(barPnlLayout({entry:100,mark:105})).toEqual({side:'long',result:'profit',positions:{entry:0.5,mark:0.75},order:['entry','mark']});
 });
 it('fit scales the bar to the prices themselves, so the move fills it',()=>{
  expect(barPnlLayout({entry:267.6,mark:267.18,side:'short',fit:true})).toEqual({side:'short',result:'profit',positions:{entry:1,mark:0},order:['mark','entry']});
  expect(barPnlLayout({entry:100,mark:110,liquidation:80,fit:true}).positions).toEqual({liquidation:0,entry:2/3,mark:1});
  // Nothing moved: both ticks sit in the middle.
  expect(barPnlLayout({entry:100,mark:100,fit:true}).positions).toEqual({entry:0.5,mark:0.5});
 });
 it('is flat when mark equals entry or is unknown, keeping mark on the side it would move to',()=>{
  expect(barPnlLayout({entry:100,mark:100,liquidation:80})).toMatchObject({result:'flat',positions:{entry:0.5,mark:0.5},order:['liquidation','entry','mark']});
  expect(barPnlLayout({entry:100,mark:null,liquidation:80})).toMatchObject({result:'flat',positions:{mark:0.5}});
  expect(barPnlLayout({entry:Number.NaN,mark:1})).toEqual({side:'long',result:'flat',positions:{},order:[]});
 });
});
describe('BarPnl',()=>{
 it('draws a decorative bar and reads the three prices under it in price order',()=>{
  render(<BarPnl title='BTC Long 10×' description='+$1,300.00' entry={64700} mark={66000} liquidation={58800} labels={labels}/>);
  const card=screen.getByRole('region',{name:'BTC Long 10×'});expect(card.classList.contains('hig-surface')).toBe(true);expect(card.dataset.result).toBe('profit');
  expect(document.querySelector('.hig-bar-pnl-bar')?.getAttribute('aria-hidden')).toBe('true');
  expect(readouts()).toEqual(['Liquidation$58,800.00','Entry$64,700.00','Mark$66,000.00']);
  const move=document.querySelector<HTMLElement>('.hig-bar-pnl-move')!;expect(move.dataset.lead).toBe('entry');expect(Number(move.style.flexGrow)).toBeCloseTo(1300/11800,5);
  expect(document.querySelector<HTMLElement>('.hig-bar-pnl-liquidation')!.style.insetInlineStart).toBe('0%');
 });
 it('draws no card with surface={false}, keeping the bar and readouts',()=>{
  const view=render(<BarPnl entry={100} mark={105} liquidation={80} labels={labels}/>);
  const card=()=>document.querySelector<HTMLElement>('.hig-bar-pnl')!;expect(card().classList.contains('hig-surface')).toBe(true);expect(card().dataset.surface).toBeUndefined();
  view.rerender(<BarPnl surface={false} entry={100} mark={105} liquidation={80} labels={labels}/>);
  expect(card().classList.contains('hig-surface')).toBe(false);expect(card().dataset.surface).toBe('false');expect(readouts()).toHaveLength(3);expect(document.querySelector('.hig-bar-pnl-bar')).toBeTruthy();
 });
 it('shortens the prices with compact: no fraction from 1,000, two digits from 1, four significant below 1, no trailing zeros',()=>{
  const view=render(<BarPnl compact entry={64700} mark={64450.5} liquidation={63000} labels={labels}/>);
  expect(readouts()).toEqual(['Liquidation$63,000','Mark$64,451','Entry$64,700']);
  view.rerender(<BarPnl compact entry={142.96} mark={149.1} liquidation={120} labels={labels}/>);
  expect(readouts()).toEqual(['Liquidation$120','Entry$142.96','Mark$149.1']);
  view.rerender(<BarPnl compact entry={0.482137} mark={0.5} labels={labels} priceOptions={{style:'currency',currency:'EUR'}}/>);
  expect(readouts()).toEqual(['Entry€0.4821','Mark€0.5']);
  expect(barPnlCompactOptions(64700)).toEqual({style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:0});
  expect(barPnlCompactOptions(null)).toMatchObject({maximumFractionDigits:2});
 });
 it('swaps mark and entry when the mark crosses the entry, and marks the loss',()=>{
  const view=render(<BarPnl entry={64700} mark={64450} liquidation={63000} labels={labels}/>);
  expect(readouts()).toEqual(['Liquidation$63,000.00','Mark$64,450.00','Entry$64,700.00']);
  const card=document.querySelector<HTMLElement>('.hig-bar-pnl')!;expect(card.dataset.result).toBe('loss');expect(card.getAttribute('aria-labelledby')).toBeNull();
  expect(document.querySelector<HTMLElement>('.hig-bar-pnl-move')!.dataset.lead).toBe('mark');
  view.rerender(<BarPnl entry={64700} mark={65000} liquidation={63000} labels={labels}/>);
  expect(readouts()).toEqual(['Liquidation$63,000.00','Entry$64,700.00','Mark$65,000.00']);expect(card.dataset.result).toBe('profit');
 });
 it('shows mark and entry alone without a liquidation price, an unknown mark as the dash, and host price formatting',()=>{
  const view=render(<BarPnl entry={142.96} mark={149.1} labels={labels}/>);
  expect(readouts()).toEqual(['Entry$142.96','Mark$149.10']);expect(document.querySelector('.hig-bar-pnl-liquidation')).toBeNull();
  view.rerender(<BarPnl entry={142.96} mark={null} labels={labels}/>);
  expect(document.querySelector<HTMLElement>('.hig-bar-pnl')!.dataset.result).toBe('flat');expect(readouts()[1]).toMatch(/^Mark(—|Unavailable)/);
  view.rerender(<BarPnl entry={1.5} mark={2} labels={{liquidation:'Liq.',mark:'Now',entry:'Open'}} priceOptions={{maximumFractionDigits:1}}/>);
  expect(readouts()).toEqual(['Open1.5','Now2']);
 });
});

it('fills the stretch between entry and mark in the result colour at the bar fill strength, with solid edges',()=>{
 const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n');const rule=(start:string)=>css.find(line=>line.startsWith(start))??'';
 expect(rule('.hig-bar-pnl-move {')).toContain('background:color-mix(in srgb,var(--hig-bar-pnl-tone) calc(var(--hig-bar-fill-opacity,.5)*100%),transparent);');expect(rule('.hig-bar-pnl-move {')).toContain('border-inline:3px solid var(--hig-text)');
 expect(rule(".hig-bar-pnl-move[data-lead='mark']")).toContain('border-inline-start-color:var(--hig-bar-pnl-tone)');
 // The result follows the market direction roles, which default to buy and sell (the same colours as positive and negative).
 expect(rule(".hig-bar-pnl[data-result='profit']")).toContain('var(--hig-up,var(--hig-buy))');expect(rule(".hig-bar-pnl[data-result='loss']")).toContain('var(--hig-down,var(--hig-sell))');
 expect(rule('.hig-bar-pnl-liquidation {')).toContain('background:var(--hig-negative)');
});

it('paints the result with the provider market colours (Unreleased)',()=>{
 const {container}=render(<HIGProvider marketColors={{up:'#ff3b30',down:'#0a84ff'}}><BarPnl entry={100} mark={110} labels={{liquidation:'Liq',mark:'Mark',entry:'Entry'}}/></HIGProvider>);
 const wrapper=container.querySelector<HTMLElement>('[data-hig-density]');
 expect(wrapper?.style.getPropertyValue('--hig-up')).toBe('#ff3b30');
 expect(container.querySelector('.hig-bar-pnl')?.getAttribute('data-result')).toBe('profit');
});
