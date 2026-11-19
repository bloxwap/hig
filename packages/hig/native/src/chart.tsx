import React,{memo,useCallback,useEffect,useId,useMemo,useRef,useState} from 'react';
import {AppState,PixelRatio,Platform,StyleSheet,View,type ViewProps} from 'react-native';
import Reanimated,{useAnimatedStyle,useFrameCallback,useSharedValue} from 'react-native-reanimated';
import Svg,{Circle,Defs,G,Line,LinearGradient,Path,Rect,Stop,Text as SvgText} from 'react-native-svg';
import {tokens} from '@bloxwap/hig/tokens';
import {ALTIMETER_BURST_COOLDOWN_MS,ALTIMETER_FLOW_PX,ALTIMETER_SAMPLE_MS,ALTIMETER_TICK_PX,
 bitcoinPrice,firstRetainedTick,labelDecimalsFor,ladderPrices,priceTween,smoothTrail,sparkGeometry,
 targetCrossings,targetLayout,tickSpacingFor,trailPoints,validTargets,
 type AltimeterFeed,type AltimeterPosition,type AltimeterTarget,type AltimeterTargetPosition,type TargetLabelInsets,type AltimeterTick} from '@bloxwap/hig/chart/altimeter-core';
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
type Frame={now:number;wallTime:number;display:number;mark:number|null;spacing:number;anchor:number;ticks:AltimeterTick[];
 levels:Map<string,AltimeterTargetPosition>;burst?:Burst};
const emptyFrame:Frame={now:0,wallTime:0,display:NaN,mark:null,spacing:1,anchor:0,ticks:[],levels:new Map()};


// As in the mobile chart, a ladder slot keeps its identity as prices scroll. The
// tick geometry depends only on the viewport; a new shelf changes the text.
const LadderInk=memo(function LadderInk({rows,hidden,ticks,width,color,font}:{rows:readonly {y:number;label:string}[];hidden:string;ticks:string;width:number;color:string;font?:string}){
 return <>
  <Path d={ticks} stroke={color} strokeOpacity={.75}/>
  {rows.map((row,i)=><SvgText key={i} x={width-32} y={row.y+4} textAnchor="end" fontFamily={font} fontSize={13} fill={color} fillOpacity={hidden[i]==='1'?0:.75}>{row.label}</SvgText>)}
 </>;
});

