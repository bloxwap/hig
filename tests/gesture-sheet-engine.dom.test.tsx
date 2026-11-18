import React,{useState} from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {GestureSheet,type GestureSheetProps} from '../packages/hig/react/src/gesture-sheet';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {SHEET_FLICK,SHEET_THROW,SHEET_TRAVEL,backdropProgress,dragPosition,releaseTarget} from '../packages/hig/contracts/src/gesture-sheet';

// jsdom lays nothing out and runs no transitions. The stage gives the sheet a box on a viewport, reports a transition for
// every travel so a test can end it, and records what each layer showed when a travel began.
type Travel={transitionProperty:string;playState:string;onfinish:(()=>void)|null};
const VIEWPORT=800;
const at=(element:HTMLElement)=>Number(/translate3d\(0,(-?[\d.]+)px,0\)/.exec(element.style.transform)?.[1]??0);
const timing=(element:HTMLElement)=>{const match=/^(\w+) (\d+)ms cubic-bezier\(([^)]+)\)$/.exec(element.style.transition);return match?{property:match[1],duration:Number(match[2]),curve:match[3].split(',').map(Number)}:null;};
const travel=(property:string)=>({property,duration:SHEET_TRAVEL.duration,curve:[...SHEET_TRAVEL.curve]});
const hinted=(element:HTMLElement)=>element.style.getPropertyValue('will-change');
const restore:(()=>void)[]=[];
function stage({height=400,motion=true}={}){
 const env={flight:null as number|null,starts:[] as {element:Element;transform:string;opacity:string}[],travels:new Map<Element,Travel>(),arrive:(element:Element)=>act(()=>{env.travels.get(element)?.onfinish?.();})};
 const innerHeight=Object.getOwnPropertyDescriptor(window,'innerHeight');
 Object.defineProperty(window,'innerHeight',{configurable:true,value:VIEWPORT});
 restore.push(()=>{if(innerHeight)Object.defineProperty(window,'innerHeight',innerHeight);});
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){
  const sheet=this.hasAttribute('data-hig-sheet'),top=sheet?VIEWPORT-height+(env.flight??at(this)):0,size=sheet?height:0;
  return {x:0,y:top,top,left:0,right:390,bottom:top+size,width:390,height:size,toJSON:()=>({})} as DOMRect;
 });
 const computed=window.getComputedStyle.bind(window);
 vi.spyOn(window,'getComputedStyle').mockImplementation((element:Element,pseudo?:string|null)=>{
  const style=computed(element,pseudo);
  if(!(element instanceof HTMLElement)||!element.matches('[data-hig-sheet],[data-hig-sheet-overlay],[data-hig-sheet-wrapper]'))return style;
  return new Proxy(style,{get:(target,key)=>{
   if(key==='opacity')env.starts.push({element,transform:element.style.transform,opacity:element.style.opacity});
   if(key==='transform'&&env.flight!==null&&element.hasAttribute('data-hig-sheet'))return `matrix(1, 0, 0, 1, 0, ${env.flight})`;
   const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});
 });
 if(motion){
  Object.defineProperty(HTMLElement.prototype,'getAnimations',{configurable:true,writable:true,value(this:HTMLElement){
   const [property]=this.style.transition.split(' ');if(!property||property==='none')return [];
   const running:Travel={transitionProperty:property,playState:'running',onfinish:null};env.travels.set(this,running);return [running];
  }});
  restore.push(()=>{Reflect.deleteProperty(HTMLElement.prototype,'getAnimations');});
 }
 return env;
}
afterEach(()=>{cleanup();for(const undo of restore.splice(0))undo();document.body.removeAttribute('style');vi.unstubAllGlobals();vi.restoreAllMocks();});
function pointer(type:'pointerdown'|'pointermove'|'pointerup'|'pointercancel',target:Element,y:number,time:number,init:{x?:number;pointerType?:string;button?:number}={}){
 const event=new MouseEvent(type,{bubbles:true,cancelable:true,clientX:init.x??100,clientY:y,button:init.button??0});
 Object.defineProperties(event,{pointerId:{value:1},pointerType:{value:init.pointerType??'mouse'},isPrimary:{value:true},timeStamp:{value:time}});
 fireEvent(target,event);
}
/** Press at `y` and move past the slop: the sheet is picked up at `y + 3`, so later moves read from there. */
function pick(target:Element,y=500,time=1000){pointer('pointerdown',target,y,time);pointer('pointermove',target,y+3,time+1);return {y:y+3,time:time+1};}
/** Drag `distance` pixels toward closed over `duration` ms, then let go after resting `hold` ms. */
function drag(target:Element,distance:number,{duration=40,hold=0,steps=4}={}){
 const start=pick(target);
 for(let step=1;step<=steps;step++)pointer('pointermove',target,start.y+distance*step/steps,start.time+duration*step/steps);
 pointer('pointerup',target,start.y+distance,start.time+duration+hold);
}
const frame=()=>act(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>resolve(null)));});
const parts=()=>({sheet:screen.getByRole('dialog'),overlay:document.querySelector<HTMLElement>('[data-hig-sheet-overlay]')!,handle:document.querySelector<HTMLElement>('[data-hig-sheet-handle]')!,body:screen.getByTestId('body')});
function Sheet({accept=true,onRequest,...props}:Partial<GestureSheetProps>&{accept?:boolean;onRequest?:(open:boolean)=>void}){
 const [open,setOpen]=useState(true);
 return <GestureSheet {...{title:'Markets',closeButton:null,...props} as GestureSheetProps} open={open} onOpenChange={next=>{onRequest?.(next);if(accept)setOpen(next);}}><p data-testid='body'>Body</p>{props.children}</GestureSheet>;
}
const snaps={contentProps:{style:{height:'100dvh'}}} as const;

