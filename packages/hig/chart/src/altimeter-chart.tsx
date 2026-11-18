"use client";
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {historyPath,trailFade,visibleFrames} from './chart-renderer.js';
import {tokens} from '@bloxwap/hig/tokens';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG,useColors} from '@bloxwap/hig/react/provider';
import {AnimatedNumberReadout} from '@bloxwap/hig/react/animated-number';
import {ALTIMETER_FLOW_PX,ALTIMETER_SAMPLE_MS,ALTIMETER_TICK_PX,gridPhase,labelDecimalsFor,ladderPrices,priceTween,tickSpacingFor,type AltimeterTick} from './altimeter-model.js';
import {drawPlusGrid,monoFallback,monoFont} from './plus-grid.js';
import {bitcoinPrice,type AltimeterFeed} from './bitcoin-price.js';
import type {TargetLabelInsets} from './outcome-model.js';
import {targetLayout,targetCrossings,validTargets,type AltimeterTarget} from './altimeter-targets.js';
import {ALTIMETER_BURST_COOLDOWN_MS,burstAtPill} from './altimeter-burst.js';

import type {AltimeterPosition} from './altimeter-core.js';
export type {AltimeterPosition} from './altimeter-core.js';

export interface AltimeterChartProps extends Omit<React.HTMLAttributes<HTMLElement>,'children'> {
 /** Text alternative shown as the figure's caption, for example what the chart tracks and where the price comes from. */
 summary:string;
 /** Suspend chart frames while an opaque overlay covers the plot. */
 paused?:boolean;
 /** Latest price, owned by the host. `null` reads as waiting for a price. Omit it to use `feed`. */
 price?:number|null;
 /** Live price source, used only while `price` is omitted. Defaults to `bitcoinPrice`. Keep its identity stable. */
 feed?:AltimeterFeed;
 /** Shade the trail to break-even and color the capsule by actual P&L. */
 position?:AltimeterPosition;
 /** Chart height in pixels. Default 320. */
 height?:number;
 /** Format of the current price and the ladder. Defaults to US dollars with the digits the ladder needs. */
 priceOptions?:Intl.NumberFormatOptions;
 /** Horizontal dotted levels with optional right-aligned labels and CSS colors. Offscreen labels pin and stack at the edges. Use stable, unique IDs. */
 targets?:readonly AltimeterTarget[];
 /** Top and bottom clearance for target text only. Defaults to 8 per edge. */
 targetLabelInsets?:TargetLabelInsets;
 /** DEGEN: shake the live pill and burst particles on target crossings. Off by default; suppressed by reduced motion. */
 degen?:boolean;
 /** @deprecated Use degen. */
 dgen?:boolean;
}

/** Inset of the ladder's tick marks from the chart edges. */
const PAD=18;
/** Length of a ladder tick mark, and the gap between the pill and the trailing edge. */
const EDGE=8;
const NO_TARGETS:readonly AltimeterTarget[]=[];
const transparent=(color:string)=>/^#[0-9a-f]{6}$/i.test(color)?`${color}00`:'transparent';
const usable=(price:number|null|undefined):price is number=>price!=null&&Number.isFinite(price)&&price>0;
const positionColor=(value:number,colors:ReturnType<typeof useColors>)=>
 !Number.isFinite(value)||value===0?colors.muted:value>0?colors.positive:colors.negative;
const formatter=(locale:string,options:Intl.NumberFormatOptions|undefined,decimals:number)=>new Intl.NumberFormat(locale,{style:'currency',currency:'USD',minimumFractionDigits:decimals,maximumFractionDigits:decimals,...options});

