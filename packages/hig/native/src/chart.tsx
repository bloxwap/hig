import React,{memo,useCallback,useEffect,useId,useMemo,useRef,useState} from 'react';
import {AppState,PixelRatio,Platform,StyleSheet,Text as NativeText,View,type ViewProps} from 'react-native';
import Reanimated,{Easing,ReduceMotion,useAnimatedStyle,useFrameCallback,useSharedValue,withTiming,type FrameInfo,type SharedValue} from 'react-native-reanimated';
import Svg,{Defs,Line,LinearGradient,Path,Rect,Stop,Text as SvgText} from 'react-native-svg';
import {tokens} from '@bloxwap/hig/tokens';
import {ALTIMETER_BURST_COOLDOWN_MS,ALTIMETER_FLOW_PX,ALTIMETER_SAMPLE_MS,ALTIMETER_TICK_PX,ALTIMETER_TWEEN_IDLE,
 bitcoinPrice,labelDecimalsFor,sparkGeometry,stepPriceTween,targetCrossings,targetLayout,tickSpacingFor,trailScroll,trailTiles,trailX,tweenValue,validTargets,
 type AltimeterFeed,type AltimeterPosition,type AltimeterTarget,type AltimeterTargetPosition,type AltimeterTweenState,type TargetLabelInsets,
 type TrailArea,type TrailPatch,type TrailSpace,type TrailTile,type TrailView} from '@bloxwap/hig/chart/altimeter-core';
import {useColors,useReducedMotion,useMonoFontFamily,useMessages,useNumberLocale} from './provider.js';
import {Text} from './surface.js';
import {NumberFlow} from './animated-number.js';
import type {NumberTone} from './data.js';

export {bitcoinPrice,type AltimeterFeed,type AltimeterPosition,type AltimeterTarget,type TargetLabelInsets};
export interface AltimeterChartProps extends Omit<ViewProps,'children'> {
 summary:string;
 /** Suspend chart frames while an opaque overlay covers the plot. */
 paused?:boolean;
 price?:number|null;
 feed?:AltimeterFeed;
 height?:number;
 priceOptions?:Intl.NumberFormatOptions;
 position?:AltimeterPosition;
 targets?:readonly AltimeterTarget[];
 /** Top and bottom clearance for target text only. Defaults to 8 per edge. */
 targetLabelInsets?:TargetLabelInsets;
 degen?:boolean;
 /** Called with each DEGEN burst: the target the displayed price just crossed and the direction it moved. Shares the burst's cooldown and reduced-motion rule. */
 onTargetCross?:(target:AltimeterTarget,direction:'up'|'down')=>void;
}

const noTargets:readonly AltimeterTarget[]=[];
const validPrice=(p:number|null|undefined):p is number=>p!=null&&Number.isFinite(p)&&p>0;
type Burst={start:number;color?:string;direction:'up'|'down'};
/**
 * What React draws. Every vector canvas on native is rasterised on the CPU, so nothing here is drawn per display frame: the
 * chart is made of small canvases that are drawn once and then only moved. A frame is published when the price changes
 * course (one small canvas beside the pill is drawn again, with the line the pill will follow), every second or two on
 * a quiet price to top that canvas up, when the ladder needs rows it has not drawn, when a target label changes place,
 * and while a burst plays. Between frames the UI thread moves the trail, the ladder, the target lines and the grid by
 * transform alone, from the same price tween the driver runs.
 */
type Frame={display:number;mark:number|null;spacing:number;anchor:number;centerTick:number;
 levels:Map<string,AltimeterTargetPosition>;burst?:Burst;view:TrailView;space:number;spaces:readonly [TrailSpace,TrailSpace]};
const emptyView:TrailView={tiles:[],live:null,area:null};
const idleSpace:TrailSpace={t0:0,p0:0,spacing:1};
const emptyFrame:Frame={display:NaN,mark:null,spacing:1,anchor:0,centerTick:0,levels:new Map(),view:emptyView,space:0,spaces:[idleSpace,idleSpace]};
/** Rows drawn beyond the visible ladder on each side, so the ladder can move between frames without exposing an empty edge; a
 * frame is published before the price drifts past them. */
const LADDER_MARGIN_ROWS=4;
/** Inset of the trail's left end and of the ladder's tick marks from the chart's edge. */
const TRAIL_START=18;
/** Nominal width of a trail tile: 400ms of history. */
const TRAIL_TILE=20;
/** The trail's spaces are re-based before a translation grows too large for a 32-bit float to hold to the pixel. */
const MAX_TRAVEL=2**18;
/** A burst plays for two base motions; the pill shakes for the first of them. */
const BURST_MS=tokens.motion.base*2,SHAKE_MS=tokens.motion.base;
const SPARKS=Array.from({length:24},(_,index)=>index);
/** How far the veil reaches above and below the trail's pieces. */
const VEIL_MARGIN=16;
/** Room for a ladder price drawn as native text, which is aligned to its right edge. */
const LADDER_TEXT_WIDTH=160;

/**
 * What the UI thread needs to move the chart on its own: the price tween, the origins of the two spaces things are drawn in,
 * which of them hold anything, and the wall clock's lead over the driver's clock. Written as one value so a frame never
 * sees half of a change.
 */
