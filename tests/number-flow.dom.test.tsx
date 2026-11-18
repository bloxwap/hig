import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,render,screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {AnimatedNumberReadout,NumberFlow,NumberFlowGroup,type AnimatedNumberProps} from '../packages/hig/react/src/animated-number';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {numberFlowCurve} from '../packages/hig/contracts/src/number-flow';

/**
 * jsdom lays nothing out and animates nothing, so both are stood in for: every part is ten pixels per character, in document
 * order, and `animate` records what it was asked to do and finishes when the test says so.
 */
interface Recorded {target:HTMLElement;keyframes:Record<string,unknown[]>;options:KeyframeAnimationOptions;cancel:ReturnType<typeof vi.fn>;onfinish:(()=>void)|null}
let animations:Recorded[]=[];
const originalAnimate=HTMLElement.prototype.animate,originalRect=HTMLElement.prototype.getBoundingClientRect;
const rect=(left:number,width:number)=>({left,right:left+width,top:0,bottom:20,width,height:20,x:left,y:0,toJSON(){return this;}}) as DOMRect;
function partRect(element:HTMLElement):DOMRect{
 // A figure starts wherever its paragraph says: `data-right` pins its right edge instead of its left.
 const visual=element.closest<HTMLElement>('.hig-animated-number-visual');if(!visual)return rect(0,0);
 const parts=Array.from(visual.querySelectorAll<HTMLElement>('[data-hig-flow-key]')).filter(part=>!part.classList.contains('hig-number-flow-ghost'));
 const widths=parts.map(part=>10*Array.from((part.querySelector('.hig-number-flow-digit')??part).textContent??'').length),total=widths.reduce((sum,width)=>sum+width,0);
 const shell=visual.closest<HTMLElement>('[data-start],[data-right]'),start=shell?.dataset.right!==undefined?Number(shell.dataset.right)-total:Number(shell?.dataset.start??0);
 const leftOf=(index:number)=>start+widths.slice(0,index).reduce((sum,width)=>sum+width,0);
 if(element===visual||element.parentElement===visual&&element.classList.contains('hig-number-flow-ghosts'))return rect(start,total);
 if(element.classList.contains('hig-number-flow-digits')||element.classList.contains('hig-number-flow-ghosts')){const box=element.classList.contains('hig-number-flow-digits')?element:element.parentElement as HTMLElement,inside=parts.map((part,index)=>({part,index})).filter(({part})=>box.contains(part));
  return inside.length?rect(leftOf(inside[0].index),inside.reduce((sum,{index})=>sum+widths[index],0)):rect(start,0);}
 if(element.classList.contains('hig-number-flow-ghost'))return rect(partRect(element.parentElement as HTMLElement).left+parseFloat(element.style.left||'0'),10);
 const index=parts.indexOf(element);return index<0?rect(0,0):rect(leftOf(index),widths[index]);
}
beforeEach(()=>{
 animations=[];
 Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value(this:HTMLElement,keyframes:Record<string,unknown[]>,options:KeyframeAnimationOptions){const animation:Recorded={target:this,keyframes,options,cancel:vi.fn(),onfinish:null};animations.push(animation);return animation as unknown as Animation;}});
 Object.defineProperty(HTMLElement.prototype,'getBoundingClientRect',{configurable:true,value(this:HTMLElement){return partRect(this);}});
});
afterEach(()=>{cleanup();if(originalAnimate)Object.defineProperty(HTMLElement.prototype,'animate',{value:originalAnimate,configurable:true});else delete (HTMLElement.prototype as {animate?:unknown}).animate;Object.defineProperty(HTMLElement.prototype,'getBoundingClientRect',{value:originalRect,configurable:true});vi.restoreAllMocks();});

