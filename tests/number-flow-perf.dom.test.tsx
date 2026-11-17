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
