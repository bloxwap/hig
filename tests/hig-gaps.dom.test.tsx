// @vitest-environment jsdom
/** Gaps the app conversions found: small optional props on shared components (web). */
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
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

describe('AssetBalanceRow trailingInteractive (web parity)',()=>{
 it('puts a trailing control beside the row button, never inside it',async()=>{
  const {AssetBalanceRow}=await import('../packages/hig/react/src/asset-balance-row');
  const select=vi.fn(),copy=vi.fn();
  render(<HIGProvider><AssetBalanceRow name='USD Coin' symbol='USDC' value={12} selected onSelect={select} trailingInteractive trailing={<button type='button' onClick={copy}>Copy</button>} data-testid='usdc'/></HIGProvider>);
  const row=screen.getByTestId('usdc');expect(row.tagName).toBe('DIV');expect(row.className).toBe('hig-asset-row');
  const main=row.querySelector<HTMLButtonElement>(':scope > button.hig-asset-row-main')!;expect(main.getAttribute('aria-current')).toBe('true');expect(main.querySelector('button')).toBeNull();
  const control=screen.getByRole('button',{name:'Copy'});expect(control.closest('.hig-asset-row-main')).toBeNull();expect(control.closest('[aria-hidden]')).toBeNull();
  await userEvent.click(main);expect(select).toHaveBeenCalledOnce();await userEvent.click(control);expect(copy).toHaveBeenCalledOnce();expect(select).toHaveBeenCalledOnce();
  cleanup();
  render(<HIGProvider><AssetBalanceRow name='USD Coin' symbol='USDC' value={12} onSelect={select} trailing='Main' data-testid='plain'/></HIGProvider>);
  expect(screen.getByTestId('plain').tagName).toBe('BUTTON');
 });
});

describe('Spinner hideLabel',()=>{
 it('draws the ring alone while the label stays the status text',async()=>{
  const {Spinner}=await import('../packages/hig/react/src/status');
  const {rerender}=render(<HIGProvider><Spinner label='Loading quote' hideLabel/></HIGProvider>);
  const status=screen.getByRole('status');expect(status.className).toBe('hig-spinner');
  const hidden=status.querySelector('.hig-sr-only')!;expect(hidden.textContent).toBe('Loading quote…');expect(status.textContent).toBe('Loading quote…');
  rerender(<HIGProvider><Spinner label='Loading quote'/></HIGProvider>);
  expect(screen.getByRole('status').querySelector('.hig-sr-only')).toBeNull();expect(screen.getByRole('status').textContent).toBe('Loading quote…');
 });
});
