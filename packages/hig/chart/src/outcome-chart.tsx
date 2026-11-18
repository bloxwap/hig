"use client";
import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {appendTrailSample,appendLiveTail,beginTrail,historyPath,visibleFrames} from './chart-renderer.js';
import {tokens} from '@bloxwap/hig/tokens';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG,useColors} from '@bloxwap/hig/react/provider';
import {NumberFlow} from '@bloxwap/hig/react/animated-number';
import {priceTween,ALTIMETER_FLOW_PX,ALTIMETER_SAMPLE_MS,easeInOut,gridPhase,type AltimeterTick} from './altimeter-model.js';
import {OUTCOME_LIMIT,capsuleCenters,labelBounds,type TargetLabelInsets,outcomeChance,outcomeColors,outcomeScale,outcomeTicks,outcomeY,type Outcome,type OutcomeFeed,type OutcomeScale} from './outcome-model.js';
import {championsLeagueWinner} from './champions-league.js';
import {drawPlusGrid,monoFont} from './plus-grid.js';

export interface OutcomeChartProps extends Omit<React.HTMLAttributes<HTMLElement>,'children'> {
 /** Text alternative shown as the figure's caption, for example the question and where its prices come from. */
 summary:string;
 /** Suspend chart frames while an opaque overlay covers the plot. */
 paused?:boolean;
 /** Two to ten outcomes, owned by the host. `null` or empty reads as waiting. Omit it to use `feed`. */
 outcomes?:readonly Outcome[]|null;
 /** Live source of outcomes, used only while `outcomes` is omitted. Defaults to `championsLeagueWinner`. Keep its identity stable. */
 feed?:OutcomeFeed;
 /** Chart height in pixels. Default 360. */
 height?:number;
 /** Clearance for outcome capsules in pixels. Defaults to zero on both edges. */
 targetLabelInsets?:TargetLabelInsets;
}

/** How long a capsule takes to glide from the waiting stack to its place once its first price arrives. */
const ARRIVE_MS=500;
/** Width of the curve that carries a trail into its capsule. */
const CONNECTOR=40;
/** Room above 100% and below 0%, so the end ticks and a capsule at either end fit. */
const INSET=24;
/** Capsule height. Shorter than AltimeterChart's 36px pill: mixed-case labels sit lower than a row of digits, so the same height reads as too tall. */
const CAPSULE=30;
/** Width of the ladder on the trailing edge: its labels, then an 8px tick mark 10px from the edge, as AltimeterChart. */
const LADDER=76;
/** Gap between the capsules and the trailing edge. They sit over the ladder's labels, as AltimeterChart's pill does. */
const EDGE=8;
/** Inset of the leading tick marks, where the trails start, as AltimeterChart. */
const PAD=18;
/** Capsule column width for a chart `width` wide; the CSS below states the same rule. */
const capsuleWidth=(width:number)=>Math.min(width*.55,200);
/** Capsules read to three decimals, the precision outcome prices move in; the ladder stays in whole percents. */
const CHANCE:Intl.NumberFormatOptions={style:'percent',minimumFractionDigits:3,maximumFractionDigits:3};

export interface OutcomeTrail {color:string;ticks:readonly AltimeterTick[];
 /** Eased chance at the trail's tip, 0 to 1. */
 value:number;
 /** Vertical center of the capsule the trail ends in. */
 capsule:number}
