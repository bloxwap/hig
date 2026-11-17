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
