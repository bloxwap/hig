import React from 'react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup,act} from '@testing-library/react';
import {HIGProvider} from '@bloxwap/hig/react/provider';
import {OutcomeChart,outcomeColors,type Outcome,type OutcomeFeed} from '../packages/hig/chart/src/index';
import {drawOutcomes} from '../packages/hig/chart/src/outcome-chart';

// jsdom has no canvas. A recording context stands in, and frames are stepped by hand.
type Call=[string,...unknown[]];
function recordingContext(){
 const calls:Call[]=[];const record=(name:string)=>(...values:unknown[])=>{calls.push([name,...values]);};
 const context={calls,clearRect:record('clearRect'),beginPath:record('beginPath'),moveTo:record('moveTo'),lineTo:record('lineTo'),bezierCurveTo:record('bezierCurveTo'),stroke:record('stroke'),setTransform:record('setTransform'),createLinearGradient:(...values:number[])=>{calls.push(['createLinearGradient',...values]);return {addColorStop:record('addColorStop')};}};
 return context as typeof context&CanvasRenderingContext2D;
}
let frames:FrameRequestCallback[]=[];let context:ReturnType<typeof recordingContext>;
const frame=(now:number)=>act(()=>{context.calls.length=0;const pending=frames;frames=[];for(const callback of pending)callback(now);});
beforeEach(()=>{
 frames=[];context=recordingContext();
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>frames.push(callback));vi.stubGlobal('cancelAnimationFrame',()=>{frames=[];});
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>context as never);
 vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(600);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
const sample:Outcome[]=[{id:'#1',label:'No change',price:.04},{id:'#2',label:'Cut',price:.004},{id:'#3',label:'Hike',price:.95,color:'#123456'}];
// A capsule part's text: the single accessible reading of an animated number, else its own text.
const read=(part:Element|null|undefined)=>part?.querySelector('.hig-sr-only')?.textContent??part?.textContent;
const capsules=()=>[...document.querySelectorAll<HTMLElement>('[data-hig-outcome]')];
// A capsule's vertical center: where it rests, plus the offset the frame loop gives it.
const center=(capsule:HTMLElement)=>parseFloat(capsule.style.top)+15+(parseFloat(capsule.style.transform.replace('translateY(',''))||0);
// The tips of the trails drawn this frame: the end of each live tail, just before its connector.
const tips=()=>context.calls.filter((call,index)=>call[0]==='bezierCurveTo'&&context.calls[index+1]?.[0]==='stroke').map(call=>call[2]);

