// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {HIGProvider,PressDecoration,type PressDecorationInfo} from '../packages/hig/react/src/provider';
import {Button,IconButton} from '../packages/hig/react/src/button';
import {Switch} from '../packages/hig/react/src/selection';
import {ListGroup,ListRow} from '../packages/hig/react/src/list-group';
import {AssetBalanceRow} from '../packages/hig/react/src/asset-balance-row';
import {SettingSwitch} from '../packages/hig/react/src/blocks/setting-switch';
import {ScreenHeader} from '../packages/hig/react/src/blocks/screen-header';
import {AccountBlock} from '../packages/hig/react/src/blocks/account-block';
import {PositionBlock} from '../packages/hig/react/src/blocks/position-block';
import {ProfileBlock} from '../packages/hig/react/src/blocks/profile-block';
import {TokenActionBlock} from '../packages/hig/react/src/blocks/token-action-block';
import {SignalsBlock} from '../packages/hig/react/src/blocks/signals-block';
import {SwapKeypad} from '../packages/hig/react/src/blocks/swap/shared';
import {SwapAmountCard} from '../packages/hig/react/src/blocks/swap/amount-card';
afterEach(cleanup);
/** The iOS Safari haptic: a native switch input placed inside the pressed control. */
const haptic=({kind}:PressDecorationInfo)=><input type='checkbox' className='host-haptic' data-host={kind} tabIndex={-1} aria-hidden='true'/>;
const controls=(extra:{onClick?:()=>void;onChecked?:(value:boolean)=>void}={})=><>
 <Button onClick={extra.onClick}>Deposit</Button>
 <IconButton label='Settings'>⚙</IconButton>
 <Button disabled>Unavailable</Button>
 <ListGroup><ListRow label='Signals' onSelect={()=>{}}/><ListRow label='Docs' href='/docs'/><ListRow label='Static' value='Off'/></ListGroup>
 <Switch label='Live Mode' onCheckedChange={extra.onChecked}/>
 <SettingSwitch label='Trend' checked={false} onCheckedChange={extra.onChecked??(()=>{})}/>
 <AssetBalanceRow name='Hyperliquid' symbol='HYPE' value={759} onSelect={()=>{}}/>
 <AssetBalanceRow name='Solana' symbol='SOL' value={203}/>
 <ScreenHeader title='Account' onBack={()=>{}}/>