type Control={tween:AltimeterTweenState;spaces:[TrailSpace,TrailSpace];live:[boolean,boolean];shift:number};
const idleControl:Control={tween:ALTIMETER_TWEEN_IDLE,spaces:[idleSpace,idleSpace],live:[false,false],shift:0};
/** The grid's offset at chart time `now`: one 50px tile left per second, on whole device pixels as the trail is. */
function gridOffset(now:number,pixel:number):number{
 'worklet';
 const phase=(Math.round(now*ALTIMETER_FLOW_PX/1000*pixel)/pixel)%ALTIMETER_FLOW_PX;
 return phase>0?-phase:0;
}

const channels=(color:string)=>/^#[0-9a-f]{6}$/i.test(color)?[1,3,5].map(at=>parseInt(color.slice(at,at+2),16)):null;
/**
 * A translucent colour that looks like `mark` over `ground`. The grid is drawn above the trail, which fades under a veil
 * in the ground colour; a see-through mark tints the line where they cross instead of cutting it, as an opaque one would.
 */
function overlay(mark:string,ground:string):{color:string;opacity:number}{
 const m=channels(mark),g=channels(ground);
 if(!m||!g)return {color:mark,opacity:1};
 // The least opacity that keeps every channel of the overlaid colour in range.
 let opacity=0;
 for(let i=0;i<3;i++){const d=m[i]-g[i];opacity=Math.max(opacity,d>0?d/(255-g[i]):d<0?-d/g[i]:0);}
 if(!(opacity>0)||opacity>=1)return {color:mark,opacity:1};
 return {color:'#'+m.map((c,i)=>Math.max(0,Math.min(255,Math.round(g[i]+(c-g[i])/opacity))).toString(16).padStart(2,'0')).join(''),opacity};
}

/** A piece of the trail's line: a canvas drawn once, at its place in the space that moves it. */
const TrailInk=memo(function TrailInk({patch,color}:{patch:TrailPatch;color:string}){
 return <Svg width={patch.width} height={patch.height} style={[styles.layer,{left:patch.left,top:patch.top}]} accessible={false}>
  <Path d={patch.d} stroke={color} strokeWidth={2.5} strokeLinejoin="round" fill="none"/>
 </Svg>;
});
/**
 * A space's tiles, in the order of their keys rather than their age. A tile that leaves hands its key to the tile that
 * arrives, so in key order the newcomer takes the leaver's place among the children and nothing else moves. In age order it
 * would go from first to last, and React Native's mounting layer would take every other tile out and put it back, which on
 * Android makes each of them rasterise again.
 */
const TrailTiles=memo(function TrailTiles({tiles,space,color}:{tiles:readonly TrailTile[];space:number;color:string}){
 const ordered=useMemo(()=>tiles.filter(tile=>tile.space===space).sort((first,second)=>first.key-second.key),[tiles,space]);
 return <>{ordered.map(tile=><TrailInk key={tile.key} patch={tile} color={color}/>)}</>;
});
/**
 * The shaded area to break-even. It is soft everywhere except along the trail, where the line covers its edge, so it is
 * drawn at about one device pixel per layout pixel and scaled up: a ninth of the pixels to rasterise on a 3x display.
 */
const TrailShade=memo(function TrailShade({area,color,id,scale}:{area:TrailArea;color:string;id:string;scale:number}){
 const width=Math.ceil(area.width/scale),height=Math.ceil(area.height/scale);
 return <Svg width={width} height={height} viewBox={`0 0 ${width*scale} ${height*scale}`} preserveAspectRatio="none" accessible={false}
  style={[styles.layer,{left:area.left+width*(scale-1)/2,top:area.top+height*(scale-1)/2,transform:[{scale}]}]}>
  <Defs><LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={area.from} y2={area.to}><Stop offset={0} stopColor={color} stopOpacity={.5}/><Stop offset={1} stopColor={color} stopOpacity={0}/></LinearGradient></Defs>
  <Path d={area.d} fill={`url(#${id})`}/>
 </Svg>;
});
/**
 * The trail's fade: the ground colour, opaque at the trail's left end and clear at the pill, over everything the trail
 * draws. It stays put while the trail moves under it, so the fade is exact on every frame and no tile is ever drawn
 * again for it. One short strip stretched over the band the trail is in, from `top` for `height`: the display blends
 * only that band each frame, not the height of the chart.
 */
const TrailVeil=memo(function TrailVeil({width,top,height,color,id}:{width:number;top:number;height:number;color:string;id:string}){
 return <Svg width={width} height={4} style={[styles.layer,{top:top+height/2-2,transform:[{scaleY:height/4}]}]} accessible={false}>
  <Defs><LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} x2={width} y1={0} y2={0}><Stop offset={0} stopColor={color} stopOpacity={1}/><Stop offset={1} stopColor={color} stopOpacity={0}/></LinearGradient></Defs>
  <Rect x={0} y={0} width={width} height={4} fill={`url(#${id})`}/>
 </Svg>;
});
/** The plus grid as one thin canvas per row of marks, a tile wider than the chart so it can wrap. A canvas the size of the chart would be blended over every pixel of it each frame to show a few marks. */
const Grid=memo(function Grid({width,height,color,opacity}:{width:number;height:number;color:string;opacity:number}){
 const marks:string[]=[],rows:number[]=[];
 for(let x=25;x<width+54;x+=50)marks.push(`M${x-3} 4h6M${x} 1v6`);
 for(let y=25;y<height+3;y+=50)rows.push(y);
 const d=marks.join('');
 return <>{rows.map(y=><Svg key={y} width={width+ALTIMETER_FLOW_PX} height={8} style={[styles.layer,{top:y-4}]} accessible={false}><Path d={d} stroke={color} strokeOpacity={opacity} fill="none"/></Svg>)}</>;
});
/**
 * One ladder price. A row keeps what it drew for as long as it is on the chart; only rows that arrive are drawn. iOS draws
 * the label as vector text. Android draws vector text glyph by glyph on the CPU and builds the typeface from its file again
 * for every text that names a family, milliseconds a row on a mid-range phone, so there the label is native text, which the
 * system draws from its glyph cache: a box centred on the row puts the baseline where the vector text has it.
 */
