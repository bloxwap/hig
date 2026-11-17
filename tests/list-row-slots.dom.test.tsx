// @vitest-environment jsdom
import React,{createRef} from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider,type PressDecorationInfo} from '../packages/hig/react/src/provider';
import {ListGroup,ListRow} from '../packages/hig/react/src/list-group';
import {Text} from '../packages/hig/react/src/surface';
import {Field,Input,SearchInput} from '../packages/hig/react/src/field';
import {SegmentedControl,Switch} from '../packages/hig/react/src/selection';
afterEach(cleanup);
const css=readFileSync('packages/hig/react/src/styles.css','utf8');
const haptic=({kind,disabled}:PressDecorationInfo)=><input type='checkbox' className='host-haptic' data-host={kind} data-disabled={disabled||undefined} tabIndex={-1} aria-hidden='true'/>;
describe('ListRow additions',()=>{
 it('draws a muted description under the label and reads it with the label',()=>{
  const view=render(<ListRow label='Card' description='Instant card deposit' onSelect={()=>{}}/>);
  const row=screen.getByRole('button',{name:'Card Instant card deposit'});
  const text=row.querySelector('.hig-list-row-text');expect(text?.children[0].className).toBe('hig-list-row-label');expect(text?.children[1].className).toBe('hig-list-row-description');
  expect(css).toContain('.hig-list-row-description { min-width:0;color:var(--hig-muted)');
  view.rerender(<ListRow label='Card' onSelect={()=>{}}/>);expect(document.querySelector('.hig-list-row-text')).toBeNull();expect(document.querySelector('.hig-list-row > .hig-list-row-label')).toBeTruthy();
 });
 it('tones the label destructive or muted',()=>{
  const view=render(<ListRow label='Delete account' tone='destructive' onSelect={()=>{}}/>);
  expect(document.querySelector('.hig-list-row-label')?.getAttribute('data-tone')).toBe('destructive');
  view.rerender(<ListRow label='Verify email' tone='muted'/>);expect(document.querySelector('.hig-list-row-label')?.getAttribute('data-tone')).toBe('muted');
  expect(css).toContain(".hig-list-row-label[data-tone='destructive'] { color:var(--hig-negative); }");
 });
 it('draws a check instead of the chevron on a selected row and marks it current; unselected choices draw no chevron',async()=>{
  const pick=vi.fn();
  render(<ListGroup><ListRow label='Embedded' selected onSelect={pick}/><ListRow label='External' selected={false} onSelect={pick}/></ListGroup>);
  const chosen=screen.getByRole('button',{name:'Embedded'}),other=screen.getByRole('button',{name:'External'});
  expect(chosen.getAttribute('aria-current')).toBe('true');expect(chosen.querySelector('.hig-list-row-check')?.getAttribute('aria-hidden')).toBe('true');expect(chosen.querySelector('.hig-list-row-chevron')).toBeNull();
  expect(other.getAttribute('aria-current')).toBeNull();expect(other.querySelector('.hig-list-row-check,.hig-list-row-chevron')).toBeNull();
  await userEvent.click(other);expect(pick).toHaveBeenCalledTimes(1);
 });
 it('shows a spinner while busy, adds the busy text to the name and ignores presses without dimming',async()=>{
  const select=vi.fn();
  const view=render(<HIGProvider pressDecoration={haptic}><ListRow label='Link account' busy onSelect={select}/></HIGProvider>);
  const row=screen.getByRole('button',{name:'Link account · Working'}) as HTMLButtonElement;
  expect(row.getAttribute('aria-busy')).toBe('true');expect(row.disabled).toBe(false);expect(row.querySelector('.hig-list-row-spinner')).toBeTruthy();expect(row.querySelector('.hig-list-row-chevron')).toBeNull();
  expect(row.querySelector('.host-haptic')?.getAttribute('data-disabled')).toBe('true');
  await userEvent.click(row);expect(select).not.toHaveBeenCalled();
  view.rerender(<HIGProvider messages={{busy:'En cours'}}><ListRow label='Link account' busy busyLabel='' onSelect={select}/></HIGProvider>);
  expect(screen.getByRole('button',{name:'Link account'}).getAttribute('aria-busy')).toBe('true');
 });
 it('keeps a linked row the same focused element while it turns busy, and stops it navigating',()=>{
  const select=vi.fn();
  const view=render(<ListRow label='Docs' href='/docs' onSelect={select}/>);
  const link=screen.getByRole('link',{name:'Docs'});link.focus();expect(document.activeElement).toBe(link);
  view.rerender(<ListRow label='Docs' href='/docs' onSelect={select} busy/>);
  expect(document.activeElement).toBe(link);expect(link.getAttribute('aria-busy')).toBe('true');expect(link.getAttribute('aria-disabled')).toBe('true');
  const event=new MouseEvent('click',{bubbles:true,cancelable:true});link.dispatchEvent(event);expect(event.defaultPrevented).toBe(true);expect(select).not.toHaveBeenCalled();
  view.rerender(<ListRow label='Docs' href='/docs' disabled/>);expect(screen.queryByRole('link')).toBeNull();
 });
 it('draws the external arrow or no glyph through disclosure',()=>{
  const view=render(<ListRow label='Docs' href='https://example.com' disclosure='external'/>);
  expect(screen.getByRole('link',{name:'Docs'}).querySelector('.hig-list-row-chevron')?.getAttribute('data-glyph')).toBe('external');
  view.rerender(<ListRow label='Docs' onSelect={()=>{}} disclosure='none'/>);expect(document.querySelector('.hig-list-row-chevron')).toBeNull();
 });
 it('forwards its ref and passes data and aria attributes through on every element',()=>{
  const button=createRef<HTMLElement>(),link=createRef<HTMLElement>(),plain=createRef<HTMLElement>();
  render(<><ListRow ref={button} label='A' onSelect={()=>{}} data-testid='row-a' aria-describedby='hint'/><ListRow ref={link} label='B' href='/b' data-kind='link'/><ListRow ref={plain} label='C' data-kind='static' aria-label='Static C'/></>);
  expect(button.current?.tagName).toBe('BUTTON');expect(button.current?.getAttribute('aria-describedby')).toBe('hint');expect(screen.getByTestId('row-a')).toBe(button.current);
  expect(link.current?.tagName).toBe('A');expect(link.current?.getAttribute('data-kind')).toBe('link');
  expect(plain.current?.tagName).toBe('DIV');expect(plain.current?.getAttribute('aria-label')).toBe('Static C');
 });
 it('is a whole-row switch with checked and onCheckedChange, named by its label and described by its description',async()=>{
  const change=vi.fn();
  const view=render(<HIGProvider pressDecoration={haptic}><ListRow label='Swing alerts' description='Daily at most' checked={false} onCheckedChange={change}/></HIGProvider>);
  const control=screen.getByRole('switch',{name:'Swing alerts'}) as HTMLInputElement;
  expect(control.getAttribute('aria-describedby')).toBe(document.querySelector('.hig-list-row-description')?.id);
  const row=document.querySelector('.hig-list-row')!;expect(row.tagName).toBe('DIV');expect(row.hasAttribute('data-switch')).toBe(true);
  // One 'switch' decoration on the row, aimed at the input.
  expect(row.querySelectorAll('.host-haptic')).toHaveLength(1);expect(row.querySelector(':scope > .hig-press-decoration')?.getAttribute('data-kind')).toBe('switch');
  await userEvent.click(row.querySelector('.hig-list-row-label')!);expect(change).toHaveBeenLastCalledWith(true);
  await userEvent.click(control);expect(change).toHaveBeenCalledTimes(2);
  fireEvent.click(row.querySelector('.host-haptic')!);expect(change).toHaveBeenCalledTimes(3);
  view.rerender(<ListRow label='Swing alerts' defaultChecked/>);expect((screen.getByRole('switch',{name:'Swing alerts'}) as HTMLInputElement).checked).toBe(true);
  await userEvent.click(document.querySelector('.hig-list-row-label')!);expect((screen.getByRole('switch',{name:'Swing alerts'}) as HTMLInputElement).checked).toBe(false);
  view.rerender(<ListRow label='Swing alerts' checked onCheckedChange={change} disabled/>);await userEvent.click(document.querySelector('.hig-list-row-label')!);expect(change).toHaveBeenCalledTimes(3);
  view.rerender(<ListRow label='Swing alerts' checked onCheckedChange={change} busy/>);await userEvent.click(document.querySelector('.hig-list-row-label')!);expect(change).toHaveBeenCalledTimes(3);
  expect(screen.getByRole('switch',{name:'Swing alerts'}).getAttribute('aria-busy')).toBe('true');
 });
 it('keeps the existing row slots and uses the shared decorative chevron',()=>{
  const {container}=render(<ListRow label='Notifications' value='Off' onSelect={()=>{}}/>);
  const row=container.querySelector('button')!;
  expect([...row.children].map(child=>[...child.classList].find(name=>name.startsWith('hig-')))).toEqual(['hig-list-row-label','hig-list-row-value','hig-list-row-chevron']);
  const icon=row.querySelector('svg')!;
  expect(icon.classList.contains('bloxwap-icon-chevron-right')).toBe(true);
  expect(icon.getAttribute('aria-hidden')).toBe('true');
  expect(icon.getAttribute('viewBox')).toBe('0 0 24 24');
 });
});
describe('ListGroup additions',()=>{
 it('takes a node title with an accessory read in the heading, while the group stays named by the title',()=>{
  render(<ListGroup title={<span data-testid='live'>Tasks</span>} titleAccessory='2/3'><ListRow label='Verify email'/></ListGroup>);
  const group=screen.getByRole('region',{name:'Tasks'});expect(within(group).getByRole('heading',{name:'Tasks 2/3'})).toBeTruthy();expect(screen.getByTestId('live')).toBeTruthy();
 });
 it('draws a heading action on the trailing edge that is a named button with the button decoration',async()=>{
  const cancel=vi.fn();
  const view=render(<HIGProvider pressDecoration={haptic}><ListGroup title='Orders' action={{label:'Cancel all',onSelect:cancel}}><ListRow label='BTC'/></ListGroup></HIGProvider>);
  const action=screen.getByRole('button',{name:'Cancel all'});expect(action.closest('.hig-list-group-header')?.firstElementChild?.tagName).toBe('H3');
  expect(action.querySelector('.host-haptic')?.getAttribute('data-host')).toBe('button');
  await userEvent.click(action);expect(cancel).toHaveBeenCalledTimes(1);
  view.rerender(<ListGroup title='Orders' action={{label:'Cancel all',onSelect:cancel,disabled:true}}><ListRow label='BTC'/></ListGroup>);
  expect((screen.getByRole('button',{name:'Cancel all'}) as HTMLButtonElement).disabled).toBe(true);
  expect(css).toMatch(/\.hig-list-group-action \{[^}]*min-height:44px/);
 });
 it('holds host content under the title, with no row container when there are no rows',()=>{
  const view=render(<ListGroup title='Custom code' intro={<p>Unlocks at 10 referrals</p>}/>);
  expect(document.querySelector('.hig-list-group-intro')?.textContent).toBe('Unlocks at 10 referrals');expect(document.querySelector('.hig-list-group-rows')).toBeNull();
  view.rerender(<ListGroup title='Custom code' intro={<p>Note</p>}><ListRow label='Code'/></ListGroup>);expect(document.querySelectorAll('.hig-list-group-rows li')).toHaveLength(1);
  view.rerender(<ListGroup title='Settings'><ListRow label='Code'/></ListGroup>);
  expect(document.querySelector('.hig-list-group')?.innerHTML.startsWith('<h3 id=')).toBe(true);expect(document.querySelector('.hig-list-group-header,.hig-list-group-intro')).toBeNull();
 });
});
describe('Small primitives',()=>{
 it('Text takes a muted tone and the caption size',()=>{
  const view=render(<Text tone='muted' size='caption'>Cleared to balance</Text>);
  const node=screen.getByText('Cleared to balance');expect(node.getAttribute('data-tone')).toBe('muted');expect(node.getAttribute('data-size')).toBe('caption');
  expect(css).toContain(".hig-text[data-tone='muted'] { color:var(--hig-muted); }");expect(css).toContain(".hig-text[data-size='caption']");
  view.rerender(<Text>Plain</Text>);expect(screen.getByText('Plain').outerHTML).toBe('<p class="hig-text ">Plain</p>');
 });
 it('Field draws a positive description as a polite live success line',()=>{
  render(<Field label='Code' description='Available' descriptionTone='positive'><Input/></Field>);
  const line=screen.getByText('Available');expect(line.getAttribute('data-tone')).toBe('positive');expect(line.getAttribute('aria-live')).toBe('polite');
  expect(screen.getByRole('textbox',{name:'Code'}).getAttribute('aria-describedby')).toBe(line.id);
 });
 it('SearchInput draws a trailing slot and a clear button that clears and returns focus',async()=>{
  const clear=vi.fn();
  const ref=createRef<HTMLInputElement>();
  const view=render(<HIGProvider pressDecoration={haptic}><SearchInput ref={ref} aria-label='Search' value='btc' onChange={()=>{}} onClear={clear} trailing={<span data-testid='extra'/>}/></HIGProvider>);
  const button=screen.getByRole('button',{name:'Clear search'});expect(button.querySelector('.host-haptic')?.getAttribute('data-host')).toBe('icon-button');
  await userEvent.click(button);expect(clear).toHaveBeenCalledTimes(1);expect(document.activeElement).toBe(ref.current);expect(screen.getByTestId('extra')).toBeTruthy();
  expect(document.querySelector('.hig-search-input')?.hasAttribute('data-trailing')).toBe(true);
  view.rerender(<HIGProvider messages={{clearSearch:'Effacer'}}><SearchInput aria-label='Search' value='' onChange={()=>{}} onClear={clear}/></HIGProvider>);
  expect(screen.queryByRole('button')).toBeNull();expect(document.querySelector('.hig-search-input')?.hasAttribute('data-trailing')).toBe(true);
  view.rerender(<HIGProvider messages={{clearSearch:'Effacer'}}><SearchInput aria-label='Search' value='e' onChange={()=>{}} onClear={clear}/></HIGProvider>);expect(screen.getByRole('button',{name:'Effacer'})).toBeTruthy();
  view.rerender(<SearchInput aria-label='Search'/>);expect(document.querySelector('.hig-search-input')?.hasAttribute('data-trailing')).toBe(false);expect(document.querySelector('.hig-search-trailing')).toBeNull();
 });
 it('SearchInput disables its clear button inside a disabled Field',()=>{
  render(<HIGProvider pressDecoration={haptic}><Field label='Search' disabled><SearchInput value='btc' onChange={()=>{}} onClear={()=>{}}/></Field></HIGProvider>);
  const button=screen.getByRole('button',{name:'Clear search'}) as HTMLButtonElement;expect(button.disabled).toBe(true);
  expect(button.querySelector('.host-haptic')?.getAttribute('data-disabled')).toBe('true');expect((screen.getByRole('searchbox') as HTMLInputElement).disabled).toBe(true);
 });
 it('Switch and SegmentedControl can hide their visible label; segments draw the segment decoration aimed at their radio',async()=>{
  const change=vi.fn();
  render(<HIGProvider pressDecoration={haptic}><Switch label='Live Mode' hideLabel/><SegmentedControl label='Unit' hideLabel options={[{value:'usd',label:'USD'},{value:'pct',label:'%'}]} defaultValue='usd' onValueChange={change}/></HIGProvider>);
  expect(screen.getByRole('switch',{name:'Live Mode'})).toBeTruthy();expect(screen.getByText('Live Mode').className).toBe('hig-sr-only');
  expect(screen.getByRole('group',{name:'Unit'}).querySelector('legend')?.className).toBe('hig-sr-only');
  const layers=document.querySelectorAll('.hig-segment > .hig-press-decoration');expect(layers).toHaveLength(2);expect(layers[1].getAttribute('data-kind')).toBe('segment');
  fireEvent.click(layers[1].querySelector('.host-haptic')!);expect(change).toHaveBeenCalledWith('pct');expect((screen.getByRole('radio',{name:'%'}) as HTMLInputElement).checked).toBe(true);
 });
});
