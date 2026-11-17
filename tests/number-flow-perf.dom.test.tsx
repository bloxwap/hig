import React,{Profiler} from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,render} from '@testing-library/react';
import {AnimatedNumberReadout,NumberFlow} from '../packages/hig/react/src/animated-number';
import {numberFlowCommit} from '../packages/hig/react/src/animated-number-flow';
import {HIGProvider} from '../packages/hig/react/src/provider';

/**
 * What a change costs, pinned where scripts/perf/number-flow-web.mjs measured it. jsdom lays nothing out and animates nothing,
 * so both are stood in for and every call is logged: a `read` is a position asked of the layout, a `write` is an animation
 * started. A read that follows a write is a layout the browser has to do again.
 */
let log:('read'|'write')[]=[],finish:(()=>void)[]=[];
const originalAnimate=HTMLElement.prototype.animate,originalRect=HTMLElement.prototype.getBoundingClientRect;
beforeEach(()=>{
 log=[];finish=[];
 Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value(){log.push('write');const animation={cancel:vi.fn(),onfinish:null as (()=>void)|null};finish.push(()=>animation.onfinish?.());return animation as unknown as Animation;}});
 // Ten pixels a character, each part after the one before it, so a figure that gains a place moves its parts.
 Object.defineProperty(HTMLElement.prototype,'getBoundingClientRect',{configurable:true,value(this:HTMLElement){log.push('read');const visual=this.closest('.hig-animated-number-visual'),parts=Array.from(visual?.querySelectorAll<HTMLElement>('[data-hig-flow-key]')??[]),index=parts.indexOf(this),width=10*(this.textContent??'').length,left=parts.slice(0,Math.max(0,index)).reduce((sum,part)=>sum+10*(part.textContent??'').length,0);return {left,right:left+width,top:0,bottom:20,width,height:20,x:left,y:0,toJSON(){return this;}} as DOMRect;}});
});
afterEach(()=>{cleanup();if(originalAnimate)Object.defineProperty(HTMLElement.prototype,'animate',{value:originalAnimate,configurable:true});else delete (HTMLElement.prototype as {animate?:unknown}).animate;Object.defineProperty(HTMLElement.prototype,'getBoundingClientRect',{value:originalRect,configurable:true});vi.restoreAllMocks();});
const usd={style:'currency',currency:'USD'} as const;
const board=(values:readonly number[],onRender:()=>void=()=>{})=><Profiler id='board' onRender={onRender}><HIGProvider>{values.map((value,index)=><p key={index}><NumberFlow value={value} options={usd}/></p>)}</HIGProvider></Profiler>;

describe('NumberFlow under load on web',()=>{
 it('reads every changed figure before any of them writes, so a commit of many figures lays the page out once',()=>{
  const {rerender}=render(board([999.25,12.5,640.75,7.1]));log=[];
  rerender(board([1000.5,13.75,641.25,8.3]));
  expect(log.filter(entry=>entry==='write').length).toBeGreaterThanOrEqual(8);expect(log.filter(entry=>entry==='read').length).toBeGreaterThanOrEqual(8);
  // Figure by figure this was read, write, read, write: every figure after the first paid for a layout of its own.
  expect(log.lastIndexOf('read')).toBeLessThan(log.indexOf('write'));
  // The writes are still made inside the commit: every figure is turning before the browser can paint.
  expect(document.querySelectorAll('.hig-number-flow-window').length).toBeGreaterThanOrEqual(8);expect(document.querySelectorAll('.hig-number-flow-ghost').length+document.querySelectorAll('[data-spinning]').length).toBeGreaterThan(0);
 });
 it('writes in a microtask when a figure that said it would change never reports back, and is itself again afterwards',async()=>{
  const {rerender}=render(board([2]));
  // A figure announced a change and then never finished its commit (a subtree React hid, an error on the way).
  numberFlowCommit.expect();rerender(board([7]));
  expect(document.querySelector('.hig-number-flow-window')).toBeNull();
  await act(async()=>{await Promise.resolve();});
  expect(document.querySelectorAll('.hig-number-flow-window')).toHaveLength(1);
  rerender(board([9]));expect(document.querySelectorAll('.hig-number-flow-glyph').length).toBeGreaterThan(6);
 });
 it('drops what a figure was about to write when its motion is cancelled first',async()=>{
  const {rerender,unmount}=render(board([2]));
  numberFlowCommit.expect();rerender(board([7]));unmount();
  await act(async()=>{await Promise.resolve();});
  expect(log.filter(entry=>entry==='write')).toHaveLength(0);expect(document.querySelector('.hig-number-flow-window')).toBeNull();
 });
 it('commits once for a change and not at all while a roll runs or when it lands',()=>{
  let commits=0;const count=()=>{commits++;},{rerender}=render(board([1234.5,99.75],count));commits=0;
  rerender(board([1240.75,101.25],count));expect(commits).toBe(1);
  // Landing takes the reels away in the DOM the engine made; React is not asked to draw anything.
  act(()=>{for(const land of finish.splice(0))land();});
  expect(commits).toBe(1);expect(document.querySelector('.hig-number-flow-window')).toBeNull();expect(document.querySelector('[data-spinning]')).toBeNull();
 });
 it('does nothing for a figure whose parent drew again with the value it already shows',()=>{
  let commits=0;const count=()=>{commits++;},{rerender}=render(board([1234.5,99.75],count));commits=0;log=[];
  const formatters=vi.spyOn(Intl,'NumberFormat');
  rerender(board([1234.5,99.75],count));
  expect(commits).toBe(1);expect(log).toEqual([]);expect(formatters).not.toHaveBeenCalled();expect(document.querySelector('.hig-number-flow-window')).toBeNull();
 });
});

