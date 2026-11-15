// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {RewardBlock,rewardProgress,type RewardBlockProps,type RewardEntry,type RewardPromo} from '../packages/hig/react/src/blocks/reward-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const entries:RewardEntry[]=[{id:'a',rank:1,name:'0x4e79…949f',verified:true,detail:'$1,789,061 vol',score:795407},{id:'me',rank:2,name:'you',detail:'$1,090,779 vol',score:418450,you:true},{id:'c',rank:3,name:'Zed',score:null}];
const pool:RewardPromo={eyebrow:'Season 01',amount:4037,goal:250000,caption:goal=>`of ${goal} prize pool`,headline:'Top 100 traders split the pool.',description:'Funded by builder fees on every trade.'};
const base:RewardBlockProps={title:'Leaderboard',entries};
const q=(selector:string)=>document.querySelector<HTMLElement>(selector);
const rows=(scope='.hig-reward-rows')=>[...document.querySelectorAll(`${scope} > .hig-reward-row`)].map(row=>[spoken(row.querySelector('.hig-reward-rank')!),spoken(row.querySelector('.hig-reward-identity > strong')!),row.querySelector('.hig-reward-identity > span')?.textContent??null,spoken(row.querySelector('.hig-reward-score')!),row.getAttribute('data-you')]);
describe('rewardProgress',()=>{
 it('is the share of the goal reached, clamped, and unknown without a usable amount or goal',()=>{
  expect(rewardProgress(4037,250000)).toBeCloseTo(0.016148,6);expect(rewardProgress(300,200)).toBe(1);expect(rewardProgress(-5,200)).toBe(0);expect(rewardProgress(0,200)).toBe(0);
  for(const [amount,goal] of [[null,200],[10,undefined],[10,0],[10,-1],[Number.NaN,200],[10,Number.POSITIVE_INFINITY]] as const)expect(rewardProgress(amount,goal)).toBeNull();
 });
});
describe('RewardBlock',()=>{
 it('shows the heading with Back and the host control, and the ranked rows in order',async()=>{
  const back=vi.fn();render(<RewardBlock {...base} onBack={back} headerAction={<button type='button'>Share</button>}/>);
  expect(screen.getByRole('heading',{name:'Leaderboard'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);expect(screen.getByRole('button',{name:'Share'})).toBeTruthy();
  expect(q('.hig-reward-rows')!.tagName).toBe('OL');
  expect(rows()).toEqual([['1','0x4e79…949f','$1,789,061 vol','795,407',null],['2','you','$1,090,779 vol','418,450','true'],['3','Zed',null,'—',null]]);
  // Without artwork the avatar shows the first letters; nothing else is drawn without its props.
  expect([...document.querySelectorAll('.hig-reward-avatar')].map(avatar=>avatar.textContent)).toEqual(['0x','yo','Ze']);
  for(const selector of ['.hig-reward-promo','.hig-reward-you','.hig-reward-columns','.hig-reward-footnote','.hig-segmented-control'])expect(q(selector),selector).toBeNull();
  expect(blocks.RewardBlock).toBe(RewardBlock);expect(blocks.rewardProgress).toBe(rewardProgress);
 });
 it('draws a prize pool: a muted eyebrow, one large figure, the goal in the caption under it, and a thin bar at the share reached',()=>{
  const view=render(<RewardBlock {...base} promo={pool}/>);
  expect(q('.hig-reward-promo')!.classList.contains('hig-surface')).toBe(true);expect(q('.hig-reward-eyebrow')!.textContent).toBe('Season 01');
  expect(spoken(q('.hig-reward-amount')!)).toBe('$4,037');expect(q('.hig-reward-caption')!.textContent).toBe('of $250,000 prize pool');
  expect(q('.hig-reward-track')!.getAttribute('aria-hidden')).toBe('true');expect(parseFloat(q('.hig-reward-track > span')!.style.width)).toBeCloseTo(1.6148,3);
  // One paragraph: the headline in the text colour, the description continuing it.
  const summary=q('.hig-reward-summary')!;expect(summary.textContent).toBe('Top 100 traders split the pool. Funded by builder fees on every trade.');expect(summary.querySelector('strong')!.textContent).toBe('Top 100 traders split the pool.');
  // Nothing sits under the bar, the eyebrow has no dot, and there is no rules link without its prop.
  for(const selector of ['.hig-reward-progress-meta','.hig-reward-headline','.hig-reward-description','.hig-reward-rules','.hig-reward-summary mark'])expect(q(selector),selector).toBeNull();
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).not.toContain('.hig-reward-eyebrow::before');expect(css).toMatch(/\.hig-reward-track \{ height:4px/);
  // The headline figure is the same size as the SwapPanel and TargetBlock headline figures.
  const rule=(selector:string)=>css.split('\n').find(line=>line.startsWith(selector+' {'))??'',size=(line:string)=>line.match(/font-size:[^;]+;line-height:[^;]+;font-weight:[^;]+;letter-spacing:[^;]+/)?.[0];
  expect(size(rule('.hig-reward-amount'))).toBeTruthy();expect(size(rule('.hig-reward-amount'))).toBe(size(rule('.hig-swap-amount')));expect(size(rule('.hig-reward-amount'))).toBe(size(rule('.hig-target-amount')));
  // Over the goal the bar is full; an unknown amount reads as a dash and an empty bar; the host formats the money.
  view.rerender(<RewardBlock {...base} promo={{...pool,amount:300000}}/>);expect(q('.hig-reward-track > span')!.style.width).toBe('100%');
  view.rerender(<RewardBlock {...base} promo={{...pool,amount:null,amountOptions:{style:'currency',currency:'EUR',maximumFractionDigits:0}}}/>);
  expect(spoken(q('.hig-reward-amount')!)).toBe('—');expect(q('.hig-reward-caption')!.textContent).toBe('of €250,000 prize pool');expect(q('.hig-reward-track > span')!.style.width).toBe('0%');
  // A headline or a description alone still reads; a bare pool has neither a caption nor a paragraph.
  view.rerender(<RewardBlock {...base} promo={{eyebrow:'Pool',amount:10,goal:100,description:'Funded by fees.'}}/>);expect(q('.hig-reward-summary')!.textContent).toBe('Funded by fees.');expect(q('.hig-reward-summary strong')).toBeNull();expect(q('.hig-reward-caption')).toBeNull();
  view.rerender(<RewardBlock {...base} promo={{eyebrow:'Pool',amount:10,goal:100}}/>);expect(q('.hig-reward-summary')).toBeNull();expect(q('.hig-reward-track')).toBeTruthy();
 });
 it('draws a sweepstakes: a caption under the figure, no bar, and the rules link and action report presses',async()=>{
  const rules=vi.fn(),action=vi.fn();
  render(<RewardBlock {...base} promo={{eyebrow:'Sweepstakes',rules:{label:'Rules',onSelect:rules},amount:100000,caption:'top prize',headline:'Every $10 you trade earns 1 entry.',action:{label:'Draws and winners',onSelect:action}}}/>);
  expect(spoken(q('.hig-reward-amount')!)).toBe('$100,000');expect(q('.hig-reward-caption')!.textContent).toBe('top prize');expect(q('.hig-reward-track')).toBeNull();
  // The rules control is a text link with a chevron, not a filled button.
  const link=screen.getByRole('button',{name:'Rules'});expect(link.className).toBe('hig-reward-rules');expect(link.querySelector('svg')).toBeTruthy();expect(link.closest('.hig-reward-promo-top')).toBeTruthy();
  await userEvent.click(link);await userEvent.click(screen.getByRole('button',{name:'Draws and winners'}));expect(rules).toHaveBeenCalledTimes(1);expect(action).toHaveBeenCalledTimes(1);
  const row=screen.getByRole('button',{name:'Draws and winners'});expect(row.className).toBe('hig-reward-action');expect(row.classList.contains('hig-button')).toBe(false);expect(row.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
 });
 it('pins the viewer on a tinted row above the list, with column headings, a standings choice and a footnote',async()=>{
  const change=vi.fn();
  render(<RewardBlock {...base} you={{id:'me',rank:2,name:'you',detail:'$1,090,779 vol',score:418450}} listTitle='Top 25 by volume' scoreTitle='Entries' footnote='Entries are provisional until audited.' tabs={{label:'Standings',options:[{value:'upcoming',label:'Upcoming draw'},{value:'winners',label:'Top winners'}],value:'upcoming',onValueChange:change}}/>);
  expect(rows('.hig-reward-you')).toEqual([['2','you','$1,090,779 vol','418,450','true']]);expect(q('.hig-reward-you > .hig-reward-row')!.tagName).toBe('DIV');
  expect(q('.hig-reward-you')!.compareDocumentPosition(q('.hig-reward-list')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect([...q('.hig-reward-columns')!.children].map(part=>part.textContent)).toEqual(['Top 25 by volume','Entries']);expect(q('.hig-reward-footnote')!.textContent).toBe('Entries are provisional until audited.');
  expect(screen.getByRole('group',{name:'Standings'})).toBeTruthy();expect((screen.getByRole('radio',{name:'Upcoming draw'}) as HTMLInputElement).checked).toBe(true);
  await userEvent.click(screen.getByRole('radio',{name:'Top winners'}));expect(change).toHaveBeenCalledWith('winners');
 });
 it('marks verified traders, named only when the host names the mark, and formats scores as the host asks',()=>{
  const view=render(<RewardBlock {...base} verifiedLabel='Verified' scoreOptions={{notation:'compact',maximumFractionDigits:1}}/>);
  expect(screen.getAllByRole('img',{name:'Verified'})).toHaveLength(1);expect(document.querySelectorAll('.hig-reward-verified')).toHaveLength(1);
  expect(rows().map(row=>row[3])).toEqual(['795.4K','418.5K','—']);
  view.rerender(<RewardBlock {...base}/>);expect(screen.queryByRole('img')).toBeNull();expect(q('.hig-reward-verified svg')!.getAttribute('aria-hidden')).toBe('true');
  view.rerender(<RewardBlock {...base} entries={[{id:'a',rank:1,name:'Ada',avatar:'/ada.png',score:1}]}/>);expect(q('.hig-reward-avatar img')!.getAttribute('src')).toBe('/ada.png');
 });
 it('ships no words of its own: only Back is built in, and figures follow the locale',()=>{
  render(<HIGProvider locale='de-DE' messages={{back:'Zurück'}}><RewardBlock {...base} promo={pool} onBack={()=>{}}/></HIGProvider>);
  expect(screen.getByRole('button',{name:'Zurück'})).toBeTruthy();expect(spoken(q('.hig-reward-amount')!)).toMatch(/^4\.037\s\$/);expect(q('.hig-reward-caption')!.textContent).toMatch(/^of 250\.000\s\$ prize pool$/);expect(rows()[0][3]).toBe('795.407');
  expect(readFileSync('packages/hig/react/src/blocks/reward-block.tsx','utf8')).not.toMatch(/messages\./);
 });
});