const finishAll=()=>act(()=>{for(const animation of animations.splice(0))animation.onfinish?.();});
const of=(kind:'spin'|'slide'|'fade'|'clip')=>animations.filter(animation=>kind==='spin'?animation.target.classList.contains('hig-number-flow-strip'):kind==='slide'?typeof animation.keyframes.transform?.[0]==='string'&&(animation.keyframes.transform[0] as string).startsWith('translateX'):kind==='fade'?'opacity' in animation.keyframes:'clipPath' in animation.keyframes);
const place=(key:string)=>document.querySelector<HTMLElement>(`[data-hig-flow-key="${key}"]`) as HTMLElement;
/** The glyphs of a place's strip from top to bottom, which is the order they pass through the window going up. */
const row=(glyph:HTMLElement)=>parseFloat(glyph.style.transform.slice('translateY('.length));
const strip=(key:string)=>Array.from(place(key).querySelectorAll<HTMLElement>('.hig-number-flow-glyph')).sort((first,second)=>row(first)-row(second)).map(glyph=>glyph.textContent?.replaceAll('\n','')).join('');
/** What the figure reads once everything that is only passing through is taken away. */
const drawn=(root:ParentNode=document)=>{const copy=(root.querySelector('.hig-animated-number-visual') as HTMLElement).cloneNode(true) as HTMLElement;copy.querySelectorAll('.hig-number-flow-window,.hig-number-flow-ghosts').forEach(node=>node.remove());return copy.textContent;};
const flow=(props:Partial<AnimatedNumberProps>&{value:AnimatedNumberProps['value']},provider:React.ComponentProps<typeof HIGProvider>={})=><HIGProvider {...provider}><NumberFlow label='Price' {...props}/></HIGProvider>;

