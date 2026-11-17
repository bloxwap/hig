// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {act,cleanup,render} from '@testing-library/react';
import {GestureSheetView} from '../packages/hig/react/src/gesture-sheet';
import {HIGProvider} from '../packages/hig/react/src/provider';
type Fake={frames:Keyframe[];options:KeyframeAnimationOptions;onfinish:(()=>void)|null;oncancel:(()=>void)|null};
let restore:(()=>void)|undefined;
function waapi(){
 const animations:Fake[]=[],original=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'animate');
 Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,writable:true,value:vi.fn((frames:Keyframe[],options:KeyframeAnimationOptions)=>{const animation:Fake={frames,options,onfinish:null,oncancel:null};animations.push(animation);return animation as unknown as Animation;})});
 restore=()=>{if(original)Object.defineProperty(HTMLElement.prototype,'animate',original);else delete (HTMLElement.prototype as {animate?:unknown}).animate;};
 return animations;
}
afterEach(()=>{cleanup();restore?.();restore=undefined;vi.restoreAllMocks();});
const views=()=>[...document.querySelectorAll<HTMLElement>('.hig-gesture-view')];
describe('GestureSheetView',()=>{
 it('shows the first view without motion, then swaps views: the old one leaves out of flow and inert while the new one enters',()=>{
  const animations=waapi();
  const view=render(<GestureSheetView viewKey='a'><p>First</p></GestureSheetView>);
  expect(views().map(node=>node.textContent)).toEqual(['First']);expect(animations).toHaveLength(0);
  view.rerender(<GestureSheetView viewKey='b'><p>Second</p></GestureSheetView>);
  expect(views().map(node=>node.textContent)).toEqual(['First','Second']);
  const [leaving,entering]=views();
  expect(leaving.hasAttribute('data-leaving')).toBe(true);expect(leaving.getAttribute('aria-hidden')).toBe('true');expect(leaving.hasAttribute('inert')).toBe(true);expect(entering.hasAttribute('data-leaving')).toBe(false);
  // In, then out: fade with a slight scale. The new view arrives in 220ms, the old one leaves in 270ms.
  expect(animations.map(animation=>animation.frames)).toEqual([[{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'scale(1)'}],[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.96)'}]]);
  expect(animations.map(animation=>animation.options.duration)).toEqual([220,270]);expect(animations.every(animation=>animation.options.easing==='cubic-bezier(.26,.08,.25,1)')).toBe(true);
  act(()=>animations[1].onfinish?.());expect(views().map(node=>node.textContent)).toEqual(['Second']);
 });
 it('with depth, a deeper view pushes in from the trailing side and a shallower one pops back, mirrored in right-to-left text',()=>{
  const animations=waapi();
  const frames=()=>animations.splice(0).map(animation=>animation.frames.map(frame=>frame.transform));
  const view=render(<GestureSheetView viewKey='menu' depth={0}><p>Menu</p></GestureSheetView>);
  view.rerender(<GestureSheetView viewKey='detail' depth={1}><p>Detail</p></GestureSheetView>);
  // Push: the new view arrives from the right, the old one leaves to the left. Both still cross-fade.
  expect(frames()).toEqual([['translateX(30%)','translateX(0%)'],['translateX(0%)','translateX(-30%)']]);
  view.rerender(<GestureSheetView viewKey='deeper' depth={2}><p>Deeper</p></GestureSheetView>);expect(frames()).toEqual([['translateX(30%)','translateX(0%)'],['translateX(0%)','translateX(-30%)']]);
  // Pop: the reverse.
  view.rerender(<GestureSheetView viewKey='detail' depth={1}><p>Detail</p></GestureSheetView>);expect(frames()).toEqual([['translateX(-30%)','translateX(0%)'],['translateX(0%)','translateX(30%)']]);
  // The same depth, or no depth, cross-fades in place.
  view.rerender(<GestureSheetView viewKey='sibling' depth={1}><p>Sibling</p></GestureSheetView>);expect(frames()).toEqual([['scale(.96)','scale(1)'],['scale(1)','scale(.96)']]);
  cleanup();animations.length=0;
  const rtl=render(<HIGProvider direction='rtl'><GestureSheetView viewKey='menu' depth={0}><p>Menu</p></GestureSheetView></HIGProvider>);
  rtl.rerender(<HIGProvider direction='rtl'><GestureSheetView viewKey='detail' depth={1}><p>Detail</p></GestureSheetView></HIGProvider>);
  expect(frames()).toEqual([['translateX(-30%)','translateX(0%)'],['translateX(0%)','translateX(30%)']]);
 });
 it('updates a view in place while its key stays the same',()=>{
  const animations=waapi();
  const view=render(<GestureSheetView viewKey='a'><p>One</p></GestureSheetView>);view.rerender(<GestureSheetView viewKey='a'><p>Two</p></GestureSheetView>);
  expect(views().map(node=>node.textContent)).toEqual(['Two']);expect(animations).toHaveLength(0);
 });
 it('swaps at once under reduced motion and where the browser cannot animate',()=>{
  const animations=waapi();
  let view=render(<HIGProvider reducedMotion><GestureSheetView viewKey='a'><p>First</p></GestureSheetView></HIGProvider>);
  view.rerender(<HIGProvider reducedMotion><GestureSheetView viewKey='b'><p>Second</p></GestureSheetView></HIGProvider>);
  expect(views().map(node=>node.textContent)).toEqual(['Second']);expect(animations).toHaveLength(0);
  cleanup();restore?.();restore=undefined;
  view=render(<GestureSheetView viewKey='a'><p>First</p></GestureSheetView>);view.rerender(<GestureSheetView viewKey='b'><p>Second</p></GestureSheetView>);
  expect(views().map(node=>node.textContent)).toEqual(['Second']);
 });
 it('a leaving view never makes the sheet scrollable or draws a scrollbar',()=>{
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  expect(css).toContain('.hig-gesture-views { position:relative;min-width:0;overflow-x:clip; }');
  expect(css).toContain(".hig-gesture-view[data-leaving] { position:absolute;inset-block-start:0;inset-inline:0;pointer-events:none; }");
  expect(css).toContain(".hig-gesture-dynamic:has(.hig-gesture-view[data-leaving]) { overflow:visible; }");
  expect(css).toContain(":is(.hig-gesture-sheet,.hig-gesture-dynamic):has(.hig-gesture-view[data-leaving]) { scrollbar-width:none; }");
 });
 it('keeps host attributes and the layout class the stylesheet positions',()=>{
  render(<GestureSheetView viewKey='a' className='steps' data-flow='buy'><p>First</p></GestureSheetView>);
  const host=document.querySelector('.hig-gesture-views')!;expect(host.classList.contains('steps')).toBe(true);expect(host.getAttribute('data-flow')).toBe('buy');
 });
});
