import {it,expect} from 'vitest';
import {ALTIMETER_EASE_MS,ALTIMETER_TWEEN_IDLE,stepPriceTween,type AltimeterTweenState} from '../packages/hig/chart/src/altimeter-model';
import {liveSegments,trailScroll,trailTiles,trailX,trailY,tweenValue,tweenVelocity,type TrailSegment,type TrailSpace,type TweenChange} from '../packages/hig/chart/src/altimeter-trail';

const space:TrailSpace={t0:10_000,p0:100,spacing:.01};
/** A cubic's value where its time is `t`. Time runs evenly along a trail segment, so the parameter is the fraction of its span. */
const at=(segment:TrailSegment,t:number)=>{
 const u=(t-segment[0])/(segment[6]-segment[0]),v=1-u;
 return v*v*v*segment[1]+3*v*v*u*segment[3]+3*v*u*u*segment[5]+u*u*u*segment[7];
};
const containing=(segments:readonly TrailSegment[],t:number)=>segments.find(segment=>segment[0]<=t&&t<=segment[6])!;

it('a space places time 50px a second to the right and a higher price further up',()=>{
 expect(trailX(space,11_000)).toBe(50);expect(trailX(space,9000)).toBe(-50);
 expect(trailY(space,100.01)).toBeCloseTo(-44);expect(trailY(space,99.99)).toBeCloseTo(44);
});

it('scrolls a space so the pill sits on its origin, on whole device pixels and never at negative zero',()=>{
 // 1.003s of travel is 50.15px: 150.45 device pixels at 3x, drawn at 150.
 expect(trailScroll(space,11_003,100,3)).toEqual({x:-50,y:0});
 // 50.5px of travel and 4.4px of rise land on the nearest device pixel: 152 and 13 of them.
 const moved=trailScroll(space,11_010,100.001,3);
 expect(moved.x).toBeCloseTo(-152/3,9);expect(moved.y).toBeCloseTo(13/3,9);
 const rest=trailScroll(space,10_000,100,3);
 expect(Object.is(rest.x,0)).toBe(true);expect(Object.is(rest.y,0)).toBe(true);
 // Before a price arrives the space holds its row.
 expect(trailScroll(space,10_000,NaN,3).y).toBe(0);
});

it('reads a tween without stepping it, as the driver and the UI thread both do',()=>{
 let state:AltimeterTweenState=ALTIMETER_TWEEN_IDLE;
 expect(tweenValue(state,0)).toBeNaN();
 const targets=[[0,100],[40,101],[120,101],[150,99],[260,99],[600,99],[640,102]] as const;
 for(const [now,target] of targets){
  const stepped=stepPriceTween(state,target,now);
  // The state before the step already says what the step shows.
  if(Number.isFinite(state.to))expect(tweenValue(state,now)).toBeCloseTo(stepped.value,12);
  state=stepped.state;
  expect(tweenValue(state,now)).toBeCloseTo(stepped.value,12);
 }
 expect(tweenValue(state,640+ALTIMETER_EASE_MS)).toBe(102);
 // Velocity is the slope of the value, and nothing moves outside the tween.
 const mid=640+ALTIMETER_EASE_MS/3;
 expect(tweenVelocity(state,mid)).toBeCloseTo((tweenValue(state,mid+.01)-tweenValue(state,mid-.01))/.02,6);
 expect(tweenVelocity(state,639)).toBe(0);expect(tweenVelocity(state,640+ALTIMETER_EASE_MS)).toBe(0);
});

it('draws the displayed price as exact cubics, through every change of course and on past the present',()=>{
 let state=stepPriceTween(ALTIMETER_TWEEN_IDLE,100,0).state;
 const log:TweenChange[]=[{at:0,state}];
 for(const [now,target] of [[50,101],[130,99.5],[500,100.2]] as const){state=stepPriceTween(state,target,now).state;log.push({at:now,state});}
 const shown=(t:number)=>{let active=log[0].state;for(const change of log)if(change.at<=t)active=change.state;return tweenValue(active,t);};
 const segments=liveSegments(log,0,2000);
 // One run with no gaps: each segment starts where the last ended.
 expect(segments[0][0]).toBe(0);expect(segments.at(-1)![6]).toBe(2000);
 for(let i=1;i<segments.length;i++){expect(segments[i][0]).toBe(segments[i-1][6]);expect(segments[i][1]).toBeCloseTo(segments[i-1][7],9);}
 for(let t=0;t<=2000;t+=7)expect(at(containing(segments,t),t)).toBeCloseTo(shown(t),9);
 // After the last tween ends the trail is level at its target.
 expect(segments.at(-1)).toEqual([800,100.2,1200,100.2,1600,100.2,2000,100.2]);
 // A window that opens part-way through a tween starts with the rest of that tween.
 const late=liveSegments(log,200,400);
 expect(late[0][0]).toBe(200);expect(late[0][1]).toBeCloseTo(shown(200),9);expect(at(containing(late,333),333)).toBeCloseTo(shown(333),9);
});

