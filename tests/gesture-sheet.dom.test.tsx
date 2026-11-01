import React,{createRef,useState} from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {GestureSheet,type GestureSheetProps} from '../packages/hig/react/src/gesture-sheet';
import {HIGProvider} from '../packages/hig/react/src/provider';
let motion:HTMLStyleElement,restoreAnimation:(()=>void)|undefined;
beforeEach(()=>{vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));motion=document.createElement('style');motion.textContent='[data-vaul-drawer],[data-vaul-overlay]{animation-name:none!important}';document.head.append(motion);});
afterEach(()=>{cleanup();restoreAnimation?.();restoreAnimation=undefined;motion.remove();vi.unstubAllGlobals();vi.restoreAllMocks();});
type MockAnimation={frames:Keyframe[];cancel:ReturnType<typeof vi.fn>;onfinish:(()=>void)|null;oncancel:(()=>void)|null};
function dynamicEnvironment({waapi=true,observer=true}={}){
 let height=100,panelHeight=100,notify=()=>{};
 const observe=vi.fn(),disconnect=vi.fn();
 if(observer)vi.stubGlobal('ResizeObserver',class{constructor(callback:ResizeObserverCallback){notify=()=>callback([],{} as ResizeObserver);}observe(...args:unknown[]){observe(...args);}disconnect(){disconnect();}});
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){const value=this.classList.contains('hig-gesture-sheet')?panelHeight:height;return{width:390,height:value,x:0,y:0,top:0,left:0,right:390,bottom:value,toJSON:()=>({})} as DOMRect;});
 const animations:MockAnimation[]=[],animate=vi.fn((frames:Keyframe[])=>{const animation:MockAnimation={frames,cancel:vi.fn(()=>animation.oncancel?.()),onfinish:null,oncancel:null};animations.push(animation);return animation as unknown as Animation;});
 if(waapi){const original=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'animate');Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,writable:true,value:animate});restoreAnimation=()=>{if(original)Object.defineProperty(HTMLElement.prototype,'animate',original);else Reflect.deleteProperty(HTMLElement.prototype,'animate');};}
 return{animations,animate,observe,disconnect,setHeight:(value:number)=>{height=value;},setPanelHeight:(value:number)=>{panelHeight=value;},resize:()=>act(()=>notify())};
}

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
 it('animates intrinsic grow and shrink with rapid retargeting while retaining input, focus and refs',async()=>{
  const env=dynamicEnvironment(),ref=createRef<HTMLDivElement>();
  function Example(){const[expanded,setExpanded]=useState(false);return <GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing contentRef={ref}><input aria-label='Search markets'/><button onClick={()=>setExpanded(value=>!value)}>Toggle details</button>{expanded&&<p>Expanded market details</p>}</GestureSheet>;}
  render(<Example/>);const panel=screen.getByRole('dialog'),body=panel.querySelector('.hig-gesture-dynamic'),input=screen.getByLabelText('Search markets');
  expect(ref.current).toBe(panel);expect(body).not.toBeNull();input.focus();fireEvent.input(input,{target:{value:'BTC'}});
  expect(panel.style.height).toBe('');await waitFor(()=>expect(env.observe).toHaveBeenCalled());env.setHeight(180);fireEvent.click(screen.getByRole('button',{name:'Toggle details'}));env.resize();
  expect(env.animations[0].frames).toEqual([{height:'100px'},{height:'180px'}]);expect(panel.style.height).toBe('');
  env.setHeight(140);env.setPanelHeight(125);fireEvent.click(screen.getByRole('button',{name:'Toggle details'}));env.resize();
  expect(env.animations[0].cancel).toHaveBeenCalledOnce();expect(env.animations[1].frames).toEqual([{height:'125px'},{height:'140px'}]);
  act(()=>env.animations[1].onfinish?.());expect(panel.style.height).toBe('');expect(ref.current).toBe(panel);expect(panel.querySelector('.hig-gesture-dynamic')).toBe(body);
  expect(screen.getByLabelText('Search markets')).toBe(input);expect((input as HTMLInputElement).value).toBe('BTC');expect(document.activeElement).toBe(input);
 });
 it('honors reduced motion and the dynamic ceiling without animating',()=>{
  const env=dynamicEnvironment();
  const view=render(<HIGProvider reducedMotion><GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing maxDynamicContentSize={160}><p>Short</p></GestureSheet></HIGProvider>);
  const panel=screen.getByRole('dialog');expect(panel.style.maxHeight).toBe('160px');expect(panel.querySelector('.hig-gesture-dynamic')).not.toBeNull();
  env.setHeight(180);view.rerender(<HIGProvider reducedMotion><GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing maxDynamicContentSize={160}><p>Expanded market details</p></GestureSheet></HIGProvider>);env.resize();
  expect(env.animate).not.toHaveBeenCalled();expect(panel.style.height).toBe('');
 });
 it('does not compete with an inline height owned by the backend',async()=>{
  const env=dynamicEnvironment();
  const view=render(<GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing backendProps={{direction:'top'}}><p>Short</p></GestureSheet>);
  const panel=screen.getByRole('dialog');expect(panel.getAttribute('data-vaul-drawer-direction')).toBe('top');
  env.setHeight(180);view.rerender(<GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing backendProps={{direction:'top'}}><p>Expanded market details</p></GestureSheet>);env.resize();expect(env.animations).toHaveLength(1);
  panel.style.height='260px';await waitFor(()=>expect(env.animations[0].cancel).toHaveBeenCalled());
  env.setHeight(220);view.rerender(<GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing backendProps={{direction:'top'}}><p>Further expanded market details</p></GestureSheet>);env.resize();
  expect(env.animate).toHaveBeenCalledOnce();expect(panel.style.height).toBe('260px');
 });
 it('disconnects and cancels on close, starts fresh on reopen and cleans up on unmount',async()=>{
  const env=dynamicEnvironment(),sheet=(open:boolean,children:React.ReactNode)=><GestureSheet open={open} onOpenChange={()=>{}} title='Markets' enableDynamicSizing>{children}</GestureSheet>;
  const view=render(sheet(true,<p>Short</p>));env.setHeight(180);view.rerender(sheet(true,<p>Expanded market details</p>));env.resize();expect(env.animations).toHaveLength(1);
  view.rerender(sheet(false,<p>Expanded market details</p>));expect(env.animations[0].cancel).toHaveBeenCalledOnce();expect(env.disconnect).toHaveBeenCalledOnce();await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
  view.rerender(sheet(true,<p>Expanded market details</p>));expect(screen.getByRole('dialog')).toBeTruthy();expect(env.animations).toHaveLength(1);view.unmount();expect(env.disconnect).toHaveBeenCalledTimes(2);
 });
 it('keeps side sheets fixed and falls back to intrinsic updates without RO or WAAPI',()=>{
  const env=dynamicEnvironment({waapi:false,observer:false});
  const view=render(<GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing maxDynamicContentSize={200} backendProps={{direction:'right'}}><p>Short</p></GestureSheet>);
  const panel=screen.getByRole('dialog');expect(panel.querySelector('.hig-gesture-dynamic')).toBeNull();expect(panel.style.maxHeight).toBe('');expect(env.observe).not.toHaveBeenCalled();
  view.rerender(<GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing maxDynamicContentSize={200}><p>Short</p></GestureSheet>);expect(panel.querySelector('.hig-gesture-dynamic')).not.toBeNull();
  view.rerender(<GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing maxDynamicContentSize={200}><p>Expanded market details</p></GestureSheet>);expect(screen.getByText('Expanded market details')).toBeTruthy();expect(panel.style.height).toBe('');
 });
 it('rejects snap-point props and non-finite or non-positive dynamic ceilings at runtime',()=>{
  vi.spyOn(console,'error').mockImplementation(()=>{});
  const incompatible={snapPoints:[.4],snapPoint:.4,activeSnapPoint:.4,setActiveSnapPoint:()=>{},fadeFromIndex:0,snapToSequentialPoint:true};
  for(const[key,value]of Object.entries(incompatible)){expect(()=>render(<GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing backendProps={{[key]:value} as never}><p>Details</p></GestureSheet>)).toThrow('Dynamic GestureSheet does not accept Vaul snap-point props.');cleanup();}
  for(const maxDynamicContentSize of[0,-1,Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY]){expect(()=>render(<GestureSheet open onOpenChange={()=>{}} title='Markets' enableDynamicSizing maxDynamicContentSize={maxDynamicContentSize}><p>Details</p></GestureSheet>)).toThrow('GestureSheet maxDynamicContentSize must be finite and greater than zero.');cleanup();}
 });
});