describe('a turn alone on its strip',()=>{
 // An engine whose animations have a clock that can be set, as every browser's do; the stand-in above has none.
 class Clocked {started:number|null=null;currentTime:number|null=0;onfinish:(()=>void)|null=null;cancel=vi.fn();
  constructor(readonly target:HTMLElement,readonly keyframes:Record<string,unknown[]>,readonly options:KeyframeAnimationOptions){}
  get startTime(){return this.started;}set startTime(time:number|null){this.started=time;}}
 let turns:Clocked[]=[];
 const spins=()=>turns.filter(turn=>turn.target.classList.contains('hig-number-flow-strip')&&turn.cancel.mock.calls.length===0);
 const one=(value:number)=><HIGProvider><NumberFlow value={value}/></HIGProvider>;
 beforeEach(()=>{turns=[];vi.stubGlobal('Animation',Clocked);Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value(this:HTMLElement,keyframes:Record<string,unknown[]>,options:KeyframeAnimationOptions){const turn=new Clocked(this,keyframes,options);turns.push(turn);return turn as unknown as Animation;}});});
 afterEach(()=>{vi.unstubAllGlobals();});
 it('is a plain animation from where the strip is to where it rests, which a compositor can run',()=>{
  const {rerender}=render(one(2));rerender(one(7));
  // The same motion as an additive 500% to 0% over a strip resting at -500%, written without the addition.
  expect(spins()).toHaveLength(1);expect(spins()[0].keyframes).toEqual({transform:['translateY(0%)','translateY(-500%)']});expect(spins()[0].options.composite).toBeUndefined();expect(spins()[0].options.duration).toBe(900);
  expect((document.querySelector('.hig-number-flow-strip') as HTMLElement).style.transform).toBe('translateY(-500%)');
  act(()=>{spins()[0].onfinish?.();});expect(document.querySelector('.hig-number-flow-window')).toBeNull();
 });
 it('is swapped for its additive twin on the same clock when another turn joins it, and later turns only add',()=>{
  const {rerender}=render(one(2));rerender(one(7));const first=spins()[0];first.startTime=1234;first.currentTime=300;
  rerender(one(9));
  expect(first.cancel).toHaveBeenCalledTimes(1);expect(spins()).toHaveLength(2);const [twin,second]=spins();
  expect(twin.keyframes).toEqual({transform:['translateY(500%)','translateY(0%)']});expect(twin.options.composite).toBe('add');expect(twin.startTime).toBe(1234);
  expect(second.keyframes).toEqual({transform:['translateY(200%)','translateY(0%)']});expect(second.options.composite).toBe('add');expect(second.startTime).toBeNull();
  expect((document.querySelector('.hig-number-flow-strip') as HTMLElement).style.transform).toBe('translateY(-700%)');
  rerender(one(8));expect(spins()).toHaveLength(3);expect(twin.cancel).not.toHaveBeenCalled();const third=spins()[2];expect(third.options.composite).toBe('add');
  // The reel is taken away when the last of them lands, the twin included.
  act(()=>{twin.onfinish?.();second.onfinish?.();});expect(document.querySelector('.hig-number-flow-window')).not.toBeNull();
  act(()=>{third.onfinish?.();});expect(document.querySelector('.hig-number-flow-window')).toBeNull();
  // With the reel gone the next turn is alone again.
  rerender(one(3));expect(turns[turns.length-1].options.composite).toBeUndefined();expect(turns[turns.length-1].keyframes).toEqual({transform:['translateY(0%)','translateY(500%)']});
 });
 it('slides a part alone as a plain animation too, and adds once another slide joins it',()=>{
  const slides=()=>turns.filter(turn=>String(turn.keyframes.transform?.[0]).startsWith('translateX')&&turn.cancel.mock.calls.length===0);
  // 999 to 1,000: the three digits make room for a place and its separator, twenty pixels in the stand-in layout.
  const {rerender}=render(one(999));rerender(one(1000));const first=slides();
  expect(first).toHaveLength(5);expect(first.every(turn=>turn.options.composite===undefined&&turn.keyframes.transform[1]==='translateX(0px)')).toBe(true);
  expect(first.filter(turn=>turn.target.dataset.higFlowKey==='digit:number:0').map(turn=>turn.keyframes.transform[0])).toEqual(['translateX(-20px)']);
  for(const turn of first)turn.startTime=500;
  // 10,000 while they slide: every part moves again, so each first slide hands over to its additive twin.
  rerender(one(10000));
  expect(first.every(turn=>turn.cancel.mock.calls.length===1)).toBe(true);
  const ones=slides().filter(turn=>turn.target.dataset.higFlowKey==='digit:number:0');
  expect(ones.map(turn=>[turn.keyframes.transform[0],turn.options.composite,turn.startTime])).toEqual([['translateX(-20px)','add',500],['translateX(-10px)','add',null]]);
  // Landed, the part is alone again.
  act(()=>{for(const turn of turns)turn.onfinish?.();});const landed=turns.length;rerender(one(100000));
  expect(turns.slice(landed).filter(turn=>turn.target.dataset.higFlowKey==='digit:number:0').map(turn=>[turn.keyframes.transform[0],turn.options.composite])).toEqual([['translateX(-10px)',undefined]]);
 });
 it('joins a turn that has not started yet at the same point, so both start together',()=>{
  const {rerender}=render(one(2));rerender(one(7));const first=spins()[0];
  rerender(one(9));const [twin]=spins();
  expect(first.cancel).toHaveBeenCalledTimes(1);expect(twin.startTime).toBeNull();expect(twin.currentTime).toBe(0);expect(twin.options.composite).toBe('add');
 });
});

