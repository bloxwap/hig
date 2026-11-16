// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {PositionBlock,type PositionBlockProps} from '../packages/hig/react/src/blocks/position-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const usd={style:'currency',currency:'USD'} as const;
const base:PositionBlockProps={title:'Position',details:[{label:'Notional',value:{value:400,options:{...usd,maximumFractionDigits:0}}},{label:'Fee',value:{value:0.53,options:usd},tone:'negative'},{label:'Liquidation',value:{value:-0.025,options:{style:'percent',maximumFractionDigits:2}},tone:'negative'}],groups:[]};
const lines=()=>[...document.querySelectorAll('.hig-position-details > div')].map(line=>[spoken(line.querySelector('dt')!),spoken(line.querySelector('dd')!),line.getAttribute('data-tone')]);
const groups=()=>[...document.querySelectorAll('.hig-position-groups > .hig-list-group')].map(group=>[...group.querySelectorAll('.hig-list-row')].map(row=>row.textContent));
describe('PositionBlock',()=>{
 it('shows the heading with Close on the trailing edge, and Back or a host control when given',async()=>{
  const close=vi.fn(),back=vi.fn();const view=render(<PositionBlock {...base} onClose={close}/>);
  expect(screen.getByRole('heading',{name:'Position'})).toBeTruthy();
  const button=screen.getByRole('button',{name:'Close'});expect(button.closest('.hig-screen-header-side')).toBe(document.querySelectorAll('.hig-screen-header-side')[1]);
  await userEvent.click(button);expect(close).toHaveBeenCalledTimes(1);expect(screen.queryByRole('button',{name:'Back'})).toBeNull();
  view.rerender(<PositionBlock {...base} onClose={close} onBack={back} headerAction={<button type='button'>Share</button>}/>);
  expect(screen.queryByRole('button',{name:'Close'})).toBeNull();expect(screen.getByRole('button',{name:'Share'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  view.rerender(<PositionBlock {...base}/>);expect(screen.queryByRole('button')).toBeNull();
  expect(blocks.PositionBlock).toBe(PositionBlock);
 });
 it('reads the summary in order: live figures, host text, tones, and an unknown figure as a dash',()=>{
  const view=render(<PositionBlock {...base}/>);
  expect(lines()).toEqual([['Notional','$400',null],['Fee','$0.53','negative'],['Liquidation','-2.5%','negative']]);
  expect(document.querySelectorAll('.hig-position-details dd.hig-number')).toHaveLength(3);
  view.rerender(<PositionBlock {...base} details={[{label:'Fee',value:'2% of profit',tone:'muted'},{label:'Bust',value:{value:null},tone:'positive'},{label:'Size',value:{value:10,prefix:'~',suffix:' USDC'}}]} note='Minimum $10 margin.'/>);
  expect(lines()).toEqual([['Fee','2% of profit','muted'],['Bust','—','positive'],['Size','~10 USDC',null]]);expect(document.querySelector('.hig-position-note')!.textContent).toBe('Minimum $10 margin.');
  view.rerender(<PositionBlock {...base} details={[]}/>);expect(document.querySelector('.hig-position-details')).toBeNull();expect(document.querySelector('.hig-position-note')).toBeNull();expect(document.querySelector('.hig-position-groups')).toBeNull();
 });
 it('draws each group as one list of rows that report a press, with values, static rows and disabled rows',async()=>{
  const size=vi.fn(),stop=vi.fn(),positions=vi.fn();
  render(<PositionBlock {...base} groups={[[{id:'size',label:'Size',value:'$10',onSelect:size},{id:'leverage',label:'Leverage',value:'40×'},{id:'stop',label:'Stop Loss',onSelect:stop,disabled:true}],[],[{id:'positions',label:'Positions',value:'2',onSelect:positions}]]}/>);
  // The empty group is not drawn.
  expect(groups()).toEqual([['Size$10','Leverage40×','Stop Loss'],['Positions2']]);
  const rows=[...document.querySelectorAll<HTMLElement>('.hig-list-row')];expect(rows.map(row=>[row.tagName,row.querySelector('.hig-list-row-chevron')!==null])).toEqual([['BUTTON',true],['DIV',false],['BUTTON',true],['BUTTON',true]]);
  for(const row of rows)await userEvent.click(row);
  expect(size).toHaveBeenCalledTimes(1);expect(stop).not.toHaveBeenCalled();expect(positions).toHaveBeenCalledTimes(1);expect((rows[2] as HTMLButtonElement).disabled).toBe(true);
 });
 it('adds the paper trading switch as a row of its own above the settings and reports the change',async()=>{
  const change=vi.fn();const view=render(<PositionBlock {...base} paperTrade={{label:'Paper trade',checked:false,onCheckedChange:change}} groups={[[{id:'size',label:'Size',value:'$10',onSelect:()=>{}}]]}/>);
  expect(groups()).toEqual([['Paper tradePaper trade'],['Size$10']]);expect(document.querySelector('.hig-position-groups > .hig-list-group')!.classList.contains('hig-position-flag')).toBe(true);
  const flag=screen.getByRole('switch',{name:'Paper trade'}) as HTMLInputElement;expect(flag.checked).toBe(false);expect(screen.getAllByRole('switch')).toHaveLength(1);
  await userEvent.click(flag);expect(change).toHaveBeenCalledWith(true);
  view.rerender(<PositionBlock {...base} paperTrade={{label:'Paper trade',checked:true,onCheckedChange:change,disabled:true}} groups={[]}/>);
  expect((screen.getByRole('switch',{name:'Paper trade'}) as HTMLInputElement).checked).toBe(true);expect((screen.getByRole('switch') as HTMLInputElement).disabled).toBe(true);expect(groups()).toHaveLength(1);
  view.rerender(<PositionBlock {...base} groups={[[{id:'size',label:'Size'}]]}/>);expect(screen.queryByRole('switch')).toBeNull();
 });
 it('ships no trading words of its own: only Close and Back are built in, and they follow the provider',()=>{
  render(<HIGProvider locale='fr-FR' messages={{close:'Fermer'}}><PositionBlock title='Position' details={[{label:'Frais',value:{value:0.53,options:usd}}]} groups={[]} onClose={()=>{}}/></HIGProvider>);
  expect(screen.getByRole('button',{name:'Fermer'})).toBeTruthy();expect(lines()[0][1]).toMatch(/^0,53\s\$US$/);
  const source=readFileSync('packages/hig/react/src/blocks/position-block.tsx','utf8');expect(source.match(/messages\.\w+/g)).toEqual(['messages.close']);
 });
 it('stacks its list groups 24 apart, the standard gap between groups',()=>{
  const rule=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n').find(line=>line.startsWith('.hig-position-groups {'))??'';
  expect(rule).toContain('gap:24px');
 });
 it('draws the summary directly on the screen, with no card',()=>{
  const rule=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n').find(line=>line.startsWith('.hig-position-details {'))??'';
  expect(rule).toContain('padding-inline:20px');expect(rule).not.toMatch(/background|border-radius/);
 });
});
describe('PositionBlock host slots',()=>{
 it('strikes a waived value through, reads the host word after it, and draws a label accessory',async()=>{
  const explain=vi.fn();
  render(<PositionBlock {...base} details={[{id:'fee',label:'Fee',value:{value:0.53,options:usd},tone:'muted',struck:'Waived',labelAccessory:<button type='button' onClick={explain}>Genesis</button>},{label:'Notional',value:'$400'}]}/>);
  const fee=document.querySelector('.hig-position-details > div')!;
  expect(fee.querySelector('dd > .hig-position-struck .hig-animated-number-visual')).not.toBeNull();expect(spoken(fee.querySelector('dd')!)).toBe('$0.53 Waived');expect(fee.querySelector('dd > .hig-sr-only')!.textContent).toBe(' Waived');
  expect(fee.querySelector('dt > .hig-position-label-accessory > button')!.textContent).toBe('Genesis');await userEvent.click(screen.getByRole('button',{name:'Genesis'}));expect(explain).toHaveBeenCalledTimes(1);
  expect(document.querySelectorAll('.hig-position-struck')).toHaveLength(1);expect(document.querySelectorAll('.hig-position-label-accessory')).toHaveLength(1);
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).toContain('.hig-position-struck::after');
 });
 it('toggles the paper trading switch from anywhere on its row, once, and not when disabled',async()=>{
  const change=vi.fn();const view=render(<PositionBlock {...base} paperTrade={{label:'Paper trade',checked:false,onCheckedChange:change}} groups={[]}/>);
  const row=document.querySelector<HTMLElement>('.hig-position-flag .hig-list-row')!;
  await userEvent.click(row.querySelector('.hig-list-row-label')!);expect(change).toHaveBeenCalledTimes(1);expect(change).toHaveBeenLastCalledWith(true);
  await userEvent.click(screen.getByRole('switch'));expect(change).toHaveBeenCalledTimes(2);
  view.rerender(<PositionBlock {...base} paperTrade={{label:'Paper trade',checked:false,onCheckedChange:change,disabled:true}} groups={[]}/>);
  await userEvent.click(document.querySelector('.hig-position-flag .hig-list-row-label')!);expect(change).toHaveBeenCalledTimes(2);
 });
 it('draws an action on the paper trading row card, under the switch, without toggling it',async()=>{
  const change=vi.fn(),harvest=vi.fn();
  const view=render(<PositionBlock {...base} paperTrade={{label:'Farming',checked:true,onCheckedChange:change,action:{label:'Harvest',onSelect:harvest}}} groups={[]}/>);
  const card=document.querySelector('.hig-position-flag .hig-position-flag-card')!;expect(card.children[0].classList.contains('hig-list-row')).toBe(true);
  const button=within(card as HTMLElement).getByRole('button',{name:'Harvest'});expect(button.closest('.hig-position-flag-action')).not.toBeNull();expect(button.getAttribute('data-intent')).toBe('primary');
  await userEvent.click(button);expect(harvest).toHaveBeenCalledTimes(1);expect(change).not.toHaveBeenCalled();
  view.rerender(<PositionBlock {...base} paperTrade={{label:'Farming',checked:true,onCheckedChange:change,action:{label:'Confirm harvest',onSelect:harvest,intent:'destructive',busy:true}}} groups={[]}/>);
  const busy=screen.getByRole('button',{name:/Confirm harvest/}) as HTMLButtonElement;expect(busy.getAttribute('data-intent')).toBe('destructive');expect(busy.disabled).toBe(true);expect(busy.getAttribute('aria-busy')).toBe('true');
  const rule=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n').find(line=>line.startsWith('.hig-position-flag-action {'))??'';expect(rule).toContain('padding:4px 20px 16px');
 });
 it('takes switch rows and live figures inside the groups',async()=>{
  const change=vi.fn();
  render(<PositionBlock {...base} groups={[[{id:'size',label:'Size',value:{value:10,options:usd},onSelect:()=>{}},{id:'reduce',label:'Reduce only',checked:false,onCheckedChange:change}]]}/>);
  const rows=[...document.querySelectorAll<HTMLElement>('.hig-position-groups .hig-list-row')];
  expect(rows[0].tagName).toBe('BUTTON');expect(rows[0].querySelector('.hig-list-row-value .hig-animated-number-visual')).not.toBeNull();expect(spoken(rows[0].querySelector('.hig-list-row-value')!)).toBe('$10.00');
  expect(rows[1].tagName).toBe('DIV');const toggle=screen.getByRole('switch',{name:'Reduce only'}) as HTMLInputElement;expect(toggle.checked).toBe(false);
  await userEvent.click(rows[1].querySelector('.hig-list-row-label')!);expect(change).toHaveBeenCalledWith(true);expect(change).toHaveBeenCalledTimes(1);
 });
 it('pins the header only with stickyHeader, and names the heading with headingId',()=>{
  const view=render(<PositionBlock {...base}/>);expect(document.querySelector('.hig-screen-header')!.hasAttribute('data-sticky')).toBe(false);
  view.rerender(<PositionBlock {...base} stickyHeader headingId='position-title'/>);expect(document.querySelector('.hig-position-block > .hig-screen-header')!.getAttribute('data-sticky')).toBe('true');
  expect(screen.getByRole('heading',{name:'Position'}).id).toBe('position-title');
  const rule=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n').find(line=>line.startsWith('.hig-screen-header[data-sticky],'))??'';expect(rule).toContain('position:sticky');expect(rule).toContain('inset-block-start:0');expect(rule).toContain('background-color:transparent');
 });
 it('passes attributes through to Back and Close (Unreleased)',()=>{
  render(<PositionBlock {...base} onBack={()=>{}} onClose={()=>{}} backProps={{'data-host':'back'} as never} closeProps={{'data-host':'close'} as never}/>);
  expect(screen.getByRole('button',{name:'Back'}).getAttribute('data-host')).toBe('back');expect(screen.getByRole('button',{name:'Close'}).getAttribute('data-host')).toBe('close');
 });
 it('draws the press decoration on the paper trading action (Unreleased)',()=>{
  render(<HIGProvider pressDecoration={({kind})=><i data-kind-host={kind}/>}><PositionBlock {...base} paperTrade={{label:'Paper trade',checked:true,onCheckedChange:()=>{},action:{label:'Harvest',onSelect:()=>{}}}}/></HIGProvider>);
  expect(screen.getByRole('button',{name:'Harvest'}).querySelector('.hig-press-decoration [data-kind-host="button"]')).toBeTruthy();
 });
 it('draws a live figure with host-formatted text, such as Leverage (Unreleased)',()=>{
  render(<PositionBlock {...base} groups={[[{id:'leverage',label:'Leverage',value:{value:40,suffix:'×',formattedValue:'40'},onSelect:()=>{}}]]}/>);
  expect(screen.getByRole('button',{name:/Leverage/}).textContent).toContain('40×');
 });
});
