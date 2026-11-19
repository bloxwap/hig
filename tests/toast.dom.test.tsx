// @vitest-environment jsdom
import React from 'react';
import {readFileSync} from 'node:fs';
import {afterEach,beforeAll,describe,expect,it,vi} from 'vitest';
import {act,cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Toaster,toast,dismissToast,ToastAction} from '../packages/hig/react/src/toast';
import {Toast} from '../packages/hig/react/src/status';
import {Button} from '../packages/hig/react/src/button';
import {HIGProvider} from '../packages/hig/react/src/provider';
// jsdom has no pointer capture, which Sonner asks for on every press inside a toast.
beforeAll(()=>{Element.prototype.setPointerCapture??=()=>{};});
afterEach(()=>{dismissToast();cleanup();});
const css=readFileSync('packages/hig/react/src/styles.css','utf8'),tokens=readFileSync('packages/hig/tokens/dist/tokens.css','utf8');
const capsules=()=>[...document.querySelectorAll<HTMLElement>('.hig-toast-item')];
const host=()=>document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
describe('web toasts: the unified API over Sonner',()=>{
 it('draws a description under the message, an action before the close button, and names the close button from the provider',async()=>{
  const retry=vi.fn();
  render(<HIGProvider messages={{dismiss:'Fermer',notifications:'Notifications reçues'}}><Toaster/></HIGProvider>);
  act(()=>{toast('Transfer failed',{severity:'error',description:'Check your balance and retry.',action:<Button onClick={retry}>Retry</Button>});});
  const close=await screen.findByRole('button',{name:'Fermer Transfer failed'});
  const capsule=close.closest<HTMLElement>('.hig-toast-item')!;
  expect(capsule.dataset.severity).toBe('error');expect(capsule.hasAttribute('data-described')).toBe(true);
  expect(capsule.querySelector('.hig-toast-message')!.firstChild!.textContent).toBe('Transfer failed');expect(capsule.querySelector('.hig-toast-description')!.textContent).toBe('Check your balance and retry.');
  // Tile (holding the symbol), message, action, close: the action sits before the close button.
  expect([...capsule.children].map(child=>child.className.split(' ')[0]||child.tagName.toLowerCase())).toEqual(['hig-toast-tile','hig-toast-message','hig-button','hig-toast-close']);
  expect(capsule.querySelector('.hig-toast-tile > svg.hig-toast-icon')).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Retry'}));expect(retry).toHaveBeenCalledTimes(1);
  // Sonner's region takes the provider's name for it.
  expect(document.querySelector('section[aria-label^="Notifications reçues"]')).toBeTruthy();
  // An explicit name wins; a notice without a description stays a full pill.
  act(()=>{toast('Copied',{dismissName:'Close the copy notice'});});
  const plain=(await screen.findByRole('button',{name:'Close the copy notice'})).closest<HTMLElement>('.hig-toast-item')!;
  expect(plain.hasAttribute('data-described')).toBe(false);expect(plain.querySelector('.hig-toast-description')).toBeNull();expect(plain.dataset.severity).toBe('info');
 });
 it('sets the severity through toast.success, toast.error, toast.warning and toast.info, and returns the id',async()=>{
  render(<HIGProvider><Toaster/></HIGProvider>);
  let ids:(string|number)[]=[];
  act(()=>{ids=[toast.success('Saved'),toast.error('Failed'),toast.warning('Slow network'),toast.info('Synced',{id:'sync'})];});
  await waitFor(()=>expect(capsules()).toHaveLength(4));
  const severity=(name:string)=>screen.getByRole('button',{name:`Dismiss ${name}`}).closest<HTMLElement>('.hig-toast-item')!.dataset.severity;
  expect([severity('Saved'),severity('Failed'),severity('Slow network'),severity('Synced')]).toEqual(['success','error','warning','info']);
  expect(ids[3]).toBe('sync');expect(new Set(ids).size).toBe(4);
  // toast.dismiss is dismissToast.
  expect(toast.dismiss).toBe(dismissToast);
 });
 it('replaces a notice in place when its id is raised again',async()=>{
  render(<HIGProvider><Toaster/></HIGProvider>);
  act(()=>{toast('Sending',{id:'send',duration:Infinity});});
  await screen.findByRole('button',{name:'Dismiss Sending'});
  act(()=>{toast.success('Sent',{id:'send'});});
  await screen.findByRole('button',{name:'Dismiss Sent'});
  expect(capsules()).toHaveLength(1);expect(capsules()[0].dataset.severity).toBe('success');
 });
 it('starts the time over when an id is raised again, as the native host does',async()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});
  try{
   render(<HIGProvider><Toaster duration={1000}/></HIGProvider>);
   const expired=vi.fn();
   act(()=>{toast('Sending',{id:'send',onAutoClose:expired});});
   act(()=>{vi.advanceTimersByTime(900);});
   act(()=>{toast.success('Sent',{id:'send',onAutoClose:expired});});
   act(()=>{vi.advanceTimersByTime(900);});expect(expired).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Dismiss Sent'})).toBeTruthy();
   act(()=>{vi.advanceTimersByTime(100);});expect(expired).toHaveBeenCalledTimes(1);
  }finally{vi.useRealTimers();}
 });
 it('tells the owner how a notice ended: dismissed by its close button or by dismissToast, or timed out',async()=>{
  render(<HIGProvider><Toaster/></HIGProvider>);
  const closed=vi.fn(),dropped=vi.fn(),expired=vi.fn(),untouched=vi.fn();
  act(()=>{toast('First',{duration:Infinity,onDismiss:closed,onAutoClose:untouched});toast('Second',{id:'second',duration:Infinity,onDismiss:dropped});toast('Third',{duration:30,onAutoClose:expired,onDismiss:untouched});});
  await userEvent.click(await screen.findByRole('button',{name:'Dismiss First'}));
  await waitFor(()=>expect(closed).toHaveBeenCalledTimes(1));
  act(()=>{dismissToast('second');});
  await waitFor(()=>expect(dropped).toHaveBeenCalledTimes(1));
  await waitFor(()=>expect(expired).toHaveBeenCalledTimes(1));
  expect(untouched).not.toHaveBeenCalled();
 });
 it('gives Sonner the shared stack figures and offsets that clear the safe area',async()=>{
  const {rerender}=render(<HIGProvider direction='rtl'><Toaster/></HIGProvider>);
  act(()=>{toast('Saved',{duration:Infinity});});
  await screen.findByRole('button',{name:'Dismiss Saved'});
  expect(host().dataset.yPosition).toBe('bottom');expect(host().dataset.xPosition).toBe('center');expect(host().getAttribute('dir')).toBe('rtl');
  expect(host().style.getPropertyValue('--gap')).toBe('14px');
  for(const edge of ['top','right','bottom','left']){
   expect(host().style.getPropertyValue(`--offset-${edge}`)).toBe(`calc(env(safe-area-inset-${edge}, 0px) + 24px)`);
   expect(host().style.getPropertyValue(`--mobile-offset-${edge}`)).toBe(`calc(env(safe-area-inset-${edge}, 0px) + 16px)`);
  }
  // A number is still a distance from the safe area; the host's own CSS and any Sonner prop pass through.
  rerender(<HIGProvider><Toaster position='top-center' offset={60} mobileOffset={{top:60,left:'2rem'}} gap={8}/></HIGProvider>);
  await waitFor(()=>expect(host().dataset.yPosition).toBe('top'));
  expect(host().style.getPropertyValue('--offset-top')).toBe('calc(env(safe-area-inset-top, 0px) + 60px)');expect(host().style.getPropertyValue('--offset-left')).toBe('calc(env(safe-area-inset-left, 0px) + 60px)');
  // One named edge: its number clears the safe area too, a string is the host's own CSS, and the other edges keep the default.
  expect(host().style.getPropertyValue('--mobile-offset-top')).toBe('calc(env(safe-area-inset-top, 0px) + 60px)');expect(host().style.getPropertyValue('--mobile-offset-left')).toBe('2rem');expect(host().style.getPropertyValue('--mobile-offset-bottom')).toBe('calc(env(safe-area-inset-bottom, 0px) + 16px)');
  expect(host().style.getPropertyValue('--gap')).toBe('8px');
  rerender(<HIGProvider><Toaster position='top-center' offset='3rem'/></HIGProvider>);
  await waitFor(()=>expect(host().style.getPropertyValue('--offset-top')).toBe('3rem'));
 });
 it('places the stack by offset at every window width, as native does, unless mobileOffset is given',async()=>{
  const {rerender}=render(<HIGProvider><Toaster offset={{top:60}}/></HIGProvider>);
  act(()=>{toast('Saved',{duration:Infinity});});
  await screen.findByRole('button',{name:'Dismiss Saved'});
  // A narrow window takes the named edge from offset and keeps the narrow default on the others.
  expect(host().style.getPropertyValue('--offset-top')).toBe('calc(env(safe-area-inset-top, 0px) + 60px)');expect(host().style.getPropertyValue('--offset-left')).toBe('calc(env(safe-area-inset-left, 0px) + 24px)');
  expect(host().style.getPropertyValue('--mobile-offset-top')).toBe('calc(env(safe-area-inset-top, 0px) + 60px)');expect(host().style.getPropertyValue('--mobile-offset-left')).toBe('calc(env(safe-area-inset-left, 0px) + 16px)');
  rerender(<HIGProvider><Toaster offset={32}/></HIGProvider>);
  await waitFor(()=>expect(host().style.getPropertyValue('--mobile-offset-bottom')).toBe('calc(env(safe-area-inset-bottom, 0px) + 32px)'));
  rerender(<HIGProvider><Toaster offset='3rem'/></HIGProvider>);
  await waitFor(()=>expect(host().style.getPropertyValue('--mobile-offset-bottom')).toBe('3rem'));
  // Sonner's own prop still wins for narrow windows.
  rerender(<HIGProvider><Toaster offset={32} mobileOffset={{bottom:8}}/></HIGProvider>);
  await waitFor(()=>expect(host().style.getPropertyValue('--mobile-offset-bottom')).toBe('calc(env(safe-area-inset-bottom, 0px) + 8px)'));
  expect(host().style.getPropertyValue('--mobile-offset-top')).toBe('calc(env(safe-area-inset-top, 0px) + 16px)');expect(host().style.getPropertyValue('--offset-bottom')).toBe('calc(env(safe-area-inset-bottom, 0px) + 32px)');
 });
 it('reads a duration as the native host does: not a positive number takes the default, and one no timer can count stays',async()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});
  try{
   render(<HIGProvider><Toaster duration={1000}/></HIGProvider>);
   const expired=vi.fn();
   act(()=>{toast('Negative',{duration:-5,onAutoClose:expired});toast('Month',{duration:2**31,onAutoClose:expired});});
   act(()=>{vi.advanceTimersByTime(900);});
   // A negative delay would fire at once; it takes the Toaster's second instead.
   expect(expired).not.toHaveBeenCalled();expect(capsules()).toHaveLength(2);
   act(()=>{vi.advanceTimersByTime(200);});expect(expired).toHaveBeenCalledTimes(1);
   // A delay past the timer range would also fire at once; it is kept like Infinity.
   act(()=>{vi.advanceTimersByTime(60000);});expect(expired).toHaveBeenCalledTimes(1);expect(screen.getByRole('button',{name:'Dismiss Month'})).toBeTruthy();
  }finally{vi.useRealTimers();}
 });
 it('paints severities from token roles that are Display P3 on capable screens, and stops Sonner under provider reduced motion',()=>{
  // The severity picks the accent the border, glow, tile and action pills share; info is the default, and a market accent wins.
  for(const [severity,role] of [['success','positive'],['warning','warning'],['error','negative']])expect(css).toContain(`.hig-toast-item[data-severity='${severity}'] { --hig-toast-accent:var(--hig-${role}); }`);
  expect(css).toMatch(/\.hig-toast-item \{ --hig-toast-accent:var\(--hig-info\);/);
  for(const direction of ['up','down'])expect(css).toContain(`.hig-toast-item[data-accent='${direction}'] { --hig-toast-accent:var(--hig-${direction}); }`);
  // No colour in the toast rules is written out: every one is a token, apart from the shadow.
  const rules=css.split('\n').filter(line=>line.startsWith('.hig-toast')).join('\n');
  expect(rules.replace(/box-shadow:[^;]+;/g,'')).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  const p3=tokens.slice(tokens.indexOf('@supports (color: color(display-p3 1 1 1))'));
  // The capsule's fill and text are neutral greys, the same in both spaces; the severity roles are the ones with a wider-gamut value.
  for(const role of ['info','positive','warning','negative'])expect(p3).toMatch(new RegExp(`--hig-${role}: color\\(display-p3 `));
  expect(css).toContain("[data-hig-motion='reduced'] [data-sonner-toast],[data-hig-motion='reduced'] [data-sonner-toast] > * { transition:none!important;animation:none!important; }");
  expect(css).toContain('.hig-toast-item[data-described] { border-radius:16px;padding-block:6px; }');
 });
});