it('OutcomeChart captions the figure, draws the ten percent ladder, and lists one stroked capsule per outcome',()=>{
 render(<HIGProvider><OutcomeChart summary='Rate decision' outcomes={sample}/></HIGProvider>);
 expect(screen.getByRole('figure').querySelector('figcaption')?.textContent).toBe('Rate decision');
 // The label on the left, the chance on the right, to three decimals.
 expect(screen.getAllByRole('listitem').map(item=>[...item.children].map(read))).toEqual([['No change','4.000%'],['Cut','0.400%'],['Hike','95.000%']]);
 const ladder=document.querySelector<SVGElement>('[data-hig-outcome-ladder]')!;
 // The percentages sit on the trailing edge, right-aligned before their tick marks; the leading edge has marks only.
 expect(ladder.style.right).toBe('0px');expect(ladder.querySelector('text')?.getAttribute('text-anchor')).toBe('end');expect(document.querySelector('svg')!.querySelectorAll('line')).toHaveLength(11);expect(document.querySelector('svg')!.querySelectorAll('text')).toHaveLength(0);
 expect([...ladder.querySelectorAll('text')].map(text=>text.textContent)).toEqual(['100%','90%','80%','70%','60%','50%','40%','30%','20%','10%','0%']);expect(ladder.querySelectorAll('line')).toHaveLength(11);
 expect(screen.getByRole('figure').querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
 // Capsules are stroked and lettered in the outcome's color, in the page's mono face.
 expect(capsules().map(capsule=>capsule.style.border)).toEqual(['1px solid rgb(229, 164, 69)','1px solid rgb(107, 154, 60)','1px solid rgb(18, 52, 86)']);expect(capsules().every(capsule=>capsule.style.color===capsule.style.borderColor)).toBe(true);
 expect(capsules()[0].closest('div')!.style.fontFamily).toContain('--hig-font-mono');
 // Capsules sit on the trailing edge, over the ladder's labels.
 expect(capsules()[0].parentElement!.style.right).toBe('8px');
 // Hike sits at 95%; No change and Cut are too close and move apart.
 expect(capsules().map(center)).toEqual([309,345,expect.closeTo(39.6,5)]);
 // The label keeps room for its descenders.
 expect(capsules()[0].style.height).toBe('30px');expect(capsules()[0].style.lineHeight).toBe('1.5');
});

it('trails flow left at 50px a second from the ladder to the capsules, over the moving grid',()=>{
 render(<HIGProvider><OutcomeChart summary='Flow' outcomes={[{id:'a',label:'A',price:.5},{id:'b',label:'B',price:.25}]}/></HIGProvider>);
 frame(0);
 // 600 wide: the capsules take 200 + 8 over the ladder and the connector 40, so trails run from 18 to 352.
 expect(context.calls.filter(call=>call[0]==='createLinearGradient')).toEqual([['createLinearGradient',18,0,352,0],['createLinearGradient',18,0,352,0]]);
 expect(context.calls).toContainEqual(['addColorStop',0,`${outcomeColors[0]}00`]);expect(context.calls).toContainEqual(['addColorStop',1,outcomeColors[1]]);
 // 50% and 25% zoom the ladder to 20%..55%.
 const high=expect.closeTo(24+312*.05/.35,5),low=expect.closeTo(24+312*.3/.35,5);
 expect(tips()).toEqual([high,low]);
 // Each trail ends in a curve to its capsule's center.
 expect(context.calls.filter(call=>call[0]==='bezierCurveTo'&&call[5]===392).map(call=>call[6])).toEqual([high,low]);
 // One row of marks per ladder tick: the first column's marks sit at 55% down to 20%.
 const firstBegin=context.calls.findIndex(call=>call[0]==='beginPath');
 expect(context.calls.slice(firstBegin+1,firstBegin+45).filter(call=>call[0]==='moveTo'&&call[1]===22).map(call=>call[2])).toEqual([0,1,2,3,4,5,6,7].map(row=>expect.closeTo(24+row*312/7,5)));
 // The first grid mark starts at x=22 and has moved 25px after half a second.
 const firstMark=()=>context.calls[context.calls.findIndex(call=>call[0]==='beginPath')+1][1];
 expect(firstMark()).toBe(22);frame(500);expect(firstMark()).toBe(-3);
 // The sample taken at t=0 has moved 50px left of the tip after one second.
 frame(1000);expect(context.calls).toContainEqual(['bezierCurveTo',expect.any(Number),expect.any(Number),expect.any(Number),expect.any(Number),302,high]);
});

it('a new chance eases over 300ms and carries its capsule along; reduced motion snaps and holds the grid',()=>{
 const view=(price:number,reducedMotion=false)=><HIGProvider reducedMotion={reducedMotion}><OutcomeChart summary='Ease' outcomes={[{id:'a',label:'A',price},{id:'b',label:'B',price:.02},{id:'c',label:'C',price:.98}]}/></HIGProvider>;
 const {rerender,unmount}=render(view(.5));
 // The outcomes at 2% and 98% keep the whole ladder, so 50% is the middle.
 frame(1000);expect(tips()[0]).toBe(180);expect(center(capsules()[0])).toBe(180);
 rerender(view(.75));
 // The reading changes at once; the capsule stays with the trail's tip until the frames move it.
 expect(read(capsules()[0].lastElementChild)).toBe('75.000%');expect(center(capsules()[0])).toBe(180);
 frame(1400);expect(tips()[0]).toBe(180);
 frame(1550);expect(tips()[0]).toBeCloseTo(141,0);expect(center(capsules()[0])).toBeCloseTo(141,0);
 frame(1700);expect(tips()[0]).toBeCloseTo(102,5);expect(center(capsules()[0])).toBeCloseTo(102,5);
 unmount();
 const reduced=render(view(.5,true));frame(1000);reduced.rerender(view(.75,true));frame(1016);expect(tips()[0]).toBeCloseTo(102,5);
 expect(context.calls[context.calls.findIndex(call=>call[0]==='beginPath')+1][1]).toBe(22);
});

it('draws at most ten outcomes and waits with the localized status when there are none',()=>{
 const many=Array.from({length:12},(_,index)=>({id:`#${index}`,label:`Outcome ${index}`,price:.1}));
 const {rerender}=render(<HIGProvider messages={{loadingChart:'Diagramm wird geladen'}}><OutcomeChart summary='Many' outcomes={many}/></HIGProvider>);
 expect(capsules()).toHaveLength(10);
 rerender(<HIGProvider messages={{loadingChart:'Diagramm wird geladen'}}><OutcomeChart summary='Many' outcomes={null}/></HIGProvider>);
 expect(screen.getByRole('status').textContent).toBe('Diagramm wird geladen');expect(capsules()).toHaveLength(0);
});

it('without outcomes it subscribes to the feed, follows it, and stops it on unmount; host outcomes never open it',()=>{
 let push:(outcomes:readonly Outcome[])=>void=()=>{};const stop=vi.fn();const feed:OutcomeFeed=vi.fn(onOutcomes=>{push=onOutcomes;return stop;});
 const {unmount}=render(<HIGProvider><OutcomeChart summary='Feed' feed={feed}/></HIGProvider>);
 expect(feed).toHaveBeenCalledTimes(1);expect(screen.getByRole('status')).toBeTruthy();
 // An outcome with no price yet shows a dash and draws no trail.
 act(()=>push([{...sample[0],price:null},sample[2]]));expect(capsules().map(capsule=>read(capsule.lastElementChild))).toEqual(['—','95.000%']);frame(0);expect(tips()).toHaveLength(1);
 act(()=>push([{...sample[0],price:.5},{...sample[2],price:.5}]));expect(capsules().map(capsule=>[...capsule.children].map(read))).toEqual([['No change','50.000%'],['Hike','50.000%']]);
 // The rolling digits are hidden from assistive technology, which reads the final value once.
 expect(capsules()[1].querySelector('.hig-animated-number-visual')?.getAttribute('aria-hidden')).toBe('true');
 unmount();expect(stop).toHaveBeenCalledTimes(1);
 const unused=vi.fn(()=>()=>{});render(<HIGProvider><OutcomeChart summary='Host' outcomes={sample} feed={unused}/></HIGProvider>);expect(unused).not.toHaveBeenCalled();
});

it('drawOutcomes skips an outcome with no samples yet',()=>{
 drawOutcomes(context,{width:600,height:360,now:0,phase:0,grid:'#262626',trails:[{color:'#e5a445',ticks:[],value:.5,capsule:180}]});
 expect(context.calls.some(call=>call[0]==='createLinearGradient')).toBe(false);
});

it('outcomes wait stacked at the bottom, then glide into place when their prices arrive; reduced motion places them at once',()=>{
 const waiting=sample.map(outcome=>({...outcome,price:null}));
 const view=(outcomes:Outcome[],reducedMotion=false)=><HIGProvider reducedMotion={reducedMotion}><OutcomeChart summary='Arrive' outcomes={outcomes}/></HIGProvider>;
 const {rerender,unmount}=render(view(waiting));
 frame(0);expect(capsules().map(center)).toEqual([273,309,345]);expect(tips()).toHaveLength(0);
 rerender(view(sample));
 // Still in the stack on arrival; halfway after 300ms; in place after 600ms. The trails are at their chances at once.
 expect(capsules().map(center)).toEqual([273,309,345]);
 frame(300);expect(capsules().map(center)).toEqual([291,327,expect.closeTo(192.3,1)]);expect(tips()).toHaveLength(3);
 // Each connector follows its capsule while it moves.
 expect(context.calls.filter(call=>call[0]==='bezierCurveTo'&&call[5]===392).map(call=>call[6])).toEqual([291,327,expect.closeTo(192.3,1)]);
 frame(600);expect(capsules().map(center)).toEqual([309,345,expect.closeTo(39.6,5)]);
 unmount();
 const reduced=render(view(waiting,true));frame(0);reduced.rerender(view(sample,true));frame(16);expect(capsules().map(center)).toEqual([309,345,expect.closeTo(39.6,5)]);
});

it('uses one track per outcome id',()=>{
 render(<OutcomeChart summary='Duplicates' outcomes={[sample[0],{...sample[0],label:'Duplicate'},sample[1]]}/>);
 expect(capsules()).toHaveLength(2);
});
it('expires silent feeds and ignores late data after replacing the feed',()=>{
 vi.useFakeTimers();
 try{
  let send!:(values:readonly Outcome[])=>void;const first:OutcomeFeed=callback=>{send=callback;return()=>{};};
  const view=render(<OutcomeChart summary='Freshness' feed={first}/>);
  act(()=>send(sample));expect(capsules()).toHaveLength(3);
  act(()=>vi.advanceTimersByTime(30_000));expect(capsules()).toHaveLength(0);expect(screen.getByRole('status').textContent).toContain('stale');
  view.rerender(<OutcomeChart summary='Freshness' feed={()=>()=>{}}/>);
  act(()=>send(sample));expect(capsules()).toHaveLength(0);
 }finally{vi.useRealTimers();}
});