const LadderLabel=memo(function LadderLabel({y,label,hidden,right,color,font}:{y:number;label:string;hidden:boolean;right:number;color:string;font?:string}){
 if(Platform.OS==='android')return <NativeText accessible={false} allowFontScaling={false} numberOfLines={1}
  style={[styles.layer,styles.ladderText,{left:right-LADDER_TEXT_WIDTH,top:y-9,color,fontFamily:font,opacity:hidden?0:.75}]}>{label}</NativeText>;
 const width=Math.ceil(label.length*9.5)+8;
 return <Svg width={width} height={18} style={[styles.layer,{left:right-width,top:y-9,opacity:hidden?0:1}]} accessible={false}>
  <SvgText x={width} y={13} textAnchor="end" fontFamily={font} fontSize={13} fill={color} fillOpacity={.75}>{label}</SvgText>
 </Svg>;
});
/** The ladder's tick marks down one edge. Every row has the same mark, so the strip is drawn once and re-placed as rows come and go. */
const LadderTicks=memo(function LadderTicks({rows,left,top,color}:{rows:number;left:number;top:number;color:string}){
 const d=useMemo(()=>Array.from({length:rows},(_,row)=>`M0 ${4+row*ALTIMETER_TICK_PX}h8`).join(''),[rows]);
 return <Svg width={8} height={(rows-1)*ALTIMETER_TICK_PX+8} style={[styles.layer,{left,top:top-4}]} accessible={false}><Path d={d} stroke={color} strokeOpacity={.75} fill="none"/></Svg>;
});
const TargetLine=memo(function TargetLine({y,width,color}:{y:number;width:number;color:string}){
 return <Svg width={width} height={4} style={[styles.layer,{top:y-2}]} accessible={false}><Line x1={0} x2={width} y1={2} y2={2} stroke={color} strokeDasharray="3 4"/></Svg>;
});
/** A target's text. A thin outline in the chart's background colour lifts it off the grid and the trail: a stroked copy drawn behind the fill, as web paints its stroke under the text. */
const TargetLabel=memo(function TargetLabel({top,right,text,color,ground}:{top:number;right:number;text:string;color:string;ground:string}){
 const width=Math.max(1,Math.min(right+6,Math.ceil(text.length*10)+16));
 return <Svg width={width} height={22} style={[styles.layer,{left:right+2-width,top}]} accessible={false}>
  <SvgText x={width-2} y={14} textAnchor="end" fontSize={13} fill={ground} stroke={ground} strokeWidth={2} strokeLinejoin="round">{text}</SvgText>
  <SvgText x={width-2} y={14} textAnchor="end" fontSize={13} fill={color}>{text}</SvgText>
 </Svg>;
});

/** One spark of a burst: a dot in its halo, carried out from the pill's edge on the UI thread. */
const Spark=memo(function Spark({index,direction,progress,half,color}:{index:number;direction:'up'|'down';progress:SharedValue<number>;half:number;color:string}){
 const {dx,dy,distance,size}=sparkGeometry(index,direction);
 const motion=useAnimatedStyle(()=>{
  'worklet';
  const left=1-progress.value,travel=1-left*left*left;
  return {transform:[{translateX:dx*(half-3+distance*travel)},{translateY:dy*(15+distance*travel)}]};
 });
 return <Reanimated.View style={[styles.layer,motion]}>
  <View style={{position:'absolute',left:-size,top:-size,width:size*2,height:size*2,borderRadius:size,backgroundColor:color,opacity:.25}}/>
  <View style={{position:'absolute',left:-size/2,top:-size/2,width:size,height:size,borderRadius:size/2,backgroundColor:color}}/>
 </Reanimated.View>;
});
/**
 * The DEGEN burst: a ring off the pill and sparks fanning the way the price moved. It is native views, mounted while DEGEN
 * is on and invisible until a crossing, and one progress value on the UI thread moves all of it, so a burst costs React
 * one draw (its colour and direction) and no canvas.
 */
const BurstLayer=memo(function BurstLayer({direction,color,progress,x,y,width}:{direction:'up'|'down';color:string;progress:SharedValue<number>;x:number;y:number;width:number}){
 const fade=useAnimatedStyle(()=>{'worklet';const at=progress.value;return {opacity:at>=1?0:Math.min(1,(1-at)*3)};});
 const ring=useAnimatedStyle(()=>{
  'worklet';
  const at=progress.value,left=1-at,travel=1-left*left*left;
  return {opacity:at<.5?1-at*2:0,transform:[{scaleX:(width+20*travel)/Math.max(1,width)},{scaleY:(36+16*travel)/36}]};
 });
 return <Reanimated.View pointerEvents="none" testID="altimeter-burst" style={[styles.layer,{left:x,top:y},fade]}>
  <Reanimated.View style={[{position:'absolute',left:-width/2,top:-18,width,height:36,borderRadius:18,borderWidth:2,borderColor:color},ring]}/>
  {SPARKS.map(index=><Spark key={index} index={index} direction={direction} progress={progress} half={width/2} color={color}/>)}
 </Reanimated.View>;
});

