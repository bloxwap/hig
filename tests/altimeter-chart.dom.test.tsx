import React from 'react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup,act} from '@testing-library/react';
import {nativeSrgb} from '@bloxwap/hig/tokens';
import {HIGProvider} from '@bloxwap/hig/react/provider';
import {AltimeterChart,bitcoinPrice,type AltimeterFeed,type AltimeterTarget} from '../packages/hig/chart/src/index';
import {burstAtPill} from '../packages/hig/chart/src/altimeter-burst';
import {drawAltimeter} from '../packages/hig/chart/src/altimeter-chart';

// jsdom has no canvas. A recording context stands in, and frames are stepped by hand.
type Call=[string,...unknown[]];
function recordingContext(){
 const calls:Call[]=[];const record=(name:string)=>(...values:unknown[])=>{calls.push([name,...values]);};
 const context={calls,fill:record('fill'),closePath:record('closePath'),clearRect:record('clearRect'),beginPath:record('beginPath'),moveTo:record('moveTo'),lineTo:record('lineTo'),bezierCurveTo:record('bezierCurveTo'),stroke:record('stroke'),fillText:record('fillText'),setTransform:record('setTransform'),measureText:(text:string)=>({width:text.length*7.8}),createLinearGradient:(...values:number[])=>{calls.push(['createLinearGradient',...values]);return {addColorStop:record('addColorStop')};}};
 return context as typeof context&CanvasRenderingContext2D;
}
let frames:FrameRequestCallback[]=[];let context:ReturnType<typeof recordingContext>;
const frame=(now:number)=>act(()=>{const pending=frames;frames=[];for(const callback of pending)callback(now);});
beforeEach(()=>{
 frames=[];context=recordingContext();
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>frames.push(callback));vi.stubGlobal('cancelAnimationFrame',()=>{frames=[];});
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>context as never);
 vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(600);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});