describe('formatting under load on web',()=>{
 it('builds one formatter and one set of digit glyphs for each locale and set of options, whatever the values',()=>{
  const {rerender}=render(board([1,2,3]));
  // A fresh double clears what was kept, as a polyfill installed later would.
  const Original=Intl.NumberFormat,formatters=vi.spyOn(Intl,'NumberFormat').mockImplementation(function(locale?:string|string[],options?:Intl.NumberFormatOptions){return new Original(locale,options);} as unknown as typeof Intl.NumberFormat);
  for(let step=1;step<=20;step++)rerender(board([1+step*1.25,2+step*7.5,3+step*0.01]));
  // Sixty new values in one format: the formatter, and the one that names its digits. It was two of each for every value.
  expect(formatters).toHaveBeenCalledTimes(2);
  // The same options written out again are the same format; other options are another.
  rerender(<HIGProvider><NumberFlow value={5} options={{style:'currency',currency:'USD'}}/><AnimatedNumberReadout value={6} options={{...usd}}/></HIGProvider>);expect(formatters).toHaveBeenCalledTimes(2);
  rerender(<HIGProvider><NumberFlow value={5} options={{style:'percent'}}/></HIGProvider>);expect(formatters).toHaveBeenCalledTimes(4);
 });
 it('formats with whatever Intl.NumberFormat is installed now, not one it kept from before',()=>{
  const {rerender,container}=render(<HIGProvider><NumberFlow value={12}/></HIGProvider>);expect(container.querySelector('.hig-sr-only')?.textContent).toBe('12');
  const Original=Intl.NumberFormat,spy=vi.spyOn(Intl,'NumberFormat').mockImplementation(function(locale?:string|string[],options?:Intl.NumberFormatOptions){const formatter=new Original(locale,options);return {format:(value:number)=>`~${formatter.format(value)}`,formatToParts:(value:number)=>formatter.formatToParts(value),resolvedOptions:()=>formatter.resolvedOptions()};} as unknown as typeof Intl.NumberFormat);
  rerender(<HIGProvider><NumberFlow value={13}/></HIGProvider>);expect(container.querySelector('.hig-sr-only')?.textContent).toBe('~13');
  spy.mockRestore();
  rerender(<HIGProvider><NumberFlow value={14}/></HIGProvider>);expect(container.querySelector('.hig-sr-only')?.textContent).toBe('14');
 });
});
