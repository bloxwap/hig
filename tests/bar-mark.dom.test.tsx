// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {BarMark,barMarkShares,barMarkTones} from '../packages/hig/react/src/bar-mark';
afterEach(cleanup);
const parts=[{label:'Bitcoin',value:6200,detail:'$6,200'},{label:'Ether',value:3400},{label:'USD Coin',value:400}];
const segments=()=>[...document.querySelectorAll<HTMLElement>('.hig-bar-mark-segment')];
describe('BarMark',()=>{
 it('reuses shares across copy, locale and title changes and recalculates for new data or totals',()=>{
  let reads=0,labelReads=0,colorReads=0;
  const elements=Array.from({length:50},(_,index)=>({get label(){labelReads++;return String(index);},get color(){colorReads++;return '#123456';},get value(){reads++;return index+1;}}));
  const chart=<BarMark title="Portfolio" elements={elements}/>;
  const view=render(<HIGProvider locale="en-US">{chart}</HIGProvider>);
  const baseline=reads;
  view.rerender(<HIGProvider locale="en-US" messages={{stale:'Delayed'}}>{chart}</HIGProvider>);
  expect(baseline).toBeGreaterThanOrEqual(50);
  expect(reads).toBe(baseline);
  view.rerender(<HIGProvider locale="fr-FR">{chart}</HIGProvider>);
  labelReads=0;colorReads=0;
  view.rerender(<HIGProvider locale="fr-FR"><BarMark title="Updated" elements={elements}/></HIGProvider>);
  expect([labelReads,colorReads]).toEqual([0,0]);
  expect(reads-baseline).toBe(0);
  view.rerender(<HIGProvider locale="fr-FR"><BarMark title="Updated" elements={elements} total={5000}/></HIGProvider>);
  expect(reads-baseline).toBe(50);
  const lastShare=()=>screen.getAllByRole('listitem').at(-1)?.querySelector('.hig-sr-only')?.textContent;
  expect(lastShare()).toBe(new Intl.NumberFormat('fr-FR',{style:'percent'}).format(.01));
  view.rerender(<HIGProvider locale="fr-FR"><BarMark title="Updated" elements={[...elements.slice(0,-1),{label:'49',value:100}]} total={5000}/></HIGProvider>);
  expect(lastShare()).toBe(new Intl.NumberFormat('fr-FR',{style:'percent'}).format(.02));
 });
 it('computes shares of the sum, or of a larger total with the remainder left empty',()=>{
  expect(barMarkShares(parts)).toEqual({shares:[0.62,0.34,0.04],rest:0});
  expect(barMarkShares(parts,20000)).toEqual({shares:[0.31,0.17,0.02],rest:0.5});
  // A total smaller than the parts cannot shrink them; bad values count as nothing; nothing at all is an empty track.
  expect(barMarkShares(parts,1).rest).toBe(0);
  expect(barMarkShares([{label:'a',value:-5},{label:'b',value:Number.NaN},{label:'c',value:10}]).shares).toEqual([0,0,1]);
  expect(barMarkShares([{label:'a',value:0}])).toEqual({shares:[0],rest:1});expect(barMarkShares([])).toEqual({shares:[],rest:1});
 });
 it('is a group named by its title, with the description, a decorative bar and a legend that reads each share',()=>{
  render(<BarMark title='Portfolio' description='$10,000.00' elements={parts}/>);
  const card=screen.getByRole('region',{name:'Portfolio'});expect(card.classList.contains('hig-surface')).toBe(true);
  expect(within(card).getByText('$10,000.00').className).toBe('hig-bar-mark-description');
  expect(document.querySelector('.hig-bar-mark-bar')?.getAttribute('aria-hidden')).toBe('true');
  expect(within(card).getAllByRole('listitem').map(item=>item.textContent)).toEqual(['Bitcoin$6,20062%','Ether34%','USD Coin4%']);
  expect(segments().map(segment=>segment.style.flexGrow)).toEqual(['0.62','0.34','0.04']);expect(document.querySelector('.hig-bar-mark-rest')).toBeNull();
 });
 it('takes tones in order, lets an element name a tone, and lets a host colour win',()=>{
  render(<BarMark title='Mix' elements={[{label:'a',value:1},{label:'b',value:1,tone:'negative'},{label:'c',value:1,color:'#123456'},{label:'d',value:1},...barMarkTones.slice(0,3).map(tone=>({label:tone,value:1}))]}/>);
  expect(segments().map(segment=>segment.dataset.tone??segment.style.getPropertyValue('--hig-bar-mark-color'))).toEqual(['positive','negative','#123456','negative','muted','faint','positive']);
  // The legend dot is painted like its segment.
  expect([...document.querySelectorAll<HTMLElement>('.hig-bar-mark-dot')].map(dot=>dot.dataset.tone??dot.style.getPropertyValue('--hig-bar-mark-color')).slice(0,3)).toEqual(['positive','negative','#123456']);
 });
 it('leaves the remainder of a total as empty track and draws no segment for a zero value',()=>{
  render(<BarMark title='Margin' total={10000} elements={[{label:'Positions',value:5200},{label:'Idle',value:0},{label:'Fees',value:800}]}/>);
  expect(segments().map(segment=>segment.style.flexGrow)).toEqual(['0.52','0.08']);expect(document.querySelector<HTMLElement>('.hig-bar-mark-rest')?.style.flexGrow).toBe('0.4');
  expect(screen.getAllByRole('listitem').map(item=>item.textContent)).toEqual(['Positions52%','Idle0%','Fees8%']);
 });
 it('hides the legend visually but keeps it for assistive technology, and formats shares in the provider locale',()=>{
  render(<HIGProvider locale='de-DE'><BarMark title='Anteile' legend={false} elements={[{label:'A',value:1},{label:'B',value:2}]}/></HIGProvider>);
  expect(document.querySelector('.hig-bar-mark-legend')).toBeNull();expect(screen.getByRole('list').className).toBe('hig-sr-only');
  expect(screen.getAllByRole('listitem').map(item=>item.textContent)).toEqual(['A33,3 %','B66,7 %']);
 });
 it('draws no card with surface={false}, keeping the title row, bar and legend',()=>{
  const view=render(<BarMark title='Portfolio' description='$10,000.00' elements={parts}/>);const card=()=>document.querySelector<HTMLElement>('.hig-bar-mark')!;
  expect(card().classList.contains('hig-surface')).toBe(true);expect(card().dataset.surface).toBeUndefined();
  view.rerender(<BarMark surface={false} title='Portfolio' description='$10,000.00' elements={parts} className='wide'/>);
  expect(card().className).toBe('hig-bar-mark wide');expect(card().dataset.surface).toBe('false');expect(screen.getByRole('region',{name:'Portfolio'})).toBe(card());
  expect(card().querySelector('.hig-bar-mark-header')).toBeTruthy();expect(segments()).toHaveLength(3);expect(screen.getAllByRole('listitem')).toHaveLength(3);
 });
 it('takes a live figure as a detail, updated place by place, and reads it with the label',()=>{
  Object.defineProperty(HTMLElement.prototype,'animate',{value:()=>({cancel(){}}),configurable:true});
  const live=(value:number)=>[{label:'Staked',value,detail:{value,options:{style:'currency',currency:'USD'} as const}},{label:'Core',value:239,detail:'$239'}];
  const view=render(<BarMark title='HYPE' elements={live(320)}/>);
  const details=()=>[...document.querySelectorAll('.hig-bar-mark-detail')];
  expect(details()[0].querySelector('.hig-animated-number-visual')).toBeTruthy();expect(details()[0].querySelector('.hig-sr-only')!.textContent).toBe('$320.00');expect(details()[1].innerHTML).toBe('$239');
  view.rerender(<BarMark title='HYPE' elements={live(321.5)}/>);expect(details()[0].querySelectorAll('.hig-number-flow-strip').length).toBeGreaterThan(0);
  view.rerender(<HIGProvider locale='fr-FR' numberFormat={{currencyDisplay:'narrowSymbol'}}><BarMark title='HYPE' elements={[{label:'Staked',value:1,detail:{value:null}},{label:'Paper',value:1,detail:{value:12.5,options:{style:'currency',currency:'USD'},suffix:' net'}}]}/></HIGProvider>);
  expect(details().map(detail=>detail.querySelector('.hig-sr-only')!.textContent)).toEqual(['—','12,50 $ net']);
  delete (HTMLElement.prototype as {animate?:unknown}).animate;
 });
 it('passes host attributes to the card and keeps its own classes',()=>{
  render(<BarMark title='Portfolio' elements={parts} className='wide' data-testid='mix'/>);
  expect(screen.getByTestId('mix').className).toBe('hig-surface hig-bar-mark wide');
 });
 it('styles follow the writing direction and keep a visible minimum for small parts',()=>{
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');const rules=css.split('\n').filter(line=>line.startsWith('.hig-bar-mark'));
  expect(rules.join('\n')).not.toMatch(/\b(left|right)\b/);
  expect(rules.find(line=>line.startsWith('.hig-bar-mark-segment {'))).toContain('min-width:3px');
  expect(rules.find(line=>line.startsWith('.hig-bar-mark-bar {'))).toMatch(/gap:2px;height:24px/);
 });
});
