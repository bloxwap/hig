import React,{createRef,useState} from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {GestureSheet,type GestureSheetProps} from '../packages/react/src/gesture-sheet';
import {HIGProvider} from '../packages/react/src/provider';
let motion:HTMLStyleElement;
beforeEach(()=>{vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));motion=document.createElement('style');motion.textContent='[data-vaul-drawer],[data-vaul-overlay]{animation-name:none!important}';document.head.append(motion);});
afterEach(()=>{cleanup();motion.remove();vi.unstubAllGlobals();});

describe('optional web gesture sheet',()=>{
 it('keeps backend content refs, translated close, naming and frozen JavaScript prop ownership',async()=>{
  const ref=createRef<HTMLDivElement>(),grip=createRef<HTMLDivElement>();
  const unsafe=Object.freeze({id:'foreign',role:'status',dir:'ltr',lang:'en','aria-labelledby':'foreign','aria-describedby':'foreign',children:'foreign',forceMount:true,asChild:true,dangerouslySetInnerHTML:{__html:'foreign'},className:'host-sheet',style:{bottom:22,maxHeight:360},'data-host-card':'login','data-vaul-drawer-direction':'top','data-vaul-no-drag':''});
  const root=Object.freeze({modal:false,open:false,defaultOpen:false,onOpenChange:()=>{},children:'foreign',autoFocus:true,repositionInputs:false,handleOnly:true,shouldScaleBackground:false});
  const unsafeGrip=Object.freeze({'aria-hidden':false,onPointerDown:vi.fn(),children:'foreign',style:{width:77}});
  const before={...unsafe};
  function Example(){const [open,set]=useState(false);return <HIGProvider locale='ar-EG' direction='rtl' reducedMotion messages={{close:'إغلاق'}}><GestureSheet open={open} onOpenChange={set} title='Login' titleHidden contentMode='custom' contentProps={unsafe as unknown as GestureSheetProps['contentProps']} contentRef={ref} handleRef={grip} handleProps={unsafeGrip as unknown as GestureSheetProps['handleProps']} backendProps={root as unknown as GestureSheetProps['backendProps']} trigger={<button>Open login</button>}><h2>Visible login heading</h2><button>Sign in</button></GestureSheet></HIGProvider>;}
  render(<Example/>);
  const trigger=screen.getByRole('button',{name:'Open login'});await userEvent.click(trigger);
  const sheet=screen.getByRole('dialog',{name:'Login'});
  expect(sheet.id).toBe(trigger.getAttribute('aria-controls'));
  expect(ref.current).toBe(sheet);expect(grip.current?.hasAttribute('data-vaul-handle')).toBe(true);
  expect(grip.current?.getAttribute('aria-hidden')).toBe('true');expect(grip.current?.style.width).toBe('77px');
  expect(sheet.getAttribute('dir')).toBe('rtl');expect(sheet.getAttribute('lang')).toBe('ar-EG');
  expect(sheet.getAttribute('aria-describedby')).toBeNull();expect(sheet.getAttribute('data-host-card')).toBe('login');
  expect(sheet.getAttribute('data-vaul-drawer-direction')).toBe('bottom');expect(sheet.hasAttribute('data-vaul-no-drag')).toBe(true);
  expect(sheet.getAttribute('data-hig-motion')).toBe('reduced');expect(sheet.style.bottom).toBe('22px');expect(sheet.style.maxHeight).toBe('360px');
  expect(screen.queryByText('foreign')).toBeNull();expect(screen.getByRole('heading',{name:'Visible login heading'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'إغلاق'}));
  await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(document.activeElement).toBe(trigger);
  expect(unsafe).toEqual(before);expect(Object.isFrozen(unsafe)).toBe(true);expect(Object.isFrozen(root)).toBe(true);
 });
 it('keeps pending dismissal veto, custom close cancellation, focus trap and return focus',async()=>{
  const opened=vi.fn((event:Event)=>{event.preventDefault();screen.getByLabelText('Search markets').focus();});
  const closed=vi.fn(),outside=vi.fn();const attempts=vi.fn();
  function Example(){const [open,set]=useState(false),[pending,setPending]=useState(true);return <GestureSheet open={open} onOpenChange={next=>{attempts(next);if(next||!pending)set(next);}} title='Markets' description='Select a market' descriptionHidden backendProps={{autoFocus:true,repositionInputs:false}} trigger={<button>Open markets</button>} contentProps={{onOpenAutoFocus:opened,onCloseAutoFocus:closed,onFocusOutside:outside}} closeButton={<button onClick={event=>{if(pending)event.preventDefault();}}>Done</button>}><input aria-label='Search markets'/><button onClick={()=>setPending(false)}>Ready</button></GestureSheet>;}
  render(<Example/>);const trigger=screen.getByRole('button',{name:'Open markets'});await userEvent.click(trigger);
  expect(document.activeElement).toBe(screen.getByLabelText('Search markets'));
  fireEvent.focusOut(screen.getByLabelText('Search markets'));fireEvent.focusIn(document.body);expect(outside).toHaveBeenCalledOnce();
  await userEvent.tab({shift:true});expect(document.activeElement).toBe(screen.getByRole('button',{name:'Done'}));
  fireEvent.click(screen.getByRole('button',{name:'Done'}));expect(attempts).toHaveBeenCalledTimes(1);
  await userEvent.keyboard('{Escape}');expect(attempts).toHaveBeenLastCalledWith(false);expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Ready'}));await userEvent.keyboard('{Escape}');
  await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(closed).toHaveBeenCalledOnce();expect(document.activeElement).toBe(trigger);
  await userEvent.click(trigger);expect(screen.getByRole('dialog',{name:'Markets'})).toBeTruthy();expect(opened).toHaveBeenCalledTimes(2);
 });
 it('retains nondismissible backend policy and only reports accepted settled states',async()=>{
  const attempts=vi.fn(),settled=vi.fn();
  const view=render(<GestureSheet open onOpenChange={attempts} title='Signing' handle={false} closeButton={null} backendProps={{dismissible:false,onAnimationEnd:settled}}><p>Wait for signature</p></GestureSheet>);
  expect(document.querySelector('[data-vaul-handle]')).toBeNull();expect(screen.queryByRole('button',{name:'Close'})).toBeNull();
  await userEvent.keyboard('{Escape}');expect(attempts).not.toHaveBeenCalled();
  view.rerender(<GestureSheet open onOpenChange={attempts} title='Signing' backendProps={{onAnimationEnd:settled}}><p>Wait for signature</p></GestureSheet>);
  await userEvent.keyboard('{Escape}');expect(attempts).toHaveBeenCalledWith(false);
  await new Promise(resolve=>setTimeout(resolve,550));expect(settled).not.toHaveBeenCalled();
 });
 it('runs React callback ref cleanup when the backend content unmounts',async()=>{
  const release=vi.fn(),attach=vi.fn((element:HTMLDivElement|null)=>{if(element)return release;});
  const view=render(<GestureSheet open onOpenChange={()=>{}} title='Review' contentRef={attach}><p>Details</p></GestureSheet>);
  expect(attach).toHaveBeenCalledWith(screen.getByRole('dialog'));
  view.rerender(<GestureSheet open={false} onOpenChange={()=>{}} title='Review' contentRef={attach}><p>Details</p></GestureSheet>);
  await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());await waitFor(()=>expect(release.mock.calls.length).toBe(attach.mock.calls.filter(([element])=>element!==null).length));
  expect(release).toHaveBeenCalled();
 });
});
