// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {PresetPickerBlock} from '../packages/hig/react/src/blocks/preset-picker-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const steps=[25,50,100,250,500,1000];
const sizeOptions=(max:number|null)=>[{value:'max' as const,label:'Max',disabled:max==null||max<=0,testID:'size-max'},...steps.map(step=>({value:step,label:`$${step.toLocaleString('en-US')}`,disabled:max==null||step>max,testID:`size-${step}`}))];
const usd0={style:'currency',currency:'USD',maximumFractionDigits:0} as const;
describe('PresetPickerBlock',()=>{
 it('draws the Size pane: the figure, Custom amount, the chips with Max, then Cancel beside Set Size',async()=>{
  const preset=vi.fn(),custom=vi.fn(),submit=vi.fn(),cancel=vi.fn();
  render(<PresetPickerBlock<'max'|number> value={100} valueOptions={usd0} presets={sizeOptions(300)} selected={100} onPresetChange={preset} presetsLabel='Size' columns={3}
   custom={{label:'Custom amount',onSelect:custom,accessibilityLabel:'Edit custom size, current $100',testID:'size-custom'}}
   onSubmit={submit} submitLabel='Set Size' onCancel={cancel} submitTestID='size-confirm' cancelTestID='size-cancel' data-testid='size-pane'/>);
  // No title: no header, the pane starts at the figure.
  expect(screen.queryByRole('heading')).toBeNull();expect(screen.getByTestId('size-pane').className).toBe('hig-preset-picker');
  expect(document.querySelector('.hig-target-amount .hig-animated-number-visual')!.textContent).toBe('$100');
  const row=screen.getByTestId('size-custom');expect(row.getAttribute('aria-label')).toBe('Edit custom size, current $100');expect(row.getAttribute('aria-pressed')).toBe('false');expect(row.textContent).toBe('Custom amount');
  await userEvent.click(row);expect(custom).toHaveBeenCalledOnce();
  const group=screen.getByRole('group',{name:'Size'});expect(group.style.getPropertyValue('--hig-preset-columns')).toBe('3');
  expect(screen.getByTestId('size-100').getAttribute('aria-pressed')).toBe('true');expect((screen.getByTestId('size-500') as HTMLButtonElement).disabled).toBe(true);
  await userEvent.click(screen.getByTestId('size-max'));expect(preset).toHaveBeenCalledExactlyOnceWith('max');
  const actions=[...document.querySelectorAll<HTMLButtonElement>('.hig-target-actions > button')];expect(actions.map(button=>button.textContent)).toEqual(['Cancel','Set Size']);
  expect(actions[1].dataset.intent).toBe('primary');
  await userEvent.click(screen.getByTestId('size-cancel'));await userEvent.click(screen.getByTestId('size-confirm'));expect(cancel).toHaveBeenCalledOnce();expect(submit).toHaveBeenCalledOnce();
 });
 it('shows a custom value on the Custom row, selected, and no chip; draws the Leverage pane with a suffix and no custom row',()=>{
  const {rerender}=render(<PresetPickerBlock<'max'|number> value={75} valueOptions={usd0} presets={sizeOptions(300)} selected={null} onPresetChange={()=>{}} custom={{label:'Custom amount',value:'$75',onSelect:()=>{}}} onSubmit={()=>{}} submitLabel='Set Size'/>);
  const row=document.querySelector('.hig-swap-setting')!;expect(row.getAttribute('aria-pressed')).toBe('true');expect(row.querySelector('.hig-swap-setting-value')!.textContent).toBe('$75');
  expect(document.querySelectorAll('.hig-preset-group [aria-pressed="true"]')).toHaveLength(0);
  rerender(<PresetPickerBlock value={40} valueSuffix='×' valueLabel='Leverage' presets={[1,5,10,20,40].map(step=>({value:step,label:`${step}×`}))} selected={40} onPresetChange={()=>{}} presetsLabel='Leverage' onSubmit={()=>{}} submitLabel='Set Leverage' onCancel={()=>{}}/>);
  expect(document.querySelector('.hig-swap-setting')).toBeNull();
  expect(document.querySelector('.hig-target-amount .hig-animated-number-visual')!.textContent).toBe('40×');
  expect(screen.getByRole('button',{name:'40×'}).getAttribute('aria-pressed')).toBe('true');
 });
 it('draws a header with title, Back and backProps, a destructive intent, children, busy and translated Cancel',async()=>{
  const back=vi.fn();
  render(<HIGProvider messages={{cancel:'Annuler'}}><PresetPickerBlock title='Leverage' headingId='lev-heading' onBack={back} backProps={{'data-testid':'lev-back'} as React.ButtonHTMLAttributes<HTMLButtonElement>} intent='destructive' value={5} presets={[{value:5,label:'5×'}]} selected={5} onPresetChange={()=>{}} onSubmit={()=>{}} submitLabel='Set' busy onCancel={()=>{}}><p className='note'>Funds convert first.</p></PresetPickerBlock></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Leverage'}).id).toBe('lev-heading');await userEvent.click(screen.getByTestId('lev-back'));expect(back).toHaveBeenCalledOnce();
  expect(document.querySelector('.hig-preset-picker')!.getAttribute('data-intent')).toBe('destructive');
  expect(screen.getByRole('button',{name:'5×'}).dataset.intent).toBe('destructive');
  // Children sit between the chips and the actions.
  const note=document.querySelector('.note')!;expect(note.previousElementSibling!.className).toContain('hig-preset-group');expect(note.nextElementSibling!.className).toBe('hig-target-actions');
  const actions=[...document.querySelectorAll<HTMLButtonElement>('.hig-target-actions > button')];expect(actions[0].textContent).toBe('Annuler');expect(actions[1].getAttribute('aria-busy')).toBe('true');
 });
 it('draws the host formattedValue as the headline figure in place of formatting value',()=>{
  render(<HIGProvider><PresetPickerBlock<number|'max'> value={1250.5} valueOptions={usd0} formattedValue='$1,250.50' valueLabel='Size' presets={sizeOptions(300)} selected={null} onPresetChange={()=>{}} onSubmit={()=>{}} submitLabel='Set Size'/></HIGProvider>);
  const figure=document.querySelector('.hig-target-amount')!;expect(figure.textContent).toContain('$1,250.50');expect(figure.textContent).not.toContain('$1,251');
 });
 it('is exported from the blocks aggregate',()=>{expect(blocks.PresetPickerBlock).toBe(PresetPickerBlock);});
});

it('skips unchanged header props on selection and applies a replacement Back handler',async()=>{
 const readTitle=vi.fn(()=>'Previous screen');
 const props={title:'Size',onBack:vi.fn(),backProps:{get title(){return readTitle();}},presets:sizeOptions(300),onPresetChange:vi.fn(),onSubmit:vi.fn(),submitLabel:'Set'};
 const {rerender}=render(<PresetPickerBlock {...props} selected={100} value={100}/>);
 expect(readTitle).toHaveBeenCalled();
 readTitle.mockClear();
 rerender(<PresetPickerBlock {...props} selected={50} value={50}/>);
 expect(readTitle).not.toHaveBeenCalled();
 const back=vi.fn();
 rerender(<PresetPickerBlock {...props} onBack={back} selected={50} value={50}/>);
 await userEvent.click(screen.getByTitle('Previous screen'));
 expect(back).toHaveBeenCalledOnce();
});