function BurstEffect({burst,now,x,y,width}:{burst:Burst;now:number;x:number;y:number;width:number}){
 const progress=Math.min(1,(now-burst.start)/(tokens.motion.base*2));
 const travel=1-(1-progress)**3;
 const color=burst.color;
 return <G opacity={Math.min(1,(1-progress)*3)}>
  {progress<.5&&<Rect x={x-width/2-10*travel} y={y-18-8*travel} width={width+20*travel} height={36+16*travel} rx={24} fill="none" stroke={color} strokeWidth={2} opacity={1-progress*2}/>}
  {Array.from({length:24},(_,i)=>{
   const {dx,dy,distance,size}=sparkGeometry(i,burst.direction);
   const cx=x+dx*(width/2-3+distance*travel),cy=y+dy*(15+distance*travel);
   return <G key={i}><Circle cx={cx} cy={cy} r={size} fill={color} opacity={.25}/><Circle cx={cx} cy={cy} r={size/2} fill={color}/></G>;
  })}
 </G>;
}

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
 const settings=useRef({width,height,reducedMotion,degen,levels,targetLabelInsets});
 useEffect(()=>{settings.current={width,height,reducedMotion,degen,levels,targetLabelInsets};if(controlled)latest.current=validPrice(price)?price:null;wake.current?.();},[width,height,reducedMotion,degen,levels,targetLabelInsets,controlled,price]);
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
  let last=-Infinity,sampled=-Infinity,lastBurst=-Infinity,previous=NaN,anchor=NaN,spacing=0,labelMotionUntil=0;
  let lastSettings:typeof settings.current|undefined;
  let ticks:AltimeterTick[]=[],burst:Burst|undefined;
  const tween=priceTween(),layout=targetLayout({reuseSettled:true}),crossings=targetCrossings({immutableTargets:true});
  const requestFrame=()=>{
   clearTimeout(sampleTimer);
   if(raf===null)raf=requestAnimationFrame(step);
  };
  const step=(now:number)=>{
   raf=null;
   const {width,height,reducedMotion,levels,degen,targetLabelInsets}=settings.current,mark=latest.current;
   if(mark==null){
    if(published.current.mark!==null){published.current=emptyFrame;setFrame(emptyFrame);}
    ticks=[];sampled=last=-Infinity;previous=NaN;spacing=0;
    tween.reset();crossings.reset();layout.reset();burst=undefined;
    return; // The next feed value or controlled prop change wakes the driver.
   }
   // Price geometry and colliding labels update at most 30 Hz. The independent
   // display clock handles horizontal travel between these snapshots.
   const interval=reducedMotion?ALTIMETER_SAMPLE_MS:1000/30;
   if(now-last<interval-1){
    if(reducedMotion)sampleTimer=setTimeout(requestFrame,interval-(now-last));
    else requestFrame();
    return;
   }
   const gap=now-last>2000;last=now;
   if(gap){ticks=[];sampled=-Infinity;tween.reset();crossings.reset();layout.reset();burst=undefined;}
   const display=tween.update(mark,now,reducedMotion||gap);
   if(!spacing||Math.abs(display-anchor)>40*spacing){spacing=tickSpacingFor(display);anchor=Math.round(display/spacing)*spacing;}
   if(now-sampled>=ALTIMETER_SAMPLE_MS){
    const keep=width/ALTIMETER_FLOW_PX*1000+2000;
    if(!ticks.length)ticks=[{t:now-keep,p:display}];
    ticks=ticks.slice(firstRetainedTick(ticks,now-keep));
    ticks.push({t:now,p:display});
    sampled=now;
   }
   const hit=crossings.update(display,levels,degen&&!reducedMotion).at(-1);
   if(hit&&degen&&!reducedMotion&&now-lastBurst>=ALTIMETER_BURST_COOLDOWN_MS){
    burst={start:now,direction:display>previous?'up':'down',color:hit.color};lastBurst=now;
    onCross.current?.(hit,burst.direction);
   }
   if(!degen||reducedMotion||(burst&&now-burst.start>=tokens.motion.base*2))burst=undefined;
   if(!gap&&(previous!==display||lastSettings!==settings.current)&&levels.some(level=>level.label)){
    labelMotionUntil=now+tokens.motion.base;
   }
   const next={now,wallTime:Date.now(),mark,display,anchor,spacing,ticks,levels:layout.update(levels,display,spacing,height,now,reducedMotion||gap,targetLabelInsets),burst};
   published.current=next;setFrame(next);
   previous=display;lastSettings=settings.current;
   if(!reducedMotion&&(display!==mark||burst||now<labelMotionUntil))requestFrame();
   else sampleTimer=setTimeout(requestFrame,Math.max(0,sampled+ALTIMETER_SAMPLE_MS-now));
  };
  wake.current=requestFrame;
  requestFrame();
  return ()=>{wake.current=null;clearTimeout(sampleTimer);if(raf!==null)cancelAnimationFrame(raf);};
 },[active,hasSize,paused,controlled,controlled?undefined:feed]);

 const {now,display,mark,spacing,anchor,ticks,wallTime}=frame,center=height/2;
 const displayTime=useSharedValue(0);
 const android=Platform.OS==='android',pixelScale=PixelRatio.get();
 const updateTime=useCallback(()=>{'worklet';displayTime.value=Date.now();},[displayTime]);
 const clock=useFrameCallback(updateTime,false);
 const scrolling=active&&hasSize&&!paused&&!reducedMotion&&mark!==null;
 useEffect(()=>{clock.setActive(scrolling);return ()=>clock.setActive(false);},[clock,scrolling]);
 const gridMotion=useAnimatedStyle(()=>{
  'worklet';
  const offset=-(displayTime.value%1000)*ALTIMETER_FLOW_PX/1000;
  return {transform:[{translateX:reducedMotion?0:android?Math.round(offset*pixelScale)/pixelScale:offset}]};
 });
 const trailMotion=useAnimatedStyle(()=>{
  'worklet';
  const elapsed=reducedMotion?0:Math.min(ALTIMETER_SAMPLE_MS,Math.max(0,displayTime.value-wallTime));
  const offset=-elapsed*ALTIMETER_FLOW_PX/1000;
  return {transform:[{translateX:android?Math.round(offset*pixelScale)/pixelScale:offset}]};
 });
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
 const basis=position?.breakEvenPrice;
 const lineColor=position?tone(mark!=null&&validPrice(basis)?(mark-basis)*(position.side==='short'?-1:1):0):colors.action;
 const pillWidth=Math.min(Math.max(0,width-8),Math.max(110,reading.length*10+20)),end=Math.max(0,width-8-pillWidth);
 const yFor=(p:number)=>center-(p-display)/spacing*ALTIMETER_TICK_PX;
 // Historical SVG commands are stable between heartbeats. Translate that geometry and
 // append only the short live connector as price and time advance.
 const history=useMemo(()=>{
  const sample=ticks.at(-1);if(!sample)return null;
  const points=trailPoints(ticks,sample.t,18,end,p=>center-(p-sample.p)/spacing*ALTIMETER_TICK_PX,true);
  const last=points.at(-1);if(!last)return null;
  const parts:string[]=[];
  smoothTrail(points,{moveTo:(x,y)=>parts.push(`M${x} ${y}`),lineTo:(x,y)=>parts.push(`L${x} ${y}`),bezierCurveTo:(a,b,c,d,x,y)=>parts.push(`C${a} ${b} ${c} ${d} ${x} ${y}`)});
  return {commands:parts.join(' '),sample,last,first:points[0][0]};
 },[ticks,end,center,spacing]);
 const scroll=history?(history.sample.t-now)*ALTIMETER_FLOW_PX/1000:0;
 const shift=history?(display-history.sample.p)/spacing*ALTIMETER_TICK_PX:0;
 const tipX=end-scroll,tipY=center-shift;
 const dx=history?(tipX-history.last[0])/3:0;
 const curve=history?`C${history.last[0]+dx} ${history.last[1]} ${tipX-dx} ${tipY} ${tipX} ${tipY}`:'';
 const tail=history&&android?`M${history.last[0]} ${history.last[1]}${curve}`:'';
 const trail=history&&!android?history.commands+curve:'';
 // Continue the live end horizontally beneath its clip while the historical
 // layer travels to the next sample. The capsule stays fixed at the true tip.
 const projection=2+ALTIMETER_SAMPLE_MS*ALTIMETER_FLOW_PX/1000;
 const basisY=validPrice(basis)?yFor(basis):center;
 const grid=useMemo(()=>{
  const marks:string[]=[];
  for(let x=25;x<width+54;x+=50)for(let y=25;y<height+3;y+=50)marks.push(`M${x-3} ${y}h6M${x} ${y-3}v6`);
  return marks.join(' ');
 },[width,height]);
 const centerTick=android&&validPrice(display)?Math.round((display-anchor)/spacing):0;
 const reference=anchor+centerTick*spacing;
 const halfRows=Math.ceil(center/ALTIMETER_TICK_PX)+1;
 const slots=useMemo(()=>android?Array.from({length:2*halfRows+1},(_,slot)=>center+(slot-halfRows)*ALTIMETER_TICK_PX):[],[android,center,halfRows]);
 const ladderTicks=useMemo(()=>slots.map(y=>`M10 ${y}h8M${width-18} ${y}h8`).join(' '),[slots,width]);
 const reach=(center/ALTIMETER_TICK_PX+1)*spacing;
 const low=android?0:Math.floor((display-reach-anchor)/spacing),high=android?0:Math.ceil((display+reach-anchor)/spacing);
 const ladder=useMemo(()=>{
  if(mark===null)return [];
  if(android)return slots.map((y,slot)=>{
   const price=anchor+(centerTick+halfRows-slot)*spacing;
   return {price,y,label:format.format(price),ticks:undefined};
  });
  return ladderPrices(anchor,spacing,anchor+low*spacing,anchor+high*spacing).map(price=>{
   const y=center-(price-anchor)/spacing*ALTIMETER_TICK_PX;
   return {price,y,label:format.format(price),ticks:`M10 ${y}h8M${width-18} ${y}h8`};
  });
 },[mark===null,android,slots,anchor,centerTick,halfRows,spacing,format,low,high,center,width]);
 const targetTexts=useMemo(()=>new Map(levels.map(level=>[level.id,[level.label,format.format(level.price)].filter(Boolean).join(' ')])),[levels,format]);
 const bounds=useMemo(()=>Array.from(frame.levels.values()),[frame.levels]);
 const ladderShift=validPrice(display)?(display-reference)/spacing*ALTIMETER_TICK_PX:0;
 const hidden=useMemo(()=>android&&bounds.length?ladder.map(row=>{
  const y=row.y+ladderShift;
  return bounds.some(level=>level.labelTop!=null&&y+7>level.labelTop-2&&y-7<level.labelTop+20)?'1':'0';
 }).join(''):'',[android,bounds,ladder,ladderShift]);
 const id=useId().replace(/[^a-zA-Z0-9_-]/g,''),fade='trail'+id,shade='basis'+id;
 const status=stale?messages.stale:messages.loadingChart;
 const label=[summary,mark==null?status:reading,...targetTexts.values()].join('. ');
 const burst=degen&&!reducedMotion?frame.burst:undefined;
 const shake=burst&&now-burst.start<tokens.motion.base?Math.sin((now-burst.start)/18)*3*(1-(now-burst.start)/tokens.motion.base):0;
 return <View {...view}><Text>{summary}</Text>
  <View accessible accessibilityLabel={label} accessibilityRole="image" onLayout={e=>setWidth(e.nativeEvent.layout.width)}
   style={{height,direction:'ltr',overflow:'hidden',borderRadius:tokens.radius.xl,backgroundColor:colors.background}}>
   {width>0&&<>
    <Reanimated.View pointerEvents="none" style={[styles.layer,gridMotion]}>
     <Svg width={width+ALTIMETER_FLOW_PX} height={height} accessible={false}><Path d={grid} stroke={colors.nested} fill="none"/></Svg>
    </Reanimated.View>
    {ladder.length>0&&<Svg width={width} height={height} style={styles.layer} accessible={false}>
     <G translateY={ladderShift}>{android
      ?<LadderInk rows={ladder} hidden={hidden} ticks={ladderTicks} width={width} color={colors.muted} font={monoFontFamily}/>
      :ladder.map(row=>{
       const y=row.y+ladderShift,covered=bounds.some(level=>level.labelTop!=null&&y+7>level.labelTop-2&&y-7<level.labelTop+20);
       return <G key={row.price}><Path d={row.ticks} strokeOpacity={.75} stroke={colors.muted}/>{!covered&&<SvgText x={width-32} y={row.y+4} textAnchor="end" fontFamily={monoFontFamily} fontSize={13} fillOpacity={.75} fill={colors.muted}>{row.label}</SvgText>}</G>;
      })}</G>
    </Svg>}
    {history&&end+2>18&&<View pointerEvents="none" style={{position:'absolute',top:0,left:18,width:end+2-18,height,overflow:'hidden'}}>
     <Reanimated.View style={[styles.layer,{left:-18},trailMotion]}>
      <Svg width={width} height={height} accessible={false}>
       <Defs>
        <LinearGradient id={fade} gradientUnits="userSpaceOnUse" x1={18-scroll} x2={tipX} y1={0} y2={0}><Stop offset={0} stopColor={lineColor} stopOpacity={0}/><Stop offset={1} stopColor={lineColor}/></LinearGradient>
        {validPrice(display)&&validPrice(basis)&&basisY!==center&&<LinearGradient id={shade} gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={tipY} y2={Math.min(height,Math.max(0,basisY))-shift}><Stop offset={0} stopColor={lineColor} stopOpacity={.5}/><Stop offset={1} stopColor={lineColor} stopOpacity={0}/></LinearGradient>}
       </Defs>
       <G translateX={scroll} translateY={shift}>
        {validPrice(basis)&&basisY!==center&&(android?<G fill={`url(#${shade})`}>
         <Path d={`${history.commands}V${basisY-shift}H${history.first}Z`}/>
         <Path d={`${tail}h${projection}V${basisY-shift}H${history.last[0]}Z`}/>
        </G>:<Path d={`${trail}h${projection}V${basisY-shift}H${history.first}Z`} fill={`url(#${shade})`}/>)}
        {android&&<Path d={history.commands} stroke={`url(#${fade})`} strokeWidth={2.5} fill="none"/>}
        <Path d={`${android?tail:trail}h${projection}`} stroke={`url(#${fade})`} strokeWidth={2.5} fill="none"/>
       </G>
      </Svg>
     </Reanimated.View>
    </View>}
    <Svg width={width} height={height} style={styles.layer} accessible={false}>
    {levels.map(l=>{const pos=frame.levels.get(l.id);if(!pos)return null;const color=l.color??colors.action;
     return <G key={l.id}>{!pos.pinned&&<Line x1={0} x2={width} y1={pos.y} y2={pos.y} stroke={color} strokeDasharray="3 4"/>}
      {/* A thin outline in the chart's background colour lifts the label off the grid and the trail: a stroked copy drawn behind the fill, as web paints its stroke under the text. */}
      {l.label&&pos.labelTop!=null&&<><SvgText x={width-8} y={pos.labelTop+14} textAnchor="end" fontSize={13} fill={colors.background} stroke={colors.background} strokeWidth={2} strokeLinejoin="round">{targetTexts.get(l.id)}</SvgText><SvgText x={width-8} y={pos.labelTop+14} textAnchor="end" fontSize={13} fill={color}>{targetTexts.get(l.id)}</SvgText></>}</G>;
    })}
    {mark==null?<SvgText x={width/2} y={center} textAnchor="middle" fill={colors.muted}>{status}</SvgText>:
     <G translateX={shake}><Rect x={end} y={center-18} width={pillWidth} height={36} rx={18} fill={colors.background} stroke={pillColor}/></G>}
    {burst&&<BurstEffect burst={{...burst,color:burst.color??colors.action}} now={now} x={end+pillWidth/2} y={center} width={pillWidth}/>}
   </Svg>
   {/* The figure sits over the pill drawn above, as native text so its digits can roll. */}
   {mark!=null&&<View pointerEvents="none" style={{position:'absolute',left:end,top:center-18,width:pillWidth,height:36,alignItems:'center',justifyContent:'center',transform:[{translateX:shake}]}}>
    <NumberFlow value={value} options={pillOptions} tone={pillTone} maxFontSizeMultiplier={1} style={{fontFamily:monoFontFamily,fontSize:16,fontWeight:'600'}}/>
   </View>}</>}
  </View>
 </View>;
}

const styles=StyleSheet.create({layer:{position:'absolute',left:0,top:0}});