/** Native SVG price ladder, scrolling trail and position readout. Stops drawing and unsubscribes in the background. */
export function AltimeterChart({summary,paused=false,price,feed=bitcoinPrice,height=320,priceOptions,position,targets=noTargets,targetLabelInsets,degen=false,onTargetCross,...view}:AltimeterChartProps){
 const colors=useColors(),reducedMotion=useReducedMotion(),monoFontFamily=useMonoFontFamily(),messages=useMessages(),locale=useNumberLocale();
 const [width,setWidth]=useState(0),[frame,setFrame]=useState(emptyFrame),[stale,setStale]=useState(false);
 const [active,setActive]=useState(AppState.currentState==null||AppState.currentState==='active');
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>setActive(state==='active'));return ()=>sub.remove();},[]);
 const levels=useMemo(()=>validTargets(targets),[targets]);
 const controlled=price!==undefined,latest=useRef<number|null>(null);
 const onCross=useRef(onTargetCross);onCross.current=onTargetCross;
 const wake=useRef<(()=>void)|null>(null),published=useRef(emptyFrame);
 const basis=position?.breakEvenPrice;
 const settings=useRef({width,height,reducedMotion,degen,levels,targetLabelInsets,basis});
 // The trail's visible length, which follows the pill's width, and whether the UI thread is moving the chart: both read by the driver.
 const trailSpan=useRef(0),uiMoves=useRef(false);
 // The ladder's scale and the space it is drawn in outlive a pause: a chart that resumes near the price it paused at keeps
 // every row it drew.
 const scale=useRef<{spacing:number;anchor:number;space:0|1}>({spacing:0,anchor:NaN,space:0});
 const pixel=PixelRatio.get();
 // The UI thread's side of the chart: what it needs to know, and where it holds the two spaces and the grid.
 const control=useSharedValue<Control>(idleControl),wallLead=useSharedValue(NaN);
 const x0=useSharedValue(0),y0=useSharedValue(0),x1=useSharedValue(0),y1=useSharedValue(0),gridX=useSharedValue(0);
 useEffect(()=>{settings.current={width,height,reducedMotion,degen,levels,targetLabelInsets,basis};if(controlled)latest.current=validPrice(price)?price:null;wake.current?.();},[width,height,reducedMotion,degen,levels,targetLabelInsets,basis,controlled,price]);
 useEffect(()=>{
  if(controlled||!active){setStale(false);return;}
  let alive=true,deadline:ReturnType<typeof setTimeout>;
  const expire=()=>{if(alive){latest.current=null;setStale(true);wake.current?.();}};
  const arm=()=>{clearTimeout(deadline);deadline=setTimeout(expire,30_000);};
  latest.current=null;setStale(false);arm();
  const stop=feed(p=>{if(alive&&validPrice(p)){if(latest.current!==p){latest.current=p;wake.current?.();}setStale(false);arm();}},expire);
  return ()=>{alive=false;clearTimeout(deadline);stop();};
 },[controlled,controlled?undefined:feed,active]);
 const hasSize=width>0&&height>0;
 useEffect(()=>{
  if(!active||!hasSize||paused)return;
  let raf:number|null=null,sampleTimer:ReturnType<typeof setTimeout>|undefined;
  let last=-Infinity,sampled=-Infinity,lastBurst=-Infinity,previous=NaN,{anchor,spacing}=scale.current,labelMotionUntil=0;
  let lastSettings:typeof settings.current|undefined;
  let burst:Burst|undefined;
  let tween=ALTIMETER_TWEEN_IDLE,shift=NaN,posted:Control|undefined;
  let spaces:[TrailSpace,TrailSpace]=[idleSpace,idleSpace];
  // A new scale waits one step: the UI thread is told the origin of the space it will be drawn in before anything is drawn there.
  let pending:{spacing:number;anchor:number;space:TrailSpace}|undefined;
  const layout=targetLayout({reuseSettled:true}),crossings=targetCrossings({immutableTargets:true});
  // Tiles a whole number of device pixels wide meet without a seam.
  const trail=trailTiles({tile:Math.max(1,Math.round(TRAIL_TILE*pixel))/pixel,pixel});
  let stopped=false;
  const requestFrame=()=>{
   clearTimeout(sampleTimer);
   if(raf===null&&!stopped)raf=requestAnimationFrame(step);
  };
  const step=(now:number)=>{
   raf=null;
   // One heartbeat at a time, however this step was reached, and none once the driver has stopped.
   clearTimeout(sampleTimer);
   if(stopped)return;
   const {width,height,reducedMotion,levels,degen,targetLabelInsets,basis}=settings.current,mark=latest.current;
   if(mark==null){
    if(published.current.mark!==null){published.current=emptyFrame;setFrame(emptyFrame);}
    sampled=last=-Infinity;previous=NaN;spacing=0;scale.current={spacing:0,anchor:NaN,space:0};tween=ALTIMETER_TWEEN_IDLE;pending=undefined;burst=undefined;
    trail.reset();crossings.reset();layout.reset();
    if(posted!==idleControl){posted=idleControl;control.value=idleControl;}
    return; // The next feed value or controlled prop change wakes the driver.
   }
   // The price, crossings and colliding labels are worked out at most 30 Hz; React draws far less often (see Frame).
   const interval=reducedMotion?ALTIMETER_SAMPLE_MS:1000/30;
   if(now-last<interval-1){
    if(reducedMotion)sampleTimer=setTimeout(requestFrame,interval-(now-last));
    else requestFrame();
    return;
   }
   const gap=now-last>2000;last=now;
   if(gap){sampled=-Infinity;tween=ALTIMETER_TWEEN_IDLE;pending=undefined;burst=undefined;trail.reset();crossings.reset();layout.reset();}
   let told=false;
   // The UI thread keeps time by the wall clock; tell it how far that runs ahead of this clock. A frame's own start is the
   // earliest reading of it, so the smallest lead seen is the truest.
   const lead=Date.now()-now;
   if(!(Math.abs(lead-shift)<=50)||lead<shift-1){shift=lead;told=true;}
   const stepped=stepPriceTween(tween,mark,now,reducedMotion||gap);
   const display=stepped.value;
   if(stepped.state!==tween){
    // A snap to the price it already rests at changes nothing the trail or the UI thread can see.
    const moved=!(tween.from===tween.to&&stepped.state.from===stepped.state.to&&tween.to===stepped.state.to);
    tween=stepped.state;
    if(moved){if(trail.seeded)trail.retarget(tween,now);told=true;}
   }
   let rescaled=false;
   if(pending){
    spacing=pending.spacing;anchor=pending.anchor;
    scale.current={spacing,anchor,space:trail.flip(pending.space) as 0|1};
    pending=undefined;rescaled=true;told=true;
   }else if(!trail.seeded){
    // A first price, or the first after a pause or a gap. The scale it had is kept while the price is still on it, and so is
    // the space, so the ladder already drawn stays as it is; only the trail starts again.
    let index=scale.current.space;
    if(!spacing||Math.abs(display-anchor)>40*spacing){spacing=tickSpacingFor(display);anchor=Math.round(display/spacing)*spacing;index=0;}
    scale.current={spacing,anchor,space:index};
    // The origin sits on a whole device pixel of travel, so the trail and the grid round to the same pixels.
    const grain=1000/(ALTIMETER_FLOW_PX*pixel),space:TrailSpace={t0:Math.floor(now/grain)*grain,p0:anchor,spacing};
    spaces=index===0?[space,idleSpace]:[idleSpace,space];
    trail.start(space,index);rescaled=true;told=true;
   }else if(Math.abs(display-anchor)>40*spacing||trailX(spaces[trail.current],now)>MAX_TRAVEL){
    const nextSpacing=tickSpacingFor(display),nextAnchor=Math.round(display/nextSpacing)*nextSpacing;
    // The new space begins where the tiles of this one end, so the two meet on a tile edge.
    const space:TrailSpace={t0:Number.isFinite(trail.edge)?trail.edge:spaces[trail.current].t0,p0:nextAnchor,spacing:nextSpacing};
    pending={spacing:nextSpacing,anchor:nextAnchor,space};
    spaces=trail.current===0?[spaces[0],space]:[space,spaces[1]];told=true;
   }
   if(!trail.seeded)trail.seed(now,display,width/ALTIMETER_FLOW_PX*1000+2000);
   // The heartbeat of a quiet chart: nothing is drawn on it unless the trail says its patch needs topping up.
   if(now-sampled>=ALTIMETER_SAMPLE_MS)sampled=now;
   const hit=crossings.update(display,levels,degen&&!reducedMotion).at(-1);
   if(hit&&degen&&!reducedMotion&&now-lastBurst>=ALTIMETER_BURST_COOLDOWN_MS){
    burst={start:now,direction:display>previous?'up':'down',color:hit.color};lastBurst=now;
    onCross.current?.(hit,burst.direction);
   }
   if(!degen||reducedMotion||(burst&&now-burst.start>=tokens.motion.base*2))burst=undefined;
   if(!gap&&(previous!==display||lastSettings!==settings.current)&&levels.some(level=>level.label)){
    labelMotionUntil=now+tokens.motion.base;
   }
   const placed=layout.update(levels,display,spacing,height,now,reducedMotion||gap,targetLabelInsets);
   const drawn=trail.view(now,{span:trailSpan.current,height,display,basis});
   const shown=published.current,centerTick=Math.round((display-anchor)/spacing);
   // Pinned at an edge or not: a target that crosses the chart's edge changes how its label is drawn.
   let edges=false;
   for(const [id,next] of placed){if(shown.levels.get(id)?.pinned!==next.pinned){edges=true;break;}}
   // A burst is published when it starts and when it is over; the UI thread plays it.
   const publish=drawn!==shown.view||rescaled||shown.mark!==mark||Math.abs(shown.centerTick-centerTick)>=LADDER_MARGIN_ROWS-1||shown.levels.size!==placed.size||edges||
    burst!==shown.burst||now<labelMotionUntil||lastSettings!==settings.current;
   // A space moves while anything is drawn in it, and from the step before it is first drawn in.
   const live:[boolean,boolean]=[false,false];
   live[trail.current]=true;
   for(const tile of drawn.tiles)live[tile.space]=true;
   if(pending)live[1-trail.current]=true;
   if(told||!posted||posted.live[0]!==live[0]||posted.live[1]!==live[1]){posted={tween,spaces,live,shift};control.value=posted;}
   // Until the UI thread runs the clock (before the first frame is drawn, and under reduced motion) the driver places the chart.
   if(!uiMoves.current){
    const at0=trailScroll(spaces[0],now,display,pixel),at1=trailScroll(spaces[1],now,display,pixel);
    if(live[0]){x0.value=at0.x;y0.value=at0.y;}
    if(live[1]){x1.value=at1.x;y1.value=at1.y;}
    gridX.value=reducedMotion?0:gridOffset(now,pixel);
   }
   if(publish){
    const next:Frame={mark,display,anchor,spacing,centerTick,levels:placed,burst,view:drawn,space:trail.current,spaces};
    published.current=next;setFrame(next);
   }
   previous=display;lastSettings=settings.current;
   if(!reducedMotion&&(display!==mark||burst||pending||now<labelMotionUntil))requestFrame();
   else sampleTimer=setTimeout(requestFrame,Math.max(0,sampled+ALTIMETER_SAMPLE_MS-now));
  };
  wake.current=requestFrame;
  requestFrame();
  return ()=>{
   stopped=true;wake.current=null;clearTimeout(sampleTimer);if(raf!==null)cancelAnimationFrame(raf);
   // Nothing moves while the driver is stopped. Its next run starts the trail from a new origin, and the UI thread must not
   // carry what is still drawn to it.
   if(posted&&(posted.live[0]||posted.live[1]))control.value={...posted,live:[false,false]};
  };
 },[active,hasSize,paused,controlled,controlled?undefined:feed]);

 const {display,mark,spacing,anchor,centerTick}=frame,center=height/2;
 const scrolling=active&&hasSize&&!paused&&!reducedMotion&&mark!==null;
 // Each display frame the UI thread reads the clock, works out the price the tween shows and moves what is drawn. Nothing is
 // drawn here and no prop but a transform changes, so a frame costs a few view updates whatever the chart holds.
 const advance=useCallback((info:FrameInfo)=>{
  'worklet';
  const state=control.value;
  // Frame times are evenly spaced where the wall clock read inside a frame is not, so the trail advances by the same
  // amount each frame. The smallest lead of the wall clock over them is the frame's true start.
  const lead=Date.now()-info.timestamp;
  let held=wallLead.value;
  if(!(Math.abs(lead-held)<=50)||lead<held){held=lead;wallLead.value=lead;}
  const at=info.timestamp+held-state.shift,shown=tweenValue(state.tween,at);
  if(state.live[0]){const to=trailScroll(state.spaces[0],at,shown,pixel);if(x0.value!==to.x)x0.value=to.x;if(y0.value!==to.y)y0.value=to.y;}
  if(state.live[1]){const to=trailScroll(state.spaces[1],at,shown,pixel);if(x1.value!==to.x)x1.value=to.x;if(y1.value!==to.y)y1.value=to.y;}
  if(state.live[0]||state.live[1]){const to=gridOffset(at,pixel);if(gridX.value!==to)gridX.value=to;}
 },[control,wallLead,x0,y0,x1,y1,gridX,pixel]);
 const clock=useFrameCallback(advance,false);
 useEffect(()=>{uiMoves.current=scrolling;clock.setActive(scrolling);return ()=>{uiMoves.current=false;clock.setActive(false);};},[clock,scrolling]);
 const trail0=useAnimatedStyle(()=>({transform:[{translateX:x0.value},{translateY:y0.value}]}));
 const trail1=useAnimatedStyle(()=>({transform:[{translateX:x1.value},{translateY:y1.value}]}));
 const rows0=useAnimatedStyle(()=>({transform:[{translateY:y0.value}]}));
 const rows1=useAnimatedStyle(()=>({transform:[{translateY:y1.value}]}));
 const gridMotion=useAnimatedStyle(()=>({transform:[{translateX:gridX.value}]}));

 const digits=labelDecimalsFor(spacing,display);
 const optionsKey=JSON.stringify(priceOptions??{});
 const format=useMemo(()=>new Intl.NumberFormat(locale,{style:'currency',currency:'USD',minimumFractionDigits:digits,maximumFractionDigits:digits,...priceOptions}),[locale,digits,optionsKey]);
 const capsule=position?.capsule;
 const mode=typeof capsule==='object'?'percent':capsule==='pnl'?'pnl':'price';
 const currency=priceOptions?.currency??'USD';
 const capsuleFormat=useMemo(()=>{
  if(mode==='percent')return new Intl.NumberFormat(locale,{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'});
  if(mode==='pnl')return new Intl.NumberFormat(locale,{style:'currency',currency,signDisplay:'exceptZero'});
  return null;
 },[locale,mode,currency]);
 const value=typeof capsule==='object'?capsule.returnRatio:capsule==='pnl'?position?.pnl:mark;
 const readingFormat=capsuleFormat??format;
 const reading=useMemo(()=>value!=null&&Number.isFinite(value)?readingFormat.format(value):'—',[value,readingFormat]);
 // The pill's figure rolls its digits as web's NumberFlow does, in the same format as the reading.
 const pillOptions=useMemo<Intl.NumberFormatOptions>(()=>mode==='percent'?{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'}:mode==='pnl'?{style:'currency',currency,signDisplay:'exceptZero'}:{style:'currency',currency:'USD',minimumFractionDigits:digits,maximumFractionDigits:digits,...priceOptions},[mode,currency,digits,optionsKey]);
 const tone=(n:number)=>!Number.isFinite(n)||n===0?colors.muted:n>0?colors.positive:colors.negative;
 const pillColor=position?tone(position.pnl):colors.action;
 const pillTone:NumberTone=!position?'action':!Number.isFinite(position.pnl)||position.pnl===0?'muted':position.pnl>0?'positive':'negative';
 const lineColor=position?tone(mark!=null&&validPrice(basis)?(mark-basis)*(position.side==='short'?-1:1):0):colors.action;
 const pillWidth=Math.min(Math.max(0,width-8),Math.max(110,reading.length*10+20)),end=Math.max(0,width-8-pillWidth);
 // The trail runs from the left inset to the pill's left edge, where the live price is.
 const span=Math.max(0,end-TRAIL_START);
 trailSpan.current=span;
 const snap=(offset:number)=>Math.round(offset*pixel)/pixel;
 const gridInk=useMemo(()=>overlay(colors.nested,colors.background),[colors.nested,colors.background]);
 // The ladder is the rows around the frame's centre tick, each at its own place in the space the UI thread moves with the
 // price. A new centre tick adds the rows that arrived and drops the ones that left; the rest keep what they drew.
 const halfRows=Math.ceil(center/ALTIMETER_TICK_PX)+1+LADDER_MARGIN_ROWS;
 const labelled=useRef<{format:Intl.NumberFormat;anchor:number;spacing:number;text:Map<number,string>}|null>(null);
 const ladder=useMemo(()=>{
  if(mark===null||!(spacing>0))return [];
  let cache=labelled.current;
  if(!cache||cache.format!==format||cache.anchor!==anchor||cache.spacing!==spacing||cache.text.size>400)cache=labelled.current={format,anchor,spacing,text:new Map()};
  const rows:{tick:number;y:number;label:string}[]=[];
  for(let tick=centerTick+halfRows;tick>=centerTick-halfRows;tick--){
   let label=cache.text.get(tick);
   if(label===undefined){label=format.format(anchor+tick*spacing);cache.text.set(tick,label);}
   rows.push({tick,y:snap(-tick*ALTIMETER_TICK_PX),label});
  }
  return rows;
 },[mark===null,anchor,spacing,centerTick,halfRows,format,pixel]);
 // Where the ladder's space sat on the chart when this frame was drawn: its origin is the anchor price.
 const shift=validPrice(display)&&spacing>0?(display-anchor)/spacing*ALTIMETER_TICK_PX:0;
 const targetTexts=useMemo(()=>new Map(levels.map(level=>[level.id,[level.label,format.format(level.price)].filter(Boolean).join(' ')])),[levels,format]);
 const bounds=useMemo(()=>Array.from(frame.levels.values()),[frame.levels]);
 const hidden=useMemo(()=>bounds.length?ladder.map(row=>{
  const y=center+row.y+shift;
  return bounds.some(level=>level.labelTop!=null&&y+7>level.labelTop-2&&y-7<level.labelTop+20);
 }):null,[bounds,ladder,shift,center]);
 // A target line belongs to its price, so it is placed once in the ladder's space and moves with it. Its label is placed
 // where the layout put it on this frame; a label pinned at the chart's edge stays on the chart instead.
 const following=useMemo(()=>spacing>0?levels.flatMap(level=>{
  const pos=frame.levels.get(level.id);
  return pos&&pos.pinned===null?[{level,y:snap(-(level.price-anchor)/spacing*ALTIMETER_TICK_PX),labelTop:pos.labelTop==null?undefined:snap(pos.labelTop-center-shift)}]:[];
 }):[],[levels,frame.levels,anchor,spacing,shift,center,pixel]);
 const pinned=useMemo(()=>levels.flatMap(level=>{const pos=frame.levels.get(level.id);return pos&&pos.pinned!==null&&level.label&&pos.labelTop!=null?[{level,labelTop:pos.labelTop}]:[];}),[levels,frame.levels]);
 const id=useId().replace(/[^a-zA-Z0-9_-]/g,''),fade='trail'+id,shadeId='basis'+id;
 const status=stale?messages.stale:messages.loadingChart;
 const label=[summary,mark==null?status:reading,...targetTexts.values()].join('. ');
 // A burst runs on the UI thread from one value, 0 to 1 over its length; at 1 nothing of it shows. The newest burst's colour
 // and direction stay on the layer between bursts, so the next one changes only what differs.
 const burst=degen&&!reducedMotion?frame.burst:undefined;
 const burstProgress=useSharedValue(1),lastBurst=useRef<Burst|undefined>(undefined);
 if(burst)lastBurst.current=burst;
 useEffect(()=>{
  if(!burst)return;
  burstProgress.value=0;
  burstProgress.value=withTiming(1,{duration:BURST_MS,easing:Easing.linear,reduceMotion:ReduceMotion.Never});
 },[burst,burstProgress]);
 const shake=useAnimatedStyle(()=>{
  'worklet';
  const elapsed=burstProgress.value*BURST_MS;
  return {transform:[{translateX:elapsed>0&&elapsed<SHAKE_MS?Math.sin(elapsed/18)*3*(1-elapsed/SHAKE_MS):0}]};
 });
 const drawn=frame.view,shadeScale=pixel>=2.5?3:pixel>=1.5?2:1;
 // The band of the chart the trail can be in until the next frame is drawn: where its pieces are now and where they will
 // be when the price has reached the mark it is easing to. The veil covers that band and no more.
 const veil=useMemo(()=>{
  if(mark===null||!validPrice(display))return null;
  const low=Math.min(display,mark),high=Math.max(display,mark);
  let top=Infinity,bottom=-Infinity;
  const cover=(piece:TrailPatch)=>{
   const space=frame.spaces[piece.space];
   if(!(space.spacing>0))return;
   // A higher price moves what is drawn down the chart.
   top=Math.min(top,center+piece.top+(low-space.p0)/space.spacing*ALTIMETER_TICK_PX);
   bottom=Math.max(bottom,center+piece.top+piece.height+(high-space.p0)/space.spacing*ALTIMETER_TICK_PX);
  };
  for(const tile of drawn.tiles)cover(tile);
  if(drawn.live)cover(drawn.live);
  // Room either side for the few milliseconds the UI thread's reading of the tween may differ from this frame's.
  top=Math.max(0,Math.floor(top)-VEIL_MARGIN);bottom=Math.min(height,Math.ceil(bottom)+VEIL_MARGIN);
  return bottom>top?{top,height:bottom-top}:null;
 },[drawn,frame.spaces,display,mark,center,height]);
 return <View {...view}><Text>{summary}</Text>
  <View accessible accessibilityLabel={label} accessibilityRole="image" onLayout={e=>setWidth(e.nativeEvent.layout.width)}
   style={{height,direction:'ltr',overflow:'hidden',borderRadius:tokens.radius.xl,backgroundColor:colors.background}}>
   {width>0&&<>
    {/* The trail, under its veil. Each space is moved as one layer; the pieces in it never change once drawn. */}
    {mark!==null&&span>0&&<View pointerEvents="none" testID="altimeter-trail" style={{position:'absolute',left:TRAIL_START,top:0,width:span,height,overflow:'hidden'}}>
     <Reanimated.View style={[styles.layer,{left:span,top:center},trail0]}>
      <TrailTiles tiles={drawn.tiles} space={0} color={lineColor}/>
      {drawn.live?.space===0&&<TrailInk patch={drawn.live} color={lineColor}/>}
     </Reanimated.View>
     <Reanimated.View style={[styles.layer,{left:span,top:center},trail1]}>
      <TrailTiles tiles={drawn.tiles} space={1} color={lineColor}/>
      {drawn.live?.space===1&&<TrailInk patch={drawn.live} color={lineColor}/>}
     </Reanimated.View>
     {veil&&<TrailVeil width={span} top={veil.top} height={veil.height} color={colors.background} id={fade}/>}
     {/* The shade is the line's colour, so it reads the same above the veiled line as beneath it, and it does not fade with the line. */}
     {drawn.area&&<Reanimated.View style={[styles.layer,{left:span,top:center},drawn.area.space===0?trail0:trail1]}>
      <TrailShade area={drawn.area} color={lineColor} id={shadeId} scale={shadeScale}/>
     </Reanimated.View>}
    </View>}
    {/* The ladder and the target lines that follow the price, in the space this frame was drawn in. */}
    {[rows0,rows1].map((motion,space)=><Reanimated.View key={space} pointerEvents="none" style={[styles.layer,{top:center},motion]}>
     {frame.space===space&&ladder.length>0&&<>
      <LadderTicks rows={ladder.length} left={10} top={ladder[0].y} color={colors.muted}/>
      <LadderTicks rows={ladder.length} left={width-18} top={ladder[0].y} color={colors.muted}/>
      {ladder.map((row,index)=><LadderLabel key={row.tick} y={row.y} label={row.label} hidden={hidden?.[index]??false} right={width-32} color={colors.muted} font={monoFontFamily}/>)}
      {following.map(({level,y})=><TargetLine key={level.id} y={y} width={width} color={level.color??colors.action}/>)}
      {following.map(({level,labelTop})=>level.label&&labelTop!=null?<TargetLabel key={level.id} top={labelTop} right={width-8} text={targetTexts.get(level.id)??''} color={level.color??colors.action} ground={colors.background}/>:null)}
     </>}
    </Reanimated.View>)}
    {/* The grid lies over the trail so the veil cannot fade it; its marks are see-through, so the line shows under them. */}
    <Reanimated.View pointerEvents="none" style={[styles.layer,gridMotion]}>
     <Grid width={width} height={height} color={gridInk.color} opacity={gridInk.opacity}/>
    </Reanimated.View>
    {pinned.map(({level,labelTop})=><TargetLabel key={level.id} top={labelTop} right={width-8} text={targetTexts.get(level.id)??''} color={level.color??colors.action} ground={colors.background}/>)}
    {degen&&!reducedMotion&&mark!==null&&<BurstLayer direction={lastBurst.current?.direction??'up'} color={lastBurst.current?.color??colors.action} progress={burstProgress} x={end+pillWidth/2} y={center} width={pillWidth}/>}
    {mark==null?<View pointerEvents="none" style={[styles.layer,{width,height,alignItems:'center',justifyContent:'center'}]}><Text style={{color:colors.muted}}>{status}</Text></View>:
    /* The pill is a native rounded box, not a canvas, and its figure is native text so its digits can roll. */
    <Reanimated.View pointerEvents="none" testID="altimeter-pill" style={[{position:'absolute',left:end,top:center-18,width:pillWidth,height:36,borderRadius:18,borderWidth:1,borderColor:pillColor,backgroundColor:colors.background,alignItems:'center',justifyContent:'center'},shake]}>
     <NumberFlow value={value} options={pillOptions} tone={pillTone} maxFontSizeMultiplier={1} style={{fontFamily:monoFontFamily,fontSize:16,fontWeight:'600'}}/>
    </Reanimated.View>}</>}
  </View>
 </View>;
}

const styles=StyleSheet.create({
 layer:{position:'absolute',left:0,top:0},
 ladderText:{width:LADDER_TEXT_WIDTH,height:18,lineHeight:18,fontSize:13,textAlign:'right',textAlignVertical:'center',includeFontPadding:false},
});
