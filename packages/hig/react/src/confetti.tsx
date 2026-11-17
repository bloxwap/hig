"use client";
import React,{useEffect,useRef} from 'react';
import {nativeDisplayP3,nativeSrgb} from '@bloxwap/hig/tokens';
import {CONFETTI_FIRST_TICK,CONFETTI_TICKS_PER_SECOND,confettiBursts,confettiDefaults,confettiFlight,confettiOpacity,confettiSkipped,confettiTravel,createConfettiBurst,type ConfettiBurst,type ConfettiFlight,type ConfettiOptions,type ConfettiParticle} from '@bloxwap/hig/contracts/confetti';
import {useHIG} from './provider.js';
export {mirrorConfetti,type ConfettiOptions,type ConfettiShape} from '@bloxwap/hig/contracts/confetti';
/**
 * HIG's own confetti, with no third-party package. `confetti(options)` fires one burst and resolves when it has finished;
 * the options are canvas-confetti's. All bursts share one full-viewport canvas and one animation frame loop: the canvas is
 * created by the first burst, sized for the device pixel ratio, takes no pointer events and is removed when the last piece
 * has gone. Nothing renders through React while it flies. The flight itself is `@bloxwap/hig/contracts/confetti`, shared
 * with native.
 */
interface Host {anchor:()=>Element|null;reducedMotion:()=>boolean}
interface Run {burst:ConfettiBurst;/** The burst's pieces by colour index, so each colour is filled once a frame. */groups:ConfettiParticle[][];/** Timestamp of the first frame, or -1 before it. */start:number;resolve:()=>void}
interface Layer {canvas:HTMLCanvasElement;context:CanvasRenderingContext2D;runs:Run[];frame:number;width:number;height:number;/** The viewport changed: measure again on the next frame. */stale:boolean}
const hosts:Host[]=[];
let layer:Layer|null=null;
/** The token roles a burst is painted in when the call names no colours: CSS variable, the variable it defaults to, and the token role behind both. */
const roles=[['--hig-action','','action'],['--hig-info','','info'],['--hig-down','--hig-sell','sell'],['--hig-warning','','warning'],['--hig-up','--hig-buy','buy']] as const;
const wideGamut=()=>typeof CSS!=='undefined'&&typeof CSS.supports==='function'&&CSS.supports('color','color(display-p3 1 1 1)');
const displayP3=(hex:string)=>`color(display-p3 ${[1,3,5].map(at=>Number((parseInt(hex.slice(at,at+2),16)/255).toFixed(4))).join(' ')})`;
/**
 * The default colours as the canvas can paint them. The `--hig-*` variables already hold `color(display-p3 …)` where the
 * browser supports it, and a provider's `primaryColor` or `marketColors` where one is set. Without the tokens stylesheet
 * the token tables stand in: Display P3 where the browser can parse it, sRGB elsewhere.
 */