describe('NumberFlow on web',()=>{
 it('draws the first value still, as plain parts with one hidden reading, and the same markup on the server',()=>{
  const view=flow({value:1234.5,prefix:'$',suffix:' USD'});render(view);
  expect(animations).toHaveLength(0);expect(screen.getByLabelText('Price: $1,234.5 USD')).toBeTruthy();expect(drawn()).toBe('$1,234.5 USD');
  expect(document.querySelector('.hig-animated-number-visual')?.getAttribute('aria-hidden')).toBe('true');expect(document.querySelectorAll('.hig-sr-only')).toHaveLength(1);expect(document.querySelector('[aria-live]')).toBeNull();
  expect(document.querySelector('.hig-number-flow-window')).toBeNull();expect(document.querySelector('.hig-number-flow-core')?.getAttribute('dir')).toBe('ltr');
  const html=renderToString(view);expect(html).toBe(renderToString(view));expect(html).toContain('hig-number-flow');expect(html).not.toContain('hig-number-flow-window');
 });
 it('rolls a changed digit through every digit between, additively, on NumberFlow’s timing',()=>{
  const {rerender}=render(flow({value:2}));rerender(flow({value:7}));
  // Old value on top, new at the bottom: the strip travels up through 3, 4, 5 and 6.
  expect(strip('digit:number:0')).toBe('234567');expect(place('digit:number:0').hasAttribute('data-spinning')).toBe(true);
  expect(of('spin')).toHaveLength(1);expect(of('spin')[0].keyframes).toEqual({transform:['translateY(500%)','translateY(0%)']});
  expect(of('spin')[0].options).toEqual({composite:'add',duration:500,easing:`linear(${numberFlowCurve.join(',')})`});
  expect((place('digit:number:0').querySelector('.hig-number-flow-strip') as HTMLElement).style.transform).toBe('translateY(-500%)');
  // Endpoints use the same transform unit as the strip. Intermediate glyphs share a paragraph.
  const groups=Array.from(place('digit:number:0').querySelectorAll<HTMLElement>('.hig-number-flow-glyph')).sort((a,b)=>row(a)-row(b));
  expect(groups.map(glyph=>[glyph.textContent,glyph.style.transform,glyph.style.top])).toEqual([['2\n3\n4\n5\n6','translateY(0%)',''],['7','translateY(500%)','']]);
  // The reading is already final for assistive technology and for the layout.
  expect(screen.getByLabelText('Price: 7')).toBeTruthy();expect(drawn()).toBe('7');
  finishAll();expect(document.querySelector('.hig-number-flow-window')).toBeNull();expect(place('digit:number:0').hasAttribute('data-spinning')).toBe(false);expect(document.querySelector('.hig-animated-number-visual')?.textContent).toBe('7');
 });
 it('wraps with the trend, and takes each digit’s own short way without one',()=>{
  const {rerender}=render(flow({value:2,trend:-1}));rerender(flow({value:7,trend:-1}));
  // Down from 2 to 7 passes 1, 0, 9 and 8; the strip travels down, so the new value is on top.
  expect(strip('digit:number:0')).toBe('789012');expect(of('spin')[0].keyframes).toEqual({transform:['translateY(-500%)','translateY(0%)']});
  finishAll();rerender(flow({value:19,trend:0}));
  expect(strip('digit:number:0')).toBe('789');expect(strip('digit:number:1')).toBe('01');
  const trend=vi.fn(()=>1 as const);finishAll();rerender(flow({value:10,trend}));expect(trend).toHaveBeenCalledWith(19,10);expect(strip('digit:number:0')).toBe('90');
 });
 it('joins a new value to the motion in flight instead of restarting it',()=>{
  const {rerender,unmount}=render(flow({value:1}));rerender(flow({value:3}));rerender(flow({value:6}));
  expect(of('spin')).toHaveLength(2);expect(of('spin').every(animation=>animation.cancel.mock.calls.length===0)).toBe(true);
  expect(strip('digit:number:0')).toBe('123456');expect(of('spin')[1].keyframes).toEqual({transform:['translateY(300%)','translateY(0%)']});
  expect(document.querySelectorAll('.hig-number-flow-window')).toHaveLength(1);
  // One turn landing does not end the roll; the last one does.
  act(()=>{of('spin')[0].onfinish?.();});expect(document.querySelector('.hig-number-flow-window')).not.toBeNull();
  // Turning back while still in flight keeps what the reel may still be showing and drops the rest.
  rerender(flow({value:4}));expect(strip('digit:number:0')).toBe('3456');
  const running=animations.slice();unmount();expect(running[0].cancel).not.toHaveBeenCalled();expect(running.slice(1).map(animation=>animation.cancel.mock.calls.length)).toEqual([1,1]);
 });
 it('keeps intermediate rows on an extended turn and gives an interrupted destination its own aligned row',()=>{
  const view=(value:number)=>flow({value,trend:0});
  const {rerender}=render(view(1));rerender(view(8));
  const middle=Array.from(place('digit:number:0').querySelectorAll('.hig-number-flow-glyph')).find(node=>node.textContent?.includes('\n'))!;
  rerender(view(9));expect(strip('digit:number:0')).toBe('123456789');expect(middle.isConnected).toBe(true);
  rerender(view(5));expect(strip('digit:number:0')).toBe('123456789');expect(middle.isConnected).toBe(false);
  act(()=>{of('spin')[0].onfinish?.();});
  rerender(view(6));expect(strip('digit:number:0')).toBe('456789');
 });
 it('reuses glyph elements that fall outside the visible travel of a turning reel',()=>{
  const {rerender}=render(flow({value:1}));rerender(flow({value:3}));rerender(flow({value:6}));
  const elements=()=>Array.from(place('digit:number:0').querySelectorAll('.hig-number-flow-glyph'));
  const original=elements();
  act(()=>{of('spin')[0].onfinish?.();});
  rerender(flow({value:8}));
  expect(strip('digit:number:0')).toBe('345678');
  expect(new Set(elements())).toEqual(new Set(original));
 });
 it('lands a reel that turns faster than it settles rather than growing without bound',()=>{
  const {rerender}=render(flow({value:0,trend:1}));
  for(let turn=1;turn<=8;turn++)rerender(flow({value:(turn*9)%10,trend:1}));
  expect(place('digit:number:0').querySelectorAll('.hig-number-flow-glyph').length).toBeLessThanOrEqual(41);expect(drawn()).toBe('2');
 });
 it('slides persistent places and clips the digits when a glyph changes width',()=>{
  const {rerender}=render(flow({value:12,suffix:' USD'}));
  vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){
   const box=partRect(this);
   const wide=place('digit:number:1')?.firstElementChild?.textContent==='8';
   if(!wide)return box;
   if(this.classList.contains('hig-number-flow-digits'))return rect(box.left,box.width+4);
   return rect(box.left+(this.dataset.higFlowKey==='affix:suffix'||this.dataset.higFlowKey==='digit:number:0'?4:0),box.width);
  });
  rerender(flow({value:82,suffix:' USD'}));
  expect(of('slide').map(animation=>animation.target.dataset.higFlowKey)).toEqual(['digit:number:0','affix:suffix']);
  expect(of('slide')[0].keyframes.transform[0]).toBe('translateX(-4px)');
  expect(of('clip')[0].keyframes.clipPath[0]).toBe('inset(-1em 4px -1em 0px)');
 });
 it('slides the parts closed when the figure gains a place, fades the new place in and moves the clip with it',()=>{
  const {rerender}=render(<div data-start='100'>{flow({value:999,prefix:'$',suffix:' USD'})}</div>);rerender(<div data-start='100'>{flow({value:1000,prefix:'$',suffix:' USD'})}</div>);
  // `1,` arrives in front: the three old places and the suffix are 20px further right and start from where they were.
  const slides=Object.fromEntries(of('slide').map(animation=>[animation.target.dataset.higFlowKey,animation.keyframes.transform[0]]));
  expect(slides).toEqual({'digit:number:3':'translateX(-20px)','sep:number:2':'translateX(-20px)','digit:number:2':'translateX(-20px)','digit:number:1':'translateX(-20px)','digit:number:0':'translateX(-20px)','affix:suffix':'translateX(-20px)'});
  expect(of('slide').every(animation=>animation.options.composite==='add'&&animation.options.duration===500&&animation.keyframes.transform[1]==='translateX(0px)')).toBe(true);
  expect(of('fade').map(animation=>[animation.target.dataset.higFlowKey,animation.keyframes.opacity,animation.options.duration,animation.options.easing])).toEqual([['digit:number:3',[0,1],250,'cubic-bezier(0,0,0.58,1)'],['sep:number:2',[0,1],250,'cubic-bezier(0,0,0.58,1)']]);
  // The digits' box grew 20px on the right: its clip starts 20px in and opens with the slide.
  expect(of('clip')).toHaveLength(1);expect(of('clip')[0].target.className).toBe('hig-number-flow-digits');expect(of('clip')[0].keyframes.clipPath).toEqual(['inset(-1em 20px -1em 0px)','inset(-1em 0px -1em 0px)']);
  // The new place rolls up from zero, and the carried places roll on.
  expect(strip('digit:number:3')).toBe('01');expect(strip('digit:number:0')).toBe('90');expect(drawn()).toBe('$1,000 USD');
 });
 it('fades a copy of each part that left, travelling with its neighbours, and removes it',()=>{
  const {rerender}=render(<div data-start='100'>{flow({value:1000,prefix:'$'})}</div>);rerender(<div data-start='100'>{flow({value:9,prefix:'$'})}</div>);
  const ghosts=Array.from(document.querySelectorAll<HTMLElement>('.hig-number-flow-ghost'));
  expect(ghosts.map(ghost=>ghost.textContent)).toEqual(['1',',','0','0']);expect(ghosts.every(ghost=>ghost.parentElement?.parentElement?.className==='hig-number-flow-digits')).toBe(true);
  // The ones slides 40px left; the places that left end 40px left of where they were, so the figure moves as one.
  expect(of('slide').find(animation=>animation.target.dataset.higFlowKey==='digit:number:0')?.keyframes.transform[0]).toBe('translateX(40px)');
  expect(ghosts.map(ghost=>ghost.style.left)).toEqual(['-40px','-30px','-20px','-10px']);expect(of('slide').filter(animation=>animation.target.classList.contains('hig-number-flow-ghost')).map(animation=>animation.keyframes.transform[0])).toEqual(Array(4).fill('translateX(40px)'));
  expect(of('fade').filter(animation=>animation.target.classList.contains('hig-number-flow-ghost')).map(animation=>[animation.keyframes.opacity,animation.options.fill])).toEqual(Array(4).fill([[1,0],'forwards']));
  expect(of('clip')[0].keyframes.clipPath[0]).toBe('inset(-1em -40px -1em 0px)');expect(drawn()).toBe('$9');
  finishAll();expect(document.querySelector('.hig-number-flow-ghost')).toBeNull();expect(document.querySelector('.hig-animated-number-visual')?.textContent).toBe('$9');
 });
 it('keeps a right-aligned figure’s digits still and slides what leads it',()=>{
  const {rerender}=render(<div data-right='300'>{flow({value:999,prefix:'$'})}</div>);rerender(<div data-right='300'>{flow({value:1000,prefix:'$'})}</div>);
  expect(Object.fromEntries(of('slide').map(animation=>[animation.target.dataset.higFlowKey,animation.keyframes.transform[0]]))).toEqual({'affix:prefix':'translateX(20px)'});
  expect(of('clip')[0].keyframes.clipPath[0]).toBe('inset(-1em 0px -1em 20px)');
 });
 it('slides for an affix or the stale mark changing with no digit turning',()=>{
  const {rerender}=render(flow({value:5,prefix:'$'}));rerender(flow({value:5,prefix:'USD '}));
  expect(of('spin')).toHaveLength(0);expect(of('slide').map(animation=>animation.keyframes.transform[0])).toEqual(['translateX(-30px)']);
  finishAll();rerender(flow({value:5,prefix:'USD ',stale:true}));expect(of('fade').map(animation=>animation.target.dataset.higFlowKey)).toEqual(['affix:stale']);expect(screen.getByLabelText('Price: USD 5 (stale)')).toBeTruthy();
 });
 it('draws every new value at once under reduced motion, with `animated` off, with no duration and on a hidden page',()=>{
  const still=(first:React.ReactElement,second:React.ReactElement,reading:string)=>{const {rerender,unmount}=render(first);rerender(second);expect(animations).toHaveLength(0);expect(document.querySelector('.hig-number-flow-window,.hig-number-flow-ghost')).toBeNull();expect(drawn()).toBe(reading);unmount();};
  still(flow({value:999},{reducedMotion:true}),flow({value:1000},{reducedMotion:true}),'1,000');
  still(flow({value:999,animated:false}),flow({value:1000,animated:false}),'1,000');
  vi.spyOn(document,'visibilityState','get').mockReturnValue('hidden');still(flow({value:999}),flow({value:1000}),'1,000');vi.restoreAllMocks();
  // No duration: nothing rolls, slides or fades, even when the figure changes width.
  still(flow({value:99,duration:0}),flow({value:100,duration:0}),'100');still(flow({value:100,duration:0}),flow({value:9,duration:0}),'9');
  // Turning motion off mid-flight lands everything.
  const {rerender}=render(flow({value:1}));rerender(flow({value:2}));const running=animations.slice();rerender(flow({value:2},{reducedMotion:true}));
  expect(running[0].cancel).toHaveBeenCalledOnce();expect(document.querySelector('.hig-number-flow-window')).toBeNull();expect(drawn()).toBe('2');
 });
 it('treats a new locale, format or unknown value as a new reading, not a change to animate',()=>{
  const {rerender}=render(flow({value:1}));rerender(flow({value:2},{locale:'de-DE'}));expect(animations).toHaveLength(0);
  rerender(flow({value:3,options:{minimumFractionDigits:2}},{locale:'de-DE'}));expect(animations).toHaveLength(0);expect(drawn()).toBe('3,00');
  rerender(flow({value:null,options:{minimumFractionDigits:2}},{locale:'de-DE'}));expect(animations).toHaveLength(0);expect(screen.getByLabelText('Price: —')).toBeTruthy();
  rerender(flow({value:4,options:{minimumFractionDigits:2}},{locale:'de-DE'}));expect(animations).toHaveLength(0);
  rerender(flow({value:5,options:{minimumFractionDigits:2}},{locale:'de-DE'}));expect(of('spin')).toHaveLength(1);
 });
 it('takes its timings from `duration` and from each timing prop',()=>{
  const {rerender,unmount}=render(flow({value:99,duration:320}));rerender(flow({value:100,duration:320}));
  expect(of('spin')[0].options.duration).toBe(320);expect(of('slide')[0].options.duration).toBe(320);expect(of('fade')[0].options.duration).toBe(160);unmount();animations=[];
  const timed={spinTiming:{duration:500,easing:'ease-out'},transformTiming:{duration:300,easing:[0.2,0,0,1]},opacityTiming:{duration:180,easing:'linear'}} as const;
  const next=render(flow({value:99,...timed}));next.rerender(flow({value:100,...timed}));
  expect(of('spin')[0].options).toMatchObject({duration:500,easing:'cubic-bezier(0,0,0.58,1)'});expect(of('slide')[0].options).toMatchObject({duration:300,easing:'cubic-bezier(0.2,0,0,1)'});expect(of('fade')[0].options).toMatchObject({duration:180,easing:'cubic-bezier(0,0,1,1)'});
 });
 it('wraps a limited place at its limit and loops lower places when continuous',()=>{
  const seconds=(value:number)=>flow({value,trend:-1,digits:{1:{max:5}},options:{minimumIntegerDigits:2}});
  const {rerender,unmount}=render(seconds(0));rerender(seconds(59));
  // The tens go 0 to 5 in one step down, never through 9, 8, 7 and 6.
  expect(strip('digit:number:1')).toBe('50');expect(strip('digit:number:0')).toBe('90');unmount();animations=[];
  const next=render(flow({value:120,trend:1,continuous:true}));next.rerender(flow({value:130,trend:1,continuous:true}));
  expect(strip('digit:number:1')).toBe('23');expect(strip('digit:number:0')).toBe('01234567890');expect(place('digit:number:2').querySelector('.hig-number-flow-window')).toBeNull();
 });
 it('turns a limited place on all ten glyphs to reach or leave a digit past its limit',()=>{
  const seconds=(value:number)=>flow({value,trend:1,digits:{1:{max:5}},options:{minimumIntegerDigits:2}});
  const {rerender}=render(seconds(30));rerender(seconds(75));expect(strip('digit:number:1')).toBe('34567');
  finishAll();rerender(seconds(12));expect(strip('digit:number:1')).toBe('78901');
  // Back inside its limit the place wraps at 5 again.
  finishAll();rerender(seconds(53));finishAll();rerender(seconds(4));expect(strip('digit:number:1')).toBe('50');expect(drawn()).toBe('04');
 });
 it('rolls the reading’s own digits and keeps the number left to right inside a right-to-left page',()=>{
  const {rerender}=render(flow({value:12,prefix:'≈ '},{locale:'ar-EG',direction:'rtl'}));rerender(flow({value:15,prefix:'≈ '},{locale:'ar-EG',direction:'rtl'}));
  expect(strip('digit:number:0')).toBe('٢٣٤٥');expect(document.querySelector('.hig-animated-number-visual')?.getAttribute('dir')).toBe('rtl');expect(document.querySelector('.hig-number-flow-core')?.getAttribute('dir')).toBe('ltr');
 });
 it('slides instead when the number itself needs reordering',()=>{
  const usd={style:'currency',currency:'USD'} as const,{rerender}=render(flow({value:12,options:usd},{locale:'ar-EG',direction:'rtl'}));
  expect(document.querySelector('.hig-number-flow')).toBeNull();rerender(flow({value:15,options:usd},{locale:'ar-EG',direction:'rtl'}));
  expect(document.querySelector('.hig-animated-number-place')).not.toBeNull();expect(animations.every(animation=>animation.options.duration===180)).toBe(true);
 });
 it('animates host-formatted text place by place only when asked to',()=>{
  const {rerender}=render(flow({value:1,formattedValue:'1.5 BTC',animateFormatted:true}));rerender(flow({value:2,formattedValue:'1.8 BTC',animateFormatted:true}));
  expect(of('spin')).toHaveLength(1);expect(drawn()).toBe('1.8 BTC');expect(screen.getByLabelText('Price: 1.8 BTC')).toBeTruthy();
  finishAll();rerender(flow({value:3,formattedValue:'2.0 BTC'}));expect(animations).toHaveLength(0);expect(drawn()).toBe('2.0 BTC');
 });
 it('passes class names to the root and marks the moving parts for their own layers on request',()=>{
  render(flow({value:1,className:'host-size',willChange:true}));
  expect(document.querySelector('.hig-number')?.className).toBe('hig-number hig-number-flow host-size');expect(document.querySelector('.hig-animated-number-visual')?.hasAttribute('data-will-change')).toBe(true);
 });
 it('draws each value at once in a browser without additive animations, where a roll would show the wrong glyphs',()=>{
  // Before 2023 `composite: 'add'` was ignored: a turn would replace the strip's resting transform instead of adding to it.
  vi.stubGlobal('KeyframeEffect',{prototype:{}});
  const {rerender}=render(flow({value:999,prefix:'$'}));rerender(flow({value:1000,prefix:'$'}));
  expect(animations).toHaveLength(0);expect(document.querySelector('.hig-number-flow-window,.hig-number-flow-ghost')).toBeNull();expect(drawn()).toBe('$1,000');
  rerender(flow({value:9,prefix:'$'}));expect(animations).toHaveLength(0);expect(document.querySelector('.hig-number-flow-ghost')).toBeNull();
  vi.unstubAllGlobals();vi.stubGlobal('KeyframeEffect',{prototype:{composite:'replace'}});
  rerender(flow({value:10,prefix:'$'}));expect(of('spin').length).toBeGreaterThan(0);vi.unstubAllGlobals();
 });
 it('falls back to the plain curve in a browser without `linear()`',()=>{
  const {rerender}=render(flow({value:1}));
  Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value(this:HTMLElement,keyframes:Record<string,unknown[]>,options:KeyframeAnimationOptions){if(String(options.easing).startsWith('linear('))throw new TypeError('easing');const animation:Recorded={target:this,keyframes,options,cancel:vi.fn(),onfinish:null};animations.push(animation);return animation as unknown as Animation;}});
  rerender(flow({value:2}));expect(of('spin')).toHaveLength(1);expect(of('spin')[0].options.easing).toBe('cubic-bezier(0.22,1,0.36,1)');
 });
});

