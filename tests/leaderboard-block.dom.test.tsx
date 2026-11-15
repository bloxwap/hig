// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {LeaderboardBlock,leaderboardProgress,type LeaderboardBlockProps,type LeaderboardEntry,type LeaderboardPromo} from '../packages/hig/react/src/blocks/leaderboard-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const entries:LeaderboardEntry[]=[{id:'a',rank:1,name:'0x4e79…949f',verified:true,detail:'$1,789,061 vol',score:795407},{id:'me',rank:2,name:'you',detail:'$1,090,779 vol',score:418450,you:true},{id:'c',rank:3,name:'Zed',score:null}];
const pool:LeaderboardPromo={eyebrow:'Season 01',amount:4037,goal:250000,caption:goal=>`of ${goal} prize pool`,headline:'Top 100 traders split the pool.',description:'Funded by builder fees on every trade.'};
const base:LeaderboardBlockProps={title:'Leaderboard',entries};
const q=(selector:string)=>document.querySelector<HTMLElement>(selector);
const rows=(scope='.hig-leaderboard-rows')=>[...document.querySelectorAll(`${scope} > .hig-leaderboard-row`)].map(row=>[spoken(row.querySelector('.hig-leaderboard-rank')!),spoken(row.querySelector('.hig-leaderboard-identity > strong')!),row.querySelector('.hig-leaderboard-identity > span')?.textContent??null,spoken(row.querySelector('.hig-leaderboard-score')!),row.getAttribute('data-you')]);
describe('leaderboardProgress',()=>{
 it('is the share of the goal reached, clamped, and unknown without a usable amount or goal',()=>{
  expect(leaderboardProgress(4037,250000)).toBeCloseTo(0.016148,6);expect(leaderboardProgress(300,200)).toBe(1);expect(leaderboardProgress(-5,200)).toBe(0);expect(leaderboardProgress(0,200)).toBe(0);
  for(const [amount,goal] of [[null,200],[10,undefined],[10,0],[10,-1],[Number.NaN,200],[10,Number.POSITIVE_INFINITY]] as const)expect(leaderboardProgress(amount,goal)).toBeNull();
 });
});
describe('LeaderboardBlock',()=>{
 it('shows the heading with Back and the host control, and the ranked rows in order',async()=>{
  const back=vi.fn();render(<LeaderboardBlock {...base} onBack={back} headerAction={<button type='button'>Share</button>}/>);
  expect(screen.getByRole('heading',{name:'Leaderboard'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);expect(screen.getByRole('button',{name:'Share'})).toBeTruthy();
  expect(q('.hig-leaderboard-rows')!.tagName).toBe('OL');
  expect(rows()).toEqual([['1','0x4e79…949f','$1,789,061 vol','795,407',null],['2','you','$1,090,779 vol','418,450','true'],['3','Zed',null,'—',null]]);
  // Without artwork the avatar shows the first letters; nothing else is drawn without its props.
  expect([...document.querySelectorAll('.hig-leaderboard-avatar')].map(avatar=>avatar.textContent)).toEqual(['0x','yo','Ze']);
  for(const selector of ['.hig-leaderboard-promo','.hig-leaderboard-you','.hig-leaderboard-columns','.hig-leaderboard-footnote','.hig-segmented-control'])expect(q(selector),selector).toBeNull();
  expect(blocks.LeaderboardBlock).toBe(LeaderboardBlock);expect(blocks.leaderboardProgress).toBe(leaderboardProgress);
 });
 it('draws a prize pool: a muted eyebrow, one large figure, the goal in the caption under it, and a thin bar at the share reached',()=>{
  const view=render(<LeaderboardBlock {...base} promo={pool}/>);
  expect(q('.hig-leaderboard-promo')!.classList.contains('hig-surface')).toBe(true);expect(q('.hig-leaderboard-eyebrow')!.textContent).toBe('Season 01');
  expect(spoken(q('.hig-leaderboard-amount')!)).toBe('$4,037');expect(q('.hig-leaderboard-caption')!.textContent).toBe('of $250,000 prize pool');
  expect(q('.hig-leaderboard-track')!.getAttribute('aria-hidden')).toBe('true');expect(parseFloat(q('.hig-leaderboard-track > span')!.style.width)).toBeCloseTo(1.6148,3);
  // One paragraph: the headline in the text colour, the description continuing it.
  const summary=q('.hig-leaderboard-summary')!;expect(summary.textContent).toBe('Top 100 traders split the pool. Funded by builder fees on every trade.');expect(summary.querySelector('strong')!.textContent).toBe('Top 100 traders split the pool.');
  // Nothing sits under the bar, the eyebrow has no dot, and there is no rules link without its prop.
  for(const selector of ['.hig-leaderboard-progress-meta','.hig-leaderboard-headline','.hig-leaderboard-description','.hig-leaderboard-rules','.hig-leaderboard-summary mark'])expect(q(selector),selector).toBeNull();
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).not.toContain('.hig-leaderboard-eyebrow::before');expect(css).toMatch(/\.hig-leaderboard-track \{ height:4px/);
  // Over the goal the bar is full; an unknown amount reads as a dash and an empty bar; the host formats the money.
  view.rerender(<LeaderboardBlock {...base} promo={{...pool,amount:300000}}/>);expect(q('.hig-leaderboard-track > span')!.style.width).toBe('100%');
  view.rerender(<LeaderboardBlock {...base} promo={{...pool,amount:null,amountOptions:{style:'currency',currency:'EUR',maximumFractionDigits:0}}}/>);
  expect(spoken(q('.hig-leaderboard-amount')!)).toBe('—');expect(q('.hig-leaderboard-caption')!.textContent).toBe('of €250,000 prize pool');expect(q('.hig-leaderboard-track > span')!.style.width).toBe('0%');
  // A headline or a description alone still reads; a bare pool has neither a caption nor a paragraph.
  view.rerender(<LeaderboardBlock {...base} promo={{eyebrow:'Pool',amount:10,goal:100,description:'Funded by fees.'}}/>);expect(q('.hig-leaderboard-summary')!.textContent).toBe('Funded by fees.');expect(q('.hig-leaderboard-summary strong')).toBeNull();expect(q('.hig-leaderboard-caption')).toBeNull();
  view.rerender(<LeaderboardBlock {...base} promo={{eyebrow:'Pool',amount:10,goal:100}}/>);expect(q('.hig-leaderboard-summary')).toBeNull();expect(q('.hig-leaderboard-track')).toBeTruthy();
 });
 it('draws a sweepstakes: a caption under the figure, no bar, and the rules link and action report presses',async()=>{
  const rules=vi.fn(),action=vi.fn();
  render(<LeaderboardBlock {...base} promo={{eyebrow:'Sweepstakes',rules:{label:'Rules',onSelect:rules},amount:100000,caption:'top prize',headline:'Every $10 you trade earns 1 entry.',action:{label:'Draws and winners',onSelect:action}}}/>);
  expect(spoken(q('.hig-leaderboard-amount')!)).toBe('$100,000');expect(q('.hig-leaderboard-caption')!.textContent).toBe('top prize');expect(q('.hig-leaderboard-track')).toBeNull();
  // The rules control is a text link with a chevron, not a filled button.
  const link=screen.getByRole('button',{name:'Rules'});expect(link.className).toBe('hig-leaderboard-rules');expect(link.querySelector('svg')).toBeTruthy();expect(link.closest('.hig-leaderboard-promo-top')).toBeTruthy();
  await userEvent.click(link);await userEvent.click(screen.getByRole('button',{name:'Draws and winners'}));expect(rules).toHaveBeenCalledTimes(1);expect(action).toHaveBeenCalledTimes(1);
  const row=screen.getByRole('button',{name:'Draws and winners'});expect(row.className).toBe('hig-leaderboard-action');expect(row.classList.contains('hig-button')).toBe(false);expect(row.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
 });
 it('pins the viewer on a tinted row above the list, with column headings, a standings choice and a footnote',async()=>{
  const change=vi.fn();
  render(<LeaderboardBlock {...base} you={{id:'me',rank:2,name:'you',detail:'$1,090,779 vol',score:418450}} listTitle='Top 25 by volume' scoreTitle='Entries' footnote='Entries are provisional until audited.' tabs={{label:'Standings',options:[{value:'upcoming',label:'Upcoming draw'},{value:'winners',label:'Top winners'}],value:'upcoming',onValueChange:change}}/>);
  expect(rows('.hig-leaderboard-you')).toEqual([['2','you','$1,090,779 vol','418,450','true']]);expect(q('.hig-leaderboard-you > .hig-leaderboard-row')!.tagName).toBe('DIV');
  expect(q('.hig-leaderboard-you')!.compareDocumentPosition(q('.hig-leaderboard-list')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect([...q('.hig-leaderboard-columns')!.children].map(part=>part.textContent)).toEqual(['Top 25 by volume','Entries']);expect(q('.hig-leaderboard-footnote')!.textContent).toBe('Entries are provisional until audited.');
  expect(screen.getByRole('group',{name:'Standings'})).toBeTruthy();expect((screen.getByRole('radio',{name:'Upcoming draw'}) as HTMLInputElement).checked).toBe(true);
  await userEvent.click(screen.getByRole('radio',{name:'Top winners'}));expect(change).toHaveBeenCalledWith('winners');
 });
 it('marks verified traders, named only when the host names the mark, and formats scores as the host asks',()=>{
  const view=render(<LeaderboardBlock {...base} verifiedLabel='Verified' scoreOptions={{notation:'compact',maximumFractionDigits:1}}/>);
  expect(screen.getAllByRole('img',{name:'Verified'})).toHaveLength(1);expect(document.querySelectorAll('.hig-leaderboard-verified')).toHaveLength(1);
  expect(rows().map(row=>row[3])).toEqual(['795.4K','418.5K','—']);
  view.rerender(<LeaderboardBlock {...base}/>);expect(screen.queryByRole('img')).toBeNull();expect(q('.hig-leaderboard-verified svg')!.getAttribute('aria-hidden')).toBe('true');
  view.rerender(<LeaderboardBlock {...base} entries={[{id:'a',rank:1,name:'Ada',avatar:'/ada.png',score:1}]}/>);expect(q('.hig-leaderboard-avatar img')!.getAttribute('src')).toBe('/ada.png');
 });
 it('ships no words of its own: only Back is built in, and figures follow the locale',()=>{
  render(<HIGProvider locale='de-DE' messages={{back:'Zurück'}}><LeaderboardBlock {...base} promo={pool} onBack={()=>{}}/></HIGProvider>);
  expect(screen.getByRole('button',{name:'Zurück'})).toBeTruthy();expect(spoken(q('.hig-leaderboard-amount')!)).toMatch(/^4\.037\s\$/);expect(q('.hig-leaderboard-caption')!.textContent).toMatch(/^of 250\.000\s\$ prize pool$/);expect(rows()[0][3]).toBe('795.407');
  expect(readFileSync('packages/hig/react/src/blocks/leaderboard-block.tsx','utf8')).not.toMatch(/messages\./);
 });
});
