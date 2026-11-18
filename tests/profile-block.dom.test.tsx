// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {ProfileBlock,type ProfileSection} from '../packages/hig/react/src/blocks/profile-block';
import * as blocks from '../packages/hig/react/src/blocks';
import {ListRow} from '../packages/hig/react/src/list-group';
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
describe('ProfileBlock host slots',()=>{
 it('draws an optional full-width primary action under the name, and the name may be left out for it',async()=>{
  const login=vi.fn();const view=render(<ProfileBlock sections={[]} action={{label:'Log in',onSelect:login}}/>);
  expect(screen.getByRole('heading',{name:'Profile'})).toBeTruthy();expect(document.querySelector('.hig-profile-name')).toBeNull();expect(document.querySelector('.hig-profile-artwork')!.textContent).toBe('');
  const button=screen.getByRole('button',{name:'Log in'});expect(button.dataset.intent).toBe('primary');expect(button.dataset.full).toBe('true');expect(button.parentElement!.className).toBe('hig-profile-identity');
  await userEvent.click(button);expect(login).toHaveBeenCalledTimes(1);
  view.rerender(<ProfileBlock name='Joe' sections={[]} action={{label:'Log in',onSelect:login,intent:'secondary',disabled:true}}/>);
  const after=screen.getByRole('button',{name:'Log in'}) as HTMLButtonElement;expect(after.dataset.intent).toBe('secondary');expect(after.disabled).toBe(true);
  // Under the name, 16 below it (the identity column's gap).
  expect(document.querySelector('.hig-profile-name')!.compareDocumentPosition(after)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n');expect(css.find(line=>line.startsWith('.hig-profile-identity {'))).toContain('gap:16px');
 });
 it('puts a name accessory beside the name, in the accessibility tree',()=>{
  render(<ProfileBlock name='Joe' onEditName={()=>{}} nameAccessory={<button type='button'>Genesis member</button>} sections={[]}/>);
  const accessory=document.querySelector('.hig-profile-name-accessory')!;expect(accessory.getAttribute('aria-hidden')).toBeNull();expect(screen.getByRole('button',{name:'Genesis member'}).parentElement).toBe(accessory);
  expect([...document.querySelector('.hig-profile-name')!.children].map(child=>child.tagName+(child.className?`.${child.className.trim().split(' ')[0]}`:''))).toEqual(['H2','SPAN.hig-profile-name-accessory','BUTTON.hig-button']);
 });
 it('makes the avatar a named button with onAvatarPress, keeping the status dot outside it',async()=>{
  const choose=vi.fn();const view=render(<ProfileBlock name='Joe' avatar='/joe.png' status={{label:'Demo'}} onAvatarPress={choose} avatarLabel='Change profile picture' sections={[]}/>);
  const avatar=screen.getByRole('button',{name:'Change profile picture'});expect(avatar.classList.contains('hig-profile-artwork')).toBe(true);expect(avatar.querySelector('img')?.getAttribute('alt')).toBe('');
  expect(avatar.querySelector('.hig-profile-status')).toBeNull();expect(document.querySelector('.hig-profile-status')!.textContent).toBe('Demo');
  await userEvent.click(avatar);expect(choose).toHaveBeenCalledTimes(1);
  view.rerender(<ProfileBlock name='Joe' onAvatarPress={choose} sections={[]}/>);expect(screen.getByRole('button',{name:'Joe'}).textContent).toBe('Jo');
  // Signed out with no name and no avatarLabel, the button still has a name: the built-in one, which the host can translate.
  view.rerender(<ProfileBlock action={{label:'Log in',onSelect:()=>{}}} onAvatarPress={choose} sections={[]}/>);expect(screen.getByRole('button',{name:'Change profile picture'}).classList.contains('hig-profile-artwork')).toBe(true);
  view.rerender(<HIGProvider messages={{changeProfilePicture:'Changer la photo'}}><ProfileBlock action={{label:'Log in',onSelect:()=>{}}} onAvatarPress={choose} sections={[]}/></HIGProvider>);expect(screen.getByRole('button',{name:'Changer la photo'})).toBeTruthy();
 });
 it('draws a live figure value place by place and colours a value by tone, leaving plain values unchanged',()=>{
  const view=render(<ProfileBlock name='Joe' sections={[{id:'money',rows:[
   {id:'accounts',label:'Accounts',value:{value:1042.09,options:{style:'currency',currency:'USD'}},onSelect:()=>{}},
   {id:'history',label:'History',value:'Live',tone:'positive',onSelect:()=>{}},
   {id:'demo',label:'Mode',value:'Demo',tone:'warning'},
   {id:'plain',label:'Version',value:'1.0'}]}]}/>);
  const values=[...document.querySelectorAll('.hig-list-row-value')];
  expect(values[0].querySelector('.hig-profile-value .hig-animated-number-visual')).toBeTruthy();expect(values[0].querySelector('.hig-sr-only')!.textContent).toBe('$1,042.09');
  expect(screen.getByRole('button',{name:/Accounts.*\$1,042\.09/})).toBeTruthy();
  expect(values[1].querySelector<HTMLElement>('.hig-profile-value')!.dataset.tone).toBe('positive');expect(values[2].querySelector<HTMLElement>('.hig-profile-value')!.dataset.tone).toBe('warning');
  expect(values[3].innerHTML).toBe('1.0');
  Object.defineProperty(HTMLElement.prototype,'animate',{value:()=>({cancel(){}}),configurable:true});
  view.rerender(<ProfileBlock name='Joe' sections={[{id:'money',rows:[{id:'accounts',label:'Accounts',value:{value:1043.5,options:{style:'currency',currency:'USD'}},onSelect:()=>{}}]}]}/>);
  expect(document.querySelectorAll('.hig-profile-value .hig-animated-number-old').length).toBeGreaterThan(0);
  delete (HTMLElement.prototype as {animate?:unknown}).animate;
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');for(const tone of ['positive','warning','negative','muted'])expect(css).toContain(`.hig-profile-value[data-tone='${tone}'] { color:var(--hig-${tone}); }`);
 });
 it('makes the whole switch row the target as ListRow\'s switch row, its name drawn and read once (Unreleased)',async()=>{
  const live=vi.fn();
  const {container}=render(<ProfileBlock name='Joe' sections={[{id:'settings',rows:[{id:'live',label:'Live Mode',value:'Off',checked:false,onCheckedChange:live}]}]}/>);
  const row=container.querySelector('.hig-list-group-rows > li > .hig-list-row')!;
  const reference=render(<ListRow label='Live Mode' value='Off' checked={false} onCheckedChange={()=>{}}/>).container.firstElementChild!;
  // Same markup as a ListRow switch row, apart from the generated ids.
  const strip=(html:string)=>html.replace(/ (id|aria-labelledby)="[^"]*"/g,'');
  expect(strip(row.outerHTML)).toBe(strip(reference.outerHTML));
  // The text appears once: the visible label names the input, and the switch's label holds no second copy.
  expect(row.textContent!.match(/Live Mode/g)).toHaveLength(1);
  const control=screen.getAllByRole('switch',{name:'Live Mode'})[0];expect(document.getElementById(control.getAttribute('aria-labelledby')!)).toBe(row.querySelector('.hig-list-row-label'));
  await userEvent.click(row.querySelector('.hig-list-row-label')!);expect(live).toHaveBeenCalledWith(true);
  await userEvent.click(control);expect(live).toHaveBeenCalledTimes(2);
 });
 it('does not toggle a disabled switch row from the row, and the press decoration covers the whole row',async()=>{
  const live=vi.fn();
  const view=render(<ProfileBlock name='Joe' sections={[{id:'settings',rows:[{id:'live',label:'Live Mode',checked:false,disabled:true,onCheckedChange:live}]}]}/>);
  await userEvent.click(document.querySelector('.hig-list-row-label')!);expect(live).not.toHaveBeenCalled();
  view.rerender(<HIGProvider pressDecoration={()=><i className='host-layer'/>}><ProfileBlock name='Joe' sections={[{id:'settings',rows:[{id:'live',label:'Live Mode',checked:false,onCheckedChange:live}]}]}/></HIGProvider>);
  const layer=document.querySelector<HTMLElement>('.hig-press-decoration')!;expect(layer.dataset.kind).toBe('switch');expect(layer.parentElement!.classList.contains('hig-list-row')).toBe(true);
  expect(document.querySelectorAll('.hig-press-decoration')).toHaveLength(1);
  await userEvent.click(layer.querySelector('.host-layer')!);expect(live).toHaveBeenCalledTimes(1);expect(live).toHaveBeenCalledWith(true);
 });
 it('draws a footer under the sections',()=>{
  render(<ProfileBlock name='Joe' sections={[{id:'money',rows:[{id:'a',label:'Accounts',onSelect:()=>{}}]}]} footer={<nav aria-label='Legal'><a href='/terms'>Terms</a></nav>}/>);
  const footer=document.querySelector('.hig-profile-footer')!;expect(footer.parentElement!.lastElementChild).toBe(footer);expect(within(footer as HTMLElement).getByRole('link',{name:'Terms'})).toBeTruthy();
  expect(document.querySelector('.hig-list-group')!.compareDocumentPosition(footer)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 });
 it('renders exactly as before without the new props',()=>{
  render(<ProfileBlock name='Joe' sections={[]}/>);
  expect(document.querySelector('.hig-profile-identity')!.innerHTML).toBe('<span class="hig-profile-avatar"><span class="hig-profile-artwork" aria-hidden="true">Jo</span></span><div class="hig-profile-name"><h2>Joe</h2></div>');
  expect(document.querySelector('.hig-profile-footer')).toBeNull();
 });
});
