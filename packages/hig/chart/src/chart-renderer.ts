import {ALTIMETER_FLOW_PX,smoothTrail,trailPoints,type AltimeterTick} from './altimeter-model.js';

type History={path:Path2D;first:number;last:readonly [number,number];sample:AltimeterTick;now:number;origin:number;scale:number;low?:number;high?:number;start:number;end:number};
const histories=new WeakMap<readonly AltimeterTick[],History>();
const fades=new WeakMap<readonly AltimeterTick[],{ctx:CanvasRenderingContext2D;start:number;end:number;color:string;gradient:CanvasGradient}>();

export function trailFade(ctx:CanvasRenderingContext2D,ticks:readonly AltimeterTick[],start:number,end:number,color:string){
 const previous=fades.get(ticks);
 if(previous?.ctx===ctx&&previous.start===start&&previous.end===end&&previous.color===color)return previous.gradient;
 const gradient=ctx.createLinearGradient(start,0,end,0);
 gradient.addColorStop(0,/^#[0-9a-f]{6}$/i.test(color)?color+'00':'transparent');
 gradient.addColorStop(1,color);fades.set(ticks,{ctx,start,end,color,gradient});return gradient;
}

/** History moves rigidly between samples. Only the connector to the live price changes shape. */
export function historyPath(ctx:CanvasRenderingContext2D,ticks:readonly AltimeterTick[],now:number,start:number,end:number,yFor:(p:number)=>number,origin:number,scale:number,low?:number,high?:number){
 const sample=ticks.at(-1);if(!sample)return;
 if(typeof Path2D==='undefined'||typeof DOMMatrix==='undefined'){
  const points=trailPoints(ticks,now,start,end,yFor);if(!points.length)return;
  ctx.beginPath();smoothTrail(points,ctx);
  return {sink:ctx,last:points[points.length-1],first:points[0][0]};
 }
 let history=histories.get(ticks);
 if(!history||history.sample!==sample||history.scale!==scale||history.low!==low||history.high!==high||history.start!==start||history.end!==end||now<history.now){
  const points=trailPoints(ticks,now,start,end,yFor);if(!points.length)return;
  const path=new Path2D();smoothTrail(points,path);
  history={path,first:points[0][0],last:points[points.length-1],sample,now,origin,scale,low,high,start,end};
  histories.set(ticks,history);
 }
 const dx=(history.now-now)*ALTIMETER_FLOW_PX/1000,dy=origin-history.origin;
 const path=new Path2D();path.addPath(history.path,new DOMMatrix([1,0,0,1,dx,dy]));
 return {path,sink:path,last:[history.last[0]+dx,history.last[1]+dy],first:history.first+dx};
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
