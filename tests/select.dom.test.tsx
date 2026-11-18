import React,{useState} from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Select} from '../packages/hig/react/src/select';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {Dialog} from '../packages/hig/react/src/dialog';

afterEach(cleanup);
const options=[{value:'buy',label:'Buy'},{value:'blocked',label:'Unavailable',disabled:true},{value:'sell',label:'Sell'}];

describe('custom Select',()=>{
 it('keeps an open list stable across unrelated provider changes and uses the current language for typeahead',()=>{
  const readLabel=vi.fn((label:string)=>label);
  const choices=Array.from({length:50},(_,index)=>({value:String(index),get label(){return readLabel(index===49?'Isparta':`City ${index}`);}}));
  const select=<Select label='City' options={choices}/>;
  const numberFormat={locale:'en-US'};
  const tree=(color:string,locale:string)=><HIGProvider primaryColor={color} locale={locale} numberFormat={numberFormat}>{select}</HIGProvider>;
  const {rerender}=render(tree('#123456','en'));
  const trigger=screen.getByRole('combobox');
  fireEvent.click(trigger);
  readLabel.mockClear();
  rerender(tree('#654321','en'));
  expect(readLabel).not.toHaveBeenCalled();
  rerender(tree('#654321','tr'));
  fireEvent.keyDown(trigger,{key:'ı'});
  expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option',{name:'Isparta'}).id);
 });

 it('leaves other option labels untouched when the keyboard highlight moves',()=>{
  const read=vi.fn((index:number)=>String(index));
  const choices=Array.from({length:50},(_,index)=>({value:String(index),get label(){return read(index);}}));
  render(<Select label='Choice' options={choices}/>);
  const trigger=screen.getByRole('combobox');
  fireEvent.click(trigger);
  read.mockClear();
  fireEvent.keyDown(trigger,{key:'ArrowDown'});
  expect(read.mock.calls.filter(([index])=>index>1)).toHaveLength(0);
  expect(document.getElementById(trigger.getAttribute('aria-activedescendant')!)?.textContent).toBe('1');
 });

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

it('reads each value once when indexing a closed large Select and rejects duplicate values',()=>{
 let reads=0;
 const choices=Array.from({length:1000},(_,index)=>({get value(){reads++;return String(index);},label:'Choice '+index,disabled:index<3}));
 render(<Select label="Choice" options={choices} defaultValue="3"/>);
 expect(screen.getByRole('combobox').textContent).toBe('Choice 3');
 expect(reads).toBeLessThanOrEqual(1001);
 expect(()=>render(<Select label="Choice" options={[choices[1],choices[1]]}/>)).toThrow('Select requires unique keys: 1');
});

it('steps among late enabled choices and recovers when the highlighted choice becomes disabled',()=>{
 const options=Array.from({length:10000},(_,i)=>({value:String(i),label:'Choice '+i,disabled:i%3===0}));
 const {rerender}=render(<Select label="Choice" options={options}/>);
 const trigger=screen.getByRole('combobox');
 const move=(key:string)=>{fireEvent.keyDown(trigger,{key});return document.getElementById(trigger.getAttribute('aria-activedescendant')??'')?.textContent;};
 expect(move('End')).toBe('Choice 9998');
 expect(move('ArrowUp')).toBe('Choice 9997');
 expect(move('ArrowUp')).toBe('Choice 9995');
 rerender(<Select label="Choice" options={options.map((choice,i)=>i===9995?{...choice,disabled:true}:choice)}/>);
 expect(move('ArrowDown')).toBe('Choice 1');
 expect(move('ArrowUp')).toBe('Choice 1');
});