function themeColors(anchor:Element):string[]{
 const style=getComputedStyle(anchor),wide=wideGamut();
 return roles.map(([name,fallback,role])=>style.getPropertyValue(name).trim()||(fallback&&style.getPropertyValue(fallback).trim())||(wide?displayP3(nativeDisplayP3[role]):nativeSrgb[role]));
}
/** A Display P3 canvas on a screen that can show it, so the token colours keep their full strength; an sRGB canvas elsewhere. */
function paintContext(canvas:HTMLCanvasElement):CanvasRenderingContext2D|null{
 let context:CanvasRenderingContext2D|null=null;
 try{
  if(typeof window.matchMedia==='function'&&window.matchMedia('(color-gamut: p3)').matches)context=canvas.getContext('2d',{colorSpace:'display-p3'});
 }catch{/* An engine that rejects the setting paints sRGB. */}
 try{return context??canvas.getContext('2d');}catch{return null;}
}
function measure(current:Layer):void{
 const root=document.documentElement,width=root.clientWidth||window.innerWidth,height=root.clientHeight||window.innerHeight,ratio=window.devicePixelRatio||1;
 current.width=width;current.height=height;current.canvas.width=Math.round(width*ratio);current.canvas.height=Math.round(height*ratio);
 // Resizing the canvas resets its state, so the scale is set again: pieces are placed in CSS pixels and painted in device pixels.
 current.context.setTransform(ratio,0,0,ratio,0,0);current.stale=false;
}
const resized=()=>{if(layer)layer.stale=true;};
function open(zIndex:number):Layer|null{
 const canvas=document.createElement('canvas'),context=paintContext(canvas);if(!context)return null;
 canvas.setAttribute('aria-hidden','true');canvas.setAttribute('data-hig-confetti','');
 Object.assign(canvas.style,{position:'fixed',top:'0',left:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:String(zIndex)});
 const current:Layer={canvas,context,runs:[],frame:0,width:0,height:0,stale:true};
 (document.body??document.documentElement).appendChild(canvas);window.addEventListener('resize',resized);
 return current;
}
function close(current:Layer):void{
 if(layer===current)layer=null;
 if(current.frame)cancelAnimationFrame(current.frame);current.frame=0;
 window.removeEventListener('resize',resized);current.canvas.remove();
}
const turn=Math.PI*2;
/** canvas-confetti's star around the origin, for a piece of size 1: ten points, alternately on the outer and the inner radius. */
const starPoints=Array.from({length:10},(_,index)=>{const angle=Math.PI*1.5+index*Math.PI/5,radius=index%2?0.4:0.8;return [Math.cos(angle)*radius,Math.sin(angle)*radius] as const;});
const flight:ConfettiFlight={x:0,y:0,ux:0,uy:0,vx:0,vy:0,wobble:0};
/**
 * One burst at tick `t`. Every piece of a burst shares its opacity, and all pieces of one colour go into one path that is
 * filled once. Each outline is wound the same way, so two overlapping pieces of a colour never cut a hole in each other.
 */
