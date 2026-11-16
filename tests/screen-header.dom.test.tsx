// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {ScreenHeader} from '../packages/hig/react/src/blocks/screen-header';
import {AccountBlock} from '../packages/hig/react/src/blocks/account-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
describe('ScreenHeader',()=>{
 it('is published on its own entry for host panes that have no block, on web and native',()=>{
  const exportsMap=JSON.parse(readFileSync('packages/hig/package.json','utf8')).exports as Record<string,{import:string}>;
  expect(exportsMap['./react/blocks/screen-header'].import).toBe('./react/dist/blocks/screen-header.js');
  expect(exportsMap['./native/screen-header'].import).toBe('./native/dist/screen-header.js');
 });
 it('draws the same header as the blocks: Back leading, the title centred, the host control trailing',async()=>{
  const back=vi.fn();
  const {container}=render(<HIGProvider><ScreenHeader title='Edit target' onBack={back} action={<button type='button'>Done</button>}/></HIGProvider>);
  const header=container.querySelector('.hig-screen-header') as HTMLElement;
  expect([...header.children].map(child=>child.className)).toEqual(['hig-screen-header-side','hig-screen-title','hig-screen-header-side']);
  expect(screen.getByRole('heading',{level:2,name:'Edit target'})).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  // A block draws the very same markup.
  const block=render(<HIGProvider><AccountBlock assets={[]} onBack={()=>{}}/></HIGProvider>).container.querySelector('.hig-screen-header') as HTMLElement;
  expect(block.firstElementChild?.outerHTML).toBe(header.firstElementChild?.outerHTML);
 });
 it('gives the heading an id only when the host asks, so a dialog can be named by it',()=>{
  const {container,rerender}=render(<ScreenHeader title='Position'/>);
  expect(container.querySelector('h2')?.hasAttribute('id')).toBe(false);
  expect(container.innerHTML).toBe('<div class="hig-screen-header"><span class="hig-screen-header-side"></span><h2 class="hig-screen-title">Position</h2><span class="hig-screen-header-side"></span></div>');
  rerender(<div role='dialog' aria-labelledby='position-title'><ScreenHeader title='Position' headingId='position-title'/></div>);
  expect(screen.getByRole('dialog',{name:'Position'})).toBeTruthy();expect(container.querySelector('h2')?.id).toBe('position-title');
 });
 it('draws a host badge beside the title, inside the heading (Unreleased)',()=>{
  const {container}=render(<ScreenHeader title='Trade' badge='Demo' headingId='trade-title'/>);
  // The badge reads after a pause: a comma that is read, not drawn.
  expect(container.querySelector('h2')!.innerHTML).toBe('Trade<span class="hig-sr-only">,</span> <span class="hig-badge hig-screen-badge">Demo</span>');
  // jsdom spaces every element in a name; a browser reads the inline comma as `Trade, Demo`.
  expect(screen.getByRole('heading',{name:/^Trade ?, Demo$/}).id).toBe('trade-title');
 });
 it('draws Back unavailable and passes attributes through to it (Unreleased)',async()=>{
  const back=vi.fn();
  render(<HIGProvider pressDecoration={({disabled})=>disabled?null:<i data-testid='decoration'/>}><ScreenHeader title='Close position' onBack={back} backDisabled backProps={{'data-host':'back'} as never}/></HIGProvider>);
  const button=screen.getByRole('button',{name:'Back'}) as HTMLButtonElement;
  expect(button.disabled).toBe(true);expect(button.getAttribute('data-host')).toBe('back');expect(screen.queryByTestId('decoration')).toBeNull();
  await userEvent.click(button);expect(back).not.toHaveBeenCalled();
 });
 it('hides the title visually while it stays the accessible heading (Unreleased)',()=>{
  const {container}=render(<ScreenHeader title='Log in' hideTitle action={<button type='button'>Close</button>}/>);
  const heading=screen.getByRole('heading',{level:2,name:'Log in'});expect(heading.classList.contains('hig-sr-only')).toBe(true);
  expect(container.querySelector('.hig-screen-header-side:last-child')!.textContent).toBe('Close');
  expect(readFileSync('packages/hig/react/src/styles.css','utf8')).toContain('.hig-screen-header > .hig-screen-header-side:last-child { grid-column:3; }');
 });
 it('reads description after the heading, visually hidden, with an id a dialog can describe itself by (Unreleased)',()=>{
  const {container,rerender}=render(<ScreenHeader title='Log in' headingId='login-title' description='Choose a sign-in method'/>);
  const heading=screen.getByRole('heading',{level:2,name:'Log in'});const description=container.querySelector('p.hig-sr-only')!;
  expect(description.textContent).toBe('Choose a sign-in method');expect(description.id).toBe('login-title-description');
  expect(heading.compareDocumentPosition(description)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  rerender(<ScreenHeader title='Log in' description='Choose a sign-in method'/>);expect(container.querySelector('p.hig-sr-only')!.hasAttribute('id')).toBe(false);
  rerender(<ScreenHeader title='Log in'/>);expect(container.querySelector('p')).toBeNull();
 });
 it('pins the header transparent at rest and fills it once content scrolls under it (Unreleased)',()=>{
  const {container}=render(<div data-testid='scroller' style={{overflowY:'auto'}}><section><ScreenHeader title='Signals' stickyHeader/><p>Rows</p></section></div>);
  const header=container.querySelector<HTMLElement>('.hig-screen-header')!,scroller=screen.getByTestId('scroller'),content=header.parentElement!;
  expect(header.dataset.sticky).toBe('true');expect(header.hasAttribute('data-scrolled')).toBe(false);
  const at=(top:number)=>({top,bottom:top+100,left:0,right:0,width:0,height:100,x:0,y:top,toJSON:()=>({})}) as DOMRect;
  scroller.getBoundingClientRect=()=>at(0);content.getBoundingClientRect=()=>at(-40);
  scroller.dispatchEvent(new Event('scroll'));expect(header.hasAttribute('data-scrolled')).toBe(true);
  content.getBoundingClientRect=()=>at(0);scroller.dispatchEvent(new Event('scroll'));expect(header.hasAttribute('data-scrolled')).toBe(false);
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  expect(css).toContain('.hig-screen-header[data-sticky],.hig-profile-bar[data-sticky] { position:sticky;inset-block-start:0;z-index:1;background-color:transparent;');
  expect(css).toMatch(/@supports \(animation-timeline:view\(\)\) \{\s*:has\(> \.hig-screen-header\[data-sticky\]\) \{ view-timeline:--hig-sticky-header block; \}/);
  expect(css).toContain('animation-range:exit-crossing 0px exit-crossing 12px;');
  expect(header.hasAttribute('data-sticky-own')).toBe(false);
 });
 it('leaves the scroll-driven fill to the script when the header\'s parent is itself the scroller (Unreleased)',()=>{
  const {container}=render(<div data-testid='pane' style={{overflowY:'auto'}}><ScreenHeader title='Signals' stickyHeader/><p>Rows</p></div>);
  const header=container.querySelector<HTMLElement>('.hig-screen-header')!,pane=screen.getByTestId('pane');
  expect(header.hasAttribute('data-sticky-own')).toBe(true);expect(header.hasAttribute('data-scrolled')).toBe(false);
  pane.scrollTop=30;pane.dispatchEvent(new Event('scroll'));expect(header.hasAttribute('data-scrolled')).toBe(true);
  expect(readFileSync('packages/hig/react/src/styles.css','utf8')).toContain('.hig-screen-header[data-sticky][data-sticky-own] { animation:none; }');
 });
 it('gives every block with a header the same sticky behaviour (Unreleased)',()=>{
  const history={title:'History',long:'Long',short:'Short',empty:'None'};
  const trade={title:'Trade',netPnl:'Net',onMargin:(p:string)=>p,long:'Long',short:'Short'};
  const target={title:'Take Profit',submit:'Set',entry:'Entry',trigger:'Trigger',custom:'Custom',unit:'Unit',units:{dollar:'$',price:'Price',percent:'%'}};
  const sticky=[
   <blocks.SoundHapticsBlock key='sound' title='Sound' sections={[]} stickyHeader/>,
   <blocks.SignalsBlock key='signals' title='Signals' groups={[]} stickyHeader/>,
   <blocks.NotificationsBlock key='notifications' title='Notifications' stickyHeader/>,
   <blocks.TargetBlock key='target' kind='take-profit' labels={target} entry={1} unit='dollar' value={1} onSubmit={()=>{}} stickyHeader/>,
   <blocks.TradeHistoryListBlock key='list' labels={history} trades={[]} stickyHeader/>,
   <blocks.TradeHistoryDetailBlock key='detail' labels={trade} name='Amazon' side='long' pnl={1} details={[]} stickyHeader/>,
   <blocks.RewardBlock key='reward' title='Rewards' entries={[]} stickyHeader/>,
   <blocks.PositionBlock key='position' title='Position' details={[]} groups={[]} stickyHeader/>,
  ];
  for(const block of sticky){const view=render(block);expect(view.container.querySelector('.hig-screen-header')!.getAttribute('data-sticky')).toBe('true');view.unmount();}
  const {container}=render(<blocks.SignalsBlock title='Signals' groups={[]}/>);expect(container.querySelector('.hig-screen-header')!.hasAttribute('data-sticky')).toBe(false);
 });
});
