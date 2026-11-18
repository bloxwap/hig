import {ALTIMETER_FLOW_PX,smoothTrail,trailPoints,type AltimeterPoint,type AltimeterTick} from './altimeter-model.js';

type History={path:Path2D;area?:{price:number;path:Path2D};first:number;last:AltimeterPoint;sample:AltimeterTick;now:number;origin:number;scale:number;low?:number;high?:number;start:number;end:number};
const histories=new WeakMap<readonly AltimeterTick[],History>();
type Fade={ctx:CanvasRenderingContext2D;start:number;end:number;color:string;step:number;gradients:Map<number,CanvasGradient>};
const fades=new WeakMap<readonly AltimeterTick[],Fade>();

export function trailFade(ctx:CanvasRenderingContext2D,ticks:readonly AltimeterTick[],start:number,end:number,color:string,scroll=0){
 let fade=fades.get(ticks);
 if(!fade||fade.ctx!==ctx||fade.start!==start||fade.end!==end||fade.color!==color){
  // Moving this gradient by one step changes its opacity by at most one 8-bit alpha level.
  const step=Math.min(1,2**Math.floor(Math.log2((end-start)/255)));
  fade={ctx,start,end,color,step,gradients:new Map()};fades.set(ticks,fade);
 }
 const offset=Math.round(scroll/fade.step)*fade.step;
 let gradient=fade.gradients.get(offset);
 if(!gradient){
  gradient=ctx.createLinearGradient(start-offset,0,end-offset,0);
  gradient.addColorStop(0,/^#[0-9a-f]{6}$/i.test(color)?color+'00':'transparent');
  gradient.addColorStop(1,color);
  if(fade.gradients.size>=64)fade.gradients.clear();
  fade.gradients.set(offset,gradient);
 }
 return gradient;
}

interface TrailFrame {
 cached?:History;
 first:number;
 last:AltimeterPoint;
 dx:number;
 dy:number;
}

/** Geometry is stored in the coordinate system of its sampling frame. */
export function historyPath(ctx:CanvasRenderingContext2D,ticks:readonly AltimeterTick[],now:number,start:number,end:number,yFor:(p:number)=>number,origin:number,scale:number,low?:number,high?:number):TrailFrame|undefined{
 const sample=ticks.at(-1);if(!sample)return;
 if(typeof Path2D==='undefined'){
  const points=trailPoints(ticks,now,start,end,yFor);if(!points.length)return;
  ctx.beginPath();smoothTrail(points,ctx);
  return {last:points[points.length-1],first:points[0][0],dx:0,dy:0};
 }
 let history=histories.get(ticks);
 if(!history||history.sample!==sample||history.scale!==scale||history.low!==low||history.high!==high||history.start!==start||history.end!==end||now<history.now){
  const points=trailPoints(ticks,now,start,end,yFor);if(!points.length)return;
  const path=new Path2D();smoothTrail(points,path);
  history={path,first:points[0][0],last:points[points.length-1],sample,now,origin,scale,low,high,start,end};
  histories.set(ticks,history);
 }
 return {cached:history,first:history.first,last:history.last,dx:(history.now-now)*ALTIMETER_FLOW_PX/1000,dy:origin-history.origin};
}

/** Stroke the immutable history, then start the short path that joins the latest sample to the live tip. */
export function beginTrail(ctx:CanvasRenderingContext2D,history:TrailFrame,ticks:readonly AltimeterTick[],start:number,end:number,color:string){
 if(history.cached){
  ctx.save();
  ctx.translate(history.dx,history.dy);
 }
 // Canvas samples gradients in the coordinate system used for the stroke. Keep the fade fixed on screen.
 ctx.strokeStyle=trailFade(ctx,ticks,start,end,color,history.dx);
 if(history.cached){
  ctx.stroke(history.cached.path);
  ctx.beginPath();ctx.moveTo(...history.last);
 }
}
export function appendLiveTail(ctx:CanvasRenderingContext2D,last:AltimeterPoint,end:number,tip:number){
 const dx=end-last[0];
 if(dx>0)ctx.bezierCurveTo(last[0]+dx/3,last[1],end-dx/3,tip,end,tip);
 else ctx.lineTo(end,tip);
}

/** Close both sides of the fill at the same sample. Only the short live polygon changes between samples. */
export function fillTrail(ctx:CanvasRenderingContext2D,history:TrailFrame,end:number,tip:number,baseline:number,price:number,height:number){
 const cached=history.cached;
 if(cached){
  if(cached.area?.price!==price){
   const path=new Path2D(cached.path);
   path.lineTo(cached.last[0],baseline);path.lineTo(cached.first,baseline);path.closePath();
   cached.area={price,path};
  }
  ctx.save();ctx.beginPath();ctx.rect(cached.start-history.dx,-history.dy,cached.end-cached.start,height);ctx.clip();
  ctx.fill(cached.area.path);
  ctx.beginPath();ctx.moveTo(...history.last);appendLiveTail(ctx,history.last,end,tip);
 }
 ctx.lineTo(end,baseline);ctx.lineTo(cached?history.last[0]:history.first,baseline);ctx.closePath();ctx.fill();
 if(cached)ctx.restore();
}

/** Keep the feed current while suspending paint outside the viewport or in a hidden tab. */
export function visibleFrames(container:Element,step:(now:number)=>void,paused:boolean){
 let frame:number|undefined,intersects=true;
 const loop=(now:number)=>{frame=requestAnimationFrame(loop);step(now);};
 const sync=()=>{
  if(!paused&&intersects&&!document.hidden){if(frame===undefined)frame=requestAnimationFrame(loop);}
  else if(frame!==undefined){cancelAnimationFrame(frame);frame=undefined;}
 };
 const observer=typeof IntersectionObserver==='undefined'?undefined:new IntersectionObserver(([entry])=>{intersects=entry.isIntersecting;sync();});
 observer?.observe(container);document.addEventListener('visibilitychange',sync);sync();
 return {
  setPaused(value:boolean){paused=value;sync();},
  stop(){observer?.disconnect();document.removeEventListener('visibilitychange',sync);if(frame!==undefined)cancelAnimationFrame(frame);},
 };
}
