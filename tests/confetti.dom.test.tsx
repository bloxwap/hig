// @vitest-environment jsdom
import React,{StrictMode} from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,render} from '@testing-library/react';
import {nativeDisplayP3,nativeSrgb} from '@bloxwap/hig/tokens';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {Confetti,confetti,mirrorConfetti} from '../packages/hig/react/src/confetti';
/** A stand-in 2D context that records what is painted; jsdom has no canvas. */
function fakeContext(){
 const calls:[string,...number[]][]=[],fills:{color:string;alpha:number}[]=[],colors:string[]=[];let fillStyle='';
 const record=(name:string)=>(...args:number[])=>{calls.push([name,...args]);};
 const context={globalAlpha:1,get fillStyle(){return fillStyle;},set fillStyle(value:string){fillStyle=value;colors.push(value);},clearRect:record('clearRect'),beginPath:record('beginPath'),moveTo:record('moveTo'),lineTo:record('lineTo'),closePath:record('closePath'),ellipse:record('ellipse'),setTransform:record('setTransform'),fill(){fills.push({color:context.fillStyle,alpha:context.globalAlpha});calls.push(['fill']);}};
 /** `colors` is every fill colour set, in order; `fills` is every piece painted. */
 return {context,calls,fills,colors};
}
let painted=fakeContext(),frames=new Map<number,FrameRequestCallback>(),nextFrame=1,queries:Record<string,boolean>={};
const getContext=vi.fn<(kind:string,settings?:{colorSpace?:string})=>unknown>(()=>painted.context);
/** Runs the one pending animation frame at `time` milliseconds. */
const step=(time:number)=>{const pending=[...frames.values()];frames.clear();for(const callback of pending)callback(time);};
const canvases=()=>[...document.querySelectorAll<HTMLCanvasElement>('canvas[data-hig-confetti]')];
const settled=async(promise:Promise<void>)=>{let done=false;void promise.then(()=>{done=true;});await Promise.resolve();await Promise.resolve();return done;};
beforeEach(()=>{
 painted=fakeContext();frames=new Map();nextFrame=1;queries={};getContext.mockClear();getContext.mockImplementation(()=>painted.context);
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(getContext as never);
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{frames.set(nextFrame,callback);return nextFrame++;});
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>{frames.delete(id);});
 vi.stubGlobal('matchMedia',(query:string)=>({matches:Object.entries(queries).some(([key,value])=>value&&query.includes(key)),media:query,addEventListener(){},removeEventListener(){}}));
 Object.defineProperty(window,'devicePixelRatio',{value:2,configurable:true});
});
afterEach(()=>{confetti.reset();cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('confetti on web',()=>{
 it('draws on one full-viewport canvas that takes no pointer events, is hidden from assistive technology and is sized for the device pixel ratio',()=>{
  void confetti({particleCount:10,colors:['red']});void confetti({particleCount:5,colors:['blue'],zIndex:7});
  expect(canvases()).toHaveLength(1);const [canvas]=canvases();
  expect(canvas.parentElement).toBe(document.body);expect(canvas.getAttribute('aria-hidden')).toBe('true');
  expect(canvas.style.position).toBe('fixed');expect(canvas.style.pointerEvents).toBe('none');expect(canvas.style.width).toBe('100%');expect(canvas.style.height).toBe('100%');
  // The first burst creates the canvas, so its zIndex (the default 100 here) is the one used.
  expect(canvas.style.zIndex).toBe('100');
  // Both bursts share one frame loop.
  expect(frames.size).toBe(1);
  step(0);
  expect(canvas.width).toBe(window.innerWidth*2);expect(canvas.height).toBe(window.innerHeight*2);
  expect(painted.calls.filter(([name])=>name==='setTransform')).toEqual([['setTransform',2,0,0,2,0,0]]);
  // Cleared in CSS pixels, then every piece is one path filled once; the fill colour is set once for each colour of each burst.
  expect(painted.calls[1]).toEqual(['clearRect',0,0,window.innerWidth,window.innerHeight]);
  expect(painted.fills).toHaveLength(15);expect(painted.calls.filter(([name])=>name==='beginPath')).toHaveLength(15);expect(painted.colors).toEqual(['red','blue']);expect(frames.size).toBe(1);
 });
 it('runs on time, resolves when the last piece has gone, then removes the canvas and stops asking for frames',async()=>{
  const remove=vi.spyOn(window,'removeEventListener');
  const promise=confetti({particleCount:4,ticks:60,colors:['red']});
  step(1000);expect(painted.fills.at(-1)!.alpha).toBeCloseTo(1-1/60);
  // Half way: tick 1 + 29.5 of the 59 ticks it is drawn for.
  step(1000+29.5*1000/60);expect(painted.fills.at(-1)!.alpha).toBeCloseTo(1-30.5/60);expect(painted.fills).toHaveLength(8);
  expect(await settled(promise)).toBe(false);expect(canvases()).toHaveLength(1);
  // Frames at 120 Hz or a single late one end it at the same moment: 59 ticks after the first frame.
  step(1000+58.9*1000/60);expect(await settled(promise)).toBe(false);
  step(1000+59*1000/60+0.01);expect(await settled(promise)).toBe(true);
  expect(canvases()).toHaveLength(0);expect(frames.size).toBe(0);expect(remove).toHaveBeenCalledWith('resize',expect.any(Function));
  // The next burst starts again with a new canvas.
  void confetti({particleCount:1});expect(canvases()).toHaveLength(1);
 });
 it('a burst that ends leaves the others flying',async()=>{
  const short=confetti({particleCount:2,ticks:10,colors:['red']}),long=confetti({particleCount:2,ticks:100,colors:['blue']});
  step(0);step(500);
  expect(await settled(short)).toBe(true);expect(await settled(long)).toBe(false);expect(canvases()).toHaveLength(1);expect(painted.fills.at(-1)!.color).toBe('blue');
  step(5000);expect(await settled(long)).toBe(true);expect(canvases()).toHaveLength(0);
 });
 it('asks for a Display P3 canvas on a wide-gamut screen and an sRGB one elsewhere',()=>{
  void confetti({particleCount:1});expect(getContext.mock.calls).toEqual([['2d']]);
  confetti.reset();getContext.mockClear();queries['color-gamut: p3']=true;
  void confetti({particleCount:1});expect(getContext.mock.calls).toEqual([['2d',{colorSpace:'display-p3'}]]);
  // An engine that refuses the setting still gets a canvas.
  confetti.reset();getContext.mockClear();getContext.mockImplementation((_kind,settings)=>settings?null:painted.context);
  void confetti({particleCount:1});expect(getContext.mock.calls).toEqual([['2d',{colorSpace:'display-p3'}],['2d']]);expect(canvases()).toHaveLength(1);
 });
 it('paints the token roles by default: Display P3 where the browser parses it, sRGB elsewhere',()=>{
  void confetti({particleCount:5});step(0);
  expect(painted.fills.map(fill=>fill.color)).toEqual([nativeSrgb.action,nativeSrgb.info,nativeSrgb.sell,nativeSrgb.warning,nativeSrgb.buy]);
  confetti.reset();painted=fakeContext();vi.stubGlobal('CSS',{supports:(property:string,value:string)=>property==='color'&&value.startsWith('color(display-p3')});
  void confetti({particleCount:5});step(0);
  const channels=(hex:string)=>[1,3,5].map(at=>parseInt(hex.slice(at,at+2),16)/255);
  expect(painted.fills.map(fill=>fill.color)).toHaveLength(5);
  painted.fills.forEach((fill,index)=>{
   const match=/^color\(display-p3 ([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(fill.color);expect(match,fill.color).not.toBeNull();
   const role=(['action','info','sell','warning','buy'] as const)[index];
   channels(nativeDisplayP3[role]).forEach((channel,at)=>expect(Number(match![at+1])).toBeCloseTo(channel,3));
  });
 });
 it('reads the provider\'s colours from the --hig-* variables at the host, so primaryColor, marketColors and the P3 values of the stylesheet apply',()=>{
  const read=vi.spyOn(window,'getComputedStyle');
  const variables:Record<string,string>={'--hig-action':' color(display-p3 0 1 0.24)','--hig-info':'#35b5ff','--hig-sell':'pink','--hig-buy':'lime','--hig-warning':'yellow','--hig-up':'crimson'};
  read.mockImplementation(()=>({getPropertyValue:(name:string)=>variables[name]??''}) as CSSStyleDeclaration);
  render(<HIGProvider><Confetti/></HIGProvider>);
  void confetti({particleCount:5});step(0);
  // The host's anchor is the element read; `down` falls back to `sell` while `up` is overridden.
  expect(read).toHaveBeenCalledWith(document.querySelector('[data-hig-confetti-host]'));
  expect(painted.fills.map(fill=>fill.color)).toEqual(['color(display-p3 0 1 0.24)','#35b5ff','pink','yellow','crimson']);
  // Colours named by the call need no style read at all.
  read.mockClear();void confetti({particleCount:2,colors:['#fff']});expect(read).not.toHaveBeenCalled();
 });
 it('draws nothing under reduced motion unless the call opts out',async()=>{
  render(<HIGProvider reducedMotion><Confetti/></HIGProvider>);
  expect(await settled(confetti({particleCount:20}))).toBe(true);expect(canvases()).toHaveLength(0);expect(frames.size).toBe(0);
  void confetti({particleCount:20,disableForReducedMotion:false});expect(canvases()).toHaveLength(1);
 });
 it('without a host follows the operating system\'s reduced motion setting',async()=>{
  queries['prefers-reduced-motion: reduce']=true;
  expect(await settled(confetti())).toBe(true);expect(canvases()).toHaveLength(0);
  // A host's provider decides instead when one is mounted.
  render(<HIGProvider reducedMotion={false}><Confetti/></HIGProvider>);
  void confetti();expect(canvases()).toHaveLength(1);
 });
 it('resolves at once when there is nothing to draw or nothing to draw on',async()=>{
  expect(await settled(confetti({particleCount:0}))).toBe(true);expect(canvases()).toHaveLength(0);
  getContext.mockImplementation(()=>null);
  expect(await settled(confetti({particleCount:3}))).toBe(true);expect(canvases()).toHaveLength(0);expect(frames.size).toBe(0);
 });
 it('reset stops every burst, removes the canvas and resolves the promises',async()=>{
  const first=confetti({particleCount:3}),second=confetti({particleCount:3});step(0);
  confetti.reset();
  expect(canvases()).toHaveLength(0);expect(frames.size).toBe(0);expect(await settled(first)).toBe(true);expect(await settled(second)).toBe(true);
  expect(()=>confetti.reset()).not.toThrow();
 });
 it('measures again after the window is resized, not on every frame',()=>{
  void confetti({particleCount:1});step(0);step(16);step(32);
  expect(painted.calls.filter(([name])=>name==='setTransform')).toHaveLength(1);
  Object.defineProperty(window,'devicePixelRatio',{value:3,configurable:true});window.dispatchEvent(new Event('resize'));step(48);
  expect(painted.calls.filter(([name])=>name==='setTransform').at(-1)).toEqual(['setTransform',3,0,0,3,0,0]);expect(canvases()[0].width).toBe(window.innerWidth*3);
 });
 it('starts each piece at the origin and draws a square as canvas-confetti\'s four-point outline',()=>{
  void confetti({particleCount:40,shapes:['square'],colors:['red'],origin:{x:0.25,y:0.5},startVelocity:0,gravity:0,ticks:400});step(0);step(700);
  const moves=painted.calls.map((call,index)=>[call,index] as const).filter(([call])=>call[0]==='moveTo');
  expect(moves).toHaveLength(80);
  for(const [call,index] of moves){
   // No launch speed and no gravity: every square stays on the origin, a quarter of the way across and half way down.
   expect(call[1]).toBeCloseTo(window.innerWidth*0.25);expect(call[2]).toBeCloseTo(window.innerHeight*0.5);
   expect(painted.calls[index-1][0]).toBe('beginPath');expect(painted.calls.slice(index+1,index+6).map(([name])=>name)).toEqual(['lineTo','lineTo','lineTo','closePath','fill']);
   // A parallelogram: the third corner is the first plus both edges.
   const [[,x0,y0],[,x1,y1],[,x2,y2],[,x3,y3]]=painted.calls.slice(index,index+4);
   expect(x2-x0).toBeCloseTo(x1-x0+(x3-x0));expect(y2-y0).toBeCloseTo(y1-y0+(y3-y0));
   // Its long edges are at most the piece's 10 pixels and its short ones the flutter, under 3.
   expect(Math.abs(x1-x0)).toBeLessThanOrEqual(10);expect(Math.abs(y3-y0)).toBeLessThanOrEqual(10);expect(Math.hypot(y1-y0,x3-x0)).toBeLessThan(3);
  }
 });
 it('draws circles as turning ellipses and stars as ten-point outlines',()=>{
  void confetti({particleCount:3,shapes:['circle'],colors:['red']});void confetti({particleCount:2,shapes:['star'],colors:['blue'],scalar:2});step(0);
  const ellipses=painted.calls.filter(([name])=>name==='ellipse');expect(ellipses).toHaveLength(3);
  for(const [,, ,rx,ry,,from,to] of ellipses){expect(rx).toBeGreaterThanOrEqual(0);expect(rx).toBeLessThanOrEqual(6);expect(ry).toBeGreaterThanOrEqual(0);expect(ry).toBeLessThanOrEqual(6);expect(from).toBe(0);expect(to).toBeCloseTo(Math.PI*2);}
  // A star: one moveTo and nine lineTo, its outer points 16 pixels from the centre at scalar 2.
  expect(painted.calls.filter(([name])=>name==='lineTo')).toHaveLength(18);
 });
 it('Confetti fires its options for a truthy trigger, on mount and on each change, once each',()=>{
  const view=render(<StrictMode><HIGProvider><Confetti trigger={0} options={{particleCount:3,colors:['red']}}/></HIGProvider></StrictMode>);
  expect(canvases()).toHaveLength(0);
  view.rerender(<StrictMode><HIGProvider><Confetti trigger={1} options={[{particleCount:3,colors:['red']},{particleCount:3,colors:['blue']}]}/></HIGProvider></StrictMode>);
  expect(canvases()).toHaveLength(1);step(0);expect(painted.colors).toEqual(['red','blue']);expect(painted.fills).toHaveLength(6);
  // The same value again fires nothing; a falsy one fires nothing; the next truthy one fires.
  painted.colors.length=0;view.rerender(<StrictMode><HIGProvider><Confetti trigger={1} options={{particleCount:3,colors:['green']}}/></HIGProvider></StrictMode>);step(16);expect(painted.colors).toEqual(['red','blue']);
  painted.colors.length=0;view.rerender(<StrictMode><HIGProvider><Confetti trigger={null} options={{particleCount:3,colors:['green']}}/></HIGProvider></StrictMode>);step(32);expect(painted.colors).toEqual(['red','blue']);
  painted.colors.length=0;view.rerender(<StrictMode><HIGProvider><Confetti trigger={2} options={{particleCount:3,colors:['green']}}/></HIGProvider></StrictMode>);step(48);expect(painted.colors).toEqual(['red','blue','green']);
  view.unmount();confetti.reset();painted=fakeContext();
  // A truthy trigger at mount fires once, also under StrictMode's doubled effects.
  render(<StrictMode><HIGProvider><Confetti trigger='order-1' options={{particleCount:3,colors:['red']}}/></HIGProvider></StrictMode>);step(0);
  expect(painted.colors).toEqual(['red']);expect(painted.fills).toHaveLength(3);
 });
 it('the host renders one hidden anchor and never renders again while a burst flies',()=>{
  let renders=0;function Screen(){renders++;return <Confetti/>;}
  const view=render(<HIGProvider><Screen/></HIGProvider>);
  const anchor=view.container.querySelector('[data-hig-confetti-host]')!;expect(anchor.hasAttribute('hidden')).toBe(true);expect(anchor.childElementCount).toBe(0);
  const before=renders;
  act(()=>{void confetti({particleCount:30});for(let time=0;time<1000;time+=16)step(time);});
  expect(renders).toBe(before);expect(painted.calls.filter(([name])=>name==='clearRect').length).toBeGreaterThan(60);
  // Unmounting the host takes it out of the registry: the next call reads the document.
  view.unmount();confetti.reset();const read=vi.spyOn(window,'getComputedStyle');void confetti({particleCount:1});expect(read).toHaveBeenCalledWith(document.documentElement);
 });
 it('exports the mirror helper for right-to-left cannons',()=>{
  expect(mirrorConfetti({angle:60,origin:{x:0}})).toMatchObject({angle:120,origin:{x:1}});
 });
});