it('formats only changed persistent notice rows on host updates',()=>{
 const format=vi.fn((message:string,dismiss:string)=>dismiss+' '+message);
 const messages={dismissNotice:format}, onDismiss=vi.fn();
 const notices=Array.from({length:40},(_,i)=>({id:String(i),message:'Notice '+i,severity:'info' as const}));
 const board=(items:typeof notices)=><HIGProvider messages={messages}><Toast notices={items} onDismiss={onDismiss}/></HIGProvider>;
 const view=render(board(notices));
 format.mockClear();
 view.rerender(board(notices.map(n=>({...n}))));
 expect(format).toHaveBeenCalledTimes(0);
 view.rerender(board([{...notices[0],message:'Changed'},...notices.slice(1)]));
 expect(format).toHaveBeenCalledTimes(1);
});

describe('toast presentation options',()=>{
 it('swaps the tile symbol, hides the tile, and takes a market accent',async()=>{
  render(<HIGProvider><Toaster/></HIGProvider>);
  act(()=>{toast('Hyperliquid to Base',{id:'flight',icon:<i data-testid='spinner'/>});toast('Signed in',{id:'plain',icon:null});toast('+$125.50',{id:'payout',severity:'success',accent:'up',messageNode:<b data-testid='figure'>+$125.50</b>});});
  const flight=(await screen.findByTestId('spinner')).closest<HTMLElement>('.hig-toast-item')!;
  expect(flight.querySelector('.hig-toast-tile > [data-testid=spinner]')).toBeTruthy();expect(flight.querySelector('.hig-toast-icon')).toBeNull();
  const plain=screen.getByRole('button',{name:'Dismiss Signed in'}).closest<HTMLElement>('.hig-toast-item')!;
  expect(plain.querySelector('.hig-toast-tile')).toBeNull();
  const payout=screen.getByTestId('figure').closest<HTMLElement>('.hig-toast-item')!;
  expect(payout.dataset.accent).toBe('up');expect(payout.dataset.severity).toBe('success');
  // The figure is drawn; the message is still what names the close button.
  expect(screen.getByRole('button',{name:'Dismiss +$125.50'})).toBeTruthy();
 });
 it('stacks two ToastAction pills under the message, the second one quieter',async()=>{
  const confirm=vi.fn(),close=vi.fn();
  render(<HIGProvider><Toaster/></HIGProvider>);
  act(()=>{toast('Check this transfer before retrying',{severity:'error',description:'It may have gone through.',action:<ToastAction onClick={confirm}>I checked</ToastAction>,secondaryAction:<ToastAction onClick={close}>Close</ToastAction>});});
  const primary=await screen.findByRole('button',{name:'I checked'});
  const capsule=primary.closest<HTMLElement>('.hig-toast-item')!;
  expect(capsule.dataset.layout).toBe('stacked');
  expect(primary.closest('.hig-toast-actions')?.getAttribute('data-count')).toBe('2');
  expect(primary.dataset.rank).toBe('primary');expect(screen.getByRole('button',{name:'Close'}).dataset.rank).toBe('secondary');
  await userEvent.click(primary);expect(confirm).toHaveBeenCalledTimes(1);
  expect(css).toContain(".hig-toast-action[data-rank='secondary'] { color:var(--hig-muted); }");
 });
 it('makes the tile and message one control with onPress, apart from the close button',async()=>{
  const open=vi.fn();
  render(<HIGProvider><Toaster/></HIGProvider>);
  act(()=>{toast("It's live",{severity:'success',onPress:open,pressName:'Open the tournament'});});
  const body=await screen.findByRole('button',{name:'Open the tournament'});
  expect(body.classList.contains('hig-toast-body')).toBe(true);expect(body.querySelector('.hig-toast-tile')).toBeTruthy();
  expect(body.contains(screen.getByRole('button',{name:"Dismiss It's live"}))).toBe(false);
  await userEvent.click(body);expect(open).toHaveBeenCalledTimes(1);
 });
});

it('runs onClose for the close control only, before onDismiss, and not for dismissToast',async()=>{
 const order:string[]=[];
 render(<HIGProvider><Toaster/></HIGProvider>);
 act(()=>{toast('Minimums',{id:'a',duration:Infinity,onClose:()=>order.push('close'),onDismiss:()=>order.push('dismiss')});});
 await userEvent.click(await screen.findByRole('button',{name:'Dismiss Minimums'}));
 await waitFor(()=>expect(order).toEqual(['close','dismiss']));
 act(()=>{toast('Bridge',{id:'b',duration:Infinity,onClose:()=>order.push('close b')});});
 await screen.findByRole('button',{name:'Dismiss Bridge'});
 act(()=>dismissToast('b'));
 expect(order).not.toContain('close b');
});
