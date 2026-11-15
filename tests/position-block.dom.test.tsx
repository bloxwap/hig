// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
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
});
