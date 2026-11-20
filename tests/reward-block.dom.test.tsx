// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,render,screen} from '@testing-library/react';
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
  expect(q('.hig-reward-track')!.getAttribute('aria-hidden')).toBe('true');expect(parseFloat(q('.hig-reward-track > span')!.style.getPropertyValue('--hig-reward-fill'))).toBeCloseTo(1.6148,3);
  // One paragraph: the headline in the text colour, the description continuing it.
  const summary=q('.hig-reward-summary')!;expect(summary.textContent).toBe('Top 100 traders split the pool. Funded by builder fees on every trade.');expect(summary.querySelector('strong')!.textContent).toBe('Top 100 traders split the pool.');
  // Nothing sits under the bar, the eyebrow has no dot, and there is no rules link without its prop.
  for(const selector of ['.hig-reward-progress-meta','.hig-reward-headline','.hig-reward-description','.hig-reward-rules','.hig-reward-summary mark'])expect(q(selector),selector).toBeNull();
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).not.toContain('.hig-reward-eyebrow::before');expect(css).toMatch(/\.hig-reward-track \{ height:4px/);
  // The headline figure is the same size as the SwapPanel and TargetBlock headline figures.
  const rule=(selector:string)=>css.split('\n').find(line=>line.startsWith(selector+' {'))??'',size=(line:string)=>line.match(/font-size:[^;]+;line-height:[^;]+;font-weight:[^;]+;letter-spacing:[^;]+/)?.[0];
  expect(size(rule('.hig-reward-amount'))).toBeTruthy();expect(size(rule('.hig-reward-amount'))).toBe(size(rule('.hig-swap-amount')));expect(size(rule('.hig-reward-amount'))).toBe(size(rule('.hig-target-amount')));
  // Over the goal the bar is full; an unknown amount reads as a dash and an empty bar; the host formats the money.
  view.rerender(<RewardBlock {...base} promo={{...pool,amount:300000}}/>);expect(q('.hig-reward-track > span')!.style.getPropertyValue('--hig-reward-fill')).toBe('100%');
  view.rerender(<RewardBlock {...base} promo={{...pool,amount:null,amountOptions:{style:'currency',currency:'EUR',maximumFractionDigits:0}}}/>);
  expect(spoken(q('.hig-reward-amount')!)).toBe('—');expect(q('.hig-reward-caption')!.textContent).toBe('of €250,000 prize pool');expect(q('.hig-reward-track > span')!.style.getPropertyValue('--hig-reward-fill')).toBe('0%');
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
describe('RewardBlock host slots (Unreleased)',()=>{
 it('draws real links for rules and the promo action, and still reports the press',async()=>{
  const rules=vi.fn();
  render(<RewardBlock {...base} promo={{...pool,rules:{label:'Rules',href:'/rules',onSelect:rules},action:{label:'Draws and winners',href:'https://example.com/draws',target:'_blank'}}}/>);
  const link=screen.getByRole('link',{name:'Rules'});expect(link.getAttribute('href')).toBe('/rules');expect(link.className).toBe('hig-reward-rules');expect(link.hasAttribute('target')).toBe(false);
  link.addEventListener('click',event=>event.preventDefault());await userEvent.click(link);expect(rules).toHaveBeenCalledTimes(1);
  const draws=screen.getByRole('link',{name:'Draws and winners'});expect(draws.getAttribute('target')).toBe('_blank');expect(draws.getAttribute('rel')).toBe('noopener noreferrer');
  expect(readFileSync('packages/hig/react/src/styles.css','utf8')).toContain('a.hig-reward-rules,a.hig-reward-action { text-decoration:none; }');
 });
 it('names the pinned row, draws a status line between it and the list, live entry details and per-entry score formats',()=>{
  const prizes:RewardEntry[]=[{id:'w1',rank:1,name:'0xaa…01',score:1000},{id:'w2',rank:2,name:'0xbb…02',score:12.5,scoreOptions:{style:'currency',currency:'USD'},detail:{value:1090779,options:{maximumFractionDigits:0},suffix:' vol'}}];
  render(<RewardBlock {...base} entries={prizes} scoreOptions={{style:'currency',currency:'USD',maximumFractionDigits:0}} you={{id:'me',rank:9,name:'you',score:3}} youLabel='Your rank' status="You're not ranked yet"/>);
  const pinned=screen.getByRole('group',{name:'Your rank'});expect(pinned.className).toBe('hig-reward-you');
  const status=screen.getByRole('status');expect(status.textContent).toBe("You're not ranked yet");
  expect(pinned.compareDocumentPosition(status)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();expect(status.compareDocumentPosition(q('.hig-reward-list')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(rows().map(([rank,name,,score])=>[rank,name,score])).toEqual([['1','0xaa…01','$1,000'],['2','0xbb…02','$12.50']]);
  expect(spoken(document.querySelectorAll('.hig-reward-rows .hig-reward-identity > span')[0]!)).toBe('1,090,779 vol');
  expect(document.querySelectorAll('.hig-reward-rows .hig-reward-identity > span .hig-animated-number-visual')).toHaveLength(1);
 });
 it('shows skeleton rows while loading, pagination under the list, a host verified mark, a host headline and a sticky header',async()=>{
  const previous=vi.fn(),next=vi.fn();
  const view=render(<RewardBlock {...base} loading/>);
  // Only the skeleton list is busy, not the whole screen.
  expect(q('.hig-reward-block')!.hasAttribute('aria-busy')).toBe(false);expect(q('.hig-reward-list')!.getAttribute('aria-busy')).toBe('true');expect(document.querySelectorAll('.hig-reward-skeleton[aria-hidden="true"]')).toHaveLength(5);expect(q('.hig-reward-rows')).toBeNull();
  view.rerender(<RewardBlock {...base} loading loadingLabel='Loading standings'/>);
  const loadingStatus=screen.getByRole('status');expect(loadingStatus.textContent).toBe('Loading standings');expect(loadingStatus.className).toBe('hig-sr-only');expect(loadingStatus.closest('[aria-busy="true"]')).toBeNull();
  view.rerender(<RewardBlock {...base} stickyHeader verifiedLabel='Genesis' verifiedMark={<svg data-testid='genesis'/>} promo={{...pool,headline:<>Top 100 <em>split</em> the pool.</>}}
   pagination={{previous:{label:'Previous',onSelect:previous,disabled:true},next:{label:'Next',onSelect:next},label:'1–25'}} footnote='Updates every 15 minutes'/>);
  expect(q('.hig-reward-block')!.hasAttribute('aria-busy')).toBe(false);expect(q('.hig-reward-block > .hig-screen-header')!.dataset.sticky).toBe('true');
  // Host artwork is drawn inside the mark's image role, named by the verified words, as before.
  const mark=screen.getAllByTestId('genesis')[0].closest('.hig-reward-verified')!;expect(mark.getAttribute('role')).toBe('img');expect(mark.getAttribute('aria-label')).toBe('Genesis');expect(mark.querySelector('.hig-sr-only')).toBeNull();expect(q('.hig-reward-summary em')!.textContent).toBe('split');
  const paging=q('.hig-reward-pagination')!;expect(paging.textContent).toBe('Previous1–25Next');expect(paging.querySelector('[aria-live="polite"]')!.textContent).toBe('1–25');
  expect(q('.hig-reward-list')!.nextElementSibling).toBe(paging);expect(paging.nextElementSibling!.className).toBe('hig-reward-footnote');
  expect((screen.getByRole('button',{name:'Previous'}) as HTMLButtonElement).disabled).toBe(true);await userEvent.click(screen.getByRole('button',{name:'Next'}));expect(next).toHaveBeenCalledTimes(1);expect(previous).not.toHaveBeenCalled();
  expect(readFileSync('packages/hig/react/src/styles.css','utf8')).toContain(".hig-screen-header[data-sticky][data-scrolled],.hig-profile-bar[data-sticky][data-scrolled] { background-color:var(--hig-sticky-header-background,var(--hig-screen-background,var(--hig-background))); }");
 });
 it('leaves the header out with header={false} and keeps an interactive verified mark reachable (Unreleased)',async()=>{
  const explain=vi.fn();
  render(<RewardBlock {...base} header={false} verifiedLabel='Genesis' verifiedMarkInteractive verifiedMark={<button type='button' onClick={explain}>Genesis badge</button>} entries={[{id:'a',rank:1,name:'0xabc',verified:true,score:5}]}/>);
  expect(q('.hig-screen-header')).toBeNull();expect(screen.queryByRole('heading')).toBeNull();
  // An interactive mark sits outside the image role, after the verified words.
  const mark=screen.getByRole('button',{name:'Genesis badge'}).closest('.hig-reward-verified')!;expect(mark.getAttribute('role')).toBeNull();expect(mark.querySelector('.hig-sr-only')!.textContent).toBe('Genesis');
  await userEvent.click(screen.getByRole('button',{name:'Genesis badge'}));expect(explain).toHaveBeenCalledTimes(1);
 });
 it('draws a detail figure from host-formatted text (Unreleased)',()=>{
  render(<RewardBlock {...base} entries={[{id:'a',rank:1,name:'0xabc',detail:{value:1090779,formattedValue:'1.090.779',suffix:' vol'},score:5}]}/>);
  expect(q('.hig-reward-identity .hig-sr-only')!.textContent).toBe('1.090.779 vol');
 });
});
describe('RewardBlock promo text, slots and a promotion-only pane',()=>{
 it('draws a host-text amount, a node caption and no list without entries',()=>{
  render(<HIGProvider><RewardBlock title='Rewards' promo={{eyebrow:'Sweepstakes',amount:'$500',caption:<span data-testid='countdown'>Draw in 2:14:33</span>,headline:'Trade to enter.'}}/></HIGProvider>);
  const amount=q('.hig-reward-amount')!;expect(amount.tagName).toBe('P');expect(amount.textContent).toBe('$500');expect(amount.querySelector('.hig-animated-number')).toBeNull();
  const caption=screen.getByTestId('countdown').parentElement!;expect(caption.tagName).toBe('DIV');expect(caption.className).toBe('hig-reward-caption hig-number');expect(caption.previousElementSibling).toBe(amount);
  expect(q('.hig-reward-list')).toBeNull();expect(q('.hig-reward-rows')).toBeNull();expect(q('.hig-reward-track')).toBeNull();
 });
 it('draws a host figure in the figure slot, a caption function with a node, and no figure line without amount or figure',()=>{
  const {unmount}=render(<HIGProvider><RewardBlock title='Rewards' entries={[]} promo={{eyebrow:'Pool',figure:<strong data-testid='live'>$4,037</strong>,goal:250000,caption:goal=><em>of {goal}</em>}}/></HIGProvider>);
  const slot=screen.getByTestId('live').parentElement!;expect(slot.tagName).toBe('DIV');expect(slot.className).toBe('hig-reward-amount');
  expect(q('.hig-reward-caption')!.textContent).toBe('of $250,000');expect(q('.hig-reward-track > span')!.style.getPropertyValue('--hig-reward-fill')).toBe('0%');
  unmount();render(<HIGProvider><RewardBlock title='Rewards' promo={{eyebrow:'Soon',headline:'Draws open Monday.'}}/></HIGProvider>);
  expect(q('.hig-reward-amount')).toBeNull();expect(q('.hig-reward-summary')!.textContent).toBe('Draws open Monday.');
 });
});

it('shows the streak reward and counts down to the supplied prize drawing',()=>{
 vi.useFakeTimers();
 try{
  const drawing={at:Date.now()+1500,label:'Prize drawing in',endedLabel:'Drawing time reached'};
  render(<RewardBlock title="Leaderboard" promo={{eyebrow:'Sweepstakes',drawing,streak:{label:'Current streak',count:{value:7,suffix:' days'},rewardLabel:'Bonus points',reward:{value:30}}}}/>);
  expect(screen.getByText('Bonus points')).toBeTruthy();
  expect(screen.getByRole('timer').textContent).toContain('2 seconds');
  act(()=>vi.advanceTimersByTime(500));
  expect(screen.getByRole('timer').textContent).toContain('1 second');
  act(()=>vi.advanceTimersByTime(1000));
  expect(screen.queryByRole('timer')).toBeNull();
  expect(screen.getByText(drawing.endedLabel)).toBeTruthy();
 }finally{cleanup();vi.useRealTimers();}
});

it('windows large ordered standings and exposes each mounted rank within the full list',()=>{
 const many=Array.from({length:10000},(_,i)=>({id:String(i),rank:i+1,name:'Trader '+i,score:i}));
 render(<RewardBlock title="Standings" entries={many}/>);
 const list=document.querySelector('ol.hig-reward-rows')!;
 expect(list.children.length).toBeLessThan(50);
 expect(list.firstElementChild?.getAttribute('aria-posinset')).toBe('1');
 expect(list.firstElementChild?.getAttribute('aria-setsize')).toBe('10000');
});

it.each([40,1000])('reuses the %i standings when only the status changes',count=>{
 const reads=vi.fn(()=>100);
 const entries=Array.from({length:count},(_,i)=>({id:String(i),name:'Trader',rank:i+1,get score(){return reads();}}));
 const view=render(<RewardBlock {...base} entries={entries} you={entries[0]} status="Live"/>);
 expect(reads).toHaveBeenCalled();
 reads.mockClear();
 view.rerender(<RewardBlock {...base} entries={entries} you={entries[0]} status="Updated"/>);
 expect(reads).not.toHaveBeenCalled();
});

it('reads only the changed score when a virtualized leaderboard refreshes',()=>{
 const reads=new Set<number>();
 const makeEntry=(index:number,score:number)=>({id:String(index),name:'Trader '+index,rank:index+1,get score(){reads.add(index);return score;}});
 const entries=Array.from({length:1000},(_,i)=>makeEntry(i,i));
 const view=render(<RewardBlock {...base} entries={entries}/>);
 reads.clear();
 const next=entries.slice();next[2]=makeEntry(2,77);
 view.rerender(<RewardBlock {...base} entries={next}/>);
 expect([...reads]).toEqual([2]);
 expect(spoken(view.container.querySelector('li[data-index="2"] .hig-reward-score')!)).toBe('77');
});

describe('RewardBlock entry action (Unreleased)',()=>{
 const place='Open your place on PrizeRail';
 const me:RewardEntry={id:'me',rank:2,name:'you',detail:'$1,090,779 vol',score:418450};
 it('leaves a row without an action as it was: no control, no id, the same elements',()=>{
  render(<RewardBlock {...base} you={me} youLabel='Your rank' verifiedLabel='Verified'/>);
  expect(q('.hig-reward-block')!.querySelectorAll('.hig-reward-row [id],.hig-reward-row a,.hig-reward-row button,a.hig-reward-row,button.hig-reward-row,[data-action],.hig-reward-hit').length).toBe(0);
  expect([...q('.hig-reward-rows')!.children].map(row=>[row.tagName,row.className,row.getAttribute('data-you'),row.attributes.length])).toEqual([['LI','hig-reward-row',null,1],['LI','hig-reward-row','true',2],['LI','hig-reward-row',null,1]]);
  const pinned=q('.hig-reward-you')!.firstElementChild!;expect([pinned.tagName,pinned.className,pinned.getAttribute('data-you'),pinned.attributes.length]).toEqual(['DIV','hig-reward-row','true',2]);
  expect([...pinned.children].map(part=>part.tagName+'.'+part.className)).toEqual(['SPAN.hig-reward-rank hig-number','SPAN.hig-reward-avatar','SPAN.hig-reward-identity','SPAN.hig-reward-score']);
  expect(pinned.querySelector('.hig-reward-identity > strong')!.firstChild!.nodeType).toBe(Node.TEXT_NODE);
 });
 it('makes a list row with href one real link, named by the row and then the action, and reports the press',async()=>{
  const select=vi.fn();
  const list=entries.map(entry=>entry.id==='me'?{...entry,action:{label:place,href:'https://example.com/me',target:'_blank',onSelect:select}}:entry);
  render(<RewardBlock {...base} entries={list} verifiedLabel='Verified'/>);
  const link=screen.getByRole('link',{name:`2 you $1,090,779 vol 418,450 ${place}`});
  expect(link.tagName).toBe('A');expect(link.className).toBe('hig-reward-row');expect(link.getAttribute('data-you')).toBe('true');expect(link.getAttribute('href')).toBe('https://example.com/me');expect(link.getAttribute('target')).toBe('_blank');expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  // The link is the row inside its list item, in place in the ordered list; the other rows are not controls.
  expect(link.parentElement!.tagName).toBe('LI');expect(link.parentElement!.className).toBe('');expect([...q('.hig-reward-rows')!.children].indexOf(link.parentElement!)).toBe(1);
  expect(screen.getAllByRole('link').length).toBe(1);expect(q('.hig-reward-rows')!.querySelectorAll('button').length).toBe(0);expect(rows().length).toBe(2);
  // The label is read, not drawn, and nothing interactive is nested in the link.
  expect(link.querySelector('.hig-sr-only:last-of-type')!.textContent).toBe(place);expect(link.querySelector('a,button,[tabindex]')).toBeNull();
  link.addEventListener('click',event=>event.preventDefault());await userEvent.click(link);expect(select).toHaveBeenCalledTimes(1);
 });
 it('makes the pinned row a button inside its named group, reachable and pressed from the keyboard',async()=>{
  const select=vi.fn();
  render(<RewardBlock title='Leaderboard' header={false} youLabel='Your rank' verifiedLabel='Verified' you={{...me,verified:true,action:{label:place,onSelect:select}}} entries={entries}/>);
  const group=screen.getByRole('group',{name:'Your rank'}),button=screen.getByRole('button',{name:`2 you Verified $1,090,779 vol 418,450 ${place}`});
  expect(button.parentElement).toBe(group);expect(button.tagName).toBe('BUTTON');expect(button.getAttribute('type')).toBe('button');expect(button.className).toBe('hig-reward-row');expect(button.getAttribute('data-you')).toBe('true');
  await userEvent.tab();expect(document.activeElement).toBe(button);await userEvent.keyboard('{Enter}');expect(select).toHaveBeenCalledTimes(1);await userEvent.keyboard(' ');expect(select).toHaveBeenCalledTimes(2);
  // The same entry in the list has no action of its own, so it stays a plain row.
  expect(q('.hig-reward-rows')!.querySelector('a,button')).toBeNull();
 });
 it('gives the control the provider press decoration, and HIG row focus, hover and pressed styles',()=>{
  render(<HIGProvider pressDecoration={({kind})=><i data-press={kind}/>}><RewardBlock {...base} you={{...me,action:{label:place,onSelect:()=>{}}}}/></HIGProvider>);
  expect(screen.getByRole('button',{name:new RegExp(place)}).querySelector('.hig-press-decoration[data-kind="row"] [data-press="row"]')).toBeTruthy();
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  expect(css).toContain(':is(a,button).hig-reward-row:focus-visible,.hig-reward-hit:focus-visible { outline:2px solid var(--hig-focus,var(--hig-text));outline-offset:-2px; }');
  expect(css).toContain(':is(a,button).hig-reward-row:active,.hig-reward-row:has(> .hig-reward-hit:active) { background:var(--hig-fill-raised); }');
  expect(css).toContain(':is(a,button).hig-reward-row:hover,.hig-reward-row:has(> .hig-reward-hit:hover) { background:var(--hig-fill-raised); }');
 });
 it('keeps an interactive verified mark its own control beside the row link, never inside it',async()=>{
  const explain=vi.fn(),select=vi.fn();
  render(<RewardBlock title='Leaderboard' header={false} youLabel='Your rank' verifiedLabel='Genesis' verifiedMarkInteractive verifiedMark={<button type='button' onClick={explain}>Genesis badge</button>}
   you={{...me,verified:true,action:{label:place,href:'/me',onSelect:select}}} entries={[{id:'a',rank:1,name:'0xabc',verified:true,score:5,action:{label:'Open 0xabc',onSelect:select}},{id:'b',rank:2,name:'Bo',score:4,action:{label:'Open Bo',onSelect:select}}]}/>);
  const link=screen.getByRole('link',{name:`2 you Genesis $1,090,779 vol 418,450 ${place}`}),mark=screen.getAllByRole('button',{name:'Genesis badge'})[0];
  const row=link.parentElement!;expect(row.tagName).toBe('DIV');expect(row.className).toBe('hig-reward-row');expect(row.hasAttribute('data-action')).toBe(true);expect(row.getAttribute('data-you')).toBe('true');expect(row.parentElement).toBe(screen.getByRole('group',{name:'Your rank'}));
  expect(link.className).toBe('hig-reward-hit');expect(link.contains(mark)).toBe(false);expect(row.contains(mark)).toBe(true);expect(link.querySelector('a,button')).toBeNull();
  await userEvent.click(mark);expect(explain).toHaveBeenCalledTimes(1);expect(select).not.toHaveBeenCalled();
  link.addEventListener('click',event=>event.preventDefault());await userEvent.click(link);expect(select).toHaveBeenCalledTimes(1);
  // In the list the row with a mark is the list item with the control over it; a row without a mark is the control itself.
  const over=screen.getByRole('button',{name:'1 0xabc Genesis 5 Open 0xabc'});expect(over.className).toBe('hig-reward-hit');expect(over.parentElement!.tagName).toBe('LI');expect(over.parentElement!.className).toBe('hig-reward-row');
  expect(screen.getByRole('button',{name:'2 Bo 4 Open Bo'}).className).toBe('hig-reward-row');
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).toContain('.hig-reward-row[data-action] .hig-reward-verified { position:relative;z-index:1; }');
 });
 it('keeps a row with an action mounted in a windowed list so Tab reaches it, at its place in the full list',()=>{
  const many:RewardEntry[]=Array.from({length:400},(_,i)=>({id:String(i),rank:i+1,name:'Trader '+i,score:i,...(i===300?{you:true,action:{label:place,href:'/me'}}:null)}));
  render(<RewardBlock title='Standings' entries={many}/>);
  const list=q('ol.hig-reward-rows')!;expect(list.children.length).toBeLessThan(50);
  const link=screen.getByRole('link',{name:`301 Trader 300 300 ${place}`}),item=link.parentElement!;
  expect(item.parentElement).toBe(list);expect(item.getAttribute('data-index')).toBe('300');expect(item.getAttribute('aria-posinset')).toBe('301');expect(item.getAttribute('aria-setsize')).toBe('400');expect(item.style.position).toBe('absolute');
 });
});
