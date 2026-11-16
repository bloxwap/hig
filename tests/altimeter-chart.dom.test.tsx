import React from 'react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup,act} from '@testing-library/react';
import {HIGProvider} from '@bloxwap/hig/react/provider';
import {AltimeterChart,bitcoinPrice,type AltimeterFeed} from '../packages/hig/chart/src/index';
import {drawAltimeter} from '../packages/hig/chart/src/altimeter-chart';

// jsdom has no canvas. A recording context stands in, and frames are stepped by hand.
type Call=[string,...unknown[]];
function recordingContext(){
 const calls:Call[]=[];const record=(name:string)=>(...values:unknown[])=>{calls.push([name,...values]);};
 const context={calls,clearRect:record('clearRect'),beginPath:record('beginPath'),moveTo:record('moveTo'),lineTo:record('lineTo'),bezierCurveTo:record('bezierCurveTo'),stroke:record('stroke'),fillText:record('fillText'),setTransform:record('setTransform'),measureText:(text:string)=>({width:text.length*7.8}),createLinearGradient:(...values:number[])=>{calls.push(['createLinearGradient',...values]);return {addColorStop:record('addColorStop')};}};
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