/** A chart driven as the native renderer drives it: a step at most 30 times a second that follows the price tween. */
function drive(pixel=3,tile=20){
 const trail=trailTiles({tile,pixel});
 let tween=ALTIMETER_TWEEN_IDLE,display=NaN;
 const port={span:260,height:600,display:NaN as number,basis:undefined as number|undefined};
 const step=(now:number,price:number)=>{
  const stepped=stepPriceTween(tween,price,now);
  display=stepped.value;
  if(stepped.state!==tween){tween=stepped.state;if(trail.seeded)trail.retarget(tween,now);}
  if(!trail.seeded)trail.seed(now,display,9800);
  return trail.view(now,{...port,display});
 };
 return {trail,step,port,get display(){return display;},get tween(){return tween;}};
}
/** The cubics of a patch's path, as canvas coordinates: start, two handles, end. */
const cubics=(d:string)=>{
 const found:TrailSegment[]=[];let x=0,y=0;
 for(const [,op,rest] of d.matchAll(/([MHC])([-\d. ]+)/g)){
  const n=rest.trim().split(' ').map(Number);
  if(op==='M'){x=n[0];y=n[1];}
  else if(op==='H')x=n[0];
  else{found.push([x,y,n[0],n[1],n[2],n[3],n[4],n[5]]);x=n[4];y=n[5];}
 }
 return found;
};

it('seeds a level trail as one wide tile and the patch beside the pill',()=>{
 const chart=drive();
 chart.trail.start(space);
 const view=chart.step(10_000,100);
 const {tiles,live}=view;
 // 260px of level trail is one canvas, not thirteen. The newest 20px wait in the patch until the line has run past their edge.
 expect(tiles).toHaveLength(1);
 expect(tiles[0]).toMatchObject({left:-260,width:240,top:-2,height:4,d:'M-4 2H244',level:true});
 // The patch carries on from the tile and runs two seconds past the present, level at the price.
 expect(live!.left).toBe(-20);
 expect(live!.left+live!.width).toBeCloseTo(100,5);
 expect(live).toMatchObject({top:-2,height:4});
});

it('draws nothing on a quiet price until the pill nears the end of what was drawn ahead of it',()=>{
 const chart=drive();
 chart.trail.start(space);
 let view=chart.step(10_000,100);
 const seeded=view.tiles[0],first=view;
 // A second and a half of steps, and the same pieces: no canvas is drawn.
 for(let now=10_033;now<=11_500;now+=33)expect(chart.step(now,100)).toBe(first);
 // Half a second short of the patch's end it is topped up, and the level trail it uncovered becomes one wide tile.
 view=chart.step(11_533,100);
 expect(view).not.toBe(first);
 expect(view.tiles).toHaveLength(2);
 expect(view.tiles[0]).toBe(seeded);
 expect(view.tiles[1]).toMatchObject({left:-20,width:80,level:true,d:'M-4 2H84'});
 expect(view.live!.left).toBe(60);
 expect(view.live!.left+view.live!.width).toBeCloseTo(trailX(space,13_533),0);
 // Tiles meet edge to edge, each is drawn once (the same object in every later view until it leaves), and a new tile takes
 // the lowest key no tile holds, so a renderer reuses the views of tiles that left.
 const seen=new Map<number,typeof seeded>();let draws=0,last=view;
 for(let now=11_566;now<=24_000;now+=33){
  view=chart.step(now,100);
  if(view!==last){draws++;last=view;}
  for(let i=1;i<view.tiles.length;i++)expect(view.tiles[i].left).toBe(view.tiles[i-1].left+view.tiles[i-1].width);
  for(const tile of view.tiles){const drawn=seen.get(tile.until);if(drawn)expect(tile).toBe(drawn);else seen.set(tile.until,tile);}
  expect(new Set(view.tiles.map(tile=>tile.key)).size).toBe(view.tiles.length);
  expect(view.tiles.length).toBeLessThanOrEqual(6);
 }
 // Twelve and a half seconds of a quiet price: a draw every second and a half, not five a second.
 expect(draws).toBeLessThanOrEqual(9);
 // The seeded tile has scrolled off and its key has been handed on.
 expect(view.tiles).not.toContain(seeded);
 expect(view.tiles.some(tile=>tile.key===0)).toBe(true);
});