describe('one component under two names',()=>{
 it('NumberFlow flows and AnimatedNumberReadout slides by default, and `motion` chooses either way',()=>{
  const changed=(first:React.ReactElement,second:React.ReactElement)=>{const {rerender,unmount}=render(first);rerender(second);const flowing=!!document.querySelector('.hig-number-flow-window'),sliding=!!document.querySelector('.hig-animated-number-place');unmount();animations=[];return {flowing,sliding};};
  expect(changed(<NumberFlow value={1}/>,<NumberFlow value={2}/>)).toEqual({flowing:true,sliding:false});
  expect(changed(<AnimatedNumberReadout value={1}/>,<AnimatedNumberReadout value={2}/>)).toEqual({flowing:false,sliding:true});
  expect(changed(<AnimatedNumberReadout value={1} motion='flow'/>,<AnimatedNumberReadout value={2} motion='flow'/>)).toEqual({flowing:true,sliding:false});
  expect(changed(<NumberFlow value={1} motion='slide'/>,<NumberFlow value={2} motion='slide'/>)).toEqual({flowing:false,sliding:true});
 });
 it('gives the sliding readout `animated` and `className` too',()=>{
  const {rerender}=render(<AnimatedNumberReadout value={1} animated={false} className='host-size'/>);rerender(<AnimatedNumberReadout value={2} animated={false} className='host-size'/>);
  expect(animations).toHaveLength(0);expect(document.querySelector('.hig-number')?.className).toBe('hig-number host-size');expect(document.querySelector('.hig-animated-number-visual')?.textContent).toBe('2');
 });
});

