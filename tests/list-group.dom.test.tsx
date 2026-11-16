// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ListGroup,ListRow} from '../packages/hig/react/src/list-group';
import {Switch} from '../packages/hig/react/src/selection';
import {readFileSync} from 'node:fs';
afterEach(cleanup);
describe('ListGroup',()=>{
 it('is a region named by its title whose rows are a list; without a title it is the container alone',()=>{
  const view=render(<ListGroup title='Settings'><ListRow label='Signals' onSelect={()=>{}}/><ListRow label='Language' value='English' onSelect={()=>{}}/>{null}</ListGroup>);
  const group=screen.getByRole('region',{name:'Settings'});expect(within(group).getByRole('heading',{name:'Settings'}).tagName).toBe('H3');
  expect(within(group).getAllByRole('listitem')).toHaveLength(2);
  view.rerender(<ListGroup><ListRow label='Experiments' onSelect={()=>{}}/></ListGroup>);
  expect(screen.queryByRole('heading')).toBeNull();expect(document.querySelector('.hig-list-group')?.getAttribute('aria-labelledby')).toBeNull();
 });
});
describe('ListRow',()=>{
 it('sits a trailing switch flush with the row edge: no padding of its own, aligned to the end',()=>{
  const rule=readFileSync('packages/hig/react/src/styles.css','utf8').match(/\.hig-list-row-trailing \.hig-switch \{([^}]*)\}/)?.[1]??'';
  expect(rule).toContain('padding-inline:0');expect(rule).toContain('justify-content:flex-end');
 });
 it('is one button with a decorative chevron when it has onSelect, named by its label and value',async()=>{
  const select=vi.fn();render(<ListRow label='Notifications' value='Off' onSelect={select}/>);
  const row=screen.getByRole('button',{name:'Notifications Off'});expect(row.classList.contains('hig-list-row')).toBe(true);
  expect(row.querySelector('.hig-list-row-chevron')?.getAttribute('aria-hidden')).toBe('true');expect(row.querySelector('.hig-list-row-value')?.textContent).toBe('Off');
  await userEvent.click(row);expect(select).toHaveBeenCalledTimes(1);
 });
 it('is a link with href, and static without either, leaving a trailing control as the only target',async()=>{
  const change=vi.fn();
  const view=render(<ListRow label='How To' href='/how-to'/>);
  expect(screen.getByRole('link',{name:'How To'}).getAttribute('href')).toBe('/how-to');expect(document.querySelector('.hig-list-row-chevron')).toBeTruthy();
  view.rerender(<ListRow label='Live Mode' trailing={<Switch label='Live Mode' onCheckedChange={change}/>}/>);
  expect(screen.queryByRole('button')).toBeNull();expect(screen.queryByRole('link')).toBeNull();expect(document.querySelector('.hig-list-row')?.tagName).toBe('DIV');expect(document.querySelector('.hig-list-row-chevron')).toBeNull();
  await userEvent.click(screen.getByRole('switch',{name:'Live Mode'}));expect(change).toHaveBeenCalledWith(true);
 });
 it('shows decorative leading artwork and rich trailing content, and blocks a disabled row',async()=>{
  const select=vi.fn();
  const view=render(<ListRow label='Sound' leading={<svg data-testid='icon'/>} value='On' trailing={<span>LIVE</span>} onSelect={select} disabled/>);
  const row=screen.getByRole('button',{name:'Sound On LIVE'}) as HTMLButtonElement;expect(row.disabled).toBe(true);
  expect(row.querySelector('.hig-list-row-leading')?.getAttribute('aria-hidden')).toBe('true');
  await userEvent.click(row);expect(select).not.toHaveBeenCalled();
  view.rerender(<ListRow label='Docs' href='/docs' disabled/>);expect(screen.queryByRole('link')).toBeNull();expect(document.querySelector('.hig-list-row')?.getAttribute('aria-disabled')).toBe('true');
 });
 it('reads an element value as valueLabel and tones a text value, as native does',()=>{
  const view=render(<ListRow label='Balance' value={<span data-testid='live'>1,0</span>} valueLabel='$1,042.09' onSelect={()=>{}}/>);
  expect(screen.getByRole('button',{name:'Balance $1,042.09'})).toBeTruthy();expect(screen.getByTestId('live').parentElement?.getAttribute('aria-hidden')).toBe('true');
  view.rerender(<ListRow label='PnL' value='+$12.50' valueTone='positive'/>);
  const value=document.querySelector('.hig-list-row-value');expect(value?.getAttribute('data-tone')).toBe('positive');expect(value?.textContent).toBe('+$12.50');
  view.rerender(<ListRow label='PnL' value='+$12.50' valueTone='muted' valueLabel='ignored'/>);
  expect(document.querySelector('.hig-list-row-value')?.getAttribute('data-tone')).toBeNull();expect(document.querySelector('.hig-list-row-value')?.textContent).toBe('+$12.50');
  expect(readFileSync('packages/hig/react/src/styles.css','utf8')).toContain(".hig-list-row-value[data-tone='positive'] { color:var(--hig-positive); }");
 });
});
