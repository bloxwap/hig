// @vitest-environment jsdom
import React from 'react';
import {readFileSync} from 'node:fs';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Button,IconButton} from '../packages/hig/react/src/button';
import {SearchInput} from '../packages/hig/react/src/field';
import {Accordion} from '../packages/hig/react/src/navigation';
import {EmptyState} from '../packages/hig/react/src/status';
import {Filter} from '../packages/hig/react/src/selection';
import {InstallCommand} from '../packages/hig/react/src/recipes';
import {Toaster,toast,dismissToast} from '../packages/hig/react/src/toast';
import {HIGProvider} from '../packages/hig/react/src/provider';
afterEach(()=>{dismissToast();cleanup();});
const css='\n'+readFileSync('packages/hig/react/src/styles.css','utf8');
/** Every declaration block written for exactly this selector, joined. */
const rule=(selector:string)=>{const blocks=css.split(`\n${selector} {`).slice(1).map(rest=>rest.slice(0,rest.indexOf('}')));if(!blocks.length)throw new Error(`No rule for ${selector}`);return blocks.join(';');};
describe('fill and space instead of strokes',()=>{
 it('draws no resting stroke on surfaces, inputs, overlays or tables',()=>{
  for(const selector of ['.hig-surface,.hig-dialog,.hig-select-list','.hig-input','.hig-popover','.hig-table-scroll','.hig-toast-item']){const body=rule(selector);expect(body).toContain('border:1px solid transparent');expect(body).not.toMatch(/solid var\(--hig-border\)/);}
  expect(css).not.toMatch(/border-bottom:1px solid var\(--hig-border\)/);
 });
 it('steps control wells one shade lighter inside a surface or overlay',()=>{
  expect(rule(':root')).toContain('--hig-fill:var(--hig-surface); --hig-fill-raised:var(--hig-nested)');
  expect(rule('.hig-surface,.hig-dialog,.hig-gesture-sheet')).toContain('--hig-fill:var(--hig-nested); --hig-fill-raised:var(--hig-border)');
  expect(rule('.hig-input')).toContain('background:var(--hig-fill)');
  expect(rule('.hig-segments')).toContain('background:var(--hig-fill)');
  expect(rule('.hig-segment-indicator')).toContain('background:var(--hig-fill-raised)');
  expect(rule('.hig-badge')).toContain('background:var(--hig-fill)');
 });
 it('fills overlays with the darker overlay role and keeps the off switch dark',()=>{
  expect(rule('.hig-dialog')).toContain('background:var(--hig-overlay,#111)');
  expect(rule('.hig-gesture-sheet')).toContain('background:var(--hig-overlay,#111)');
  expect(rule('.hig-switch input')).toContain('background:var(--hig-border)');
 });
 it('sizes a comfortable segmented control to the 44px button height',()=>{expect(rule('.hig-segment span')).toContain('min-height:calc(var(--hig-button) - 8px)');expect(rule('.hig-segments')).toContain('padding:4px');});
});
describe('reviewed component changes',()=>{
 it('shows a leading spinner on a busy button and keeps the busy text in the name only',()=>{
  render(<><Button busy>Review order</Button><IconButton busy label='Confirm'>✓</IconButton><Button>Idle</Button></>);
  const busy=screen.getByRole('button',{name:'Review order · Working'});
  expect(busy.firstElementChild?.className).toBe('hig-button-spinner');expect(busy.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  expect(busy.querySelector('[role=status]')?.className).toContain('hig-sr-only');
  expect(screen.getByRole('button',{name:'Confirm'}).firstElementChild?.className).toBe('hig-button-spinner');
  expect(rule(".hig-icon-button[aria-busy='true'] > .hig-button-spinner ~ span[aria-hidden='true']")).toContain('display:none');
  expect(screen.getByRole('button',{name:'Idle'}).querySelector('.hig-button-spinner')).toBeNull();
 });
 it('lets the host choose the SearchInput type, defaulting to search',()=>{
  render(<><SearchInput aria-label='Default'/><SearchInput aria-label='Plain' type='text' inputMode='search'/></>);
  expect(screen.getByLabelText('Default').getAttribute('type')).toBe('search');
  // A host can keep a plain text field to avoid Safari's search-field chrome while keeping the HIG anatomy.
  const plain=screen.getByLabelText('Plain');expect(plain.getAttribute('type')).toBe('text');expect(plain.parentElement?.className).toBe('hig-search-input');
 });
 it('insets a magnifying glass on the leading edge of SearchInput and keeps the ref on the input',()=>{
  const ref=React.createRef<HTMLInputElement>();render(<SearchInput ref={ref} aria-label='Search markets' className='host'/>);
  const input=screen.getByRole('searchbox',{name:'Search markets'});expect(ref.current).toBe(input);expect(input.className).toContain('host');
  expect(input.parentElement?.className).toBe('hig-search-input');expect(input.previousElementSibling?.getAttribute('class')).toBe('hig-search-icon');
  expect(rule('.hig-search-icon')).toContain('inset-inline-start:16px');
  // Every text field takes the button height (44 touch, 36 compact); the search text starts 42px in, 6px after the glass.
  expect(rule('.hig-input')).toContain('min-height:var(--hig-button)');expect(rule('.hig-search-input')).not.toContain('--hig-control');expect(rule('.hig-search-input > .hig-input')).toContain('padding-inline-start:42px');
 });
 it('puts an outline chevron on the trailing edge of the accordion header and turns it when open',async()=>{
  const changed=vi.fn();render(<Accordion title='Advanced options' onOpenChange={changed}><p>Body</p></Accordion>);
  const summary=screen.getByText('Advanced options').closest('summary')!;expect(summary.lastElementChild?.getAttribute('class')).toBe('hig-accordion-chevron');
  expect(rule('.hig-select-chevron,.hig-select-check,.hig-accordion-chevron')).toContain('fill:none;stroke:currentColor');
  expect(rule('.hig-accordion[open] > .hig-accordion-summary .hig-accordion-chevron')).toContain('transform:rotate(180deg)');
  expect(rule('.hig-accordion[open]::details-content')).toContain('block-size:auto');
  await userEvent.click(summary);expect(changed).toHaveBeenCalledWith(true);
 });
 it('centres EmptyState under a symbol and makes the description optional',()=>{
  render(<><EmptyState title='No open positions' description='Positions appear here.' action={<button>Refresh</button>}/><EmptyState title='Nothing yet' illustration={null}/></>);
  const full=screen.getByText('No open positions').closest('section')!;
  expect([...full.children].map(node=>node.tagName)).toEqual(['SPAN','H3','P','BUTTON']);expect(full.firstElementChild?.className).toBe('hig-empty-state-icon');
  const bare=screen.getByText('Nothing yet').closest('section')!;expect([...bare.children].map(node=>node.tagName)).toEqual(['H3']);
  expect(rule('.hig-empty-state')).toContain('align-items:center;text-align:center');
 });
 it('pulses skeletons and live status dots, and stops both for reduced motion',()=>{
  expect(rule('.hig-skeleton')).toContain('animation:hig-pulse');
  expect(rule(".hig-status-indicator:is([data-state='online'],[data-state='stale'])::before")).toContain('animation:hig-status-pulse');
  expect(css).toMatch(/prefers-reduced-motion:reduce\)\s*\{[^@]*\.hig-skeleton,\.hig-status-indicator::before \{ animation:none; \}/);
  expect(rule("[data-hig-motion='reduced'] .hig-status-indicator::before")).toContain('animation:none');
 });
 it('raises a capsule through Sonner and dismisses it from its close button',async()=>{
  render(<HIGProvider><Toaster/></HIGProvider>);
  act(()=>{toast('Saved',{severity:'success'});});
  const close=await screen.findByRole('button',{name:'Dismiss Saved'});
  const capsule=close.closest('.hig-toast-item')!;expect(capsule.getAttribute('data-severity')).toBe('success');expect(capsule.closest('[data-sonner-toast]')).toBeTruthy();
  expect(capsule.querySelector('.hig-toast-message')?.textContent).toBe('Saved');
 });
 it('reports an InstallCommand copy as a toast under a mounted Toaster and inline without one',async()=>{
  const fr={copied:'Copié',dismiss:'Ignorer',dismissNotice:(message:string,dismiss:string)=>`${dismiss} : ${message}`};
  render(<HIGProvider messages={fr}><InstallCommand command='npm install @bloxwap/hig' onCopy={()=>{}}/><Toaster/></HIGProvider>);
  await userEvent.click(screen.getByRole('button',{name:'Copy install command'}));
  expect(await screen.findByRole('button',{name:'Ignorer : Copié'})).toBeTruthy();
  const status=[...document.querySelectorAll('p[role=status]')].find(node=>node.textContent==='Copié')!;expect(status.className).toBe('hig-sr-only');
  cleanup();
  render(<InstallCommand command='x' onCopy={()=>Promise.reject(new Error('denied'))}/>);
  await userEvent.click(screen.getByRole('button',{name:'Copy install command'}));
  const inline=await screen.findByText('Copy failed. Select the command and copy manually.');
  expect(inline.className).toBe('');expect(document.querySelector('[data-sonner-toast]')).toBeNull();
 });
 it('keeps Sonner out of the recipes: only the toast entry imports it',()=>{
  for(const file of ['recipes/install-command.tsx','recipes.tsx','notify.ts','status.tsx'])expect(readFileSync(`packages/hig/react/src/${file}`,'utf8')).not.toMatch(/sonner|toast\.js/);
  expect(readFileSync('packages/hig/react/src/toast.tsx','utf8')).toContain("from 'sonner'");
 });
});
describe('Filter',()=>{
 const options=[{value:'',label:'All'},{value:'1',label:'Ethereum',icon:'/eth.png'},{value:'8453',label:'Base'},{value:'10',label:'Optimism',disabled:true}];
 it('is one radio group whose capsules carry a circle with the image or a ring, and a check path',()=>{
  render(<Filter label='Chain' options={options} defaultValue=''/>);
  const group=screen.getByRole('radiogroup',{name:'Chain'});expect(group.className).toBe('hig-filter');
  expect(screen.getAllByRole('radio').map(radio=>[radio.closest('label')?.textContent,(radio as HTMLInputElement).checked])).toEqual([['All',true],['Ethereum',false],['Base',false],['Optimism',false]]);
  const mark=(name:string)=>screen.getByRole('radio',{name}).closest('label')!.querySelector('.hig-filter-mark')!;
  expect(mark('Ethereum').querySelector('img')?.getAttribute('src')).toBe('/eth.png');expect(mark('Base').querySelector('img')).toBeNull();
  for(const name of ['All','Ethereum','Base'])expect(mark(name).querySelector('svg path')?.getAttribute('pathLength')).toBe('1');
  expect(mark('All').getAttribute('aria-hidden')).toBe('true');
 });
 it('selects by pointer and arrow keys, uncontrolled and controlled, and rejects disabled options',async()=>{
  const changed=vi.fn();const view=render(<Filter label='Chain' options={options} defaultValue='' onValueChange={changed}/>);
  await userEvent.click(screen.getByRole('radio',{name:'Base'}));expect(changed).toHaveBeenLastCalledWith('8453');expect(screen.getByRole('radio',{name:'Base'})).toHaveProperty('checked',true);
  await userEvent.click(screen.getByRole('radio',{name:'Base'}));expect(changed).toHaveBeenCalledTimes(1);
  // jsdom has no CSS.escape, which user-event needs to find the radio's group for arrow keys.
  vi.stubGlobal('CSS',{escape:(value:string)=>value});
  await userEvent.keyboard('{ArrowLeft}');expect(changed).toHaveBeenLastCalledWith('1');vi.unstubAllGlobals();
  expect(screen.getByRole('radio',{name:'Optimism'})).toHaveProperty('disabled',true);
  view.unmount();
  render(<Filter label='Chain' options={options} value='1' onValueChange={changed}/>);
  await userEvent.click(screen.getByRole('radio',{name:'All'}));expect(changed).toHaveBeenLastCalledWith('');expect(screen.getByRole('radio',{name:'Ethereum'})).toHaveProperty('checked',true);
  cleanup();render(<Filter label='Chain' options={options} defaultValue='' disabled/>);
  expect(screen.getAllByRole('radio').every(radio=>(radio as HTMLInputElement).disabled)).toBe(true);expect(screen.getByRole('radiogroup').getAttribute('aria-disabled')).toBe('true');
 });
 it('inverts the chosen capsule, draws the check in, and stops the motion when reduced',()=>{
  expect(rule('.hig-filter')).toContain('overflow-x:auto');
  expect(rule('.hig-filter-chip:has(input:checked)')).toContain('background:var(--hig-text);color:var(--hig-background)');
  // Hidden as well as undrawn: a round-capped stroke at full offset would still paint a dot in the empty ring.
  expect(rule('.hig-filter-mark path')).toContain('stroke-dasharray:1;stroke-dashoffset:1;opacity:0;transition:stroke-dashoffset');
  expect(rule('.hig-filter-chip:has(input:checked) .hig-filter-mark path')).toContain('stroke-dashoffset:0;opacity:1');
  expect(rule('.hig-filter-chip:has(input:checked) .hig-filter-mark')).toContain('background:currentColor');
  expect(css).toMatch(/prefers-reduced-motion:reduce\)\s*\{[^@]*\.hig-filter-chip,\.hig-filter-mark,\.hig-filter-mark > img,\.hig-filter-mark path \{ transition:none; \}/);
  expect(rule("[data-hig-motion='reduced'] :is(.hig-filter-chip,.hig-filter-mark,.hig-filter-mark > img,.hig-filter-mark path)")).toContain('transition:none');
 });
 it('presents floating lists with a fade and keeps the switch sliding under reduced motion',()=>{
  expect(rule('.hig-select-list,.hig-popover')).toContain('animation:hig-present');
  expect(rule('.hig-switch input')).toContain('transition:background-color .15s ease');
  expect(css).not.toMatch(/\.hig-switch input::before[^{]*\{ transition:none/);
  expect(rule("[data-hig-motion='reduced'] .hig-select-list,[data-hig-motion='reduced'].hig-popover")).toContain('animation:none');
 });
});