describe('NumberFlowGroup',()=>{
 const clock=(minutes:number,seconds:number,duration:number,spinOnly=false)=><HIGProvider><NumberFlowGroup><span data-start='0'><NumberFlow value={minutes} trend={-1} duration={duration} spinTiming={spinOnly?{duration:200}:undefined}/></span><span data-start={minutes>9?'20':'10'} id='seconds'><NumberFlow value={seconds} trend={-1} options={{minimumIntegerDigits:2}}/></span></NumberFlowGroup></HIGProvider>;
 it.each([[0,false],[0,true],[500,false]] as const)('slides a neighbour when a figure changes width (duration %s, spin only %s)',(duration,spinOnly)=>{
  const {rerender}=render(clock(10,0,duration,spinOnly));rerender(clock(9,0,duration,spinOnly));
  const seconds=of('slide').filter(animation=>document.querySelector('#seconds')?.contains(animation.target));
  expect(seconds.map(animation=>animation.keyframes.transform[0])).toEqual(['translateX(10px)','translateX(10px)']);expect(document.querySelector('#seconds .hig-number-flow-window')).toBeNull();
 });
 it('leaves a neighbour alone outside a group',()=>{
  const alone=(minutes:number)=><HIGProvider><span data-start='0'><NumberFlow value={minutes}/></span><span data-start={minutes>9?'20':'10'} id='seconds'><NumberFlow value={0}/></span></HIGProvider>;
  const {rerender}=render(alone(10));rerender(alone(9));expect(of('slide').filter(animation=>document.querySelector('#seconds')?.contains(animation.target))).toHaveLength(0);
 });
});
