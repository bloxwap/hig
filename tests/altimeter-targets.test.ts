import {it,expect} from 'vitest';
import {placeTargets,targetLayout,targetCrossings,validTargets} from '../packages/hig/chart/src/altimeter-targets';

it('ignores invalid prices and duplicate IDs while retaining optional labels and CSS colors',()=>{
 const target={id:'entry',price:100,color:'var(--entry)'};
 expect(validTargets([target,{id:'entry',price:110},{id:'',price:100},{id:'nan',price:NaN},{id:'infinity',price:Infinity},{id:'zero',price:0},{id:'negative',price:-1}])).toEqual([target]);
});

it('counts arrivals at the exact price once, crossings in both directions, and jumps over several levels',()=>{
 const tracker=targetCrossings(),low={id:'low',price:99},high={id:'high',price:101},levels=[high,low];
 expect(tracker.update(98,levels)).toEqual([]);
 expect(tracker.update(99,levels)).toEqual([low]);
 expect(tracker.update(99,levels)).toEqual([]);
 expect(tracker.update(100,levels)).toEqual([]);
 expect(tracker.update(102,levels)).toEqual([high]);
 expect(tracker.update(98,levels)).toEqual([high,low]);
 expect(tracker.update(102,levels)).toEqual([low,high]);
});

it('arms new and edited levels without a crossing and forgets removed levels and previous sessions',()=>{
 const tracker=targetCrossings(),original={id:'tp',price:101},edited={...original,price:99};
 tracker.update(98,[original]);
 expect(tracker.update(100,[edited])).toEqual([]);
 expect(tracker.update(98,[edited])).toEqual([edited]);
 tracker.update(98,[]);
 expect(tracker.update(100,[edited])).toEqual([]);
 tracker.reset();expect(tracker.update(98,[edited])).toEqual([]);
 // New object identities and cosmetic edits do not disarm an existing level.
 expect(tracker.update(100,[{...edited,label:'Take profit',color:'lime'}])).toEqual([{...edited,label:'Take profit',color:'lime'}]);
});

it('pins offscreen labels in price order at both edges and ignores unlabelled targets when stacking',()=>{
 const targets=[{id:'low',price:90,label:'Liquidation'},{id:'higher',price:120,label:'Take Profit'},{id:'lower',price:80,label:'Stop Loss'},{id:'high',price:110,label:'Entry'},{id:'line',price:130}];
 const placed=placeTargets(targets,100,.01,200);
 expect(placed.get('higher')).toMatchObject({anchor:0,labelTop:8,pinned:'top'});
 expect(placed.get('high')).toMatchObject({anchor:0,labelTop:32,pinned:'top'});
 expect(placed.get('low')).toMatchObject({anchor:200,labelTop:150,pinned:'bottom'});
 expect(placed.get('lower')).toMatchObject({anchor:200,labelTop:174,pinned:'bottom'});
 expect(placed.get('line')?.labelTop).toBeUndefined();
 expect(placeTargets([...targets].reverse(),100,.01,200)).toEqual(placed);
});

it('keeps returning targets on their lines and separates edge labels from nearby visible labels',()=>{
 const targets=[{id:'far',price:101,label:'Far'},{id:'near',price:100.022,label:'Near'}];
 const placed=placeTargets(targets,100,.01,200);
 expect(placed.get('far')).toMatchObject({labelTop:8,pinned:'top'});
 expect(placed.get('near')?.pinned).toBeNull();
 expect(placed.get('near')!.labelTop!-placed.get('far')!.labelTop!).toBeGreaterThanOrEqual(24);
 const returning=placeTargets(targets,101,.01,200).get('far')!;
 expect(returning.pinned).toBeNull();expect(returning.y).toBe(100);expect(returning.labelTop).toBe(78);
 const taller=placeTargets(targets,100,.01,400).get('near')!;
 expect(taller.labelTop).toBeCloseTo(taller.y+8);
 expect(placeTargets(targets,NaN,.01,200).size).toBe(0);
 expect(placeTargets(targets,100,0,200).size).toBe(0);
});

it('preserves stack order when close targets switch sides and keeps positions continuous at pin boundaries',()=>{
 const targets=[{id:'higher',price:100.001,label:'Higher'},{id:'lower',price:100,label:'Lower'}];
 // Labels face the current price, but must never swap order while that price moves between two close levels.
 for(const price of [99.99,100,100.0005,100.001,100.01]){
  const placed=placeTargets(targets,price,.01,200);
  expect(placed.get('lower')!.labelTop!-placed.get('higher')!.labelTop!).toBeGreaterThanOrEqual(24-1e-9);
 }
 let previous:Map<string,{labelTop?:number}>|undefined;
 for(let i=0;i<=200;i++){
  const placed=placeTargets(targets,100.022+i*.00001,.01,200);
  if(previous)for(const target of targets)expect(Math.abs(placed.get(target.id)!.labelTop!-previous.get(target.id)!.labelTop!)).toBeLessThanOrEqual(.044001);
  previous=placed;
 }
});

it('tracks the line on every frame without easing its position a second time',()=>{
 const layout=targetLayout(),targets=[{id:'high',price:100.02,label:'Take Profit'},{id:'low',price:99.98,label:'Stop Loss'}];
 for(let frame=0;frame<80;frame++){
  const positions=layout.update(targets,100+Math.sin(frame/8)*.008,.01,400,frame*16);
  expect(positions.get('high')!.labelTop!-positions.get('high')!.y).toBeCloseTo(8,8);
  expect(positions.get('low')!.labelTop!-positions.get('low')!.y).toBeCloseTo(-22,8);
 }
});

it('animates only the side offset and reverses from its current offset',()=>{
 const layout=targetLayout(),targets=[{id:'entry',price:100,label:'Entry'}];
 const offset=(price:number,now:number,snap=false)=>{const position=layout.update(targets,price,.01,200,now,snap).get('entry')!;return position.labelTop!-position.y;};
 expect(offset(99.999,1000)).toBeCloseTo(8);
 expect(offset(100.001,1020)).toBeCloseTo(8);
 const moving=offset(100.001,1085);
 expect(moving).toBeLessThan(8);expect(moving).toBeGreaterThan(-22);
 expect(offset(99.999,1085)).toBeCloseTo(moving);
 expect(offset(99.999,1345)).toBeCloseTo(8);
 expect(offset(100.001,1361,true)).toBeCloseTo(-22);
 layout.update(targets,NaN,.01,200,1400);
 expect(offset(99.999,1416)).toBeCloseTo(8);
});

it('resolves animated side changes and edge stacks before rendering, without overlap or edge overshoot',()=>{
 const layout=targetLayout(),targets=[{id:'high',price:100.001,label:'High'},{id:'entry',price:100,label:'Entry'},{id:'low',price:99.99,label:'Low'}];
 for(let frame=0;frame<180;frame++){
  const positions=layout.update(targets,100+Math.sin(frame/20)*.06,.01,200,frame*16);
  const tops=targets.map(target=>positions.get(target.id)!.labelTop!);
  expect(tops[0]).toBeGreaterThanOrEqual(8-1e-9);
  expect(tops[2]+18).toBeLessThanOrEqual(192+1e-9);
  for(let i=1;i<tops.length;i++)expect(tops[i]-tops[i-1]).toBeGreaterThanOrEqual(24-1e-9);
 }
});
