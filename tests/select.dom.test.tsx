import React,{useState} from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Select} from '../packages/react/src/select';
import {HIGProvider} from '../packages/react/src/provider';
import {Dialog} from '../packages/react/src/dialog';

afterEach(cleanup);
const options=[{value:'buy',label:'Buy'},{value:'blocked',label:'Unavailable',disabled:true},{value:'sell',label:'Sell'}];

describe('custom Select',()=>{
 it('renders a custom listbox and commits pointer selection with focus on the labeled trigger',async()=>{
  const changed=vi.fn();render(<Select label='Side' options={options} defaultValue='buy' onValueChange={changed}/>);
  const trigger=screen.getByRole('combobox',{name:'Side'});
  expect(trigger.tagName).toBe('BUTTON');expect(trigger.textContent).toBe('Buy');
  await userEvent.click(trigger);expect(trigger.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('listbox',{name:'Side'}).id).toBe(trigger.getAttribute('aria-controls'));
  expect(screen.getByRole('option',{name:'Buy'}).getAttribute('aria-selected')).toBe('true');
  await userEvent.click(screen.getByRole('option',{name:'Sell'}));
  expect(changed).toHaveBeenCalledExactlyOnceWith('sell');expect(trigger.textContent).toBe('Sell');
  expect(screen.queryByRole('listbox')).toBeNull();expect(document.activeElement).toBe(trigger);
 });

 it('skips disabled choices during keyboard navigation and only commits on acceptance',async()=>{
  const changed=vi.fn();render(<Select label='Side' options={options} defaultValue='buy' onValueChange={changed}/>);
  const trigger=screen.getByRole('combobox');trigger.focus();
  await userEvent.keyboard('{ArrowDown}{ArrowDown}');
  expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option',{name:'Sell'}).id);
  expect(changed).not.toHaveBeenCalled();
  await userEvent.keyboard('{Escape}');expect(screen.queryByRole('listbox')).toBeNull();expect(trigger.textContent).toBe('Buy');
  await userEvent.keyboard('{Enter}{End}{Enter}');expect(changed).toHaveBeenCalledExactlyOnceWith('sell');
  await userEvent.keyboard('{Enter}{Home}{Enter}');expect(changed).toHaveBeenLastCalledWith('buy');
 });

 it('rejects disabled interactions and closes when disabled while open',async()=>{
  const changed=vi.fn();const {rerender}=render(<Select label='Side' options={options} onValueChange={changed}/>);
  await userEvent.click(screen.getByRole('combobox'));await userEvent.click(screen.getByRole('option',{name:'Unavailable'}));
  expect(changed).not.toHaveBeenCalled();expect(screen.getByRole('listbox')).toBeTruthy();
  rerender(<Select label='Side' options={options} onValueChange={changed} disabled/>);
  expect(screen.queryByRole('listbox')).toBeNull();
  await userEvent.click(screen.getByRole('combobox'));expect(screen.queryByRole('listbox')).toBeNull();
  rerender(<Select label='Side' options={options} onValueChange={changed}/>);expect(screen.queryByRole('listbox')).toBeNull();
 });

 it('respects rejected controlled changes and deduplicates the accepted value',async()=>{
  const changed=vi.fn();render(<Select label='Side' options={options} value='buy' onValueChange={changed}/>);
  const trigger=screen.getByRole('combobox');
  await userEvent.click(trigger);await userEvent.click(screen.getByRole('option',{name:'Sell'}));
  expect(changed).toHaveBeenCalledExactlyOnceWith('sell');expect(trigger.textContent).toBe('Buy');
  await userEvent.click(trigger);await userEvent.click(screen.getByRole('option',{name:'Buy'}));expect(changed).toHaveBeenCalledTimes(1);
 });

 it('supports typeahead, repeated-letter cycling and typeahead within the open list',async()=>{
  render(<Select label='Asset' options={[{value:'a',label:'Alpha'},{value:'b',label:'Beta'},{value:'blocked',label:'Blocked',disabled:true},{value:'br',label:'Bravo'}]}/>);
  const trigger=screen.getByRole('combobox');trigger.focus();
  await userEvent.keyboard('b');expect(trigger.textContent).toBe('Beta');
  await userEvent.keyboard('b');expect(trigger.textContent).toBe('Bravo');
  await userEvent.click(trigger);await userEvent.keyboard('al');
  expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option',{name:'Alpha'}).id);
  expect(trigger.textContent).toBe('Bravo');await userEvent.keyboard('{Enter}');expect(trigger.textContent).toBe('Alpha');
 });

 it('dismisses on outside click and lets Tab move to the next control without committing a preview',async()=>{
  const changed=vi.fn();render(<><Select label='Side' options={options} onValueChange={changed}/><button>After</button></>);
  const trigger=screen.getByRole('combobox');await userEvent.click(trigger);
  fireEvent.pointerDown(document.body);expect(screen.queryByRole('listbox')).toBeNull();
  await userEvent.click(trigger);await userEvent.keyboard('{End}{Tab}');
  expect(screen.queryByRole('listbox')).toBeNull();expect(changed).not.toHaveBeenCalled();expect(document.activeElement).toBe(screen.getByRole('button',{name:'After'}));
 });

 it('preserves first enabled fallback and safely renders empty or entirely disabled choices',async()=>{
  const {rerender}=render(<Select label='Side' options={[options[1],options[0]]} defaultValue=''/>);
  expect(screen.getByRole('combobox').textContent).toBe('Buy');
  rerender(<Select label='Side' options={[]} value='unknown'/>);await userEvent.click(screen.getByRole('combobox'));expect(screen.queryByRole('listbox')).toBeNull();
  rerender(<Select label='Side' options={[options[1]]}/>);await userEvent.click(screen.getByRole('combobox'));
  expect(screen.getByRole('option',{name:'Unavailable'}).getAttribute('aria-disabled')).toBe('true');
  await userEvent.keyboard('{ArrowDown}{Enter}');expect(screen.getByRole('combobox').hasAttribute('aria-activedescendant')).toBe(false);
 });

 it('keeps the popup inside a modal and emits feedback only after an accepted selection',async()=>{
  const emit=vi.fn();function Example(){const [open,setOpen]=useState(true);const [value,setValue]=useState('buy');return <HIGProvider feedback={{emit}}><Dialog open={open} onOpenChange={setOpen} title='Order'><Select label='Side' options={options} value={value} onValueChange={setValue}/></Dialog></HIGProvider>;}
  render(<Example/>);await userEvent.click(screen.getByRole('combobox'));
  expect(screen.getByRole('dialog').contains(screen.getByRole('listbox'))).toBe(true);
  await userEvent.click(screen.getByRole('option',{name:'Sell'}));expect(screen.getByRole('dialog')).toBeTruthy();expect(emit).toHaveBeenCalledOnce();
  await userEvent.click(screen.getByRole('combobox'));await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('listbox')).toBeNull();expect(screen.getByRole('dialog')).toBeTruthy();expect(emit).toHaveBeenCalledTimes(1);
 });
});