</>;
describe('HIGProvider pressDecoration',()=>{
 it('draws nothing at all without the hook: the markup is the same as a hook that returns nothing',()=>{
  const plain=render(<HIGProvider>{controls()}<ProfileBlock name='Joe' onClose={()=>{}} onEditName={()=>{}} sections={[{id:'s',rows:[{id:'live',label:'Live',checked:true,onCheckedChange:()=>{}},{id:'a',label:'Accounts',onSelect:()=>{}}]}]}/></HIGProvider>).container.innerHTML;
  cleanup();
  const empty=render(<HIGProvider pressDecoration={()=>null}>{controls()}<ProfileBlock name='Joe' onClose={()=>{}} onEditName={()=>{}} sections={[{id:'s',rows:[{id:'live',label:'Live',checked:true,onCheckedChange:()=>{}},{id:'a',label:'Accounts',onSelect:()=>{}}]}]}/></HIGProvider>).container.innerHTML;
  const ids=(html:string)=>html.replace(/_r_[a-z0-9]+_/g,'id');
  expect(plain).not.toContain('hig-press-decoration');expect(ids(empty)).toBe(ids(plain));
 });
 it('puts the host element last inside every pressable control, in one layer that names the control kind',()=>{
  const {container}=render(<HIGProvider pressDecoration={haptic}>{controls()}</HIGProvider>);
  const kindOf=(control:Element)=>{const layer=control.lastElementChild as HTMLElement;expect(layer.className).toBe('hig-press-decoration');expect(layer.querySelector('.host-haptic')?.getAttribute('data-host')).toBe(layer.dataset.kind);return layer.dataset.kind;};
  expect(kindOf(screen.getByRole('button',{name:'Deposit'}))).toBe('button');
  expect(kindOf(screen.getByRole('button',{name:'Settings'}))).toBe('icon-button');
  expect(kindOf(screen.getByRole('button',{name:'Signals'}))).toBe('row');
  expect(kindOf(screen.getByRole('link',{name:'Docs'}))).toBe('row');
  expect(kindOf(screen.getByRole('switch',{name:'Live Mode'}).closest('label')!)).toBe('switch');
  expect(kindOf(screen.getByRole('switch',{name:'Trend'}).closest('label')!)).toBe('switch');
  expect(kindOf(screen.getByRole('button',{name:/Hyperliquid/}))).toBe('row');
  expect(kindOf(screen.getByRole('button',{name:'Back'}))).toBe('back');
  // Static rows have no target of their own, so they carry nothing.
  expect(screen.getByText('Static').closest('.hig-list-row')?.querySelector('.hig-press-decoration')).toBeNull();
  expect(screen.getByText('Solana').closest('.hig-asset-row')?.querySelector('.hig-press-decoration')).toBeNull();
  // The label and accessible names are unchanged, and the icon stays hidden apart from the layer.
  expect(screen.getByRole('button',{name:'Settings'}).querySelector(':scope > span[aria-hidden="true"]')?.textContent).toBe('⚙');
  expect(container.querySelectorAll('.hig-press-decoration')).toHaveLength(9);
 });
 it('reaches the block controls: header Back, Close and address, the deposit and token actions, rows and the help pill',()=>{
  const info:PressDecorationInfo[]=[];
  render(<HIGProvider pressDecoration={value=>{info.push(value);return <i/>;}}>
   <AccountBlock assets={[{id:'sol',name:'Solana',symbol:'SOL',value:1}]} onBack={()=>{}} onShowAddress={()=>{}} onDeposit={()=>{}} onAssetSelect={()=>{}}/>
   <PositionBlock title='Position' onClose={()=>{}} details={[]} groups={[[{id:'size',label:'Size',onSelect:()=>{}}]]}/>
   <TokenActionBlock symbol='HYPE' name='Hyperliquid' assets={[]} chains={[]} actions={[{id:'send',onSelect:()=>{}},{id:'burn',label:'Burn',disabled:true,onSelect:()=>{}}]}/>
   <SignalsBlock title='Signals' groups={[{id:'trend',title:'Trend',help:{label:'How it works',onSelect:()=>{}},items:[{id:'t',label:'Trend',checked:true,onCheckedChange:()=>{}}]}]}/>
  </HIGProvider>);
  const layer=(name:string|RegExp)=>(screen.getByRole('button',{name}).lastElementChild as HTMLElement).dataset.kind;
  expect(screen.getAllByRole('button',{name:'Back'}).map(button=>(button.lastElementChild as HTMLElement).dataset.kind)).toEqual(['back']);
  expect(layer('Show account address')).toBe('back');expect(layer('Close')).toBe('back');
  expect(layer('Deposit')).toBe('button');expect(layer(/Solana/)).toBe('row');expect(layer(/Size/)).toBe('row');
  expect(layer('Send')).toBe('button');expect(layer('Burn')).toBe('button');expect(layer('How it works')).toBe('button');
  expect((screen.getByRole('switch',{name:'Trend'}).closest('label')!.lastElementChild as HTMLElement).dataset.kind).toBe('switch');
  // A disabled control says so, so the host can leave its haptic out.
  expect(info.find(value=>value.disabled)).toEqual({kind:'button',disabled:true});
 });
 it('lets a press on the host element act exactly once: buttons through bubbling, switches through the layer',()=>{
  const click=vi.fn(),checked=vi.fn();
  const {container}=render(<HIGProvider pressDecoration={haptic}>{controls({onClick:click,onChecked:checked})}</HIGProvider>);
  fireEvent.click(screen.getByRole('button',{name:'Deposit'}).querySelector('.host-haptic')!);
  expect(click).toHaveBeenCalledTimes(1);
  const [plainSwitch,settingSwitch]=[...container.querySelectorAll('label .hig-press-decoration .host-haptic')] as HTMLInputElement[];
  fireEvent.click(plainSwitch);expect(checked).toHaveBeenLastCalledWith(true);expect(checked).toHaveBeenCalledTimes(1);
  expect(screen.getByRole<HTMLInputElement>('switch',{name:'Live Mode'}).checked).toBe(true);
  fireEvent.click(settingSwitch);expect(checked).toHaveBeenLastCalledWith(true);expect(checked).toHaveBeenCalledTimes(2);
  // A press on the switch row itself still toggles once, as before.
  fireEvent.click(screen.getByText('Trend'));expect(checked).toHaveBeenCalledTimes(3);
 });
 it('keeps the control\'s default action: a submit Button submits once, a reset Button resets, a linked row navigates once',()=>{
  const submit=vi.fn((event:React.FormEvent)=>event.preventDefault()),reset=vi.fn(),pressed=vi.fn();
  const clicks:MouseEvent[]=[];
  const record=(event:MouseEvent)=>{if((event.target as Element).closest?.('a.hig-list-row'))clicks.push(event);};
  document.addEventListener('click',record);
  try{
   render(<HIGProvider pressDecoration={haptic}>
    <form onSubmit={submit} onReset={reset}><Button type='submit' onClick={pressed}>Send</Button><Button type='reset'>Clear</Button></form>
    <ListGroup><ListRow label='Docs' href='#docs'/></ListGroup>
   </HIGProvider>);
   fireEvent.click(screen.getByRole('button',{name:'Send'}).querySelector('.host-haptic')!);
   expect(submit).toHaveBeenCalledTimes(1);expect(pressed).toHaveBeenCalledTimes(1);
   fireEvent.click(screen.getByRole('button',{name:'Clear'}).querySelector('.host-haptic')!);
   expect(reset).toHaveBeenCalledTimes(1);expect(submit).toHaveBeenCalledTimes(1);
   const link=screen.getByRole('link',{name:'Docs'});
   fireEvent.click(link.querySelector('.host-haptic')!);
   // One click reaches the document, aimed at the link itself so the link is its activation target (jsdom does not navigate).
   expect(clicks).toHaveLength(1);expect(clicks[0].target).toBe(link);expect(clicks[0].defaultPrevented).toBe(false);
   // A press on the control itself is untouched: one submit, as before.
   fireEvent.click(screen.getByRole('button',{name:'Send'}));expect(submit).toHaveBeenCalledTimes(2);
  }finally{document.removeEventListener('click',record);}
 });
 it('gives nothing to a disabled control, and a host element on a busy button does not submit',()=>{
  const submit=vi.fn((event:React.FormEvent)=>event.preventDefault()),pressed=vi.fn();
  render(<HIGProvider pressDecoration={haptic}><form onSubmit={submit}><Button type='submit' busy onClick={pressed}>Send</Button></form></HIGProvider>);
  fireEvent.click(screen.getByRole('button',{name:/Send/}).querySelector('.host-haptic')!);
  expect(submit).not.toHaveBeenCalled();expect(pressed).not.toHaveBeenCalled();
 });
 it('reaches the swap panel keypad keys, flip button, token pickers and receive address',()=>{
  const {container}=render(<HIGProvider pressDecoration={haptic}><SwapKeypad label='Keypad' deleteLabel='Delete' onKey={()=>{}}/><SwapAmountCard name='Solana' symbol='SOL' value={1} amountLabel='Amount' onSelect={()=>{}} selectLabel='Choose asset'/></HIGProvider>);
  expect([...container.querySelectorAll('.hig-swap-key')].every(key=>(key.lastElementChild as HTMLElement).dataset.kind==='button')).toBe(true);
  expect((screen.getByRole('button',{name:'Choose asset'}).lastElementChild as HTMLElement).dataset.kind).toBe('row');
  const source=readFileSync('packages/hig/react/src/blocks/swap-panel-block.tsx','utf8');
  expect(source.match(/className='hig-swap-hit'.*?<PressDecoration kind='row'\/><\/button>/g)).toHaveLength(3);
  expect(source).toContain("<SwapIcon name='flip' size={16}/><PressDecoration kind='icon-button' disabled={submitting||!from||!to}/>");
  expect(source).toContain("onClick={copyAddress}>{content}<PressDecoration kind='row'/>");
 });
 it('hands a press to a disabled switch to nobody, and a host label that names its own control is left to that control',()=>{
  const checked=vi.fn();
  render(<HIGProvider pressDecoration={()=><><input id='host-switch' type='checkbox'/><label htmlFor='host-switch' data-testid='host-label' onClick={event=>event.stopPropagation()}/></>}>
   <Switch label='Off' disabled onCheckedChange={checked}/>
   <PressDecoration kind='button'/>
  </HIGProvider>);
  fireEvent.click(document.querySelector('#host-switch')!);expect(checked).not.toHaveBeenCalled();
  // A host control can carry the same layer.
  expect([...document.querySelectorAll<HTMLElement>('.hig-press-decoration')].map(layer=>layer.dataset.kind)).toEqual(['switch','button']);
 });
 it('lets a host label that names a switch inside the layer reach the switch once',()=>{
  const checked=vi.fn();
  render(<HIGProvider pressDecoration={()=><><input id='haptic' type='checkbox'/><label htmlFor='haptic' data-testid='haptic-label'/></>}><Switch label='Live' onCheckedChange={checked}/></HIGProvider>);
  fireEvent.click(screen.getByTestId('haptic-label'));
  expect(checked).toHaveBeenCalledTimes(1);expect(checked).toHaveBeenLastCalledWith(true);
 });
 it('styles the layer out of flow: absolutely positioned over the control, no pointer events of its own, its children take them',()=>{
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  expect(css).toContain(':where(:has(> .hig-press-decoration)) { position:relative; }');
  expect(css).toMatch(/span\.hig-press-decoration\[data-kind\][^{]*\{ position:absolute;inset:0;[^}]*border-radius:inherit;overflow:hidden;[^}]*pointer-events:none; \}/);
  expect(css).toContain('span.hig-press-decoration[data-kind] > * { pointer-events:auto; }');
 });
});