function draw(context:CanvasRenderingContext2D,run:Run,t:number,width:number,height:number):void{
 const {burst,groups}=run,{physics,origin,colors}=burst,travel=confettiTravel(physics,t),left=origin.x*width,top=origin.y*height,size=physics.size;
 context.globalAlpha=confettiOpacity(physics,t);
 for(let color=0;color<groups.length;color++){
  const group=groups[color];if(!group.length)continue;
  context.fillStyle=colors[color];context.beginPath();
  for(let index=0;index<group.length;index++){
   const particle=group[index];confettiFlight(particle,physics,t,travel,flight);
   const x=left+flight.x,y=top+flight.y;
   if(particle.shape==='circle'){
    const angle=Math.PI/10*flight.wobble,rx=Math.abs(flight.ux)*0.6,ry=Math.abs(flight.vy)*0.6;
    context.moveTo(x+rx*Math.cos(angle),y+rx*Math.sin(angle));context.ellipse(x,y,rx,ry,angle,0,turn);
   }else if(particle.shape==='star'){
    context.moveTo(x+starPoints[0][0]*size,y+starPoints[0][1]*size);
    for(let point=1;point<10;point++)context.lineTo(x+starPoints[point][0]*size,y+starPoints[point][1]*size);
    context.closePath();
   }else{
    const {ux,uy,vx,vy}=flight;
    context.moveTo(x,y);
    if(ux*vy-uy*vx<0){context.lineTo(x+vx,y+vy);context.lineTo(x+ux+vx,y+uy+vy);context.lineTo(x+ux,y+uy);}
    else{context.lineTo(x+ux,y+uy);context.lineTo(x+ux+vx,y+uy+vy);context.lineTo(x+vx,y+vy);}
    context.closePath();
   }
  }
  context.fill();
 }
}
function frame(now:number):void{
 const current=layer;if(!current)return;
 current.frame=0;
 if(current.stale)measure(current);
 const {context,width,height}=current;
 context.clearRect(0,0,width,height);
 const runs=current.runs;let kept=0;
 for(let index=0;index<runs.length;index++){
  const run=runs[index];
  // Time, not frames, moves a burst: it takes the same time at 60 Hz and 120 Hz, and a dropped frame costs nothing later.
  if(run.start<0)run.start=now;
  const t=CONFETTI_FIRST_TICK+(now-run.start)*CONFETTI_TICKS_PER_SECOND/1000;
  if(t>=run.burst.physics.ticks)run.resolve();else{draw(context,run,t,width,height);runs[kept++]=run;}
 }
 runs.length=kept;
 if(kept===0){close(current);return;}
 current.frame=requestAnimationFrame(frame);
}
function fire(options:ConfettiOptions|undefined,host:Host|undefined):Promise<void>{
 if(typeof window==='undefined'||typeof document==='undefined')return Promise.resolve();
 const reduced=host?host.reducedMotion():typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(confettiSkipped(options,reduced))return Promise.resolve();
 const burst=createConfettiBurst(options,()=>themeColors(host?.anchor()??document.documentElement));
 if(burst.particles.length===0)return Promise.resolve();
 const zIndex=options?.zIndex;
 const current=layer??=open(typeof zIndex==='number'&&Number.isFinite(zIndex)?zIndex:confettiDefaults.zIndex);
 // No 2D canvas here: there is nothing to draw on, so the burst is over.
 if(!current)return Promise.resolve();
 const groups:ConfettiParticle[][]=burst.colors.map(()=>[]);for(const particle of burst.particles)groups[particle.color].push(particle);
 return new Promise<void>(resolve=>{
  current.runs.push({burst,groups,start:-1,resolve});
  if(!current.frame)current.frame=requestAnimationFrame(frame);
 });
}
function reset():void{
 const current=layer;if(!current)return;
 close(current);for(const run of current.runs.splice(0))run.resolve();
}
export interface ConfettiFire {
 /** Fires one burst and resolves when it has finished, or at once when nothing is drawn: under reduced motion (unless `disableForReducedMotion` is false), with no pieces, or on a server. Colours and reduced motion come from the most recently mounted `Confetti`, else from the document. */
 (options?:ConfettiOptions):Promise<void>;
 /** Stops every burst now, removes the canvas and resolves their promises. */
 reset():void;
}
/** Fires a burst of confetti over the viewport. Call it from an event handler or an effect; it needs no `Confetti` to be mounted on web. */
export const confetti:ConfettiFire=Object.assign((options?:ConfettiOptions)=>fire(options,hosts[hosts.length-1]),{reset});
export interface ConfettiProps {
 /** Fires `options` whenever it is truthy: on mount, and each time it changes to another truthy value. A win count or an order id works. Leave it out to fire only through `confetti()`. */
 trigger?:unknown;
 /** The burst `trigger` fires, or several fired together. Read when `trigger` changes, so it need not be a stable object. */
 options?:ConfettiOptions|readonly ConfettiOptions[];
}
/**
 * The confetti host. Mount it once inside HIGProvider: bursts then follow the provider's `reducedMotion`, `primaryColor`
 * and `marketColors`. It draws nothing itself and never renders again for a burst; on web the canvas is added to the
 * document body while pieces fly. With `trigger` it also fires declaratively.
 */
export function Confetti({trigger,options}:ConfettiProps){
 const {reducedMotion}=useHIG();
 const anchor=useRef<HTMLSpanElement>(null),motion=useRef(reducedMotion),latest=useRef(options),fired=useRef<unknown>(undefined),self=useRef<Host|null>(null);
 motion.current=reducedMotion;latest.current=options;
 useEffect(()=>{
  const host:Host={anchor:()=>anchor.current,reducedMotion:()=>motion.current===true};self.current=host;hosts.push(host);
  return()=>{self.current=null;const index=hosts.indexOf(host);if(index>=0)hosts.splice(index,1);};
 },[]);
 useEffect(()=>{
  // Each truthy value fires once, also when React runs the effect twice in development.
  if(Object.is(fired.current,trigger))return;fired.current=trigger;if(!trigger)return;
  for(const burst of confettiBursts(latest.current))void fire(burst,self.current??undefined);
 },[trigger]);
 return <span ref={anchor} hidden data-hig-confetti-host=''/>;
}