it('AltimeterChart captions the figure, waits with the localized status, then shows the current price as text',()=>{
 const {rerender}=render(<HIGProvider messages={{loadingChart:'Diagramm wird geladen'}}><AltimeterChart summary='Bitcoin live' price={null}/></HIGProvider>);
 expect(screen.getByRole('figure').querySelector('figcaption')?.textContent).toBe('Bitcoin live');
 expect(screen.getByRole('status').textContent).toBe('Diagramm wird geladen');
 expect(screen.getByRole('figure').querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
 rerender(<HIGProvider messages={{loadingChart:'Diagramm wird geladen'}}><AltimeterChart summary='Bitcoin live' price={65_262}/></HIGProvider>);
 frame(1000);
 expect(screen.queryByRole('status')).toBeNull();
 expect(document.querySelector('[data-hig-altimeter-price] .hig-sr-only')?.textContent).toBe('$65,262.00');
 // The pill starts where the trail ends.
 frame(1016);expect((document.querySelector('[data-hig-altimeter-price]') as HTMLElement).style.left).toBe('482px');
});

it('a host price renders on the server pass, in the provider locale and the host format',()=>{
 render(<HIGProvider locale='de-DE'><AltimeterChart summary='Kurs' price={1234.5} priceOptions={{currency:'EUR'}}/></HIGProvider>);
 expect(document.querySelector('[data-hig-altimeter-price] .hig-sr-only')?.textContent?.replace(/\s/g,' ')).toBe('1.234,50 €');
});

it('the grid flows 50px a second and holds still with reduced motion',()=>{
 const firstMark=()=>{const index=context.calls.findIndex(c=>c[0]==='beginPath');return context.calls[index+1][1] as number;};
 const {unmount}=render(<HIGProvider><AltimeterChart summary='Grid' price={100}/></HIGProvider>);
 frame(0);expect(firstMark()).toBe(22);
 context.calls.length=0;frame(500);expect(firstMark()).toBe(-3);
 unmount();context.calls.length=0;
 render(<HIGProvider reducedMotion><AltimeterChart summary='Grid' price={100}/></HIGProvider>);
 frame(500);expect(firstMark()).toBe(22);
});

it('the price eases over 300ms, and snaps with reduced motion',()=>{
 // The ladder label nearest the center sits where the eased price puts it: 44px per tick of 0.01 at $100.
 const centerLabelY=()=>{const labels=context.calls.filter(c=>c[0]==='fillText'&&c[1]==='$100.00');return labels.at(-1)?.[3] as number;};
 const view=(price:number,reducedMotion=false)=><HIGProvider reducedMotion={reducedMotion}><AltimeterChart summary='Ease' price={price} height={200}/></HIGProvider>;
 const {rerender,unmount}=render(view(100));
 frame(1000);expect(centerLabelY()).toBe(100);
 rerender(view(100.01));
 frame(1400);expect(centerLabelY()).toBe(100);
 frame(1550);expect(centerLabelY()).toBeCloseTo(122,0);
 frame(1700);expect(centerLabelY()).toBeCloseTo(144,5);
 unmount();context.calls.length=0;
 const reduced=render(view(100,true));frame(1000);reduced.rerender(view(100.01,true));frame(1016);expect(centerLabelY()).toBeCloseTo(144,5);
});

it('does not teleport the target lines when a feed update interrupts an unfinished move',()=>{
 let push:(price:number)=>void=()=>{};
 const feed:AltimeterFeed=listener=>{push=listener;listener(100);return()=>{};};
 render(<HIGProvider><AltimeterChart summary='Streaming' feed={feed} height={800} targets={[{id:'entry',price:100,label:'Entry'}]}/></HIGProvider>);
 frame(1000);push(100.04);frame(1400);frame(1550);
 const line=document.querySelector<HTMLElement>('[data-hig-altimeter-target="entry"]')!;
 const before=line.style.transform;
 push(99.98);frame(1550);
 expect(line.style.transform).toBe(before);
 frame(1566);
 expect(Math.abs(parseFloat(line.style.transform.slice(11))-parseFloat(before.slice(11)))).toBeLessThan(2);
});

it('without a price it subscribes to the feed, draws from it, and stops it on unmount',()=>{
 let push:(price:number)=>void=()=>{};const stop=vi.fn();const feed:AltimeterFeed=vi.fn(onPrice=>{push=onPrice;return stop;});
 const {unmount}=render(<HIGProvider><AltimeterChart summary='Feed' feed={feed}/></HIGProvider>);
 expect(feed).toHaveBeenCalledTimes(1);frame(0);expect(screen.getByRole('status')).toBeTruthy();
 push(NaN);push(-1);frame(100);expect(screen.getByRole('status')).toBeTruthy();
 push(250);frame(1000);expect(document.querySelector('[data-hig-altimeter-price] .hig-sr-only')?.textContent).toBe('$250.00');
 // The reading follows the feed at the 200ms sampling cadence.
 push(251);frame(1100);expect(document.querySelector('[data-hig-altimeter-price] .hig-sr-only')?.textContent).toBe('$250.00');
 frame(1200);expect(document.querySelector('[data-hig-altimeter-price] .hig-sr-only')?.textContent).toBe('$251.00');
 unmount();expect(stop).toHaveBeenCalledTimes(1);
});

it('a host price never opens the feed',()=>{
 const feed=vi.fn(()=>()=>{});
 render(<HIGProvider><AltimeterChart summary='Host' price={10} feed={feed}/></HIGProvider>);
 expect(feed).not.toHaveBeenCalled();
});

it('positions colored dotted targets on the eased price scale and exposes localized values as text',()=>{
 const targets:AltimeterTarget[]=[{id:'tp',price:100.01,label:'Take profit',color:'var(--profit)'},{id:'entry',price:100},{id:'offscreen',price:101,label:'Far target'},{id:'invalid',price:NaN}];
 const view=(price:number|null)=><HIGProvider locale='de-DE'><AltimeterChart summary='Targets' price={price} targets={targets} height={200} priceOptions={{currency:'EUR'}}/></HIGProvider>;
 const {rerender}=render(view(100));frame(1000);
 const row=()=>document.querySelector<HTMLElement>('[data-hig-altimeter-target="tp"]')!;
 const label=()=>document.querySelector<HTMLElement>('[data-hig-altimeter-target-label="tp"]')!;
 expect(row().style.transform).toMatch(/translateY\(55\.99/);
 expect(row().style.borderTopStyle).toBe('dotted');expect(row().style.color).toBe('var(--profit)');
 expect(label().textContent?.replace(/\s/g,' ')).toBe('Take profit 100,01 €');
 expect(screen.getByRole('list').textContent?.replace(/\s/g,' ')).toContain('Take profit: 100,01 €');
 const pinned=document.querySelector<HTMLElement>('[data-hig-altimeter-target="offscreen"]')!;
 const pinnedLabel=document.querySelector<HTMLElement>('[data-hig-altimeter-target-label="offscreen"]')!;
 expect(pinned.style.visibility).toBe('hidden');expect(pinnedLabel.style.visibility).toBe('visible');expect(pinned.style.borderTopColor).toBe('transparent');
 expect(pinned.dataset.higAltimeterPinned).toBe('top');
 expect(pinnedLabel.textContent?.replace(/\s/g,' ')).toBe('Far target 101,00 €');
 expect(document.querySelector('[data-hig-altimeter-target="entry"]')!.children).toHaveLength(0);
 expect(document.querySelector('[data-hig-altimeter-target="invalid"]')).toBeNull();
 rerender(view(100.02));frame(1400);frame(1550);
 expect(parseFloat(row().style.transform.slice(11))).toBeCloseTo(100,5);
 rerender(view(null));frame(1800);expect(row().style.visibility).toBe('hidden');expect(pinnedLabel.style.visibility).toBe('hidden');expect(label().style.visibility).toBe('hidden');
});

it('pins and unpins labels without a delayed CSS transition, including reduced motion',()=>{
 const view=(price:number,reducedMotion=false)=><HIGProvider reducedMotion={reducedMotion}><AltimeterChart summary='Pinning' price={price} targets={[{id:'entry',price:100,label:'Entry'}]} height={200}/></HIGProvider>;
 const {rerender}=render(view(100));frame(1000);frame(1016);
 const label=document.querySelector<HTMLElement>('[data-hig-altimeter-target-label="entry"]')!;
 const line=document.querySelector<HTMLElement>('[data-hig-altimeter-target="entry"]')!;
 expect(label.style.transition).toBe('');
 rerender(view(100.04));frame(1400);frame(1700);
 expect(line.dataset.higAltimeterPinned).toBe('bottom');expect(label.style.visibility).toBe('visible');expect(label.style.transform).toBe('translateY(174px)');
 rerender(view(100));frame(1800);frame(2100);
 expect(line.dataset.higAltimeterPinned).toBeUndefined();expect(label.style.transform).toBe('translateY(78px)');
 rerender(view(100.04,true));frame(2200);
 expect(line.dataset.higAltimeterPinned).toBe('bottom');expect(label.style.transform).toBe('translateY(174px)');
});

it('keeps unobstructed labels attached to their lines during price changes and reversals',()=>{
 const view=(price:number)=><HIGProvider><AltimeterChart summary='Attached labels' price={price} targets={[{id:'tp',price:100.02,label:'Take Profit'},{id:'sl',price:99.98,label:'Stop Loss'}]} height={400}/></HIGProvider>;
 const {rerender}=render(view(100));frame(1000);
 rerender(view(100.008));
 for(let now=1400;now<=1800;now+=16){
  if(now===1560)rerender(view(100.002));
  frame(now);
  for(const [id,offset] of [['tp',8],['sl',-22]] as const){
   const line=document.querySelector<HTMLElement>(`[data-hig-altimeter-target="${id}"]`)!;
   const label=document.querySelector<HTMLElement>(`[data-hig-altimeter-target-label="${id}"]`)!;
   expect(parseFloat(label.style.transform.slice(11))-parseFloat(line.style.transform.slice(11))).toBeCloseTo(offset,8);
   expect(label.style.transition).toBe('');
  }
 }
});

function recordAnimations(){
 const animations:{element:HTMLElement;cancel:ReturnType<typeof vi.fn>;finish:()=>void}[]=[];
 const animate=vi.fn();
 const implementation=function(this:HTMLElement){
  let finish=()=>{};
  const finished=new Promise<void>(resolve=>{finish=resolve;});
  const animation={element:this,cancel:vi.fn(),finish};
  // The price's existing digit reels also use WAAPI; record only the crossing effect.
  if(this.hasAttribute('data-hig-altimeter-price')||this.closest('[data-hig-altimeter-burst]')){animate();animations.push(animation);}
  return {cancel:animation.cancel,finished} as unknown as Animation;
 };
 // jsdom does not implement Web Animations.
 const original=HTMLElement.prototype.animate;
 HTMLElement.prototype.animate=implementation;
 return {animate,animations,restore:()=>{HTMLElement.prototype.animate=original;}};
}

it('DEGEN is opt-in, fires at the visual crossing, coalesces nearby crossings, and can be stopped immediately',()=>{
 const motion=recordAnimations(),targets=[{id:'tp',price:100.01,label:'Take profit',color:'#00ff00'}];
 const view=(price:number,degen=false,reducedMotion=false)=><HIGProvider reducedMotion={reducedMotion}><AltimeterChart summary='DEGEN' price={price} targets={targets} degen={degen}/></HIGProvider>;
 try{
  const {rerender,unmount}=render(view(100));frame(1000);
  rerender(view(100.02));frame(1400);frame(1700);expect(motion.animate).not.toHaveBeenCalled();
  rerender(view(100.02,true));frame(1800);expect(motion.animate).not.toHaveBeenCalled();
  rerender(view(100,true));frame(2000);frame(2100);expect(motion.animate).not.toHaveBeenCalled();
  frame(2300);
  expect(motion.animations.filter(a=>a.element.hasAttribute('data-hig-altimeter-price'))).toHaveLength(1);
  expect(document.querySelector<HTMLElement>('[data-hig-altimeter-burst]')?.style.color).toBe('rgb(0, 255, 0)');
  expect(document.querySelector('[data-hig-altimeter-burst]')!.children).toHaveLength(25);
  const count=motion.animate.mock.calls.length;
  rerender(view(100.02,true));frame(2350);frame(2650);expect(motion.animate).toHaveBeenCalledTimes(count);
  rerender(view(100.02,true,true));expect(document.querySelector('[data-hig-altimeter-burst]')).toBeNull();
  expect(motion.animations.every(a=>a.cancel.mock.calls.length>0)).toBe(true);
  rerender(view(100,true,true));frame(3000);expect(motion.animate).toHaveBeenCalledTimes(count);
  rerender(view(100,true));frame(3100);
  rerender(view(100.02,true));frame(3500);frame(3800);expect(motion.animate).toHaveBeenCalledTimes(count*2);
  rerender(view(100.02));expect(document.querySelector('[data-hig-altimeter-burst]')).toBeNull();
  unmount();expect(frames).toHaveLength(0);
 }finally{motion.restore();}
});

it('DEGEN does not replay after missing data, a hidden-tab gap, edited levels, or a feed replacement',()=>{
 const motion=recordAnimations();let push:(price:number)=>void=()=>{};
 const feed:AltimeterFeed=listener=>{push=listener;listener(100);return ()=>{};};
 const view=(price:number|null|undefined,target=100.01,source=feed)=><HIGProvider><AltimeterChart summary='DEGEN' price={price} feed={source} targets={[{id:'tp',price:target}]} degen/></HIGProvider>;
 try{
  const {rerender}=render(view(100));frame(1000);
  rerender(view(100.02));frame(5000);frame(5400);
  rerender(view(null));frame(5600);
  rerender(view(100));frame(5800);
  expect(motion.animate).not.toHaveBeenCalled();
  rerender(view(100.04,100.03));frame(6200);frame(6500);
  // A newly placed line can cross later; editing it alone never fires.
  expect(motion.animate).toHaveBeenCalled();
  const count=motion.animate.mock.calls.length;
  rerender(view(undefined));frame(7000);
  push(100.02);frame(10000);frame(10400);
  rerender(view(undefined,100.01,listener=>{listener(100);return ()=>{};}));frame(11000);
  expect(motion.animate).toHaveBeenCalledTimes(count);
 }finally{motion.restore();}
});

it('DEGEN animations release their particles when finished and cancel on unmount',async()=>{
 const motion=recordAnimations();
 const view=(price:number)=><HIGProvider><AltimeterChart summary='DEGEN' price={price} targets={[{id:'entry',price:100.01}]} degen/></HIGProvider>;
 try{
  const {rerender,unmount}=render(view(100));frame(1000);
  rerender(view(100.02));frame(1400);frame(1700);
  await act(async()=>{for(const animation of motion.animations)animation.finish();});
  expect(document.querySelector('[data-hig-altimeter-burst]')).toBeNull();
  rerender(view(100));frame(2100);frame(2400);
  expect(document.querySelector('[data-hig-altimeter-burst]')).not.toBeNull();
  unmount();expect(motion.animations.every(a=>a.cancel.mock.calls.length>0)).toBe(true);
 }finally{motion.restore();}
});

it('drawAltimeter strokes a trail that fades in from the left and ends at the centered live price',()=>{
 const trailEnd=drawAltimeter(context,{width:600,height:200,now:10_000,phase:0,ticks:[{t:0,p:100},{t:9000,p:100},{t:9800,p:100.01}],display:100.01,anchor:100,spacing:.01,colors:{grid:'#262626',ladder:'#a1a1a1',line:'#00ff3f'},label:price=>`$${price.toFixed(2)}`});
 expect(trailEnd).toBe(482);
 expect(context.calls).toContainEqual(['createLinearGradient',18,0,482,0]);
 expect(context.calls).toContainEqual(['addColorStop',0,'#00ff3f00']);expect(context.calls).toContainEqual(['addColorStop',1,'#00ff3f']);
 // One second ago the price was one tick lower: 44px below the center, 50px left of the tip.
 expect(context.calls).toContainEqual(['bezierCurveTo',expect.any(Number),expect.any(Number),expect.any(Number),expect.any(Number),432,expect.closeTo(144,5)]);
 // The live tail leaves the newest sample level and arrives level at the tip.
 expect(context.calls.at(-2)).toEqual(['bezierCurveTo',expect.closeTo(472+10/3,5),100,expect.closeTo(482-10/3,5),100,482,100]);
});

it('ladder numbers yield to target labels while their tick marks remain',()=>{
 drawAltimeter(context,{width:600,height:200,now:0,phase:0,ticks:[],display:100,anchor:100,spacing:.01,targetLabelBounds:[[90,110]],colors:{grid:'#262626',ladder:'#a1a1a1',line:'#00ff3f'},label:price=>`$${price.toFixed(2)}`});
 expect(context.calls.some(call=>call[0]==='fillText'&&call[1]==='$100.00')).toBe(false);
 expect(context.calls.some(call=>call[0]==='fillText'&&call[1]==='$100.01')).toBe(true);
 expect(context.calls).toContainEqual(['moveTo',582,100]);expect(context.calls).toContainEqual(['lineTo',590,100]);
});

it('bitcoinPrice subscribes to the Hyperliquid BTC best bid and offer, reports the mid, and closes',()=>{
 const sockets:{url:string;sent:string[];closed:boolean;onopen?:()=>void;onmessage?:(event:{data:string})=>void;onclose?:()=>void}[]=[];
 vi.stubGlobal('WebSocket',class{sent:string[]=[];closed=false;constructor(public url:string){sockets.push(this as never);}send(text:string){this.sent.push(text);}close(){this.closed=true;}});
 const prices:number[]=[];const stop=bitcoinPrice(price=>prices.push(price));
 expect(sockets[0].url).toBe('wss://api.hyperliquid.xyz/ws');sockets[0].onopen?.();
 expect(JSON.parse(sockets[0].sent[0])).toEqual({method:'subscribe',subscription:{type:'bbo',coin:'BTC'}});
 sockets[0].onmessage?.({data:'{"channel":"subscriptionResponse","data":{}}'});sockets[0].onmessage?.({data:'not json'});
 sockets[0].onmessage?.({data:'{"channel":"bbo","data":{"coin":"BTC","bbo":[{"px":"65262.0"},{"px":"65263.0"}]}}'});
 sockets[0].onmessage?.({data:'{"channel":"bbo","data":{"coin":"BTC","bbo":[null,{"px":"65270.0"}]}}'});
 expect(prices).toEqual([65262.5,65270]);
 stop();expect(sockets[0].closed).toBe(true);sockets[0].onclose?.();expect(sockets).toHaveLength(1);
});

it('separates directional trail profit from net P&L across live position updates',()=>{
 const view=(side:'long'|'short',pnl:number,capsule:'price'|'pnl'|{returnRatio:number})=>
  <HIGProvider reducedMotion><AltimeterChart summary='Position' price={101} position={{side,breakEvenPrice:100,pnl,capsule}}/></HIGProvider>;
 const {rerender}=render(view('long',-2,'price'));
 const pill=()=>document.querySelector<HTMLElement>('[data-hig-altimeter-price]')!;
 const text=()=>pill().querySelector('.hig-sr-only')?.textContent;
 frame(1000);
 const longColor=context.calls.find(call=>call[0]==='addColorStop'&&call[1]===1)?.[2];
 const lossColor=pill().style.color;
 expect(longColor).toBe(nativeSrgb.positive);
 expect(context.calls.some(call=>call[0]==='fill')).toBe(true);
 expect(text()).toBe('$101.00');
 context.calls.length=0;rerender(view('short',2,{returnRatio:.025}));frame(1016);
 expect(context.calls.find(call=>call[0]==='addColorStop'&&call[1]===1)?.[2]).toBe(nativeSrgb.negative);
 expect(pill().style.color).not.toBe(lossColor);expect(text()).toBe('+2.50%');
 const gainColor=pill().style.color;
 rerender(view('short',0,'pnl'));frame(1032);
 expect([gainColor,lossColor]).not.toContain(pill().style.color);expect(text()).toBe('$0.00');
});

it.each(['up','down'] as const)('biases the visible spark trajectories on a %s crossing',direction=>{
 const pill=document.createElement('span'),layer=document.createElement('div');
 const paths:Keyframe[][]=[];
 const original=HTMLElement.prototype.animate;
 HTMLElement.prototype.animate=function(frames){
  if(this.parentElement?.hasAttribute('data-hig-altimeter-burst')&&this.style.borderRadius==='50%')paths.push(frames as Keyframe[]);
  return {cancel:()=>{},finished:new Promise(()=>{})} as unknown as Animation;
 };
 try{
  const clear=burstAtPill(pill,layer,'lime',direction);
  const y=(frame:Keyframe)=>Number(/, ([-\d.]+)px\)/.exec(String(frame.transform))?.[1]);
  const upward=paths.filter(path=>y(path[path.length-1])<y(path[0])).length;
  expect(paths).toHaveLength(24);expect(upward).toBe(direction==='up'?18:6);
  clear();expect(layer.childElementCount).toBe(0);
 }finally{HTMLElement.prototype.animate=original;}
});
