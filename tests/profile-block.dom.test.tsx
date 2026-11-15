// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {ProfileBlock,type ProfileSection} from '../packages/hig/react/src/blocks/profile-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const sections=(handlers:{accounts?:()=>void;live?:(value:boolean)=>void}={}):ProfileSection[]=>[
 {id:'money',rows:[{id:'accounts',label:'Accounts',value:'$1,042.09',onSelect:handlers.accounts??(()=>{})},{id:'history',label:'History',value:'Demo',onSelect:()=>{}}]},
 {id:'empty',title:'Nothing',rows:[]},
 {id:'settings',title:'Settings',rows:[{id:'live',label:'Live Mode',checked:false,onCheckedChange:handlers.live??(()=>{})},{id:'notifications',label:'Notifications',value:'Off',onSelect:()=>{},disabled:true}]},
];
describe('ProfileBlock',()=>{
 it('shows the name as the heading, with the top bar and edit controls only when the host handles them',async()=>{
  const address=vi.fn(),close=vi.fn(),edit=vi.fn();
  const view=render(<ProfileBlock name='5459····6263' sections={[]}/>);
  expect(screen.getByRole('heading',{name:'5459····6263'})).toBeTruthy();expect(screen.queryByRole('button')).toBeNull();
  view.rerender(<ProfileBlock name='5459····6263' sections={[]} onShowAddress={address} onClose={close} onEditName={edit}/>);
  const bar=document.querySelector('.hig-profile-bar') as HTMLElement;
  // Address leads, Close trails.
  expect([...bar.querySelectorAll('button')].map(button=>button.getAttribute('aria-label'))).toEqual(['Show account address','Close']);
  // Bare icons, as in the other block headers: no filled circle behind them.
  expect([...bar.querySelectorAll('button')].map(button=>button.getAttribute('data-intent'))).toEqual(['ghost','ghost']);
  await userEvent.click(within(bar).getByRole('button',{name:'Show account address'}));await userEvent.click(within(bar).getByRole('button',{name:'Close'}));await userEvent.click(screen.getByRole('button',{name:'Edit name'}));
  expect(address).toHaveBeenCalledTimes(1);expect(close).toHaveBeenCalledTimes(1);expect(edit).toHaveBeenCalledTimes(1);
  expect(document.querySelector('.hig-profile-name > .hig-button')).toBe(screen.getByRole('button',{name:'Edit name'}));
 });
 it('draws the avatar from artwork, an address colour or initials, and names the status dot',()=>{
  const view=render(<ProfileBlock name='Joe Blau' sections={[]}/>);const avatar=()=>document.querySelector<HTMLElement>('.hig-profile-avatar')!,art=()=>avatar().querySelector('.hig-profile-artwork')!;
  expect(art().textContent).toBe('Jo');expect(art().getAttribute('aria-hidden')).toBe('true');expect(avatar().style.background).toBe('');expect(document.querySelector('.hig-profile-status')).toBeNull();
  view.rerender(<ProfileBlock name='5459····6263' address='5459Qk3vJm8Rt2Xw9Ln4Hd7Fz1Bp6Yc6263' status={{label:'Demo'}} sections={[]}/>);
  expect(art().textContent).toBe('');expect(avatar().style.background).not.toBe('');
  const dot=document.querySelector<HTMLElement>('.hig-profile-status')!;expect(dot.dataset.tone).toBe('warning');expect(dot.textContent).toBe('Demo');
  view.rerender(<ProfileBlock name='Joe' address='5459Qk3v' avatar='/joe.png' status={{label:'Live',tone:'positive'}} sections={[]}/>);
  expect(art().querySelector('img')?.getAttribute('src')).toBe('/joe.png');expect(avatar().style.background).toBe('');expect(document.querySelector<HTMLElement>('.hig-profile-status')!.dataset.tone).toBe('positive');
  view.rerender(<ProfileBlock name='Joe' avatar={<svg data-testid='face'/>} sections={[]}/>);expect(within(art() as HTMLElement).getByTestId('face')).toBeTruthy();
 });
 it('lays the sections out as titled groups of rows and skips an empty one',async()=>{
  const accounts=vi.fn();render(<ProfileBlock name='Joe' sections={sections({accounts})}/>);
  const groups=[...document.querySelectorAll('.hig-list-group')];expect(groups).toHaveLength(2);
  expect(groups.map(group=>group.querySelector('.hig-list-group-title')?.textContent??null)).toEqual([null,'Settings']);expect(screen.getByRole('region',{name:'Settings'})).toBe(groups[1]);
  expect([...groups[0].querySelectorAll('.hig-list-row')].map(row=>[row.tagName,row.querySelector('.hig-list-row-label')!.textContent,row.querySelector('.hig-list-row-value')?.textContent,row.querySelector('.hig-list-row-chevron')!==null])).toEqual([['BUTTON','Accounts','$1,042.09',true],['BUTTON','History','Demo',true]]);
  await userEvent.click(screen.getByRole('button',{name:/Accounts/}));expect(accounts).toHaveBeenCalledTimes(1);
  expect((screen.getByRole('button',{name:/Notifications/}) as HTMLButtonElement).disabled).toBe(true);
 });
 it('makes a row with onCheckedChange a switch named by its label, not a button',async()=>{
  const live=vi.fn();const view=render(<ProfileBlock name='Joe' sections={sections({live})}/>);
  const control=screen.getByRole('switch',{name:'Live Mode'}) as HTMLInputElement;expect(control.checked).toBe(false);
  const row=control.closest('.hig-list-row')!;expect(row.tagName).toBe('DIV');expect(row.querySelector('.hig-list-row-chevron')).toBeNull();expect(row.querySelector('.hig-list-row-trailing .hig-switch')).toBeTruthy();
  await userEvent.click(control);expect(live).toHaveBeenCalledWith(true);
  view.rerender(<ProfileBlock name='Joe' sections={[{id:'settings',rows:[{id:'live',label:'Live Mode',checked:true,onCheckedChange:live}]}]}/>);expect((screen.getByRole('switch',{name:'Live Mode'}) as HTMLInputElement).checked).toBe(true);
 });
 it('translates its three built-in labels, follows the writing direction and is in the aggregate',()=>{
  render(<HIGProvider messages={{showAddress:'Afficher l’adresse',close:'Fermer',editName:'Modifier le nom'}}><ProfileBlock name='Joe' sections={[]} onShowAddress={()=>{}} onClose={()=>{}} onEditName={()=>{}}/></HIGProvider>);
  for(const name of ['Afficher l’adresse','Fermer','Modifier le nom'])expect(screen.getByRole('button',{name})).toBeTruthy();
  expect(blocks.ProfileBlock).toBe(ProfileBlock);
  const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n').filter(line=>line.startsWith('.hig-profile'));
  expect(css.join('\n')).not.toMatch(/\b(left|right)\b/);expect(css.find(line=>line.startsWith('.hig-profile-status {'))).toMatch(/inset-inline-end:10px/);expect(css.find(line=>line.startsWith('.hig-profile-block {'))).toContain('gap:24px');
 });
});