it('draws the course a new price sets at once, ahead of the pill, and keeps it as history without redrawing it',()=>{
 const chart=drive();
 chart.trail.start(space);
 let view=chart.step(10_000,100);
 for(let now=10_033;now<=11_000;now+=33)view=chart.step(now,100);
 const before=view.tiles;
 // The price changes: the patch is drawn again with the tween it will follow. The level trail behind it joins the
 // history as one more tile, and no tile already drawn is touched.
 view=chart.step(11_033,100.03);
 for(const tile of before)expect(view.tiles).toContain(tile);
 expect(view.tiles.every(tile=>tile.level)).toBe(true);
 const live=view.live!;
 // 132px of rise (three rows), drawn before the pill gets there: the canvas already spans it.
 expect(live.height).toBeCloseTo(136,5);
 const [rise]=cubics(live.d);
 // The line is at the pill's price where the pill is, at every moment of the tween.
 for(let now=11_040;now<11_333;now+=20)expect(at(rise,trailX(space,now)-live.left)).toBeCloseTo(trailY(space,tweenValue(chart.tween,now))-live.top,1);
 expect(live.d).toMatch(/C[-\d. ]+H[-\d.]+$/);
 // While the pill follows that course nothing is drawn: the patch already holds it.
 const held=view;
 for(let now=11_066;now<=12_500;now+=33)expect(chart.step(now,100.03)).toBe(held);
 // At the next top-up the rise is history: it is cut into tiles as it was drawn, the same curve, never reshaped.
 view=chart.step(12_566,100.03);
 const risen=view.tiles.filter(tile=>tile.height>4);
 expect(risen.length).toBeGreaterThan(0);
 const [kept]=cubics(risen[0].d);
 for(let now=11_100;now<11_300;now+=40){
  const x=trailX(space,now);
  if(x<risen[0].left||x>risen[0].left+risen[0].width)continue;
  expect(at(kept,x-risen[0].left)+risen[0].top).toBeCloseTo(at(rise,x-live.left)+live.top,1);
 }
 // And the trail after it is level again, three rows up.
 expect(view.tiles.at(-1)).toMatchObject({top:-134,height:4,level:true});
});

it('joins a change of course in flight to the path already followed',()=>{
 const chart=drive();
 chart.trail.start(space);
 chart.step(10_000,100);
 chart.step(10_033,100.02);
 // A third of the way up, the price turns back.
 const view=chart.step(10_133,99.99);
 const turned=cubics(view.live!.d);
 // The path so far and the new course meet where the pill is.
 const here=trailX(space,10_133)-view.live!.left;
 expect(turned[0][6]).toBeCloseTo(here,1);expect(turned[1][0]).toBeCloseTo(here,1);
 expect(turned[1][1]).toBeCloseTo(turned[0][7],1);
 expect(turned[0][7]).toBeCloseTo(trailY(space,chart.display)-view.live!.top,1);
});