/** Paints one frame: the grid, then each trail from the leading edge to its capsule. */
export function drawOutcomes(ctx:CanvasRenderingContext2D,frame:{width:number;height:number;now:number;phase:number;grid:string;scale?:OutcomeScale;gridRows?:readonly number[];trails:readonly OutcomeTrail[]}):void{
 const {width,height}=frame,trailEnd=Math.max(PAD+40,width-EDGE-capsuleWidth(width)-CONNECTOR),yFor=(chance:number)=>outcomeY(chance,height,INSET,frame.scale);
 ctx.clearRect(0,0,width,height);
 ctx.lineJoin='round';
 // One row of marks per ladder tick, so each row is a ten percent line.
 drawPlusGrid(ctx,width,height,frame.phase,frame.grid,frame.gridRows??outcomeTicks(frame.scale).map(yFor));
 ctx.lineWidth=2.5;
 for(const trail of frame.trails){
  const history=historyPath(ctx,trail.ticks,frame.now,PAD,trailEnd,yFor,0,height,frame.scale?.low,frame.scale?.high);
  if(!history)continue;
  const end=trailEnd-history.dx,tip=yFor(trail.value)-history.dy;
  beginTrail(ctx,history,trail.ticks,PAD,trailEnd,trail.color);
  appendLiveTail(ctx,history.last,end,tip);
  // From the live chance to the capsule, which may sit off the line to clear its neighbors.
  ctx.bezierCurveTo(end+CONNECTOR/2,tip,end+CONNECTOR/2,trail.capsule-history.dy,end+CONNECTOR,trail.capsule-history.dy);
  ctx.stroke();if(history.cached)ctx.restore();
 }
}

/**
 * The chances of the outcomes of one question, live: AltimeterChart's grid and trails, flowing left at 50px per
 * second, on a ladder zoomed to the range the chances occupy. Each outcome's trail ends in a stroked capsule
 * with its label and its chance. It draws no positions or controls. Web canvas only.
 */
