// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {TargetBlock,targetFormat,targetLayout,type TargetBlockProps} from '../packages/hig/react/src/blocks/target-block';
import * as blocks from '../packages/hig/react/src/blocks';
import * as en from '../packages/hig/contracts/src/messages';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const labels={title:'Take Profit',submit:'Set Take Profit',entry:'Entry',trigger:'If triggered',unit:'Target in',units:{dollar:'Dollar',price:'Price',percent:'Percent'},custom:'Custom'};
const base:TargetBlockProps={kind:'take-profit',labels,entry:64700,trigger:65000,unit:'dollar',value:2,onSubmit:()=>{}};
const readouts=()=>[...document.querySelectorAll('.hig-target-prices dl > div')].map(item=>[item.getAttribute('data-price'),spoken(item.querySelector('dt')!),spoken(item.querySelector('dd')!)]);
const grow=()=>[...document.querySelectorAll<HTMLElement>('.hig-target-bar > span')].map(part=>[part.className.replace('hig-target-',''),part.style.flexGrow?Number(Number(part.style.flexGrow).toFixed(4)):part.style.insetInlineStart]);
const presets=()=>[...document.querySelectorAll<HTMLButtonElement>('.hig-target-presets > button')];
describe('targetLayout',()=>{
 it('places entry and the trigger on one axis in price order, with the stretch spanning the whole bar between them',()=>{
  expect(targetLayout({entry:100,trigger:140})).toEqual({positions:{entry:0,trigger:1},order:['entry','trigger'],from:0,to:1});
  // A stop under entry: the trigger is the low end.
  expect(targetLayout({entry:100,trigger:80})).toEqual({positions:{entry:1,trigger:0},order:['trigger','entry'],from:0,to:1});
 });
 it('has no stretch without a trigger, and keeps equal prices in entry, trigger order',()=>{
  expect(targetLayout({entry:100,trigger:null})).toEqual({positions:{entry:0.5},order:['entry'],from:0.5,to:0.5});
  expect(targetLayout({entry:100,trigger:100})).toEqual({positions:{entry:0.5,trigger:0.5},order:['entry','trigger'],from:0.5,to:0.5});
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
 it('shortens a whole price preset whatever fraction digits the host fixes, as native does',()=>{
  const text=(value:number,options:Intl.NumberFormatOptions)=>new Intl.NumberFormat('en-US',options).format(value);
  const fixed={style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2} as const;
  expect(text(63000,targetFormat('price',fixed,63000))).toBe('$63,000');expect(text(63000,targetFormat('price',undefined,63000))).toBe('$63,000');
  expect(text(62500.5,targetFormat('price',fixed,62500.5))).toBe('$62,500.50');expect(text(63000,targetFormat('price',fixed))).toBe('$63,000.00');
 });
});
describe('TargetBlock',()=>{
 it('shows the heading, the target as the headline figure, and the position and order type on the price card',async()=>{
  const back=vi.fn();render(<TargetBlock {...base} position='BTC · Long 40×' orderType='Take-limit' note='Fills at your target price or better.' onBack={back}/>);
  expect(screen.getByRole('heading',{name:'Take Profit'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  expect(spoken(document.querySelector('.hig-target-amount')!)).toBe('+$2.00');
  const card=screen.getByRole('region',{name:'BTC · Long 40×'});expect(card.classList.contains('hig-surface')).toBe(false);
  expect(card.querySelector('.hig-bar-mark-description')!.textContent).toBe('Take-limit');expect(document.querySelector('.hig-target-note')!.textContent).toBe('Fills at your target price or better.');
  expect(blocks.TargetBlock).toBe(TargetBlock);expect(blocks.targetLayout).toBe(targetLayout);
 });
 it('draws two prices, entry and the trigger, in price order with the whole bar filled between them',()=>{
  const view=render(<TargetBlock {...base}/>);
  expect(document.querySelector('.hig-target-block')!.getAttribute('data-kind')).toBe('take-profit');
  expect(readouts()).toEqual([['entry','Entry','$64,700.00'],['trigger','If triggered','$65,000.00']]);
  expect(grow()).toEqual([['rest',0],['move',1],['rest',0]]);expect(document.querySelector('.hig-target-move')!.getAttribute('data-lead')).toBe('start');expect(document.querySelector('.hig-target-entry')).toBeNull();
  expect(document.querySelector('.hig-target-bar')!.getAttribute('aria-hidden')).toBe('true');
  // A stop loss under entry leads with the trigger and reads in the negative role.
  view.rerender(<TargetBlock {...base} kind='stop-loss' trigger={64600} value={-0.5}/>);
  expect(document.querySelector('.hig-target-block')!.getAttribute('data-kind')).toBe('stop-loss');expect(spoken(document.querySelector('.hig-target-amount')!)).toBe('-$0.50');
  expect(readouts().map(row=>row[0])).toEqual(['trigger','entry']);expect(document.querySelector('.hig-target-move')!.getAttribute('data-lead')).toBe('trigger');
  // Without a trigger there is no stretch and only entry reads; the mark price is not part of this block.
  view.rerender(<TargetBlock {...base} trigger={undefined}/>);expect(document.querySelector('.hig-target-move')).toBeNull();expect(readouts().map(row=>row[0])).toEqual(['entry']);
  const props:string[]=Object.keys(base);expect(props).not.toContain('mark');expect(document.querySelector('[data-price="mark"]')).toBeNull();
 });
 it('reads the target in the current unit and takes it as the trigger in the price unit',()=>{
  const view=render(<TargetBlock {...base} unit='percent' value={0.05}/>);expect(spoken(document.querySelector('.hig-target-amount')!)).toBe('+5%');
  view.rerender(<TargetBlock {...base} unit='price' value={65250} trigger={undefined}/>);
  expect(spoken(document.querySelector('.hig-target-amount')!)).toBe('$65,250.00');expect(readouts()[1]).toEqual(['trigger','If triggered','$65,250.00']);
  view.rerender(<TargetBlock {...base} value={null}/>);expect(spoken(document.querySelector('.hig-target-amount')!)).toBe('—');expect((screen.getByRole('button',{name:'Set Take Profit'}) as HTMLButtonElement).disabled).toBe(true);
 });
 it('offers the units as one control, hidden with a single unit, and reports the choice',async()=>{
  const change=vi.fn();const view=render(<TargetBlock {...base} onUnitChange={change}/>);
  expect(screen.getAllByRole('radio').map(radio=>[(radio as HTMLInputElement).value,(radio as HTMLInputElement).checked])).toEqual([['dollar',true],['price',false],['percent',false]]);
  expect(screen.getByRole('group',{name:'Target in'})).toBeTruthy();
  await userEvent.click(screen.getByRole('radio',{name:'Percent'}));expect(change).toHaveBeenCalledWith('percent');
  view.rerender(<TargetBlock {...base} units={['price','dollar']}/>);expect(screen.getAllByRole('radio').map(radio=>(radio as HTMLInputElement).value)).toEqual(['price','dollar']);
  view.rerender(<TargetBlock {...base} units={['dollar']}/>);expect(screen.queryByRole('radio')).toBeNull();
 });
 it('draws the quick choices in the unit format, marks the one equal to the target, and reports presses and the custom row',async()=>{
  const change=vi.fn(),custom=vi.fn();const view=render(<TargetBlock {...base} presets={[1,2,5,10]} onValueChange={change} onCustom={custom}/>);
  expect(presets().map(button=>[button.textContent,button.getAttribute('aria-pressed'),button.dataset.intent])).toEqual([['+$1','false','secondary'],['+$2','true','primary'],['+$5','false','secondary'],['+$10','false','secondary']]);
  await userEvent.click(presets()[2]);expect(change).toHaveBeenCalledWith(5);
  await userEvent.click(screen.getByRole('button',{name:'Custom'}));expect(custom).toHaveBeenCalledTimes(1);
  view.rerender(<TargetBlock {...base} kind='stop-loss' value={-0.5} presets={[-0.5,-1,-2,-5]}/>);
  expect(presets().map(button=>[button.textContent,button.dataset.intent])).toEqual([['-$0.50','destructive'],['-$1','secondary'],['-$2','secondary'],['-$5','secondary']]);
  expect(screen.queryByRole('button',{name:'Custom'})).toBeNull();
  view.rerender(<TargetBlock {...base} unit='percent' value={0.1} presets={[0.05,0.1,0.25]}/>);expect(presets().map(button=>button.textContent)).toEqual(['+5%','+10%','+25%']);
  view.rerender(<TargetBlock {...base}/>);expect(document.querySelector('.hig-target-presets')).toBeNull();
 });
 it('names the quick choices\' group by the title, or by the host\'s own name for it',()=>{
  const view=render(<TargetBlock {...base} presets={[1,2]}/>);
  expect(document.querySelector('.hig-target-presets')).toBe(screen.getByRole('group',{name:'Take Profit'}));
  view.rerender(<TargetBlock {...base} labels={{...labels,presets:'Quick targets'}} presets={[1,2]}/>);
  expect(document.querySelector('.hig-target-presets')).toBe(screen.getByRole('group',{name:'Quick targets'}));
 });
 it('confirms in the role of its kind, with Cancel beside it only when the host handles it',async()=>{
  const submit=vi.fn(),cancel=vi.fn();const view=render(<TargetBlock {...base} onSubmit={submit} onCancel={cancel}/>);
  const actions=()=>[...document.querySelectorAll<HTMLButtonElement>('.hig-target-actions > button')];
  expect(actions().map(button=>[button.textContent,button.dataset.intent])).toEqual([['Cancel','secondary'],['Set Take Profit','primary']]);
  for(const button of actions())await userEvent.click(button);expect(cancel).toHaveBeenCalledTimes(1);expect(submit).toHaveBeenCalledTimes(1);
  view.rerender(<TargetBlock {...base} kind='stop-loss' labels={{...labels,submit:'Set Stop Loss',cancel:'Not now'}} onSubmit={submit} onCancel={cancel} submitDisabled/>);
  expect(actions().map(button=>[button.textContent,button.dataset.intent,button.disabled])).toEqual([['Not now','secondary',false],['Set Stop Loss','destructive',true]]);
  view.rerender(<TargetBlock {...base} onSubmit={submit} busy/>);expect(actions()).toHaveLength(1);expect(actions()[0].getAttribute('aria-busy')).toBe('true');
 });
 it('ships no trading words of its own: only Cancel is built in, and it follows the provider',()=>{
  render(<HIGProvider locale='fr-FR' messages={{cancel:'Annuler'}}><TargetBlock {...base} labels={{...labels,title:'Prise de profit',submit:'Définir',trigger:'Si déclenché'}} onCancel={()=>{}} presets={[1.5]}/></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Prise de profit'})).toBeTruthy();expect(screen.getByRole('button',{name:'Annuler'})).toBeTruthy();
  expect(readouts()[1].slice(0,2)).toEqual(['trigger','Si déclenché']);expect(presets()[0].textContent).toMatch(/^\+1,50\s\$US$/);
  const source=readFileSync('packages/hig/react/src/blocks/target-block.tsx','utf8');expect(source.match(/messages\.\w+/g)).toEqual(['messages.cancel']);
  for(const key of ['takeProfit','stopLoss','trigger','entry','custom'])expect(key in en,key).toBe(false);
 });
});

describe('TargetBlock note',()=>{
 it('opens the note in a popover from an info button on the trailing edge of the header when the host names it',async()=>{
  const view=render(<TargetBlock {...base} labels={{...labels,info:'How this order fills'}} note='Fills at your target price or better.'/>);
  const button=screen.getByRole('button',{name:'How this order fills'});
  expect(button.closest('.hig-screen-header-side')).toBe(document.querySelectorAll('.hig-screen-header-side')[1]);expect(button.querySelector('svg')).toBeTruthy();
  expect(button.getAttribute('aria-expanded')).toBe('false');expect(document.querySelector('.hig-target-popover')).toBeNull();
  await userEvent.click(button);
  const note=document.querySelector('.hig-target-popover')!;expect(note.textContent).toBe('Fills at your target price or better.');expect(note.classList.contains('hig-popover')).toBe(true);expect(note.parentElement).toBe(button.parentElement);expect(document.querySelector('.hig-target-note')).toBeNull();
  expect(button.getAttribute('aria-expanded')).toBe('true');expect(button.getAttribute('aria-controls')).toBe(note.id);
  await userEvent.click(button);expect(document.querySelector('.hig-target-popover')).toBeNull();
  // Escape, a press outside, and focus leaving all close it.
  await userEvent.click(button);await userEvent.keyboard('{Escape}');expect(document.querySelector('.hig-target-popover')).toBeNull();expect(button.getAttribute('aria-expanded')).toBe('false');
  await userEvent.click(button);expect(document.querySelector('.hig-target-popover')).toBeTruthy();await userEvent.click(document.querySelector('.hig-target-amount')!);expect(document.querySelector('.hig-target-popover')).toBeNull();
  await userEvent.click(button);await userEvent.tab();expect(document.querySelector('.hig-target-popover')).toBeNull();
  // No note, no button; no name for the button, or a host header control, and the note is always shown.
  view.rerender(<TargetBlock {...base} labels={{...labels,info:'How this order fills'}}/>);expect(screen.queryByRole('button',{name:'How this order fills'})).toBeNull();
  view.rerender(<TargetBlock {...base} note='Always shown.'/>);expect(document.querySelector('.hig-target-note')!.textContent).toBe('Always shown.');
  view.rerender(<TargetBlock {...base} labels={{...labels,info:'How this order fills'}} note='Always shown.' headerAction={<button type='button'>Share</button>}/>);
  expect(screen.queryByRole('button',{name:'How this order fills'})).toBeNull();expect(screen.getByRole('button',{name:'Share'})).toBeTruthy();expect(document.querySelector('.hig-target-note')!.textContent).toBe('Always shown.');
 });
});
describe('TargetBlock price card surface',()=>{
 it('draws the prices without a card by default and inside one with surface, keeping the title row, bar and prices',()=>{
  const view=render(<TargetBlock {...base} position='BTC Long 10×'/>);const card=()=>document.querySelector<HTMLElement>('.hig-target-prices')!;
  expect(card().className).toBe('hig-target-prices');expect(card().dataset.surface).toBe('false');
  expect(card().querySelector('.hig-target-bar')).toBeTruthy();expect(readouts().map(([price])=>price)).toEqual(['entry','trigger']);
  view.rerender(<TargetBlock {...base} position='BTC Long 10×' surface/>);
  expect(card().classList.contains('hig-surface')).toBe(true);expect(card().dataset.surface).toBeUndefined();
  expect(card().querySelector('.hig-target-bar')).toBeTruthy();expect(readouts().map(([price])=>price)).toEqual(['entry','trigger']);
 });
 it('sizes the headline figure like the SwapPanel amount, in the interface face',()=>{
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');const rule=(selector:string)=>css.split('\n').find(line=>line.startsWith(selector+' {'))??'';
  const size=(line:string)=>line.match(/font-size:[^;]+;line-height:[^;]+;font-weight:[^;]+;letter-spacing:[^;]+/)?.[0];
  expect(size(rule('.hig-target-amount'))).toBe(size(rule('.hig-swap-amount')));expect(size(rule('.hig-target-amount'))).toBeTruthy();
  expect(css.split('\n').find(line=>line.endsWith(' { font-family:inherit; }'))?.split(' {')[0].split(',')).toContain('.hig-target-amount .hig-number');
 });
});
describe('TargetBlock host slots',()=>{
 it('dims a preset or a unit the host cannot offer now, and leaves the rest working',async()=>{
  const change=vi.fn(),unit=vi.fn();
  render(<TargetBlock {...base} value={2} presets={[1,{value:2},{value:5,disabled:true}]} units={['dollar',{unit:'price',disabled:true},{unit:'percent'}]} onValueChange={change} onUnitChange={unit}/>);
  expect(presets().map(button=>[button.textContent,button.disabled,button.getAttribute('aria-pressed')])).toEqual([['+$1',false,'false'],['+$2',false,'true'],['+$5',true,'false']]);
  await userEvent.click(presets()[2]);expect(change).not.toHaveBeenCalled();await userEvent.click(presets()[0]);expect(change).toHaveBeenCalledWith(1);
  const radios=screen.getAllByRole('radio') as HTMLInputElement[];expect(radios.map(radio=>[radio.value,radio.disabled])).toEqual([['dollar',false],['price',true],['percent',false]]);
  await userEvent.click(radios[1]);expect(unit).not.toHaveBeenCalled();await userEvent.click(radios[2]);expect(unit).toHaveBeenCalledWith('percent');
 });
 it('shows the custom value on the Custom row, which then reads as selected in place of any preset',async()=>{
  const custom=vi.fn();const view=render(<TargetBlock {...base} value={2} presets={[1,2]} onCustom={custom}/>);
  const row=()=>screen.getByRole('button',{name:/^Custom/});
  expect(row().getAttribute('aria-pressed')).toBeNull();expect(row().querySelector('.hig-swap-setting-value')).toBeNull();expect(presets()[1].getAttribute('aria-pressed')).toBe('true');
  view.rerender(<TargetBlock {...base} value={2} presets={[1,2]} onCustom={custom} customValue={2}/>);
  expect(row().getAttribute('aria-pressed')).toBe('true');expect(row().querySelector('.hig-swap-setting-value')!.textContent).toBe('+$2.00');expect(screen.getByRole('button',{name:'Custom +$2.00'})).toBe(row());
  expect(presets().map(button=>button.getAttribute('aria-pressed'))).toEqual(['false','false']);
  await userEvent.click(row());expect(custom).toHaveBeenCalledTimes(1);
  view.rerender(<TargetBlock {...base} unit='percent' value={0.035} onCustom={custom} customValue={0.035}/>);expect(row().querySelector('.hig-swap-setting-value')!.textContent).toBe('+3.5%');
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).toContain("{ background:var(--hig-target-fill,var(--hig-action));color:var(--hig-target-on-fill,var(--hig-onAction)); }");expect(css).toContain("--hig-target-fill:var(--hig-negative);--hig-target-on-fill:var(--hig-background);");expect(css).not.toContain('box-shadow:inset 0 0 0 2px var(--hig-target-tone)');
 });
 it('formats dollar presets, the custom value and the headline with the provider money presentation',()=>{
  render(<HIGProvider locale='fr-FR' numberFormat={{currencyDisplay:'narrowSymbol'}}><TargetBlock {...base} value={2} presets={[1,2]} onCustom={()=>{}} customValue={2.5}/></HIGProvider>);
  expect(presets().map(button=>button.textContent)).toEqual([expect.stringMatching(/^\+1\s\$$/),expect.stringMatching(/^\+2\s\$$/)]);
  expect(document.querySelector('.hig-swap-setting-value')!.textContent).toMatch(/^\+2,50\s\$$/);expect(spoken(document.querySelector('.hig-target-amount')!)).toMatch(/^\+2,00\s\$$/);
 });
 it('keeps the info button beside a host header control with headerActionBesideInfo',async()=>{
  const view=render(<TargetBlock {...base} labels={{...labels,info:'How this order fills'}} note='Fills at your price or better.' headerAction={<button type='button'>Receive</button>}/>);
  expect(screen.queryByRole('button',{name:'How this order fills'})).toBeNull();expect(document.querySelector('.hig-target-note')).not.toBeNull();
  view.rerender(<TargetBlock {...base} labels={{...labels,info:'How this order fills'}} note='Fills at your price or better.' headerAction={<button type='button'>Receive</button>} headerActionBesideInfo headingId='target-title'/>);
  const pair=document.querySelector('.hig-screen-header-side:last-child > .hig-target-header-actions')!;
  expect([...pair.querySelectorAll('button')].map(button=>button.getAttribute('aria-label')??button.textContent)).toEqual(['How this order fills','Receive']);
  expect(document.querySelector('.hig-target-note')).toBeNull();await userEvent.click(screen.getByRole('button',{name:'How this order fills'}));expect(screen.getByRole('status').textContent).toBe('Fills at your price or better.');
  expect(screen.getByRole('heading',{name:'Take Profit'}).id).toBe('target-title');
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).toContain('.hig-target-block > .hig-screen-header:has(.hig-target-header-actions) { grid-template-columns:92px minmax(0,1fr) 92px; }');
 });
});