it('shades to break-even in one canvas, strongest at the pill and gone at the line',()=>{
 const chart=drive();
 chart.trail.start(space);
 let view=chart.step(10_000,100);
 expect(view.area).toBeNull();
 chart.port.basis=99.98;
 view=chart.step(10_033,100);
 const area=view.area!;
 // From the trail's left end to two seconds past the pill; two rows down to break-even.
 expect(area.left).toBeLessThanOrEqual(trailX(space,10_033)-260);
 expect(area.left+area.width).toBeCloseTo(trailX(space,12_033),0);
 expect(area.top).toBe(0);expect(area.height).toBe(88);
 expect(area.from).toBe(0);expect(area.to).toBe(88);
 expect(area.d).toMatch(/^M[-\d. ]+(H[-\d.]+)+V88H-?[\d.]+Z$/);
 // A new price: the shade is strongest where the pill is heading.
 view=chart.step(10_066,100.01);
 expect(view.area!.from).toBe(0);expect(view.area!.top).toBe(-44);expect(view.area!.to).toBe(132);
 // Break-even far off the chart: the shade fades by the chart's edge and the canvas stops there.
 chart.port.basis=90;
 view=chart.step(10_500,100.01);
 expect(view.area!.to-view.area!.from).toBe(300);expect(view.area!.height).toBeLessThanOrEqual(300+44+2);
 // At break-even exactly there is nothing to shade, and an invalid price draws nothing.
 chart.port.basis=100.01;expect(chart.step(10_600,100.01).area).toBeNull();
 chart.port.basis=NaN;expect(chart.step(10_700,100.01).area).toBeNull();
});

it('moves new pieces to the other space and leaves the tiles already drawn where they are',()=>{
 const chart=drive();
 chart.trail.start(space);
 let view=chart.step(10_000,100);
 for(let now=10_033;now<=12_000;now+=33)view=chart.step(now,100);
 const before=view.tiles,edge=chart.trail.edge;
 // The new space starts where this one's tiles end, at another scale.
 const next:TrailSpace={t0:edge,p0:100.5,spacing:.02};
 expect(chart.trail.flip(next)).toBe(1);
 view=chart.step(12_033,100);
 expect(view.live!.space).toBe(1);
 // What has been drawn since is in the new space, starting at its origin.
 const taken=view.tiles.filter(tile=>tile.space===1);
 expect(taken.length?taken[0].left:view.live!.left).toBe(0);
 for(const tile of before)if(view.tiles.includes(tile))expect(tile.space).toBe(0);
 for(let now=12_066;now<=15_000;now+=33)view=chart.step(now,100);
 const fresh=view.tiles.filter(tile=>tile.space===1);
 expect(fresh.length).toBeGreaterThan(0);
 // The first tile of the new space begins at that same moment: no gap and no overlap in time.
 expect(fresh[0].left).toBe(0);
 const old=view.tiles.filter(tile=>tile.space===0);
 expect(old.at(-1)!.until).toBe(edge);
 // Its price sits where the new scale puts it: 100 is 25 rows under 100.5 at 0.02 a row.
 expect(fresh[0].top).toBe(25*44-2);
 // Flipping back reuses the first space, whose old tiles must not move with its new origin.
 const back=chart.trail.edge;
 expect(chart.trail.flip({t0:back,p0:100,spacing:.01})).toBe(0);
 view=chart.step(15_033,100);
 for(const tile of before)expect(view.tiles).not.toContain(tile);
 expect(view.tiles.filter(tile=>tile.space===0).every(tile=>tile.until>back&&tile.left>=0)).toBe(true);
 // A trail can also start in the second space, which is how a chart resumes in the space its ladder is drawn in.
 chart.trail.reset();
 chart.trail.start(space,1);
 chart.trail.seed(20_000,100,9800);
 view=chart.trail.view(20_000,{...chart.port,display:100});
 expect(view.live!.space).toBe(1);expect(view.tiles.every(tile=>tile.space===1)).toBe(true);
});

it('works on a display whose pixels do not divide the layout evenly',()=>{
 const pixel=2.625,tile=Math.round(20*pixel)/pixel,chart=drive(pixel,tile);
 chart.trail.start(space);
 let view=chart.step(10_000,100);
 for(let now=10_033;now<=14_000;now+=33)view=chart.step(now,100+Math.round(Math.sin(now/300)*2)/100);
 const onPixel=(value:number)=>Math.abs(value*pixel-Math.round(value*pixel))<1e-6;
 for(const piece of [...view.tiles,view.live!]){expect(onPixel(piece.left)).toBe(true);expect(onPixel(piece.top)).toBe(true);expect(onPixel(piece.left+piece.width)).toBe(true);}
 for(let i=1;i<view.tiles.length;i++)expect(view.tiles[i].left).toBeCloseTo(view.tiles[i-1].left+view.tiles[i-1].width,9);
});
