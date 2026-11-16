"use client";
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {tokens} from '@bloxwap/hig/tokens';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG,useColors} from '@bloxwap/hig/react/provider';
import {AnimatedNumberReadout} from '@bloxwap/hig/react/animated-number';
import {ALTIMETER_EASE_MS,ALTIMETER_FLOW_PX,ALTIMETER_SAMPLE_MS,ALTIMETER_TICK_PX,easeInOut,gridPhase,labelDecimalsFor,ladderPrices,smoothTrail,tickSpacingFor,trailPoints,type AltimeterTick} from './altimeter-model.js';
import {drawPlusGrid,monoFallback,monoFont} from './plus-grid.js';
import {bitcoinPrice,type AltimeterFeed} from './bitcoin-price.js';

export interface AltimeterChartProps extends Omit<React.HTMLAttributes<HTMLElement>,'children'> {
 /** Text alternative shown as the figure's caption, for example what the chart tracks and where the price comes from. */
 summary:string;
 /** Latest price, owned by the host. `null` reads as waiting for a price. Omit it to use `feed`. */
 price?:number|null;
 /** Live price source, used only while `price` is omitted. Defaults to `bitcoinPrice`. Keep its identity stable. */
 feed?:AltimeterFeed;
 /** Chart height in pixels. Default 320. */
 height?:number;
 /** Format of the current price and the ladder. Defaults to US dollars with the digits the ladder needs. */
 priceOptions?:Intl.NumberFormatOptions;
}

/** Inset of the ladder's tick marks from the chart edges. */
const PAD=18;
/** Length of a ladder tick mark, and the gap between the pill and the trailing edge. */
const EDGE=8;
const transparent=(color:string)=>/^#[0-9a-f]{6}$/i.test(color)?`${color}00`:'transparent';
const usable=(price:number|null|undefined):price is number=>price!=null&&Number.isFinite(price)&&price>0;
const formatter=(locale:string,options:Intl.NumberFormatOptions|undefined,decimals:number)=>new Intl.NumberFormat(locale,{style:'currency',currency:'USD',minimumFractionDigits:decimals,maximumFractionDigits:decimals,...options});

export interface AltimeterFrame {
 width:number;height:number;now:number;
 /** Grid offset in (-50, 0]. */
 phase:number;
 ticks:readonly AltimeterTick[];
 /** Eased price held at the vertical center; `NaN` while waiting. */
 display:number;
 anchor:number;spacing:number;
 colors:{grid:string;ladder:string;line:string};
 label:(price:number)=>string;
 /** Resolved font stack for the ladder labels. Defaults to the mono family by name. */
 font?:string;
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
 const reach=(center/ALTIMETER_TICK_PX+1)*spacing,labels=ladderPrices(frame.anchor,spacing,display-reach,display+reach).map(price=>({y:yFor(price),text:frame.label(price)}));
 ctx.font=`13px ${frame.font??monoFallback}`;ctx.textAlign='right';ctx.textBaseline='middle';
 ctx.globalAlpha=.75;ctx.strokeStyle=frame.colors.ladder;ctx.fillStyle=frame.colors.ladder;
 let widest=0;
 ctx.beginPath();
 for(const {y,text} of labels){
  ctx.moveTo(PAD-EDGE,y);ctx.lineTo(PAD,y);ctx.moveTo(right,y);ctx.lineTo(right+EDGE,y);
  ctx.fillText(text,right-14,y);widest=Math.max(widest,ctx.measureText(text).width);
 }
 ctx.stroke();ctx.globalAlpha=1;
 // The trail stops short of the ladder labels; the pill covers the rest of the row.
 const trailEnd=Math.max(PAD+40,right-Math.max(100,Math.ceil(widest)+22));
 const points=trailPoints(frame.ticks,frame.now,PAD,trailEnd,yFor),last=points.at(-1);
 if(!last)return trailEnd;
 const fade=ctx.createLinearGradient(PAD,0,trailEnd,0);fade.addColorStop(0,transparent(frame.colors.line));fade.addColorStop(1,frame.colors.line);
 ctx.strokeStyle=fade;ctx.lineWidth=2.5;
 ctx.beginPath();smoothTrail(points,ctx);
 // From the newest sample to the live price; level end tangents keep the tail inside both prices.
 const dx=trailEnd-last[0];
 if(dx>0)ctx.bezierCurveTo(last[0]+dx/3,last[1],trailEnd-dx/3,center,trailEnd,center);else ctx.lineTo(trailEnd,center);
 ctx.stroke();
 return trailEnd;
}

/**
 * The Bloxwap live chart on its own: a grid of plus marks and a price trail that flow left at 50px per second, a
 * price ladder that keeps the current price at the vertical center, and the current price at the trail's tip. It
 * draws no positions, levels or controls. Web canvas only.
 */