export function OutcomeChart({summary,paused=false,outcomes,feed=championsLeagueWinner,height=360,targetLabelInsets,style,...props}:OutcomeChartProps){
 const {locale,messages,reducedMotion}=useHIG();const colors=useColors();
 const pauseFrames=useRef<((paused:boolean)=>void)|undefined>(undefined);
 const initiallyPaused=useRef(paused);
 useEffect(()=>{initiallyPaused.current=paused;pauseFrames.current?.(paused);},[paused]);
 const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),list=useRef<HTMLUListElement>(null);
 const [stale,setStale]=useState(false);
 const controlled=outcomes!==undefined;
 const [fed,setFed]=useState<readonly Outcome[]|null>(null);
 useEffect(()=>{
  if(controlled){setStale(false);return;}let alive=true;let deadline:ReturnType<typeof setTimeout>|undefined;
  setFed(null);setStale(false);
  const expire=()=>{if(alive){setFed(null);setStale(true);}};
  deadline=setTimeout(expire,30_000);
  const stop=feed(next=>{if(!alive)return;setFed(next);setStale(false);clearTimeout(deadline);deadline=setTimeout(expire,30_000);},expire);
  return()=>{alive=false;clearTimeout(deadline);stop();};
 },[controlled,feed]);
 const shown=useMemo(()=>{
  const visible:Outcome[]=[],seen=new Set<string>();
  for(const item of (controlled?outcomes:fed)??[]){
   const id=item.id;
   if(id===''||seen.has(id))continue;
   seen.add(id);visible.push(item);
   if(visible.length===OUTCOME_LIMIT)break;
  }
  return visible;
 },[controlled,outcomes,fed]);
 const paint=(outcome:Outcome,index:number)=>outcome.color??outcomeColors[index%outcomeColors.length];
 const percent=useMemo(()=>new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:0}),[locale]);
 // Where each capsule rests: at its outcome's chance, moved apart from close neighbors.
 // The ladder zooms to the range the chances occupy, and holds still until one leaves it.
 const held=useRef<OutcomeScale|null>(null),chances=shown.map(outcome=>outcomeChance(outcome.price));
 const scale=outcomeScale(chances,held.current??undefined);
 // Only a ladder fitted to real chances is worth holding; the whole ladder shown while waiting is not.
 held.current=chances.some(chance=>chance!=null)?scale:null;
 const ticks=useMemo(()=>outcomeTicks(scale),[scale]);
 const gridRows=useMemo(()=>ticks.map(chance=>outcomeY(chance,height,INSET,scale)),[ticks,height,scale]);
 const bounds=labelBounds(height,CAPSULE,targetLabelInsets);
 const rest=capsuleCenters(shown.map(outcome=>outcomeY(outcomeChance(outcome.price)??scale.low,height,INSET,scale)),height,CAPSULE,6,false,bounds);
 // The frame loop reads the newest props without restarting, so a re-render never clears the trails.
 const settings=useRef({shown,rest,scale,gridRows,colors,reducedMotion});
 const eased=useRef(new Map<string,{tween:ReturnType<typeof priceTween>;value:number;ticks:AltimeterTick[]}>());
 // Capsules render at rest; while a chance eases, an offset carries each one along its trail's tip.
 // Outcomes wait for their first price stacked at the bottom; when it arrives, the capsule glides from the stack to its place.
 const arrival=useRef({clock:NaN,priced:new Map<string,boolean>(),at:new Map<string,number>(),moving:new Map<string,{from:number;start:number}>()});
 const settledRest=useRef<number[]|null>(null);
 const place=useRef((_now?:number): number[]=>[]);
 place.current=frameTime=>{
  const {shown,rest,scale,reducedMotion}=settings.current,state=arrival.current;
  if(frameTime!==undefined)state.clock=frameTime;
  const settled=shown.every(outcome=>{
   const track=eased.current.get(outcome.id);
   return !track||track.value===outcomeChance(outcome.price);
  });
  // The canvas keeps scrolling after the capsules have reached their DOM positions.
  if(settled&&settledRest.current===rest&&state.moving.size===0)return rest;
  settledRest.current=settled?rest:null;
  const now=state.clock,tips=shown.map(outcome=>{const value=eased.current.get(outcome.id)?.value;return outcomeY(value!=null&&Number.isFinite(value)?value:outcomeChance(outcome.price)??scale.low,height,INSET,scale);});
  const centers=capsuleCenters(tips,height,CAPSULE,6,false,bounds),items=list.current?.children;
  for(const id of state.priced.keys())if(!shown.some(outcome=>outcome.id===id)){state.priced.delete(id);state.at.delete(id);state.moving.delete(id);}
  for(const [index,outcome] of shown.entries()){
   const priced=outcomeChance(outcome.price)!=null,from=state.at.get(outcome.id);
   if(priced&&state.priced.get(outcome.id)===false&&from!==undefined&&!reducedMotion&&Number.isFinite(now))state.moving.set(outcome.id,{from,start:now});
   state.priced.set(outcome.id,priced);
   const move=state.moving.get(outcome.id);
   if(move){const progress=(now-move.start)/ARRIVE_MS;if(progress>=1||reducedMotion)state.moving.delete(outcome.id);else {const start=Math.max(bounds.top+CAPSULE/2,Math.min(bounds.bottom-CAPSULE/2,move.from));centers[index]=start+(centers[index]-start)*easeInOut(progress);}}
   state.at.set(outcome.id,centers[index]);
   const item=items?.[index] as HTMLElement|undefined;if(item){const transform=`translateY(${+(centers[index]-rest[index]).toFixed(2)}px)`;if(item.style.transform!==transform)item.style.transform=transform;}
  }
  return centers;
 };
 useLayoutEffect(()=>{settings.current={shown,rest,scale,gridRows,colors,reducedMotion};place.current();});
 useEffect(()=>{
  const surface=canvas.current,container=box.current;if(!surface||!container)return;
  let context:CanvasRenderingContext2D|null=null;
  try{context=surface.getContext('2d');}catch{/* No canvas: the caption, ladder and capsules remain. */}
  let width=container.clientWidth,sampled=-Infinity;
  const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(entries=>{width=entries[0].contentRect.width;});
  observer?.observe(container);
  const tracks=eased.current;
  const step=(now:number)=>{
   const {shown,scale,gridRows,colors,reducedMotion}=settings.current,sample=now-sampled>=ALTIMETER_SAMPLE_MS,keep=(Math.max(width,0)/ALTIMETER_FLOW_PX)*1000+2000;
   // After a pause (a hidden tab stops the frames) the trails start flat again, so no line bridges the gap.
   if(sample&&now-sampled>2000)for(const track of tracks.values())track.ticks=[];
   for(const id of tracks.keys())if(!shown.some(outcome=>outcome.id===id))tracks.delete(id);
   for(const outcome of shown){
    const target=outcomeChance(outcome.price);
    if(target==null){tracks.delete(outcome.id);continue;}
    let track=tracks.get(outcome.id);
    if(!track){track={tween:priceTween(),value:target,ticks:[]};tracks.set(outcome.id,track);}
    track.value=track.tween.update(target,now,reducedMotion);
    if(sample){
     appendTrailSample(track.ticks,{t:now,p:track.value},now-keep);
    }
   }
   if(sample)sampled=now;
   const centers=place.current(now);
   if(!context||width<=0)return;
   const ratio=window.devicePixelRatio||1,w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
   if(surface.width!==w)surface.width=w;
   if(surface.height!==h)surface.height=h;
   context.setTransform(ratio,0,0,ratio,0,0);
   drawOutcomes(context,{width,height,now,phase:reducedMotion?0:gridPhase(now),grid:colors.nested,scale,gridRows,trails:shown.flatMap((outcome,index)=>{const track=tracks.get(outcome.id);return track?[{color:outcome.color??outcomeColors[index%outcomeColors.length],ticks:track.ticks,value:track.value,capsule:centers[index]}]:[];})});
  };
  const frames=visibleFrames(container,step,initiallyPaused.current);
  pauseFrames.current=frames.setPaused;
  return ()=>{pauseFrames.current=undefined;frames.stop();observer?.disconnect();};
 },[height]);
 return <figure {...props} style={{margin:0,inlineSize:'100%',minInlineSize:0,...style}}>
  <figcaption style={{marginBlockEnd:tokens.space.sm}}>{summary}</figcaption>
  <div ref={box} dir='ltr' style={{position:'relative',height,overflow:'hidden',borderRadius:tokens.radius.xl,background:colors.background,fontFamily:monoFont}}>
   <canvas ref={canvas} aria-hidden style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
   {shown.length===0
    ?<p role='status' style={{position:'absolute',inset:0,margin:0,display:'grid',placeItems:'center',color:colors.muted,fontFamily:'var(--hig-font-sans, inherit)'}}>{stale?(messages.stale??en.stale):(messages.loadingChart??en.loadingChart)}</p>
    :<>
     <svg aria-hidden width={PAD} height={height} viewBox={`0 0 ${PAD} ${height}`} style={{position:'absolute',left:0,top:0}}>
      {ticks.map(tick=>{const y=outcomeY(tick,height,INSET,scale);return <line key={tick} x1={PAD-8} x2={PAD} y1={y} y2={y} stroke={colors.muted} strokeWidth={1} strokeLinecap='round' opacity={.75}/>;})}
     </svg>
     <svg aria-hidden data-hig-outcome-ladder width={LADDER} height={height} viewBox={`0 0 ${LADDER} ${height}`} style={{position:'absolute',right:0,top:0}}>
      {ticks.map(tick=>{const y=outcomeY(tick,height,INSET,scale);return <g key={tick} opacity={.75}>
       <text x={LADDER-PAD-14} y={y} textAnchor='end' dominantBaseline='central' fill={colors.muted} fontSize={13}>{percent.format(tick)}</text>
       <line x1={LADDER-PAD} x2={LADDER-PAD+8} y1={y} y2={y} stroke={colors.muted} strokeWidth={1} strokeLinecap='round'/>
      </g>;})}
     </svg>
     <ul ref={list} style={{position:'absolute',top:0,right:EDGE,width:'min(55%, 200px)',height:'100%',margin:0,padding:0,listStyle:'none'}}>
      {shown.map((outcome,index)=><li key={outcome.id} data-hig-outcome={outcome.id} style={{position:'absolute',insetInline:0,top:rest[index]-CAPSULE/2,height:CAPSULE,boxSizing:'border-box',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,paddingInline:14,border:`1px solid ${paint(outcome,index)}`,borderRadius:tokens.radius.pill,background:colors.background,color:paint(outcome,index),fontSize:16,fontWeight:600,lineHeight:1.5,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}>
       <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>{outcome.label}</span><NumberFlow motion="slide" value={outcomeChance(outcome.price)} options={CHANCE}/>
      </li>)}
     </ul>
    </>}
  </div>
 </figure>;
}