describe('web gesture sheet engine',()=>{
 it('opens from closed and closes on the shared travel timing and curve, hinting the compositor only while it moves',()=>{
  const env=stage();
  const view=render(<GestureSheet open onOpenChange={()=>{}} title='Markets'><p data-testid='body'>Body</p></GestureSheet>);
  const {sheet,overlay}=parts();
  // The travel starts from the closed position with the overlay clear.
  expect(env.starts.find(start=>start.element===sheet)?.transform).toBe('translate3d(0,400px,0)');expect(env.starts.find(start=>start.element===overlay)?.opacity).toBe('0');
  expect(timing(sheet)).toEqual(travel('transform'));expect(timing(overlay)).toEqual(travel('opacity'));
  expect(at(sheet)).toBe(0);expect(overlay.style.opacity).toBe('1');expect(hinted(sheet)).toBe('transform');expect(hinted(overlay)).toBe('opacity');
  env.arrive(sheet);
  expect(sheet.style.transition).toBe('');expect(sheet.style.transform).toBe('');expect(hinted(sheet)).toBe('');expect(overlay.style.transition).toBe('');expect(overlay.style.opacity).toBe('');expect(hinted(overlay)).toBe('');
  view.rerender(<GestureSheet open={false} onOpenChange={()=>{}} title='Markets'><p data-testid='body'>Body</p></GestureSheet>);
  // The sheet stays mounted while it travels out.
  expect(screen.getByRole('dialog')).toBe(sheet);expect(sheet.getAttribute('data-state')).toBe('closed');
  expect(timing(sheet)).toEqual(travel('transform'));expect(timing(overlay)).toEqual(travel('opacity'));expect(at(sheet)).toBe(400);expect(overlay.style.opacity).toBe('0');expect(hinted(sheet)).toBe('transform');
  env.arrive(sheet);expect(screen.queryByRole('dialog')).toBeNull();
 });
 it('closes a floating sheet past the gap it keeps from its edge, and reopens one caught closing from where it is',()=>{
  const env=stage({height:300});
  vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockImplementation(function(this:HTMLElement){const sheet=this.hasAttribute('data-hig-sheet'),top=sheet?VIEWPORT-312+(env.flight??at(this)):0,size=sheet?300:0;return {x:0,y:top,top,left:0,right:390,bottom:top+size,width:390,height:size,toJSON:()=>({})} as DOMRect;});
  const sheetAt=(open:boolean)=><GestureSheet open={open} onOpenChange={()=>{}} title='Markets'><p data-testid='body'>Body</p></GestureSheet>;
  const view=render(sheetAt(true));const {sheet}=parts();env.arrive(sheet);
  view.rerender(sheetAt(false));expect(at(sheet)).toBe(312);
  env.flight=120;view.rerender(sheetAt(true));env.flight=null;
  expect(screen.getByRole('dialog')).toBe(sheet);expect(timing(sheet)).toEqual(travel('transform'));expect(at(sheet)).toBe(0);
  env.arrive(sheet);expect(sheet.style.transform).toBe('');expect(screen.getByRole('dialog')).toBe(sheet);
 });
 it('travels between detents when the host changes the active one and fades the overlay from the fade detent',()=>{
  const env=stage({height:800});
  const sheetAt=(active:number)=><GestureSheet open onOpenChange={()=>{}} title='Markets' {...snaps} backendProps={{snapPoints:[.25,.75],activeSnapPoint:active,fadeFromIndex:1}}><p data-testid='body'>Body</p></GestureSheet>;
  const view=render(sheetAt(.25));const {sheet,overlay}=parts();
  expect(sheet.getAttribute('data-hig-sheet-snap-points')).toBe('true');expect(at(sheet)).toBe(600);expect(overlay.style.opacity).toBe('0');
  env.arrive(sheet);expect(sheet.style.transform).toBe('translate3d(0,600px,0)');expect(sheet.style.transition).toBe('');expect(overlay.style.opacity).toBe('0');
  view.rerender(sheetAt(.75));
  expect(timing(sheet)).toEqual(travel('transform'));expect(at(sheet)).toBe(200);expect(timing(overlay)).toEqual(travel('opacity'));expect(overlay.style.opacity).toBe('1');
  env.arrive(sheet);expect(sheet.style.transform).toBe('translate3d(0,200px,0)');expect(hinted(sheet)).toBe('');
 });
 it('follows the pointer one to one without a transition, fades the overlay with it and resists past its full height',()=>{
  const env=stage(),moved=vi.fn();
  render(<Sheet backendProps={{onDrag:(_event,share)=>moved(share)}}/>);const {sheet,overlay,body}=parts();env.arrive(sheet);
  const start=pick(body);
  expect(sheet.hasAttribute('data-hig-sheet-dragging')).toBe(true);expect(sheet.style.transition).toBe('none');expect(overlay.style.transition).toBe('none');expect(hinted(sheet)).toBe('transform');expect(at(sheet)).toBe(0);
  pointer('pointermove',body,start.y+100,start.time+16);
  expect(at(sheet)).toBe(100);expect(Number(overlay.style.opacity)).toBeCloseTo(backdropProgress(100,0,400));expect(moved).toHaveBeenLastCalledWith(1-backdropProgress(100,0,400));
  pointer('pointermove',body,start.y+237.5,start.time+32);expect(at(sheet)).toBe(237.5);
  // Past the tallest detent the sheet follows less and less, and a flush sheet trails its fill.
  pointer('pointermove',body,start.y-100,start.time+48);
  expect(at(sheet)).toBeCloseTo(dragPosition(-100,0,0,400,true),2);expect(at(sheet)).toBeGreaterThan(-100);expect(sheet.hasAttribute('data-hig-sheet-overshoot')).toBe(true);expect(overlay.style.opacity).toBe('1');
  pointer('pointerup',body,start.y-100,start.time+300);
  expect(sheet.hasAttribute('data-hig-sheet-dragging')).toBe(false);expect(timing(sheet)).toEqual(travel('transform'));expect(at(sheet)).toBe(0);
  env.arrive(sheet);expect(sheet.hasAttribute('data-hig-sheet-overshoot')).toBe(false);expect(sheet.style.transform).toBe('');
 });
 it('settles a release where the shared rule says: a placement by where it is, a flick by its speed',()=>{
  const cases:[distance:number,duration:number,hold:number][]=[[80,400,200],[150,400,200],[40,40,0],[20,10,0],[60,400,0]];
  for(const [distance,duration,hold] of cases){
   const env=stage(),request=vi.fn(),released=vi.fn();
   render(<Sheet onRequest={request} accept={false} backendProps={{onRelease:(_event,open)=>released(open)}}/>);const {sheet,body}=parts();env.arrive(sheet);
   drag(body,distance,{duration,hold});
   const velocity=hold>100?0:distance/duration*1000,closes=releaseTarget(distance,velocity,[0],400,true,0,false,VIEWPORT)===-1;
   expect(request.mock.calls,`${distance}px in ${duration}ms`).toEqual(closes?[[false]]:[]);expect(released).toHaveBeenCalledWith(!closes);
   // A release that stays open returns on the travel timing; a closing one waits where it is for the host.
   if(closes){expect(sheet.style.transition).toBe('none');expect(at(sheet)).toBe(distance);}else{expect(timing(sheet)).toEqual(travel('transform'));expect(at(sheet)).toBe(0);}
   cleanup();for(const undo of restore.splice(0))undo();vi.restoreAllMocks();
  }
  // The cases cover both outcomes of each kind: a slow release short of and past the closing line, a flick, and a nudge too short to be one.
  expect(cases.map(([distance,duration,hold])=>releaseTarget(distance,hold>100?0:distance/duration*1000,[0],400,true,0,false,VIEWPORT))).toEqual([0,-1,-1,0,0]);
  expect(40/40*1000).toBeGreaterThanOrEqual(SHEET_FLICK);
 });
 it('moves the closing line with closeThreshold',()=>{
  for(const [distance,closes] of [[150,false],[250,true]] as const){
   const env=stage(),request=vi.fn();
   render(<Sheet onRequest={request} accept={false} backendProps={{closeThreshold:.5}}/>);const {sheet,body}=parts();env.arrive(sheet);
   drag(body,distance,{duration:400,hold:200});expect(request.mock.calls).toEqual(closes?[[false]]:[]);
   cleanup();for(const undo of restore.splice(0))undo();vi.restoreAllMocks();
  }
 });
 it('steps between detents on a flick, throws to the tallest, and steps one at a time when sequential',()=>{
  for(const [sequential,expected,offset] of [[false,.75,200],[true,.5,400]] as const){
   const env=stage({height:800}),selected=vi.fn();
   render(<Sheet {...snaps} backendProps={{snapPoints:[.25,.5,.75],fadeFromIndex:2,setActiveSnapPoint:selected,snapToSequentialPoint:sequential}}/>);const {sheet,body}=parts();
   expect(at(sheet)).toBe(600);env.arrive(sheet);
   // Below its tallest detent the sheet moves from anywhere on it, toward open as well.
   drag(body,-90,{duration:30});
   expect(90/30*1000).toBeGreaterThanOrEqual(SHEET_THROW);expect(selected).toHaveBeenCalledWith(expected);expect(timing(sheet)).toEqual(travel('transform'));expect(at(sheet)).toBe(offset);
   cleanup();for(const undo of restore.splice(0))undo();vi.restoreAllMocks();
  }
 });
 it('is caught where it is drawn in the middle of its open travel',()=>{
  const env=stage();
  render(<Sheet/>);const {sheet,overlay,body}=parts();
  expect(timing(sheet)).toEqual(travel('transform'));
  // 150 pixels short of open when the pointer lands.
  env.flight=150;const start=pick(body);env.flight=null;
  expect(sheet.style.transition).toBe('none');expect(at(sheet)).toBe(150);expect(Number(overlay.style.opacity)).toBeCloseTo(backdropProgress(150,0,400));
  pointer('pointermove',body,start.y-50,start.time+16);expect(at(sheet)).toBe(100);
  pointer('pointermove',body,start.y+30,start.time+32);expect(at(sheet)).toBe(180);
  // The travel it interrupted no longer ends anything.
  env.arrive(sheet);expect(at(sheet)).toBe(180);expect(sheet.style.transition).toBe('none');
 });
 it('continues a close from where the drag let go',()=>{
  const env=stage(),request=vi.fn();
  render(<Sheet onRequest={request}/>);const {sheet,body}=parts();env.arrive(sheet);env.starts.length=0;
  drag(body,150,{duration:400,hold:200});
  expect(request).toHaveBeenCalledWith(false);expect(sheet.getAttribute('data-state')).toBe('closed');
  expect(env.starts.find(start=>start.element===sheet)?.transform).toBe('translate3d(0,150px,0)');
  expect(timing(sheet)).toEqual(travel('transform'));expect(at(sheet)).toBe(400);
  env.arrive(sheet);expect(screen.queryByRole('dialog')).toBeNull();
 });
 it('returns to its detent on the travel timing when the host keeps it open, without remounting its children',async()=>{
  const env=stage(),request=vi.fn(),settled=vi.fn();
  render(<Sheet onRequest={request} accept={false} backendProps={{onAnimationEnd:settled}}><input aria-label='Search'/></Sheet>);const {sheet,overlay,body}=parts();env.arrive(sheet);
  const input=screen.getByLabelText('Search');fireEvent.input(input,{target:{value:'BTC'}});
  drag(body,150,{duration:400,hold:200});
  expect(request.mock.calls).toEqual([[false]]);expect(at(sheet)).toBe(150);expect(sheet.style.transition).toBe('none');
  await frame();
  expect(timing(sheet)).toEqual(travel('transform'));expect(at(sheet)).toBe(0);expect(timing(overlay)).toEqual(travel('opacity'));expect(overlay.style.opacity).toBe('1');
  env.arrive(sheet);
  expect(sheet.style.transform).toBe('');expect(screen.getByRole('dialog')).toBe(sheet);expect(screen.getByLabelText('Search')).toBe(input);expect((input as HTMLInputElement).value).toBe('BTC');expect(settled).not.toHaveBeenCalled();
 });
 it('resists a drag toward closed when it cannot be dismissed, and asks for nothing',()=>{
  const env=stage(),request=vi.fn();
  render(<Sheet onRequest={request} backendProps={{dismissible:false}}/>);const {sheet,body}=parts();env.arrive(sheet);
  const start=pick(body);pointer('pointermove',body,start.y+200,start.time+16);
  expect(at(sheet)).toBeCloseTo(dragPosition(200,0,0,400,false),2);expect(at(sheet)).toBeLessThan(200);
  pointer('pointerup',body,start.y+200,start.time+17);
  expect(request).not.toHaveBeenCalled();expect(timing(sheet)).toEqual(travel('transform'));expect(at(sheet)).toBe(0);
 });
 describe('scroll handoff',()=>{
  function scrolling(props:Partial<GestureSheetProps>={},top=120){
   const env=stage(),request=vi.fn();
   render(<Sheet onRequest={request} accept={false} contentMode='custom' {...props}><div data-testid='scroller' style={{overflow:'auto'}}><p data-testid='row'>Row</p></div></Sheet>);
   const all={...parts(),scroller:screen.getByTestId('scroller'),row:screen.getByTestId('row')};
   Object.defineProperties(all.scroller,{scrollHeight:{configurable:true,value:1000},clientHeight:{configurable:true,value:300},scrollTop:{configurable:true,writable:true,value:top}});
   env.arrive(all.sheet);
   return {env,request,...all};
  }
  it('leaves the sheet alone while its content is scrolled away from the top, and for the lock window after',async()=>{
   const {sheet,scroller,row,request}=scrolling({backendProps:{scrollLockTimeout:40}});
   drag(row,150,{duration:400,hold:200});
   expect(sheet.style.transform).toBe('');expect(sheet.hasAttribute('data-hig-sheet-dragging')).toBe(false);expect(request).not.toHaveBeenCalled();
   // Back at the top, the sheet still waits out the lock.
   (scroller as HTMLElement).scrollTop=0;drag(row,150,{duration:400,hold:200});expect(sheet.style.transform).toBe('');expect(request).not.toHaveBeenCalled();
   await new Promise(resolve=>setTimeout(resolve,60));
   drag(row,150,{duration:400,hold:200});expect(request.mock.calls).toEqual([[false]]);expect(at(sheet)).toBe(150);
  });
  it('holds the lock after any scroll of the content',async()=>{
   const {sheet,scroller,row,handle}=scrolling({backendProps:{scrollLockTimeout:10000}},0);
   fireEvent.scroll(scroller);
   const start=pick(row);pointer('pointermove',row,start.y+100,start.time+16);expect(sheet.style.transform).toBe('');pointer('pointerup',row,start.y+100,start.time+17);
   // The handle is never content: it drags the sheet whatever the content has done.
   const grip=pick(handle);pointer('pointermove',handle,grip.y+60,grip.time+16);expect(at(sheet)).toBe(60);
  });
  it('does not read a drag that began as a scroll as a flick',async()=>{
   const flick=async(scrolled:boolean)=>{
    const {scroller,row,request}=scrolling({backendProps:{scrollLockTimeout:20}},scrolled?120:0);
    pointer('pointerdown',row,500,1000);
    // The content scrolls under the pointer first, reaches its top, and the pointer rests past the lock.
    pointer('pointermove',row,520,1016);(scroller as HTMLElement).scrollTop=0;
    await new Promise(resolve=>setTimeout(resolve,40));
    pointer('pointermove',row,523,1100);pointer('pointermove',row,563,1140);pointer('pointerup',row,563,1140);
    const asked=request.mock.calls.length;cleanup();for(const undo of restore.splice(0))undo();vi.restoreAllMocks();return asked;
   };
   // 40 pixels at 1000 px/s closes as a flick, but not when the gesture started by scrolling the content.
   expect(releaseTarget(40,1000,[0],400,true,0,false,VIEWPORT)).toBe(-1);expect(releaseTarget(40,1000,[0],400,true,0,true,VIEWPORT)).toBe(0);
   expect(await flick(false)).toBe(1);expect(await flick(true)).toBe(0);
  });
  it('claims a touch on its first touch move when the sheet takes the drag, and leaves a scroll to the browser',()=>{
   const {sheet,scroller,row}=scrolling({backendProps:{scrollLockTimeout:0}},0);
   const touchMove=(y:number)=>{const event=new Event('touchmove',{bubbles:true,cancelable:true});Object.defineProperties(event,{touches:{value:[{clientX:100,clientY:y}]},timeStamp:{value:1010}});fireEvent(row,event);return event.defaultPrevented;};
   pointer('pointerdown',row,500,1000,{pointerType:'touch'});
   // Six pixels is inside the slop of a finger, but the browser is about to scroll: the touch move decides.
   pointer('pointermove',row,506,1008,{pointerType:'touch'});expect(sheet.hasAttribute('data-hig-sheet-dragging')).toBe(false);
   expect(touchMove(506)).toBe(true);expect(sheet.hasAttribute('data-hig-sheet-dragging')).toBe(true);
   pointer('pointermove',row,546,1030,{pointerType:'touch'});expect(at(sheet)).toBe(40);expect(touchMove(546)).toBe(true);
   // The browser takes the pointer back: the sheet returns.
   pointer('pointercancel',row,546,1040,{pointerType:'touch'});
   expect(sheet.hasAttribute('data-hig-sheet-dragging')).toBe(false);expect(timing(sheet)).toEqual(travel('transform'));expect(at(sheet)).toBe(0);
   (scroller as HTMLElement).scrollTop=120;
   pointer('pointerdown',row,500,2000,{pointerType:'touch'});
   expect(touchMove(520)).toBe(false);expect(sheet.hasAttribute('data-hig-sheet-dragging')).toBe(false);
  });
  it('does not start a drag toward open at full height, across the sheet, over selected text, on a form control or where the host opts out',()=>{
   const {sheet,body,row}=scrolling({backendProps:{scrollLockTimeout:0}},0);
   const tried=(target:Element,dy:number,dx=0)=>{pointer('pointerdown',target,500,1000);pointer('pointermove',target,500+dy,1016,{x:100+dx});pointer('pointermove',target,500+dy*2,1032,{x:100+dx*2});const moved=sheet.style.transform!=='';pointer('pointerup',target,500+dy*2,1500,{x:100+dx*2});return moved;};
   expect(tried(body,-40)).toBe(false);expect(tried(body,10,60)).toBe(false);
   const selection=vi.spyOn(window,'getSelection').mockReturnValue({toString:()=>'Row'} as Selection);expect(tried(row,40)).toBe(false);selection.mockRestore();
   const input=document.createElement('input'),range=Object.assign(document.createElement('input'),{type:'range'}),select=document.createElement('select'),area=document.createElement('textarea'),optOut=document.createElement('div'),inner=document.createElement('span'),checkbox=Object.assign(document.createElement('input'),{type:'checkbox'});
   optOut.setAttribute('data-hig-sheet-no-drag','');optOut.append(inner);sheet.append(input,range,select,area,optOut,checkbox);
   for(const control of [input,range,select,area,inner])expect(tried(control,40),control.tagName).toBe(false);
   // A press on a checkbox, a button or plain content drags.
   expect(tried(checkbox,40)).toBe(true);
  });
  it('lets only the handle drag when handleOnly is set',()=>{
   const env=stage();
   render(<Sheet backendProps={{handleOnly:true}}/>);const {sheet,body,handle}=parts();env.arrive(sheet);
   const start=pick(body);pointer('pointermove',body,start.y+100,start.time+16);expect(sheet.style.transform).toBe('');pointer('pointerup',body,start.y+100,start.time+17);
   const grip=pick(handle.firstElementChild!);pointer('pointermove',handle,grip.y+100,grip.time+16);expect(at(sheet)).toBe(100);
  });
 });
 it('moves without travel under reduced motion while drag and detents still work',()=>{
  const env=stage({height:800}),selected=vi.fn();
  render(<HIGProvider reducedMotion><Sheet {...snaps} backendProps={{snapPoints:[.25,.75],fadeFromIndex:1,setActiveSnapPoint:selected}}/></HIGProvider>);const {sheet,overlay,body}=parts();
  expect(sheet.style.transition).toBe('');expect(hinted(sheet)).toBe('');expect(sheet.style.transform).toBe('translate3d(0,600px,0)');expect(env.travels.size).toBe(0);
  const start=pick(body);pointer('pointermove',body,start.y-250,start.time+300);
  expect(at(sheet)).toBe(350);expect(sheet.style.transition).toBe('none');
  pointer('pointerup',body,start.y-250,start.time+600);
  // Nearest detent, placed at once.
  expect(selected).toHaveBeenCalledWith(.75);expect(sheet.style.transform).toBe('translate3d(0,200px,0)');expect(sheet.style.transition).toBe('');expect(overlay.style.opacity).toBe('');expect(env.travels.size).toBe(0);
 });
 it('swallows the click that ends a drag and lets the next press through',()=>{
  const env=stage(),pressed=vi.fn();
  render(<Sheet><button onClick={pressed}>Row</button></Sheet>);const {sheet}=parts(),button=screen.getByRole('button',{name:'Row'});env.arrive(sheet);
  const start=pick(button);pointer('pointermove',button,start.y+40,start.time+16);pointer('pointerup',button,start.y+40,start.time+400);
  fireEvent.click(button,{detail:1});expect(pressed).not.toHaveBeenCalled();
  fireEvent.click(button,{detail:1});expect(pressed).toHaveBeenCalledOnce();
  // A press that does not move the sheet is a click, and so is a keyboard click after a drag.
  const again=pick(button);pointer('pointermove',button,again.y+40,again.time+16);pointer('pointerup',button,again.y+40,again.time+400);
  fireEvent.click(button,{detail:0});expect(pressed).toHaveBeenCalledTimes(2);
 });
 it('steps up a detent on a handle tap unless preventCycle is set',()=>{
  for(const preventCycle of [false,true]){
   const env=stage({height:800}),selected=vi.fn();
   render(<Sheet {...snaps} handleProps={{preventCycle}} backendProps={{snapPoints:[.25,.75],fadeFromIndex:1,setActiveSnapPoint:selected}}/>);const {sheet,handle}=parts();env.arrive(sheet);
   fireEvent.click(handle);
   if(preventCycle){expect(selected).not.toHaveBeenCalled();expect(at(sheet)).toBe(600);}else{expect(selected).toHaveBeenCalledWith(.75);expect(at(sheet)).toBe(200);}
   expect(handle.hasAttribute('preventcycle')).toBe(false);
   cleanup();for(const undo of restore.splice(0))undo();vi.restoreAllMocks();
  }
 });
 it('reports onAnimationEnd once an open or close the sheet asked for has finished moving',async()=>{
  const env=stage(),settled=vi.fn();
  function Example(){const [open,setOpen]=useState(false);return <GestureSheet open={open} onOpenChange={setOpen} title='Markets' trigger={<button>Open</button>} backendProps={{onAnimationEnd:settled}}><p data-testid='body'>Body</p></GestureSheet>;}
  render(<Example/>);fireEvent.click(screen.getByRole('button',{name:'Open'}));
  const {sheet}=parts();await frame();expect(settled).not.toHaveBeenCalled();
  env.arrive(sheet);expect(settled.mock.calls).toEqual([[true]]);
  fireEvent.keyDown(sheet,{key:'Escape'});expect(settled).toHaveBeenCalledTimes(1);
  env.arrive(sheet);expect(settled.mock.calls).toEqual([[true],[false]]);expect(screen.queryByRole('dialog')).toBeNull();
 });
 it('scales the page behind with the sheet and restores it after the close',()=>{
  const env=stage(),page=document.createElement('div');page.setAttribute('data-hig-sheet-wrapper','');page.style.overflow='auto';document.body.append(page);restore.push(()=>page.remove());
  const sheetAt=(open:boolean)=><GestureSheet open={open} onOpenChange={()=>{}} title='Markets' backendProps={{shouldScaleBackground:true}}><p data-testid='body'>Body</p></GestureSheet>;
  const view=render(sheetAt(true));const {sheet,body}=parts();
  const scale=()=>Number(/scale\(([\d.]+)\)/.exec(page.style.transform)?.[1]);
  expect(timing(page)).toEqual(travel('transform'));expect(scale()).toBeCloseTo(1-26/window.innerWidth);expect(page.style.borderRadius).toBe('8px');expect(page.style.overflow).toBe('hidden');expect(document.body.style.background).toBe('black');
  env.arrive(sheet);expect(page.style.transition).toBe('');
  const start=pick(body);pointer('pointermove',body,start.y+200,start.time+16);
  expect(page.style.transition).toBe('none');expect(scale()).toBeCloseTo(1-26/window.innerWidth*.5);
  pointer('pointerup',body,start.y+200,start.time+17);
  view.rerender(sheetAt(false));expect(timing(page)).toEqual(travel('transform'));expect(scale()).toBe(1);
  env.arrive(sheet);
  expect(page.style.transform).toBe('');expect(page.style.borderRadius).toBe('');expect(page.style.overflow).toBe('auto');expect(document.body.style.background).toBe('');
 });
 it('keeps a bottom sheet above the software keyboard while a field in it is focused, and puts it back after',()=>{
  const env=stage({height:700}),viewport=Object.assign(new EventTarget(),{height:VIEWPORT});vi.stubGlobal('visualViewport',viewport);
  const resize=(height:number)=>act(()=>{viewport.height=height;viewport.dispatchEvent(new Event('resize'));});
  const view=render(<Sheet contentProps={{style:{bottom:12}}}><input aria-label='Search'/></Sheet>);const {sheet}=parts();env.arrive(sheet);
  // The keyboard alone moves nothing; a focused field does.
  resize(500);expect(sheet.style.bottom).toBe('12px');expect(sheet.style.height).toBe('');
  resize(VIEWPORT);screen.getByLabelText('Search').focus();resize(500);
  // 300 pixels of keyboard: the sheet rides up by it and, too tall for what is left, keeps its top edge.
  expect(sheet.style.bottom).toBe('312px');expect(sheet.style.height).toBe(`${500-(VIEWPORT-700)}px`);
  resize(VIEWPORT);expect(sheet.style.bottom).toBe('12px');expect(sheet.style.height).toBe('');
  view.unmount();
  const fixed=render(<Sheet contentProps={{style:{bottom:12}}} backendProps={{fixed:true}}><input aria-label='Search'/></Sheet>);const next=parts().sheet;env.arrive(next);
  screen.getByLabelText('Search').focus();resize(500);expect(next.style.bottom).toBe('312px');expect(next.style.height).toBe('400px');
  fixed.unmount();
  render(<Sheet contentProps={{style:{bottom:12}}} backendProps={{repositionInputs:false}}><input aria-label='Search'/></Sheet>);const still=parts().sheet;env.arrive(still);
  screen.getByLabelText('Search').focus();resize(500);expect(still.style.bottom).toBe('12px');expect(still.style.height).toBe('');
 });
});
