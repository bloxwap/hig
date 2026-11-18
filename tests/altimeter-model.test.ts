import {appendTrailSample} from '../packages/hig/chart/src/chart-renderer';
import {it,expect} from 'vitest';
import {ALTIMETER_FLOW_PX,easeInOut,gridPhase,labelDecimalsFor,ladderPrices,priceTween,smoothTrail,tickSpacingFor,trailPoints} from '../packages/hig/chart/src/altimeter-model';

it('the grid and trail travel 50px a second, and the grid wraps every tile',()=>{
 expect(ALTIMETER_FLOW_PX).toBe(50);
 expect(gridPhase(0)).toBe(0);expect(gridPhase(500)).toBe(-25);expect(gridPhase(999)).toBeCloseTo(-49.95);expect(gridPhase(1000)).toBe(0);expect(gridPhase(1500)).toBe(-25);
 const y=()=>0;
 // A sample one second old sits 50px left of the trail's end.
 expect(trailPoints([{t:9000,p:1},{t:10_000,p:1}],10_000,0,400,y)).toEqual([[350,0],[400,0]]);
});

it('trail points drop samples that scrolled off and enter on the left edge at the interpolated price',()=>{
 const points=trailPoints([{t:0,p:100},{t:4000,p:200},{t:6000,p:300}],6000,0,200,price=>price);
 // 200px is four seconds of trail: the edge is t=2000, halfway between the first two samples.
 expect(points).toEqual([[0,150],[100,200],[200,300]]);
 expect(trailPoints([],6000,0,200,price=>price)).toEqual([]);
});

it('ladder spacing is about one basis point and its labels keep enough digits',()=>{
 expect(tickSpacingFor(65_262)).toBe(6.53);expect(tickSpacingFor(100)).toBe(0.01);expect(tickSpacingFor(0.5)).toBeCloseTo(0.00005);expect(tickSpacingFor(0)).toBe(0.01);expect(tickSpacingFor(NaN)).toBe(0.01);
 expect(labelDecimalsFor(6.53,65_262)).toBe(2);expect(labelDecimalsFor(0.00005,0.5)).toBe(5);expect(labelDecimalsFor(0,0.5)).toBe(4);
 expect(ladderPrices(100,10,75,125)).toEqual([80,90,100,110,120]);expect(ladderPrices(100,0,75,125)).toEqual([]);
});

it('the price tween eases in and out between its ends',()=>{
 expect(easeInOut(0)).toBe(0);expect(easeInOut(1)).toBe(1);expect(easeInOut(2)).toBe(1);expect(easeInOut(.5)).toBeCloseTo(.5,3);
 expect(easeInOut(.25)).toBeLessThan(.25);expect(easeInOut(.75)).toBeGreaterThan(.75);
});

it('retargets an unfinished price move without changing its current position',()=>{
 const tween=priceTween();
 tween.update(100,1000);tween.update(100.04,1400);
 const before=tween.update(100.04,1550);
 expect(before).toBeCloseTo(100.02);
 expect(tween.update(99.98,1550)).toBe(before);
 let previous=before;
 for(let now=1551;now<=1850;now++){
  const value=tween.update(99.98,now);
  expect(value).toBeLessThanOrEqual(previous+1e-10);expect(value).toBeGreaterThanOrEqual(99.98-1e-10);
  previous=value;
 }
 expect(previous).toBeCloseTo(99.98);
});

it('lands on the exact price and starts the next move there after idle frames',()=>{
 const tween=priceTween();tween.update(1e16,0);tween.update(.01,10);
 expect(tween.update(.01,310)).toBe(.01);
 expect(tween.update(.01,900)).toBe(.01);
 expect(tween.update(.02,1000)).toBe(.01);
 expect(tween.update(.02,1150)).toBeCloseTo(.015,8);
});

it('carries forward velocity through streaming updates instead of stopping on every packet',()=>{
 const tween=priceTween();tween.update(100,0);tween.update(100.04,10);
 const before=tween.update(100.04,159.99),at=tween.update(100.04,160);
 expect(tween.update(100.08,160)).toBe(at);
 const after=tween.update(100.08,160.01);
 expect((after-at)/.01).toBeCloseTo((at-before)/.01,7);
});

it('limits velocity toward nearer prices and resets after missing data or reduced motion',()=>{
 const tween=priceTween();tween.update(100,0);tween.update(100.04,10);
 const at=tween.update(100.04,160),target=at+.001;
 expect(tween.update(target,160)).toBe(at);
 let previous=at;
 for(let now=161;now<=460;now++){
  const value=tween.update(target,now);
  expect(value).toBeGreaterThanOrEqual(previous-1e-10);expect(value).toBeLessThanOrEqual(target+1e-10);
  previous=value;
 }
 expect(tween.update(200,500,true)).toBe(200);
 tween.reset();expect(tween.update(50,516)).toBe(50);
});

it('the smoothed trail passes through every sample and never overshoots a price',()=>{
 const calls:number[][]=[];const sink={moveTo:(x:number,y:number)=>calls.push([x,y]),lineTo:(x:number,y:number)=>calls.push([x,y]),bezierCurveTo:(...values:number[])=>calls.push(values)};
 const points=[[0,10],[10,10],[20,40],[30,40],[40,5]] as const;
 smoothTrail(points,sink);
 expect(calls[0]).toEqual([0,10]);expect(calls.slice(1).map(c=>c.slice(-2))).toEqual(points.slice(1).map(p=>[...p]));
 for(const [i,call] of calls.slice(1).entries()){const low=Math.min(points[i][1],points[i+1][1]),high=Math.max(points[i][1],points[i+1][1]);for(const y of [call[1],call[3]]){expect(y).toBeGreaterThanOrEqual(low-1e-9);expect(y).toBeLessThanOrEqual(high+1e-9);}}
 calls.length=0;smoothTrail([[0,1],[5,2]],sink);expect(calls).toEqual([[0,1],[5,2]]);
});

it('seeds a flat trail and retains the left-edge neighbor when the viewport shrinks',()=>{
 const ticks:{t:number;p:number}[]=[];
 appendTrailSample(ticks,{t:20,p:5},0);
 expect(ticks).toEqual([{t:0,p:5},{t:20,p:5}]);
 for(const t of [40,60,80,80,100])appendTrailSample(ticks,{t,p:t/2},0);
 const neighbor=ticks[3];
 appendTrailSample(ticks,{t:120,p:60},80);
 expect(ticks[0]).toBe(neighbor);
 expect(ticks.map(tick=>tick.t)).toEqual([60,80,80,100,120]);
 appendTrailSample(ticks,{t:200,p:100},180);
 expect(ticks.map(tick=>tick.t)).toEqual([120,200]);
});

it('compacts horizontal runs between their endpoints without changing neighboring curves',()=>{
 const ticks=[0,0,0,3,4,4,4,4,1,1,1].map((p,i)=>({t:i*200,p}));
 const full=trailPoints(ticks,2000,0,100,p=>p);
 const compact=trailPoints(ticks,2000,0,100,p=>p,true);
 expect(compact).toEqual([full[0],full[2],full[3],full[4],full[7],full[8],full[10]]);
 const sloped=(points:typeof full)=>{
  const curves:number[][]=[];let previous=points[0][1];
  smoothTrail(points,{moveTo(){},lineTo(){},bezierCurveTo(...args){
   if(args[5]!==previous)curves.push(args);
   previous=args[5];
  }});
  return curves;
 };
 expect(sloped(compact)).toEqual(sloped(full));
 expect(trailPoints(ticks.slice(0,3),400,7,20,p=>p,true)).toEqual([[7,0],[20,0]]);
});
