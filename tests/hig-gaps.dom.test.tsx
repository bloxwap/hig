// @vitest-environment jsdom
/** Gaps the app conversions found: small optional props on shared components (web). */
import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {Field,Input} from '../packages/hig/react/src/field';
afterEach(cleanup);

describe('Input prefix',()=>{
 it('draws the prefix before the text, outside the value, and names it in the description before the help and error',async()=>{
  render(<HIGProvider><Field label='Username' description='Letters and digits.' error='Taken.'><Input prefix='@' defaultValue=''/></Field></HIGProvider>);
  const input=screen.getByRole('textbox',{name:'Username'}) as HTMLInputElement;
  const wrapper=input.parentElement!;expect(wrapper.className).toBe('hig-input-affix');
  const prefix=wrapper.firstElementChild!;expect(prefix.className).toBe('hig-input-prefix');expect(prefix.textContent).toBe('@');expect(prefix.nextElementSibling).toBe(input);
  const ids=input.getAttribute('aria-describedby')!.split(' ');expect(ids[0]).toBe(prefix.id);expect(ids.slice(1).map(id=>document.getElementById(id)!.textContent)).toEqual(['Letters and digits.','Taken.']);
  expect(input.getAttribute('aria-describedby')!.split(' ').map(id=>document.getElementById(id)!.textContent).join(' ')).toBe('@ Letters and digits. Taken.');
  await userEvent.type(input,'joe');expect(input.value).toBe('joe');
  expect(input.className.trim()).toBe('hig-input');expect(input.hasAttribute('prefix')).toBe(false);
 });
 it('leaves an input without a prefix exactly as before',()=>{
  render(<HIGProvider><Field label='Name' description='Shown on your profile.'><Input/></Field></HIGProvider>);
  const input=screen.getByRole('textbox',{name:'Name'});expect(input.parentElement!.className).toBe('hig-field');expect(document.querySelector('.hig-input-affix')).toBeNull();
  expect(document.getElementById(input.getAttribute('aria-describedby')!)!.textContent).toBe('Shown on your profile.');
 });
});

describe('ListRow parity with native: aria-label and a rich description',()=>{
 it('takes aria-label as the row name and draws a description of several nodes in the muted line',async()=>{
  const {ListRow}=await import('../packages/hig/react/src/list-group');
  render(<HIGProvider><ListRow label='BTC' aria-label='Long BTC, 10×, 0.5 BTC' onSelect={()=>{}} description={<><svg data-testid='arrow'/><span>10×</span><span> • 0.5</span></>}/></HIGProvider>);
  const row=screen.getByRole('button',{name:'Long BTC, 10×, 0.5 BTC'});
  const description=row.querySelector('.hig-list-row-description')!;expect(description.querySelectorAll('span')).toHaveLength(2);expect(description.querySelector('[data-testid="arrow"]')).toBeTruthy();
 });
});
