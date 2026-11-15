// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {TargetCard,targetFormat,targetLayout,type TargetCardProps} from '../packages/hig/react/src/blocks/target-card';
import * as blocks from '../packages/hig/react/src/blocks';
import * as en from '../packages/hig/contracts/src/messages';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const labels={title:'Take Profit',submit:'Set Take Profit',entry:'Entry',mark:'Mark',trigger:'If triggered',unit:'Target in',units:{dollar:'Dollar',price:'Price',percent:'Percent'},custom:'Custom'};
const base:TargetCardProps={kind:'take-profit',labels,entry:64700,mark:64500,trigger:65000,unit:'dollar',value:2,onSubmit:()=>{}};
const readouts=()=>[...document.querySelectorAll('.hig-target-prices dl > div')].map(item=>[item.getAttribute('data-price'),spoken(item.querySelector('dt')!),spoken(item.querySelector('dd')!)]);
const grow=()=>[...document.querySelectorAll<HTMLElement>('.hig-target-bar > span')].map(part=>[part.className.replace('hig-target-',''),part.style.flexGrow?Number(Number(part.style.flexGrow).toFixed(4)):part.style.insetInlineStart]);
const presets=()=>[...document.querySelectorAll<HTMLButtonElement>('.hig-target-presets > button')];
describe('targetLayout',()=>{
 it('places the known prices on one axis in price order and spans the stretch from the mark to the trigger',()=>{
  expect(targetLayout({entry:100,mark:90,trigger:140})).toEqual({positions:{entry:0.2,mark:0,trigger:1},order:['mark','entry','trigger'],from:0,to:1});
  // A stop under the mark: the stretch runs down from the mark.
  expect(targetLayout({entry:100,mark:120,trigger:80})).toEqual({positions:{entry:0.5,mark:1,trigger:0},order:['trigger','entry','mark'],from:0,to:1});
  // The mark between entry and trigger leaves the ground already covered untinted.
  expect(targetLayout({entry:100,mark:110,trigger:140})).toMatchObject({from:0.25,to:1,order:['entry','mark','trigger']});
 });
 it('starts from entry without a mark, has no stretch without a trigger, and keeps equal prices in entry, mark, trigger order',()=>{
  expect(targetLayout({entry:100,trigger:140})).toEqual({positions:{entry:0,trigger:1},order:['entry','trigger'],from:0,to:1});
  expect(targetLayout({entry:100,mark:90,trigger:null})).toEqual({positions:{entry:1,mark:0},order:['mark','entry'],from:0.5,to:0.5});
  expect(targetLayout({entry:100,mark:100,trigger:100})).toEqual({positions:{entry:0.5,mark:0.5,trigger:0.5},order:['entry','mark','trigger'],from:0.5,to:0.5});
  expect(targetLayout({entry:Number.NaN})).toEqual({positions:{},order:[],from:0.5,to:0.5});
 });
});
describe('targetFormat',()=>{
 it('signs dollars and percents, shortens whole dollar presets, and leaves prices to the host format',()=>{
  const text=(value:number,options:Intl.NumberFormatOptions)=>new Intl.NumberFormat('en-US',options).format(value);
  expect(text(2,targetFormat('dollar'))).toBe('+$2.00');expect(text(-0.5,targetFormat('dollar',undefined,-0.5))).toBe('-$0.50');expect(text(10,targetFormat('dollar',undefined,10))).toBe('+$10');
  expect(text(0.05,targetFormat('percent'))).toBe('+5%');expect(text(-0.025,targetFormat('percent'))).toBe('-2.5%');
  expect(text(65024.48,targetFormat('price'))).toBe('$65,024.48');expect(text(0.5123,targetFormat('price',{style:'currency',currency:'USD',maximumFractionDigits:4}))).toBe('$0.5123');
 });
});
describe('TargetCard',()=>{
 it('shows the heading, the target as the headline figure, and the position and order type on the price card',async()=>{
  const back=vi.fn();render(<TargetCard {...base} position='BTC · Long 40×' orderType='Take-limit' note='Fills at your target price or better.' onBack={back}/>);
  expect(screen.getByRole('heading',{name:'Take Profit'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  expect(spoken(document.querySelector('.hig-target-amount')!)).toBe('+$2.00');
  const card=screen.getByRole('region',{name:'BTC · Long 40×'});expect(card.classList.contains('hig-surface')).toBe(true);
  expect(card.querySelector('.hig-bar-mark-description')!.textContent).toBe('Take-limit');expect(document.querySelector('.hig-target-note')!.textContent).toBe('Fills at your target price or better.');
  expect(blocks.TargetCard).toBe(TargetCard);expect(blocks.targetLayout).toBe(targetLayout);
 });
 it('draws the prices in price order with the stretch from the mark to the trigger and entry as a tick',()=>{
  const view=render(<TargetCard {...base}/>);
  expect(document.querySelector('.hig-target-card')!.getAttribute('data-kind')).toBe('take-profit');
  expect(readouts()).toEqual([['mark','Mark','$64,500.00'],['entry','Entry','$64,700.00'],['trigger','If triggered','$65,000.00']]);
  expect(grow()).toEqual([['rest',0],['move',1],['rest',0],['entry','40%']]);expect(document.querySelector('.hig-target-move')!.getAttribute('data-lead')).toBe('start');
  expect(document.querySelector('.hig-target-bar')!.getAttribute('aria-hidden')).toBe('true');
  // A stop loss under the mark leads with the trigger and reads in the negative role.
  view.rerender(<TargetCard {...base} kind='stop-loss' mark={64800} trigger={64600} value={-0.5}/>);
  expect(document.querySelector('.hig-target-card')!.getAttribute('data-kind')).toBe('stop-loss');expect(spoken(document.querySelector('.hig-target-amount')!)).toBe('-$0.50');
  expect(readouts().map(row=>row[0])).toEqual(['trigger','entry','mark']);expect(document.querySelector('.hig-target-move')!.getAttribute('data-lead')).toBe('trigger');
  // Without a mark the stretch starts at entry and there is no separate tick; without a trigger there is no stretch.
  view.rerender(<TargetCard {...base} mark={null}/>);expect(grow()).toEqual([['rest',0],['move',1],['rest',0]]);expect(readouts()).toEqual([['entry','Entry','$64,700.00'],['trigger','If triggered','$65,000.00']]);
  view.rerender(<TargetCard {...base} trigger={undefined}/>);expect(document.querySelector('.hig-target-move')).toBeNull();expect(readouts().map(row=>row[0])).toEqual(['mark','entry']);
 });
 it('reads the target in the current unit and takes it as the trigger in the price unit',()=>{
  const view=render(<TargetCard {...base} unit='percent' value={0.05}/>);expect(spoken(document.querySelector('.hig-target-amount')!)).toBe('+5%');
  view.rerender(<TargetCard {...base} unit='price' value={65250} trigger={undefined}/>);
  expect(spoken(document.querySelector('.hig-target-amount')!)).toBe('$65,250.00');expect(readouts()[2]).toEqual(['trigger','If triggered','$65,250.00']);
  view.rerender(<TargetCard {...base} value={null}/>);expect(spoken(document.querySelector('.hig-target-amount')!)).toBe('—');expect((screen.getByRole('button',{name:'Set Take Profit'}) as HTMLButtonElement).disabled).toBe(true);
 });
 it('offers the units as one control, hidden with a single unit, and reports the choice',async()=>{
  const change=vi.fn();const view=render(<TargetCard {...base} onUnitChange={change}/>);
  expect(screen.getAllByRole('radio').map(radio=>[(radio as HTMLInputElement).value,(radio as HTMLInputElement).checked])).toEqual([['dollar',true],['price',false],['percent',false]]);
  expect(screen.getByRole('group',{name:'Target in'})).toBeTruthy();
  await userEvent.click(screen.getByRole('radio',{name:'Percent'}));expect(change).toHaveBeenCalledWith('percent');
  view.rerender(<TargetCard {...base} units={['price','dollar']}/>);expect(screen.getAllByRole('radio').map(radio=>(radio as HTMLInputElement).value)).toEqual(['price','dollar']);
  view.rerender(<TargetCard {...base} units={['dollar']}/>);expect(screen.queryByRole('radio')).toBeNull();
 });
 it('draws the quick choices in the unit format, marks the one equal to the target, and reports presses and the custom row',async()=>{
  const change=vi.fn(),custom=vi.fn();const view=render(<TargetCard {...base} presets={[1,2,5,10]} onValueChange={change} onCustom={custom}/>);
  expect(presets().map(button=>[button.textContent,button.getAttribute('aria-pressed'),button.dataset.intent])).toEqual([['+$1','false','secondary'],['+$2','true','primary'],['+$5','false','secondary'],['+$10','false','secondary']]);
  await userEvent.click(presets()[2]);expect(change).toHaveBeenCalledWith(5);
  await userEvent.click(screen.getByRole('button',{name:'Custom'}));expect(custom).toHaveBeenCalledTimes(1);
  view.rerender(<TargetCard {...base} kind='stop-loss' value={-0.5} presets={[-0.5,-1,-2,-5]}/>);
  expect(presets().map(button=>[button.textContent,button.dataset.intent])).toEqual([['-$0.50','destructive'],['-$1','secondary'],['-$2','secondary'],['-$5','secondary']]);
  expect(screen.queryByRole('button',{name:'Custom'})).toBeNull();
  view.rerender(<TargetCard {...base} unit='percent' value={0.1} presets={[0.05,0.1,0.25]}/>);expect(presets().map(button=>button.textContent)).toEqual(['+5%','+10%','+25%']);
  view.rerender(<TargetCard {...base}/>);expect(document.querySelector('.hig-target-presets')).toBeNull();
 });
 it('confirms in the role of its kind, with Cancel beside it only when the host handles it',async()=>{
  const submit=vi.fn(),cancel=vi.fn();const view=render(<TargetCard {...base} onSubmit={submit} onCancel={cancel}/>);
  const actions=()=>[...document.querySelectorAll<HTMLButtonElement>('.hig-target-actions > button')];
  expect(actions().map(button=>[button.textContent,button.dataset.intent])).toEqual([['Cancel','secondary'],['Set Take Profit','primary']]);
  for(const button of actions())await userEvent.click(button);expect(cancel).toHaveBeenCalledTimes(1);expect(submit).toHaveBeenCalledTimes(1);
  view.rerender(<TargetCard {...base} kind='stop-loss' labels={{...labels,submit:'Set Stop Loss',cancel:'Not now'}} onSubmit={submit} onCancel={cancel} submitDisabled/>);
  expect(actions().map(button=>[button.textContent,button.dataset.intent,button.disabled])).toEqual([['Not now','secondary',false],['Set Stop Loss','destructive',true]]);
  view.rerender(<TargetCard {...base} onSubmit={submit} busy/>);expect(actions()).toHaveLength(1);expect(actions()[0].getAttribute('aria-busy')).toBe('true');
 });
 it('ships no trading words of its own: only Cancel is built in, and it follows the provider',()=>{
  render(<HIGProvider locale='fr-FR' messages={{cancel:'Annuler'}}><TargetCard {...base} labels={{...labels,title:'Prise de profit',submit:'Définir',trigger:'Si déclenché'}} onCancel={()=>{}} presets={[1.5]}/></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Prise de profit'})).toBeTruthy();expect(screen.getByRole('button',{name:'Annuler'})).toBeTruthy();
  expect(readouts()[2].slice(0,2)).toEqual(['trigger','Si déclenché']);expect(presets()[0].textContent).toMatch(/^\+1,50\s\$US$/);
  const source=readFileSync('packages/hig/react/src/blocks/target-card.tsx','utf8');expect(source.match(/messages\.\w+/g)).toEqual(['messages.cancel']);
  for(const key of ['takeProfit','stopLoss','trigger','entry','mark','custom'])expect(key in en,key).toBe(false);
 });
});