export interface AltimeterFrame {
 width:number;height:number;now:number;
 /** Grid offset in (-50, 0]. */
 phase:number;
 ticks:readonly AltimeterTick[];
 /** Eased price held at the vertical center; `NaN` while waiting. */
 display:number;
 anchor:number;spacing:number;
 breakEvenPrice?:number;
 colors:{grid:string;ladder:string;line:string};
 label:(price:number)=>string;
 /** Resolved font stack for the ladder labels. Defaults to the mono family by name. */
 font?:string;
 /** Optional text-width cache for a live renderer; invalidated when the resolved font changes. */
 labelWidth?:(text:string)=>number;
 /** Vertical text bounds of target labels; colliding ladder numbers yield to them. */
 targetLabelBounds?:readonly (readonly [number,number])[];
}
/** Paints one frame (grid, ladder, trail) and returns the x where the trail ends and the price pill begins. */
export function drawAltimeter(ctx:CanvasRenderingContext2D,frame:AltimeterFrame):number{
 const {width,height,display,spacing}=frame;
 ctx.clearRect(0,0,width,height);
 ctx.lineJoin='round';
 drawPlusGrid(ctx,width,height,frame.phase,frame.colors.grid);
 const right=width-PAD;
 if(!(display>0)||!(spacing>0))return right-100;
 const center=height/2,yFor=(price:number)=>center-((price-display)/spacing)*ALTIMETER_TICK_PX;
 const reach=(center/ALTIMETER_TICK_PX+1)*spacing,prices=ladderPrices(frame.anchor,spacing,display-reach,display+reach);
 const font=`13px ${frame.font??monoFallback}`;
 // Reassigning the canvas font can synchronously resolve document styles, even if the font is unchanged.
 if(ctx.font!==font)ctx.font=font;
 ctx.textAlign='right';ctx.textBaseline='middle';
 ctx.globalAlpha=.75;ctx.strokeStyle=frame.colors.ladder;ctx.fillStyle=frame.colors.ladder;
 let widest=0;
 ctx.beginPath();
 for(const price of prices){
  const y=yFor(price),text=frame.label(price);
  ctx.moveTo(PAD-EDGE,y);ctx.lineTo(PAD,y);ctx.moveTo(right,y);ctx.lineTo(right+EDGE,y);
  if(!frame.targetLabelBounds?.some(([top,bottom])=>y+7>top-2&&y-7<bottom+2))ctx.fillText(text,right-14,y);
  widest=Math.max(widest,frame.labelWidth?.(text)??ctx.measureText(text).width);
 }
 ctx.stroke();ctx.globalAlpha=1;
 // The trail stops short of the ladder labels; the pill covers the rest of the row.
 const trailEnd=Math.max(PAD+40,right-Math.max(100,Math.ceil(widest)+22));
 const history=historyPath(ctx,frame.ticks,frame.now,PAD,trailEnd,yFor,yFor(frame.anchor),spacing,frame.anchor);
 if(!history)return trailEnd;
 const {last,sink,path}=history;
 ctx.strokeStyle=trailFade(ctx,frame.ticks,PAD,trailEnd,frame.colors.line);ctx.lineWidth=2.5;
 // From the newest sample to the live price; level end tangents keep the tail inside both prices.
 const dx=trailEnd-last[0];
 if(dx>0)sink.bezierCurveTo(last[0]+dx/3,last[1],trailEnd-dx/3,center,trailEnd,center);else sink.lineTo(trailEnd,center);
 if(path)ctx.stroke(path);else ctx.stroke();
 if(usable(frame.breakEvenPrice)){
  const baseline=yFor(frame.breakEvenPrice);
  if(baseline!==center){
   const bottom=Math.max(0,Math.min(height,baseline));
   const shade=ctx.createLinearGradient(0,center,0,bottom);
   shade.addColorStop(0,frame.colors.line);shade.addColorStop(1,transparent(frame.colors.line));
   sink.lineTo(trailEnd,baseline);sink.lineTo(history.first,baseline);sink.closePath();
   ctx.fillStyle=shade;ctx.globalAlpha=.5;if(path){ctx.save();ctx.beginPath();ctx.rect(PAD,0,trailEnd-PAD,height);ctx.clip();ctx.fill(path);ctx.restore();}else ctx.fill();ctx.globalAlpha=1;
  }
 }
 return trailEnd;
}

/**
 * The Bloxwap live chart on its own: a grid of plus marks and a price trail that flow left at 50px per second, a
 * price ladder that keeps the current price at the vertical center, and the current price at the trail's tip. It
 * accepts optional target lines and opt-in DEGEN crossing feedback. Web only.
 */
