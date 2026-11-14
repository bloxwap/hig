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
 it('insets a magnifying glass on the leading edge of SearchInput and keeps the ref on the input',()=>{
  const ref=React.createRef<HTMLInputElement>();render(<SearchInput ref={ref} aria-label='Search markets' className='host'/>);
  const input=screen.getByRole('searchbox',{name:'Search markets'});expect(ref.current).toBe(input);expect(input.className).toContain('host');
  expect(input.parentElement?.className).toBe('hig-search-input');expect(input.previousElementSibling?.getAttribute('class')).toBe('hig-search-icon');
  expect(rule('.hig-search-icon')).toContain('inset-inline-start:16px');
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
 it('reports an InstallCommand copy as a toast and still announces it without a toaster',async()=>{
  const fr={copied:'Copié',dismiss:'Ignorer',dismissNotice:(message:string,dismiss:string)=>`${dismiss} : ${message}`};
  render(<HIGProvider messages={fr}><InstallCommand command='npm install @bloxwap/hig' onCopy={()=>{}}/><Toaster/></HIGProvider>);
  await userEvent.click(screen.getByRole('button',{name:'Copy install command'}));
  expect(await screen.findByRole('button',{name:'Ignorer : Copié'})).toBeTruthy();
  const status=[...document.querySelectorAll('[role=status]')].find(node=>node.textContent==='Copié')!;expect(status.className).toBe('hig-sr-only');
  cleanup();
  render(<InstallCommand command='x' onCopy={()=>Promise.reject(new Error('denied'))}/>);
  await userEvent.click(screen.getByRole('button',{name:'Copy install command'}));
  expect((await screen.findByText('Copy failed. Select the command and copy manually.')).className).toBe('hig-sr-only');
 });
});
