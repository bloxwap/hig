// @vitest-environment jsdom
import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {renderToString} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {PresetGroup} from '../packages/hig/react/src/selection';
import * as selection from '../packages/hig/react/src/selection';
afterEach(cleanup);
const sizes=[{value:10,label:'$10',testID:'size-10'},{value:25,label:'$25',testID:'size-25'},{value:50,label:'$50'},{value:100,label:'$100'},{value:1000,label:'$1,000',disabled:true},{value:-1,label:'Max',testID:'size-max'}];
const chips=()=>screen.getAllByRole('button') as HTMLButtonElement[];
const css=readFileSync('packages/hig/react/src/styles.css','utf8');

it('is exported from the selection entry',()=>{expect(selection.PresetGroup).toBe(PresetGroup);});

it('draws a named group of toggle buttons in an equal-width grid, the selected one pressed in the selected intent',()=>{
 render(<PresetGroup label='Size' options={sizes} value={25} columns={3} testID='size'/>);
 const group=screen.getByRole('group',{name:'Size'});expect(group.classList.contains('hig-preset-group')).toBe(true);expect(group.dataset.testid).toBe('size');
 expect(group.style.getPropertyValue('--hig-preset-columns')).toBe('3');
 expect(chips().map(chip=>[chip.textContent,chip.getAttribute('aria-pressed'),chip.dataset.intent,chip.disabled])).toEqual([['$10','false','secondary',false],['$25','true','primary',false],['$50','false','secondary',false],['$100','false','secondary',false],['$1,000','false','secondary',true],['Max','false','secondary',false]]);
 // Per-option test IDs; an option without one has none.
 expect(chips().map(chip=>chip.dataset.testid??null)).toEqual(['size-10','size-25',null,null,null,'size-max']);
 expect(chips().every(chip=>chip.dataset.full==='true'&&chip.type==='button')).toBe(true);
});

it('defaults to one row, and a nonsense column count to at least one',()=>{
 const view=render(<PresetGroup options={sizes.slice(0,4)} value={null}/>);
 expect(document.querySelector<HTMLElement>('.hig-preset-group')!.style.getPropertyValue('--hig-preset-columns')).toBe('4');
 expect(chips().map(chip=>chip.getAttribute('aria-pressed'))).toEqual(['false','false','false','false']);
 view.rerender(<PresetGroup options={sizes.slice(0,4)} columns={0}/>);expect(document.querySelector<HTMLElement>('.hig-preset-group')!.style.getPropertyValue('--hig-preset-columns')).toBe('1');
});

it('reports a new choice once, and ignores the selected chip, a dimmed chip and a disabled group',async()=>{
 const change=vi.fn();const view=render(<PresetGroup label='Size' options={sizes} value={25} onValueChange={change}/>);
 await userEvent.click(screen.getByRole('button',{name:'$50'}));expect(change).toHaveBeenCalledExactlyOnceWith(50);
 // Controlled: the host has not accepted 50 yet.
 expect(screen.getByRole('button',{name:'$25'}).getAttribute('aria-pressed')).toBe('true');
 await userEvent.click(screen.getByRole('button',{name:'$25'}));await userEvent.click(screen.getByRole('button',{name:'$1,000'}));expect(change).toHaveBeenCalledTimes(1);
 view.rerender(<PresetGroup label='Size' options={sizes} value={25} onValueChange={change} disabled/>);
 expect(screen.getByRole('group').getAttribute('aria-disabled')).toBe('true');expect(chips().every(chip=>chip.disabled)).toBe(true);
});

it('keeps its own selection when uncontrolled',async()=>{
 const change=vi.fn();render(<PresetGroup label='Leverage' options={[{value:'1',label:'1x'},{value:'5',label:'5x'},{value:'40',label:'40x'}]} defaultValue='5' onValueChange={change}/>);
 await userEvent.click(screen.getByRole('button',{name:'40x'}));expect(change).toHaveBeenCalledWith('40');
 expect(chips().map(chip=>chip.getAttribute('aria-pressed'))).toEqual(['false','false','true']);
});

it('plays the provider selection feedback once a new choice lands, and none with suppressFeedback',async()=>{
 const emit=vi.fn();
 function Host({suppress}:{suppress?:boolean}){const [value,setValue]=React.useState<number|null>(10);return <PresetGroup options={sizes} value={value} onValueChange={setValue} suppressFeedback={suppress}/>;}
 const view=render(<HIGProvider feedback={{emit}}><Host/></HIGProvider>);
 await userEvent.click(screen.getByRole('button',{name:'$50'}));
 expect(emit).toHaveBeenCalledTimes(1);expect(emit.mock.calls[0][0]).toMatchObject({intent:'selection'});
 view.unmount();emit.mockClear();
 render(<HIGProvider feedback={{emit}}><Host suppress/></HIGProvider>);
 await userEvent.click(screen.getByRole('button',{name:'$50'}));expect(screen.getByRole('button',{name:'$50'}).getAttribute('aria-pressed')).toBe('true');expect(emit).not.toHaveBeenCalled();
});

it('renders its selection in server HTML',()=>{
 const html=renderToString(<PresetGroup label='Size' options={sizes} value={100} columns={3}/>);
 expect(html).toContain('--hig-preset-columns:3');expect(html).toContain('aria-pressed="true"');expect(html).toContain('role="group"');
});

it('lays the chips out as a grid of 44px targets in the interface face',()=>{
 expect(css).toMatch(/\.hig-preset-group \{ display:grid;grid-template-columns:repeat\(var\(--hig-preset-columns,1\),minmax\(0,1fr\)\);gap:8px;width:100%;min-width:0; \}/);
 expect(css).toMatch(/\.hig-preset-group > \.hig-button \{ min-height:44px;padding-inline:8px; \}/);
 // The chip is a HIG Button, whose label is the sans interface face, not the mono face.
 expect(css).toMatch(/\.hig-button \{[^}]*font:600 1rem\/1\.5 var\(--hig-font-sans/);
});

it('rereads only changed chips and uses the latest selection callback',async()=>{
 const reads=new Set<number>();
 const options=Array.from({length:40},(_,value)=>({value,get label(){reads.add(value);return String(value);}}));
 const first=vi.fn(),next=vi.fn();
 const view=render(<PresetGroup options={options} value={0} onValueChange={first}/>);
 reads.clear();
 view.rerender(<PresetGroup options={options} value={1} onValueChange={next}/>);
 expect([...reads]).toEqual([0,1]);
 await userEvent.click(screen.getByRole('button',{name:'39'}));
 expect(next).toHaveBeenCalledWith(39);
 expect(first).not.toHaveBeenCalled();
});

it('validates replacement choices even when the selection is unchanged',()=>{
 const view=render(<PresetGroup options={sizes} value={10}/>);
 expect(()=>view.rerender(<PresetGroup options={[sizes[0],sizes[0]]} value={10}/>)).toThrow('Choices requires unique keys');
});
