// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ExplainerBlock} from '../packages/hig/react/src/blocks/explainer-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const glyph=<svg data-glyph=''/>;
describe('ExplainerBlock',()=>{
 it('draws the How Trend works sheet: the header, toned icon sections with heading and meaning, a closing caveat and one action',async()=>{
  const done=vi.fn();
  render(<ExplainerBlock title='How Trend works' headingId='trend-heading' description='Trend reads each market every minute.' caveat='Trend is not advice.' primaryAction={{label:'Got it',onSelect:done,testID:'trend-done'}} sections={[
   {id:'up',tone:'up',icon:glyph,title:'Up',meaning:'→ Momentum is rising',body:'Price is climbing.',testID:'trend-up'},
   {id:'down',tone:'down',icon:glyph,title:'Down',meaning:'→ Momentum is falling',body:'Price is sliding.'},
   {id:'watch',tone:'warning',icon:glyph,title:'Watch',meaning:'→ A move may be coming',body:'Price is coiling.'},
  ]} data-testid='trend-how'/>);
  expect(screen.getByRole('heading',{name:'How Trend works',level:2}).id).toBe('trend-heading');
  expect(screen.getByTestId('trend-how').className).toBe('hig-explainer');
  expect(screen.getByText('Trend reads each market every minute.').className).toBe('hig-explainer-text');
  const up=screen.getByTestId('trend-up');expect(up.getAttribute('data-tone')).toBe('up');
  // Each section is a plain card led by its heading, not a landmark; the meaning sits muted on the heading's line; the icon is decorative.
  expect(screen.queryAllByRole('region')).toHaveLength(0);expect(up.tagName).toBe('DIV');
  expect(screen.getByRole('heading',{name:'Up → Momentum is rising',level:3}).closest('.hig-explainer-section')).toBe(up);
  expect(within(up).getByRole('heading',{level:3}).querySelector('span')!.textContent).toBe('→ Momentum is rising');
  expect(up.querySelector('.hig-explainer-icon')!.getAttribute('aria-hidden')).toBe('true');expect(up.querySelector('[data-glyph]')).toBeTruthy();
  expect(within(up).getByText('Price is climbing.').className).toBe('hig-explainer-text');
  expect([...document.querySelectorAll('.hig-explainer-section')].map(section=>section.getAttribute('data-tone'))).toEqual(['up','down','warning']);
  const note=screen.getByText('Trend is not advice.');expect(note.hasAttribute('data-caveat')).toBe(true);expect(note.nextElementSibling!.className).toBe('hig-confirm-actions');
  const actions=[...document.querySelectorAll<HTMLButtonElement>('.hig-confirm-actions > button')];expect(actions).toHaveLength(1);expect(actions[0].dataset.intent).toBe('primary');
  await userEvent.click(screen.getByTestId('trend-done'));expect(done).toHaveBeenCalledOnce();
 });
 it('draws the How Swing works sheet without a header: neutral sections with media and a section caveat',()=>{
  render(<ExplainerBlock sections={[{id:'notification',title:'The notification',media:<div data-testid='example-card'>BTC 10× Long</div>,body:'Each signal names a market.',caveat:'Signals expire.'},{id:'execution',title:'Execution',body:<span data-testid='rich'>Tap to open.</span>}]}/>);
  expect(screen.queryByRole('heading',{level:2})).toBeNull();
  const [first,second]=[...document.querySelectorAll('.hig-explainer-section')];
  expect(first.hasAttribute('data-tone')).toBe(false);expect(first.querySelector('.hig-explainer-icon')).toBeNull();
  // Media comes after the heading and before the body.
  const parts=[...first.querySelector(':scope > div')!.children];expect(parts.map(part=>part.tagName)).toEqual(['H3','DIV','DIV','P']);
  expect(parts[1].className).toBe('hig-explainer-media');expect(within(parts[1] as HTMLElement).getByTestId('example-card')).toBeTruthy();expect(parts[3].hasAttribute('data-caveat')).toBe(true);
  expect(within(second as HTMLElement).getByTestId('rich')).toBeTruthy();
  expect(document.querySelector('.hig-confirm-actions')).toBeNull();
 });
 it('draws a task dialog: Back with backProps, steps as an ordered list, and two actions sharing the row with their intents',async()=>{
  const back=vi.fn(),copy=vi.fn(),later=vi.fn();
  render(<ExplainerBlock title='Invite a friend' onBack={back} backProps={{'data-testid':'invite-back'} as React.ButtonHTMLAttributes<HTMLButtonElement>} headerAction={<button type='button'>Close</button>} description='You both earn when they trade.' steps={['Copy your link.','Send it to a friend.',<strong key='3'>They trade $100.</strong>]} primaryAction={{label:'Copy link',onSelect:copy,busy:true}} secondaryAction={{label:'Not now',onSelect:later,testID:'invite-later'}} suppressFeedback/>);
  await userEvent.click(screen.getByTestId('invite-back'));expect(back).toHaveBeenCalledOnce();
  expect(screen.getByRole('button',{name:'Close'})).toBeTruthy();
  const list=screen.getByRole('list');expect(list.tagName).toBe('OL');expect(within(list).getAllByRole('listitem').map(item=>item.textContent)).toEqual(['Copy your link.','Send it to a friend.','They trade $100.']);
  const actions=[...document.querySelectorAll<HTMLButtonElement>('.hig-confirm-actions > button')];
  expect(actions.map(button=>button.dataset.intent)).toEqual(['secondary','primary']);expect(actions[0].textContent).toBe('Not now');expect(actions[1].textContent).toContain('Copy link');expect(actions[1].getAttribute('aria-busy')).toBe('true');
  await userEvent.click(screen.getByTestId('invite-later'));expect(later).toHaveBeenCalledOnce();
 });
 it('draws an eyebrow over the title, a badge, a hero under the header, host children before the actions, and a trailing action icon',async()=>{
  const open=vi.fn();
  render(<ExplainerBlock title='Keep the lights on.' eyebrow='Builder fee' badge='Demo' hero={<span data-testid='donut'>4% off</span>} description='A small fee on each trade.' sections={[{id:'fee',title:'Fee'}]} caveat='Fees can change.' primaryAction={{label:'Approve',onSelect:open,icon:<svg data-testid='arrow'/>,testID:'approve'}}><div data-testid='extra'>Field</div></ExplainerBlock>);
  const heading=screen.getByRole('heading',{level:2});expect(heading.textContent).toBe('Keep the lights on., Demo');
  const eyebrow=screen.getByText('Builder fee');expect(eyebrow.className).toBe('hig-screen-eyebrow');expect(eyebrow.nextElementSibling).toBe(heading);expect(eyebrow.parentElement!.className).toBe('hig-screen-heading');
  const hero=screen.getByTestId('donut').parentElement!;expect(hero.className).toBe('hig-explainer-hero');expect(hero.previousElementSibling!.className).toBe('hig-screen-header');expect(hero.nextElementSibling!.textContent).toBe('A small fee on each trade.');
  const extra=screen.getByTestId('extra');expect(extra.previousElementSibling!.hasAttribute('data-caveat')).toBe(true);expect(extra.nextElementSibling!.className).toBe('hig-confirm-actions');
  const approve=screen.getByTestId('approve');expect(screen.getByRole('button',{name:'Approve'})).toBe(approve);
  const icon=approve.querySelector('.hig-explainer-action-icon')!;expect(icon.getAttribute('aria-hidden')).toBe('true');expect(icon.querySelector('[data-testid="arrow"]')).toBeTruthy();expect(icon.previousSibling!.textContent).toBe('Approve');
  await userEvent.click(approve);expect(open).toHaveBeenCalledOnce();
 });
 it('draws the eyebrow as the first line when there is no title, and leaves the header unchanged without one',()=>{
  const {unmount}=render(<ExplainerBlock eyebrow='Builder fee' description='Lead.'/>);
  const eyebrow=screen.getByText('Builder fee');expect(eyebrow.className).toBe('hig-explainer-eyebrow');expect(eyebrow.parentElement!.firstElementChild).toBe(eyebrow);expect(screen.queryByRole('heading')).toBeNull();
  unmount();render(<ExplainerBlock title='Plain'/>);
  expect(document.querySelector('.hig-screen-heading')).toBeNull();expect(screen.getByRole('heading',{level:2}).parentElement!.className).toBe('hig-screen-header');expect(document.querySelector('.hig-explainer-hero')).toBeNull();
 });
 it('is exported from the blocks aggregate',()=>{expect(blocks.ExplainerBlock).toBe(ExplainerBlock);});
});