export function AltimeterChart({summary,price,feed=bitcoinPrice,height=320,priceOptions,style,...props}:AltimeterChartProps){
 const {locale,messages,reducedMotion}=useHIG();const colors=useColors();
 const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),pill=useRef<HTMLSpanElement>(null);
 const controlled=price!==undefined;
 const latest=useRef<number|null>(usable(price)?price:null);
 const [reading,setReading]=useState<number|null>(()=>usable(price)?price:null);
 const digits=reading==null?2:labelDecimalsFor(tickSpacingFor(reading),reading);
 const readingOptions=useMemo(():Intl.NumberFormatOptions=>({style:'currency',currency:'USD',minimumFractionDigits:digits,maximumFractionDigits:digits,...priceOptions}),[digits,JSON.stringify(priceOptions??{})]);
 // The frame loop reads the newest props without restarting, so a re-render never clears the trail.
 const settings=useRef({colors,locale,priceOptions,optionsKey:'',reducedMotion});
 useEffect(()=>{settings.current={colors,locale,priceOptions,optionsKey:JSON.stringify(priceOptions??{}),reducedMotion};if(controlled)latest.current=usable(price)?price:null;});
 useEffect(()=>{if(controlled)return;latest.current=null;return feed(next=>{if(usable(next))latest.current=next;});},[controlled,feed]);
 useEffect(()=>{
  const surface=canvas.current,container=box.current;if(!surface||!container)return;
  let context:CanvasRenderingContext2D|null=null;
  try{context=surface.getContext('2d');}catch{/* No canvas: the caption and the price reading remain. */}
  let width=container.clientWidth,raf=0,sampled=-Infinity,shown:number|null|undefined,pillLeft=NaN;
  const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(entries=>{width=entries[0].contentRect.width;});
  observer?.observe(container);
  // The canvas cannot read CSS variables, so it takes the font stack the box resolved, again once fonts load.
  let font=monoFallback;
  const readFont=()=>{const resolved=typeof getComputedStyle==='function'?getComputedStyle(container).fontFamily:'';if(resolved)font=resolved;};
  readFont();document.fonts?.ready.then(readFont).catch(()=>{});
  const ease={from:NaN,to:NaN,start:0,value:NaN};
  let ticks:AltimeterTick[]=[],anchor=NaN,spacing=0,format:Intl.NumberFormat|undefined,formatKey='';
  const labels=new Map<number,string>();
  const show=(next:number|null)=>{if(next!==shown){shown=next;setReading(next);}};
  const step=(now:number)=>{
   raf=requestAnimationFrame(step);
   const {colors,locale,priceOptions,optionsKey,reducedMotion}=settings.current,target=latest.current;
   if(target==null){ease.value=NaN;ticks=[];sampled=-Infinity;show(null);}
   else{
    if(!Number.isFinite(ease.value)||reducedMotion){ease.from=ease.to=ease.value=target;ease.start=now;}
    else if(target!==ease.to){if(now-ease.start>=ALTIMETER_EASE_MS){ease.from=ease.value;ease.start=now;}ease.to=target;}
    ease.value=ease.from+(ease.to-ease.from)*easeInOut((now-ease.start)/ALTIMETER_EASE_MS);
    // Re-anchor the ladder before a drifting price runs past its ticks.
    if(!(spacing>0)||Math.abs(ease.value-anchor)/spacing>40){spacing=tickSpacingFor(ease.value);anchor=Math.round(ease.value/spacing)*spacing;labels.clear();}
    const key=`${locale}|${optionsKey}|${labelDecimalsFor(spacing,ease.value)}`;
    if(key!==formatKey||!format){formatKey=key;format=formatter(locale,priceOptions,labelDecimalsFor(spacing,ease.value));labels.clear();}
    if(now-sampled>=ALTIMETER_SAMPLE_MS){
     const keep=(Math.max(width,0)/ALTIMETER_FLOW_PX)*1000+2000;
     // Start flat, and again after a pause (a hidden tab stops the frames), so no line bridges the gap.
     if(ticks.length===0||now-sampled>2000)ticks=[{t:now-keep,p:ease.value}];
     ticks.push({t:now,p:ease.value});
     while(ticks.length>2&&ticks[1].t<now-keep)ticks.shift();
     sampled=now;show(target);
    }
   }
   if(!context||width<=0)return;
   const ratio=window.devicePixelRatio||1,w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
   if(surface.width!==w)surface.width=w;
   if(surface.height!==h)surface.height=h;
   context.setTransform(ratio,0,0,ratio,0,0);
   const trailEnd=drawAltimeter(context,{width,height,now,phase:reducedMotion?0:gridPhase(now),ticks,display:ease.value,anchor,spacing,font,colors:{grid:colors.nested,ladder:colors.muted,line:colors.action},label:value=>{let text=labels.get(value);if(text===undefined){text=format!.format(value);labels.set(value,text);}return text;}});
   if(trailEnd!==pillLeft&&pill.current){pillLeft=trailEnd;pill.current.style.left=`${trailEnd}px`;}
  };
  raf=requestAnimationFrame(step);
  return ()=>{cancelAnimationFrame(raf);observer?.disconnect();};
 },[height]);
 return <figure {...props} style={{margin:0,inlineSize:'100%',minInlineSize:0,...style}}>
  <figcaption style={{marginBlockEnd:tokens.space.sm}}>{summary}</figcaption>
  <div ref={box} style={{position:'relative',height,overflow:'hidden',borderRadius:tokens.radius.xl,background:colors.background,fontFamily:monoFont}}>
   <canvas ref={canvas} aria-hidden style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
   {reading==null
    ?<p role='status' style={{position:'absolute',inset:0,margin:0,display:'grid',placeItems:'center',color:colors.muted,fontFamily:'var(--hig-font-sans, inherit)'}}>{messages.loadingChart??en.loadingChart}</p>
    :<span ref={pill} data-hig-altimeter-price style={{position:'absolute',right:EDGE,top:height/2-18,height:36,minWidth:110,boxSizing:'border-box',display:'flex',alignItems:'center',justifyContent:'center',paddingInline:10,border:`1px solid ${colors.action}`,borderRadius:tokens.radius.pill,background:colors.background,color:colors.action,fontSize:16,fontWeight:600,lineHeight:1,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}><AnimatedNumberReadout value={reading} options={readingOptions}/></span>}
  </div>
 </figure>;
}
