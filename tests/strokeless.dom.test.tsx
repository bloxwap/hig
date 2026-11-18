// @vitest-environment jsdom
import React from 'react';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Button,IconButton} from '../packages/hig/react/src/button';
import {SearchInput} from '../packages/hig/react/src/field';
import {Accordion} from '../packages/hig/react/src/navigation';
import {EmptyState} from '../packages/hig/react/src/status';
import {Filter} from '../packages/hig/react/src/selection';
import * as asyncResult from '../packages/hig/react/src/async-result';
import {InstallCommand} from '../packages/hig/react/src/blocks';
import {Toaster,toast,dismissToast} from '../packages/hig/react/src/toast';
import {HIGProvider} from '../packages/hig/react/src/provider';
afterEach(()=>{dismissToast();cleanup();});
const css='\n'+readFileSync('packages/hig/react/src/styles.css','utf8');
/** Every declaration block written for exactly this selector, joined. */
const rule=(selector:string)=>{const blocks=css.split(`\n${selector} {`).slice(1).map(rest=>rest.slice(0,rest.indexOf('}')));if(!blocks.length)throw new Error(`No rule for ${selector}`);return blocks.join(';');};
/** Whether `prop: none` stops `selector` in a reduced-motion media rule and, prefixed with `[data-hig-motion='reduced']`, in a provider rule. */
const stopped=(selector:string,prop:'transition'|'animation')=>{const found={media:false,provider:false};postcss.parse(css).walkDecls(prop,decl=>{if(decl.value!=='none')return;const parent=decl.parent as postcss.Rule;const media=parent.parent?.type==='atrule'&&/prefers-reduced-motion:\s*reduce/.test((parent.parent as postcss.AtRule).params);if(media&&parent.selectors.includes(selector))found.media=true;if(!media&&parent.selectors.includes(`[data-hig-motion='reduced'] ${selector}`))found.provider=true;});return found;};
describe('fill and space instead of strokes',()=>{
 it('draws no resting stroke on surfaces, inputs, overlays or tables',()=>{
  for(const selector of ['.hig-surface,.hig-dialog,.hig-select-list','.hig-input','.hig-popover','.hig-table-scroll','.hig-toast-item']){const body=rule(selector);expect(body).toContain('border:1px solid transparent');expect(body).not.toMatch(/solid var\(--hig-border\)/);}
  expect(css).not.toMatch(/border-bottom:1px solid var\(--hig-border\)/);
 });
 it('steps control wells one shade lighter inside a surface or overlay',()=>{
  expect(rule(':root')).toContain('--hig-fill:var(--hig-surface); --hig-fill-raised:var(--hig-nested)');
  expect(rule('.hig-surface,.hig-dialog,.hig-gesture-sheet')).toContain('--hig-fill:var(--hig-nested); --hig-fill-raised:var(--hig-border)');
  expect(rule('.hig-input')).toContain('background:var(--hig-fill)');
  expect(rule('.hig-segments::before')).toContain('background:var(--hig-fill)');
  expect(rule('.hig-segment-indicator')).toContain('background:var(--hig-fill-raised)');
  expect(rule('.hig-badge')).toContain('background:var(--hig-fill)');
 });
 it('fills overlays with the darker overlay role and keeps the off switch dark',()=>{
  expect(rule('.hig-dialog')).toContain('background:var(--hig-overlay,#111)');
  expect(rule('.hig-gesture-sheet')).toContain('background:var(--hig-overlay,#111)');
  expect(rule('.hig-switch input')).toContain('background:var(--hig-fill-raised)');
 });
 it('paints every thin track and rule one step above the wells of its container',()=>{
  for(const selector of ['.hig-switch input','.hig-separator','.hig-range::-moz-range-track','.hig-progress progress','.hig-progress progress::-webkit-progress-bar'])expect(rule(selector)).toContain('background:var(--hig-fill-raised)');
  expect(rule('.hig-range::-webkit-slider-runnable-track')).toContain('var(--hig-fill-raised) var(--hig-range-fill)');
  expect(rule('.hig-spinner-indicator')).toContain('border:2px solid var(--hig-fill-raised)');
  expect(rule('.hig-list > li + li')).toContain('1px solid var(--hig-fill-raised)');
  // A track never takes the lightest grey directly; only the container mapping does.
  expect(css).not.toMatch(/\.hig-(range|progress|switch|spinner|separator)[^{]*\{[^}]*var\(--hig-(border|nested)\)/);
 });
 it('draws an unavailable button as a neutral well and keeps the intent colour while busy',()=>{
  // A Button with href is an anchor, disabled through aria-disabled, so each rule matches both.
  expect(rule(".hig-button:is(:disabled,[aria-disabled='true'])")).not.toContain('opacity');
  expect(rule(".hig-button:is(:disabled,[aria-disabled='true']):not([aria-busy='true'])")).toBe(' background:var(--hig-fill);color:var(--hig-muted);box-shadow:none; ');
  expect(rule(".hig-button[data-intent='ghost']:is(:disabled,[aria-disabled='true']):not([aria-busy='true'])")).toContain('background:transparent;color:var(--hig-faint)');
  expect(rule(".hig-button[aria-busy='true']")).toContain('opacity:.7');
  expect(css).not.toContain('.hig-swap-actions > .hig-button:disabled');
 });
 it('restores touch sizes in a comfortable scope nested inside a compact one',()=>{
  expect(rule("[data-hig-density='compact'] [data-hig-density='comfortable']")).toContain('--hig-control: 48px; --hig-button: 44px; --hig-gap: 12px;');
 });
 it('marks the selected tab with a raised neutral capsule, never the action colour',()=>{
  expect(rule('.hig-tab')).toContain('background:transparent;color:var(--hig-muted)');
  expect(rule(".hig-tab[aria-selected='true']")).toBe(' background:var(--hig-fill-raised);color:var(--hig-text); ');
  expect(rule(".hig-button.hig-tab:disabled:not([aria-busy='true'])")).toContain('background:transparent;color:var(--hig-faint)');
  expect(css).not.toContain("[role='tab']");
 });
 it('steps the menu highlight lighter, like a select option, and aligns choices and market rows to the content edge',()=>{
  expect(rule('.hig-menu-item[data-highlighted]')).toBe(rule(".hig-select-option[data-active='true']"));
  expect(rule('.hig-menu-item:active:not([data-disabled])')).toContain('background:var(--hig-border)');
  expect(rule('.hig-choice')).toContain('padding-inline:0 16px');expect(rule('.hig-group legend')).toContain('padding:0');
  expect(rule(".hig-market-row[data-mode='action']")).toContain('padding-inline-end:20px');
  expect(rule(".hig-market-row[data-mode='action'] .hig-button[data-intent='ghost']")).toContain('color:var(--hig-text)');
 });
 it('sizes a comfortable segmented control to the 44px button height',()=>{expect(rule('.hig-segment span')).toContain('min-height:calc(var(--hig-button) - 8px)');
  // The 4px inset is the label's own padding, so each segment's target is the full control height.
  expect(rule('.hig-segments')).toContain('padding:0 4px');expect(rule('.hig-segment')).toContain('padding-block:calc(4px + var(--hig-segment-inset))');});
});
describe('reviewed component changes',()=>{
 it('shows a leading spinner on a busy button and keeps the busy text in the name only',()=>{
  vi.useFakeTimers();
  render(<><Button busy>Review order</Button><IconButton busy label='Confirm'>✓</IconButton><Button>Idle</Button></>);
  const busy=screen.getByRole('button',{name:'Review order · Working'});
  const slot=busy.firstElementChild;
  expect(slot?.className).toBe('hig-button-spinner-placeholder');
  expect(screen.getByRole('button',{name:'Confirm'}).querySelector('.hig-button-spinner-placeholder')).toBeNull();
  act(()=>vi.advanceTimersByTime(999));
  expect(busy.querySelector('.hig-button-spinner')).toBeNull();
  act(()=>vi.advanceTimersByTime(1));
  vi.useRealTimers();
  expect(busy.firstElementChild).toBe(slot);
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
  expect(input.parentElement?.className).toBe('hig-search-input');expect(input.previousElementSibling?.classList.contains('hig-search-icon')).toBe(true);
  expect(rule('.hig-search-icon')).toContain('inset-inline-start:16px');
  // Every text field reserves at least a 44px target; the search text starts 42px in, 6px after the glass.
  expect(rule('.hig-input')).toContain('min-height:max(44px,var(--hig-button))');expect(rule('.hig-search-input')).not.toContain('--hig-control');expect(rule('.hig-search-input > .hig-input')).toContain('padding-inline-start:42px');
 });
 it('puts an outline chevron on the trailing edge of the accordion header and turns it when open',async()=>{
  const changed=vi.fn();render(<Accordion title='Advanced options' onOpenChange={changed}><p>Body</p></Accordion>);
  const summary=screen.getByText('Advanced options').closest('summary')!;expect(summary.lastElementChild?.classList.contains('hig-accordion-chevron')).toBe(true);
  expect(rule('.hig-select-chevron,.hig-select-check,.hig-accordion-chevron')).toContain('fill:none;stroke:currentColor');
  expect(rule('.hig-accordion[open] > .hig-accordion-summary .hig-accordion-chevron')).toContain('transform:rotate(180deg)');
  expect(rule('.hig-accordion::details-content')).toContain('transition:opacity');
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
  for(const selector of ['.hig-skeleton',".hig-status-indicator:is([data-state='online'],[data-state='stale'])::before"])expect(stopped(selector,'animation'),selector).toEqual({media:true,provider:true});
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
 it('keeps Sonner out of the blocks: only the toast entry imports it',()=>{
  for(const file of ['blocks/install-command.tsx','blocks.tsx','notify.ts','status.tsx'])expect(readFileSync(`packages/hig/react/src/${file}`,'utf8')).not.toMatch(/sonner|toast\.js/);
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
 it('inverts the chosen capsule, scales the check in, and stops the motion when reduced',()=>{
  expect(rule('.hig-filter')).toContain('overflow-x:auto');
  expect(rule('.hig-filter-chip:has(input:checked)')).toContain('background:var(--hig-text);color:var(--hig-background)');
  expect(rule('.hig-filter-mark > svg')).toContain('opacity:0;transform:scale(.4);transition:opacity');
  expect(rule('.hig-filter-chip:has(input:checked) .hig-filter-mark > svg')).toContain('opacity:1;transform:scale(1)');
  expect(rule('.hig-filter-chip:has(input:checked) .hig-filter-mark')).toContain('background:currentColor');
  for(const selector of ['.hig-filter-mark > img','.hig-filter-mark > svg'])expect(stopped(selector,'transition'),selector).toEqual({media:true,provider:true});
 });
 it('spaces side-by-side actions 8px apart through one token, at every density',()=>{
  expect(rule(':root')).toContain('--hig-action-gap:var(--hig-space-sm,8px)');
  expect(css).not.toMatch(/data-hig-density='compact'\][^{]*\{[^}]*--hig-action-gap/);
  for(const selector of ['.hig-alert-actions','.hig-tab-list,.hig-pagination','.hig-filter','.hig-swap-actions','.hig-swap-pills','.hig-swap-wallet'])expect(rule(selector)).toContain('gap:var(--hig-action-gap)');
 });
 it('sets closing call-to-action buttons a double step, 16px, below the form and 8px from each other',()=>{
  expect(rule(':root')).toContain('--hig-action-offset:calc(var(--hig-action-gap)*2)');
  expect(rule('.hig-form-action')).toContain('margin-block-start:calc(var(--hig-action-offset) - var(--hig-gap))');
  expect(rule('.hig-form-action + .hig-form-action')).toContain('margin-block-start:calc(var(--hig-action-gap) - var(--hig-gap))');
  expect(rule(':is(.hig-dialog,.hig-gesture-sheet,.hig-gesture-dynamic) > :not(.hig-button) + .hig-button')).toContain('calc(var(--hig-action-offset) - 12px)');
  expect(rule(':is(.hig-dialog,.hig-gesture-sheet,.hig-gesture-dynamic) > .hig-button + .hig-button')).toContain('calc(var(--hig-action-gap) - 12px)');
  expect(rule('.hig-swap-actions')).toContain('margin-block-start:var(--hig-action-offset)');
 });
 it('presents floating lists with a fade, eases the switch track with its thumb, and stops both under reduced motion',()=>{
  expect(rule('.hig-select-list,.hig-popover')).toContain('animation:hig-present');
  // Durations come from the motion tokens, and every one has a stop in both preference paths (tests/motion-css.test.ts).
  expect(rule('.hig-switch input::after')).toContain('transition:opacity var(--hig-motion-duration-fast)');
  for(const selector of ['.hig-button','.hig-switch input','.hig-switch input::before','.hig-switch input::after'])expect(stopped(selector,'transition'),selector).toEqual({media:true,provider:true});
  for(const selector of ['.hig-select-list','.hig-popover'])expect(stopped(selector,'animation'),selector).toEqual({media:true,provider:true});
  // A popover portalled out of the provider carries data-hig-motion itself.
  expect(css).toMatch(/\[data-hig-motion='reduced'\]\.hig-popover[,{ ][^}]*\{ animation:none; \}/);
 });
});

it('hides a visible busy spinner in the completion commit and delays the next operation',()=>{
 vi.useFakeTimers();
 try{
  const commits=vi.fn(),button=(busy:boolean)=><React.Profiler id='save' onRender={commits}><Button busy={busy}>Save</Button></React.Profiler>;
  const view=render(button(true));act(()=>vi.advanceTimersByTime(1000));
  expect(view.container.querySelector('.hig-button-spinner')).toBeTruthy();commits.mockClear();
  view.rerender(button(false));expect(commits).toHaveBeenCalledTimes(1);
  view.rerender(button(true));act(()=>vi.advanceTimersByTime(999));expect(view.container.querySelector('.hig-button-spinner')).toBeNull();
 }finally{vi.useRealTimers();}
});

it('starts a fresh spinner delay for each busy operation',()=>{
 vi.useFakeTimers();
 try{
  const view=render(<Button busy>Save</Button>);
  act(()=>vi.advanceTimersByTime(700));
  view.rerender(<Button>Save</Button>);
  view.rerender(<Button busy>Save</Button>);
  act(()=>vi.advanceTimersByTime(999));
  expect(view.container.querySelector('.hig-button-spinner')).toBeNull();
  act(()=>vi.advanceTimersByTime(1));
  expect(view.container.querySelector('.hig-button-spinner')).toBeTruthy();
 }finally{vi.useRealTimers();}
});

it('keeps the install command stable across unrelated provider changes and updates its translated action',()=>{
 const renders=vi.spyOn(asyncResult,'useAsyncResult');
 try{
  const command=<InstallCommand command="npm i" onCopy={()=>{}}/>;
  const {rerender}=render(<HIGProvider density="comfortable">{command}</HIGProvider>);
  renders.mockClear();
  rerender(<HIGProvider density="compact">{command}</HIGProvider>);
  expect(renders).not.toHaveBeenCalled();
  rerender(<HIGProvider density="compact" messages={{copyInstallCommand:'Copier'}}>{command}</HIGProvider>);
  expect(screen.getByRole('button',{name:'Copier'})).toBeTruthy();
 }finally{renders.mockRestore();}
});