export function AltimeterChart({summary,paused=false,price,feed=bitcoinPrice,height=320,priceOptions,position,targets=NO_TARGETS,targetLabelInsets,dgen,degen=dgen??false,style,...props}:AltimeterChartProps){
 const {locale,messages,reducedMotion}=useHIG();const colors=useColors();
 const pauseFrames=useRef<((paused:boolean)=>void)|undefined>(undefined);
 const initiallyPaused=useRef(paused);
 useEffect(()=>{initiallyPaused.current=paused;pauseFrames.current?.(paused);},[paused]);
 const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),pill=useRef<HTMLSpanElement>(null);
 const targetRows=useRef(new Map<string,HTMLDivElement>()),targetLabels=useRef(new Map<string,HTMLSpanElement>()),effects=useRef<HTMLDivElement>(null);
 const levels=useMemo(()=>validTargets(targets),[targets]);
 const crossings=useRef(targetCrossings()),cancelBurst=useRef<(()=>void)|undefined>(undefined);
 const [stale,setStale]=useState(false);
 const controlled=price!==undefined;
 const latest=useRef<number|null>(usable(price)?price:null);
 const [reading,setReading]=useState<number|null>(()=>usable(price)?price:null);
 const digits=reading==null?2:labelDecimalsFor(tickSpacingFor(reading),reading);
 const readingOptions=useMemo(():Intl.NumberFormatOptions=>({style:'currency',currency:'USD',minimumFractionDigits:digits,maximumFractionDigits:digits,...priceOptions}),[digits,JSON.stringify(priceOptions??{})]);
 const capsuleColor=position?positionColor(position.pnl,colors):colors.action;
 const capsule=position?.capsule;
 const pillValue=typeof capsule==='object'?capsule.returnRatio:capsule==='pnl'?position?.pnl:reading;
 const pillOptions:Intl.NumberFormatOptions=typeof capsule==='object'
  ?{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'}
  :capsule==='pnl'?{style:'currency',currency:priceOptions?.currency??'USD',signDisplay:'exceptZero'}:readingOptions;
 const targetFormat=useMemo(()=>new Intl.NumberFormat(locale,readingOptions),[locale,readingOptions]);
 // The frame loop reads the newest props without restarting, so a re-render never clears the trail.
 const settings=useRef({colors,locale,priceOptions,optionsKey:'',reducedMotion,levels,degen,position,targetLabelInsets});
 useEffect(()=>{settings.current={colors,locale,priceOptions,optionsKey:JSON.stringify(priceOptions??{}),reducedMotion,levels,degen,position,targetLabelInsets};if(controlled)latest.current=usable(price)?price:null;});
 useEffect(()=>{if(!degen||reducedMotion){cancelBurst.current?.();cancelBurst.current=undefined;}},[degen,reducedMotion]);
 useEffect(()=>{
  if(controlled){setStale(false);return;}let alive=true;let deadline:ReturnType<typeof setTimeout>|undefined;
  latest.current=null;setStale(false);
  const expire=()=>{if(alive){latest.current=null;setStale(true);}};
  deadline=setTimeout(expire,30_000);
  const stop=feed(next=>{if(alive&&usable(next)){latest.current=next;setStale(false);clearTimeout(deadline);deadline=setTimeout(expire,30_000);}},expire);
  return()=>{alive=false;clearTimeout(deadline);stop();};
 },[controlled,feed]);
 useEffect(()=>{
  const surface=canvas.current,container=box.current;if(!surface||!container)return;
  let context:CanvasRenderingContext2D|null=null;
  try{context=surface.getContext('2d');}catch{/* No canvas: the caption and the price reading remain. */}
  let width=container.clientWidth,sampled=-Infinity,shown:number|null|undefined;
  let lastFrame=-Infinity,lastBurst=-Infinity;
  crossings.current.reset();
  const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(entries=>{width=entries[0].contentRect.width;});
  observer?.observe(container);
  // The canvas cannot read CSS variables, so it takes the font stack the box resolved, again once fonts load.
  let font=monoFallback;
  const widths=new Map<string,number>();
  const readFont=()=>{const resolved=typeof getComputedStyle==='function'?getComputedStyle(container).fontFamily:'';if(resolved)font=resolved;widths.clear();};
  readFont();document.fonts?.ready.then(readFont).catch(()=>{});
  const motion=priceTween();let display=NaN;
  const layout=targetLayout();
  let ticks:AltimeterTick[]=[],anchor=NaN,spacing=0,format:Intl.NumberFormat|undefined,formatKey='';
  const labels=new Map<number,string>();
  const show=(next:number|null)=>{if(next!==shown){shown=next;setReading(next);}};
  const step=(now:number)=>{
   const {colors,locale,priceOptions,optionsKey,reducedMotion,levels,degen,position,targetLabelInsets}=settings.current,target=latest.current;
   const previousDisplay=display;
   const resumed=now-lastFrame>2000;lastFrame=now;
   if(resumed){crossings.current.reset();cancelBurst.current?.();}
   if(target==null){display=NaN;motion.reset();ticks=[];sampled=-Infinity;show(null);crossings.current.reset();cancelBurst.current?.();}
   else{
    display=motion.update(target,now,reducedMotion||resumed);
    // Re-anchor the ladder before a drifting price runs past its ticks.
    if(!(spacing>0)||Math.abs(display-anchor)/spacing>40){spacing=tickSpacingFor(display);anchor=Math.round(display/spacing)*spacing;labels.clear();widths.clear();}
    const key=`${locale}|${optionsKey}|${labelDecimalsFor(spacing,display)}`;
    if(key!==formatKey||!format){formatKey=key;format=formatter(locale,priceOptions,labelDecimalsFor(spacing,display));labels.clear();widths.clear();}
    if(now-sampled>=ALTIMETER_SAMPLE_MS){
     const keep=(Math.max(width,0)/ALTIMETER_FLOW_PX)*1000+2000;
     // Start flat, and again after a pause (a hidden tab stops the frames), so no line bridges the gap.
     if(ticks.length===0||now-sampled>2000)ticks=[{t:now-keep,p:display}];
     ticks.push({t:now,p:display});
     while(ticks.length>2&&ticks[1].t<now-keep)ticks.shift();
     sampled=now;show(target);
    }
   }
   const positions=layout.update(levels,display,spacing,height,now,reducedMotion||resumed,targetLabelInsets);
   for(const level of levels){
    const row=targetRows.current.get(level.id);if(!row)continue;
    const label=targetLabels.current.get(level.id);
    const position=positions.get(level.id);
    if(!position){row.style.visibility='hidden';if(label)label.style.visibility='hidden';continue;}
    const {anchor,labelTop,pinned}=position;
    row.style.visibility=pinned?'hidden':'visible';
    row.style.transform=`translateY(${anchor}px)`;
    row.style.borderTopColor=pinned?'transparent':'currentColor';
    if(pinned){if(row.dataset.higAltimeterPinned!==pinned)row.dataset.higAltimeterPinned=pinned;}
    else if(row.dataset.higAltimeterPinned)delete row.dataset.higAltimeterPinned;
    // Line tracking is immediate. Only the side offset eases, before collision and edge constraints.
    if(label&&labelTop!==undefined){
     label.style.visibility='visible';
     label.style.transform=`translateY(${labelTop}px)`;
    }
   }
   const crossed=target==null||!levels.length?[]:crossings.current.update(display,levels);
   let trailEnd:number|undefined;
   // Keep DOM writes together; the canvas and labels use the same resolved geometry.
   if(context&&width>0){
    const ratio=window.devicePixelRatio||1,w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
    if(surface.width!==w)surface.width=w;
    if(surface.height!==h)surface.height=h;
    context.setTransform(ratio,0,0,ratio,0,0);
    const targetLabelBounds:(readonly [number,number])[]=[];
    for(const {labelTop} of positions.values())if(labelTop!==undefined)targetLabelBounds.push([labelTop,labelTop+18]);
    const spread=position&&usable(position.breakEvenPrice)&&target!=null?(target-position.breakEvenPrice)*(position.side==='short'?-1:1):0;
    trailEnd=drawAltimeter(context,{width,height,now,phase:reducedMotion?0:gridPhase(now),ticks,display,anchor,spacing,font,targetLabelBounds,breakEvenPrice:position?.breakEvenPrice,colors:{grid:colors.nested,ladder:colors.muted,line:position?positionColor(spread,colors):colors.action},label:value=>{let text=labels.get(value);if(text===undefined){text=format!.format(value);labels.set(value,text);}return text;},labelWidth:text=>{let size=widths.get(text);if(size===undefined){size=context!.measureText(text).width;widths.set(text,size);}return size;}});
   }
   if(pill.current&&trailEnd!==undefined){
    const left=`${trailEnd}px`;if(pill.current.style.left!==left)pill.current.style.left=left;
    const hit=crossed.at(-1);
    if(hit&&degen&&!reducedMotion&&now-lastBurst>=ALTIMETER_BURST_COOLDOWN_MS&&effects.current){
     lastBurst=now;cancelBurst.current?.();
     cancelBurst.current=burstAtPill(pill.current,effects.current,hit.color??colors.action,display>previousDisplay?'up':'down');
    }
   }
  };
  const frames=visibleFrames(container,step,initiallyPaused.current);
  pauseFrames.current=frames.setPaused;
  return ()=>{pauseFrames.current=undefined;frames.stop();observer?.disconnect();cancelBurst.current?.();};
 },[height,controlled,controlled?undefined:feed]);
 return <figure {...props} style={{margin:0,inlineSize:'100%',minInlineSize:0,...style}}>
  <figcaption style={{marginBlockEnd:tokens.space.sm}}>{summary}</figcaption>
  <div ref={box} style={{position:'relative',height,overflow:'hidden',borderRadius:tokens.radius.xl,background:colors.background,fontFamily:monoFont}}>
   <canvas ref={canvas} aria-hidden style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
   <div aria-hidden style={{position:'absolute',inset:0,pointerEvents:'none'}}>
    {levels.map(level=><React.Fragment key={level.id}>
     <div ref={node=>{if(node)targetRows.current.set(level.id,node);else targetRows.current.delete(level.id);}} data-hig-altimeter-target={level.id} style={{position:'absolute',top:0,left:0,right:0,visibility:'hidden',borderTop:'2px dotted currentColor',color:level.color??colors.action}}/>
     {level.label&&<span ref={node=>{if(node)targetLabels.current.set(level.id,node);else targetLabels.current.delete(level.id);}} data-hig-altimeter-target-label={level.id} dir='ltr' title={`${level.label} ${targetFormat.format(level.price)}`} style={{position:'absolute',right:EDGE,top:0,visibility:'hidden',transform:'translateY(0px)',maxWidth:`calc(100% - ${EDGE*2}px)`,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'right',color:level.color??colors.action,fontSize:12,fontWeight:600,lineHeight:'18px',fontVariantNumeric:'tabular-nums'}}><bdi style={{textTransform:'capitalize'}}>{level.label}</bdi>{' '}<bdi>{targetFormat.format(level.price)}</bdi></span>}
    </React.Fragment>)}
   </div>
   {reading==null
    ?<p role='status' style={{position:'absolute',inset:0,margin:0,display:'grid',placeItems:'center',color:colors.muted,fontFamily:'var(--hig-font-sans, inherit)'}}>{stale?(messages.stale??en.stale):(messages.loadingChart??en.loadingChart)}</p>
    :<span ref={pill} data-hig-altimeter-price style={{position:'absolute',right:EDGE,top:height/2-18,height:36,minWidth:110,boxSizing:'border-box',display:'flex',alignItems:'center',justifyContent:'center',paddingInline:10,border:`1px solid ${capsuleColor}`,borderRadius:tokens.radius.pill,background:colors.background,color:capsuleColor,fontSize:16,fontWeight:600,lineHeight:1,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}>{pillValue!=null&&Number.isFinite(pillValue)?<AnimatedNumberReadout value={pillValue} options={pillOptions}/>:'—'}</span>}
   <div ref={effects} aria-hidden style={{position:'absolute',inset:0,pointerEvents:'none'}}/>
  </div>
  {levels.length>0&&<ul className='hig-sr-only'>{levels.map(level=><li key={level.id}>{level.label?`${level.label}: `:''}{targetFormat.format(level.price)}</li>)}</ul>}
 </figure>;
}
