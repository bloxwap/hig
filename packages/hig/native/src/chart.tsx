import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import {AppState,View,type ViewProps} from 'react-native';
import Svg,{Circle,ClipPath,Defs,G,Line,LinearGradient,Path,Rect,Stop,Text as SvgText} from 'react-native-svg';
import {tokens} from '@bloxwap/hig/tokens';
import {ALTIMETER_BURST_COOLDOWN_MS,ALTIMETER_FLOW_PX,ALTIMETER_SAMPLE_MS,ALTIMETER_TICK_PX,
 bitcoinPrice,gridPhase,labelDecimalsFor,ladderPrices,priceTween,smoothTrail,sparkGeometry,
 targetCrossings,targetLayout,tickSpacingFor,trailPoints,validTargets,
 type AltimeterFeed,type AltimeterPosition,type AltimeterTarget,type AltimeterTargetPosition,type TargetLabelInsets,type AltimeterTick} from '@bloxwap/hig/chart/altimeter-core';
import {useColors,useHIG,useMessages,useNumberLocale} from './provider.js';
import {Text} from './surface.js';

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
 /** @deprecated Use degen. */
 dgen?:boolean;
}

const noTargets:readonly AltimeterTarget[]=[];
const validPrice=(p:number|null|undefined):p is number=>p!=null&&Number.isFinite(p)&&p>0;
type Burst={start:number;color?:string;direction:'up'|'down'};
type Frame={now:number;display:number;mark:number|null;spacing:number;anchor:number;ticks:AltimeterTick[];
 levels:Map<string,AltimeterTargetPosition>;burst?:Burst};
const emptyFrame:Frame={now:0,display:NaN,mark:null,spacing:1,anchor:0,ticks:[],levels:new Map()};

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
export function AltimeterChart({summary,paused=false,price,feed=bitcoinPrice,height=320,priceOptions,position,targets=noTargets,targetLabelInsets,dgen,degen=dgen??false,...view}:AltimeterChartProps){
 const colors=useColors(),{reducedMotion,monoFontFamily}=useHIG(),messages=useMessages(),locale=useNumberLocale();
 const [width,setWidth]=useState(0),[frame,setFrame]=useState(emptyFrame),[stale,setStale]=useState(false);
 const [active,setActive]=useState(AppState.currentState==null||AppState.currentState==='active');
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>setActive(state==='active'));return ()=>sub.remove();},[]);
 const levels=useMemo(()=>validTargets(targets),[targets]);
 const controlled=price!==undefined,latest=useRef<number|null>(null);
 const settings=useRef({width,height,reducedMotion,degen,levels,targetLabelInsets});
 useEffect(()=>{settings.current={width,height,reducedMotion,degen,levels,targetLabelInsets};if(controlled)latest.current=validPrice(price)?price:null;},[width,height,reducedMotion,degen,levels,targetLabelInsets,controlled,price]);
 useEffect(()=>{
  if(controlled||!active){setStale(false);return;}
  let alive=true,deadline:ReturnType<typeof setTimeout>;
  const expire=()=>{if(alive){latest.current=null;setStale(true);}};
  const arm=()=>{clearTimeout(deadline);deadline=setTimeout(expire,30_000);};
  latest.current=null;setStale(false);arm();
  const stop=feed(p=>{if(alive&&validPrice(p)){latest.current=p;setStale(false);arm();}},expire);
  return ()=>{alive=false;clearTimeout(deadline);stop();};
 },[controlled,controlled?undefined:feed,active]);
 const hasSize=width>0&&height>0;
 useEffect(()=>{
  if(!active||!hasSize||paused)return;
  let raf=0,last=-Infinity,sampled=-Infinity,lastBurst=-Infinity,previous=NaN,anchor=NaN,spacing=0;
  let ticks:AltimeterTick[]=[],burst:Burst|undefined;
  const tween=priceTween(),layout=targetLayout(),crossings=targetCrossings();
  const step=(now:number)=>{
   raf=requestAnimationFrame(step);
   const {width,height,reducedMotion,levels,degen,targetLabelInsets}=settings.current,mark=latest.current;
   // Bound SVG commits to 30 Hz. Reduced motion needs only the price sample cadence.
   if(now-last<(reducedMotion?ALTIMETER_SAMPLE_MS:1000/30)-1)return;
   const gap=now-last>2000;last=now;
   if(gap||mark==null){ticks=[];sampled=-Infinity;tween.reset();crossings.reset();layout.reset();burst=undefined;}
   const display=mark==null?NaN:tween.update(mark,now,reducedMotion||gap);
   if(mark!=null){
    if(!spacing||Math.abs(display-anchor)>40*spacing){spacing=tickSpacingFor(display);anchor=Math.round(display/spacing)*spacing;}
    if(now-sampled>=ALTIMETER_SAMPLE_MS){
     const keep=width/ALTIMETER_FLOW_PX*1000+2000;
     if(!ticks.length)ticks=[{t:now-keep,p:display}];
     ticks=[...ticks,{t:now,p:display}];
     while(ticks.length>2&&ticks[1].t<now-keep)ticks.shift();
     sampled=now;
    }
    const hit=crossings.update(display,levels).at(-1);
    if(hit&&degen&&!reducedMotion&&now-lastBurst>=ALTIMETER_BURST_COOLDOWN_MS){
     burst={start:now,direction:display>previous?'up':'down',color:hit.color};lastBurst=now;
    }
   }
   if(!degen||reducedMotion||(burst&&now-burst.start>=tokens.motion.base*2))burst=undefined;
   previous=display;
   setFrame({now,mark,display,anchor,spacing,ticks,levels:layout.update(levels,display,spacing,height,now,reducedMotion||gap,targetLabelInsets),burst});
  };
  raf=requestAnimationFrame(step);
  return ()=>cancelAnimationFrame(raf);
 },[active,hasSize,paused,controlled,controlled?undefined:feed]);

 const {now,display,mark,spacing,anchor,ticks}=frame,center=height/2;
 const digits=labelDecimalsFor(spacing,display);
 const optionsKey=JSON.stringify(priceOptions??{});
 const format=useMemo(()=>new Intl.NumberFormat(locale,{style:'currency',currency:'USD',minimumFractionDigits:digits,maximumFractionDigits:digits,...priceOptions}),[locale,digits,optionsKey]);
 const pnlFormat=useMemo(()=>new Intl.NumberFormat(locale,{style:'currency',currency:priceOptions?.currency??'USD',signDisplay:'exceptZero'}),[locale,priceOptions?.currency]);
 const percent=useMemo(()=>new Intl.NumberFormat(locale,{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'}),[locale]);
 const capsule=position?.capsule;
 const value=typeof capsule==='object'?capsule.returnRatio:capsule==='pnl'?position?.pnl:mark;
 const reading=value!=null&&Number.isFinite(value)?(typeof capsule==='object'?percent:capsule==='pnl'?pnlFormat:format).format(value):'—';
 const tone=(n:number)=>!Number.isFinite(n)||n===0?colors.muted:n>0?colors.positive:colors.negative;
 const pillColor=position?tone(position.pnl):colors.action;
 const basis=position?.breakEvenPrice;
 const lineColor=position?tone(mark!=null&&validPrice(basis)?(mark-basis)*(position.side==='short'?-1:1):0):colors.action;
 const pillWidth=Math.min(Math.max(0,width-8),Math.max(110,reading.length*10+20)),end=Math.max(0,width-8-pillWidth);
 const yFor=(p:number)=>center-(p-display)/spacing*ALTIMETER_TICK_PX;
 // Historical SVG commands are stable between heartbeats. Translate that geometry and
 // append only the short live connector as price and time advance.
 const history=useMemo(()=>{
  const sample=ticks.at(-1);if(!sample)return null;
  const points=trailPoints(ticks,sample.t,18,end,p=>center-(p-sample.p)/spacing*ALTIMETER_TICK_PX);
  const last=points.at(-1);if(!last)return null;
  const parts:string[]=[];
  smoothTrail(points,{moveTo:(x,y)=>parts.push(`M${x} ${y}`),lineTo:(x,y)=>parts.push(`L${x} ${y}`),bezierCurveTo:(a,b,c,d,x,y)=>parts.push(`C${a} ${b} ${c} ${d} ${x} ${y}`)});
  return {commands:parts.join(' '),sample,last,first:points[0][0]};
 },[ticks,end,center,spacing]);
 const scroll=history?(history.sample.t-now)*ALTIMETER_FLOW_PX/1000:0;
 const shift=history?(display-history.sample.p)/spacing*ALTIMETER_TICK_PX:0;
 const tipX=end-scroll,tipY=center-shift;
 const dx=history?(tipX-history.last[0])/3:0;
 const trail=history?`${history.commands}C${history.last[0]+dx} ${history.last[1]} ${tipX-dx} ${tipY} ${tipX} ${tipY}`:'';
 const basisY=validPrice(basis)?yFor(basis):center;
 const grid=useMemo(()=>{
  const marks:string[]=[];
  for(let x=25;x<width+54;x+=50)for(let y=25;y<height+3;y+=50)marks.push(`M${x-3} ${y}h6M${x} ${y-3}v6`);
  return marks.join(' ');
 },[width,height]);
 const reach=(center/ALTIMETER_TICK_PX+1)*spacing;
 // Labels and Intl formatting change only when the visible tick range or its format changes.
 const low=Math.floor((display-reach-anchor)/spacing),high=Math.ceil((display+reach-anchor)/spacing);
 const ladder=useMemo(()=>Number.isFinite(low)&&Number.isFinite(high)
  ?ladderPrices(anchor,spacing,anchor+low*spacing,anchor+high*spacing).map(price=>{
    const y=center-(price-anchor)/spacing*ALTIMETER_TICK_PX;
    return {price,y,label:format.format(price),ticks:`M10 ${y}h8M${width-18} ${y}h8`};
   })
  :[],[anchor,spacing,low,high,format,center,width]);
 const targetTexts=useMemo(()=>new Map(levels.map(level=>[level.id,[level.label,format.format(level.price)].filter(Boolean).join(' ')])),[levels,format]);
 const bounds=Array.from(frame.levels.values());
 const ladderShift=validPrice(display)?(display-anchor)/spacing*ALTIMETER_TICK_PX:0;
 const id=useId().replace(/[^a-zA-Z0-9_-]/g,''),fade='trail'+id,shade='basis'+id,clip='trailClip'+id;
 const status=stale?messages.stale:messages.loadingChart;
 const label=[summary,mark==null?status:reading,...targetTexts.values()].join('. ');
 const burst=degen&&!reducedMotion?frame.burst:undefined;
 const shake=burst&&now-burst.start<tokens.motion.base?Math.sin((now-burst.start)/18)*3*(1-(now-burst.start)/tokens.motion.base):0;
 return <View {...view}><Text>{summary}</Text>
  <View accessible accessibilityLabel={label} accessibilityRole="image" onLayout={e=>setWidth(e.nativeEvent.layout.width)}
   style={{height,overflow:'hidden',borderRadius:tokens.radius.xl,backgroundColor:colors.background}}>
   {width>0&&<Svg width={width} height={height} accessible={false}>
    <Defs>
     <ClipPath id={clip}><Path d={`M18 0H${Math.max(18,end+2)}V${height}H18Z`}/></ClipPath>
     <LinearGradient id={fade} gradientUnits="userSpaceOnUse" x1={18-scroll} x2={tipX} y1={0} y2={0}><Stop offset={0} stopColor={lineColor} stopOpacity={0}/><Stop offset={1} stopColor={lineColor}/></LinearGradient>
     {validPrice(display)&&validPrice(basis)&&basisY!==center&&<LinearGradient id={shade} gradientUnits="userSpaceOnUse" x1={0} x2={0} y1={tipY} y2={Math.min(height,Math.max(0,basisY))-shift}><Stop offset={0} stopColor={lineColor} stopOpacity={.5}/><Stop offset={1} stopColor={lineColor} stopOpacity={0}/></LinearGradient>}
    </Defs>
    <Path d={grid} translateX={reducedMotion?0:gridPhase(now)} stroke={colors.nested} fill="none"/>
    <G translateY={ladderShift}>{ladder.map(({price:p,label,y,ticks})=>{
     const screenY=y+ladderShift;
     const covered=bounds.some(l=>l.labelTop!=null&&screenY+7>l.labelTop-2&&screenY-7<l.labelTop+20);
     return <G key={p} opacity={.75}><Path d={ticks} stroke={colors.muted}/>{!covered&&<SvgText x={width-32} y={y+4} textAnchor="end" fontFamily={monoFontFamily} fontSize={13} fill={colors.muted}>{label}</SvgText>}</G>;
    })}</G>
    <G clipPath={`url(#${clip})`}><G translateX={scroll} translateY={shift}>
    {history&&validPrice(basis)&&basisY!==center?<Path d={`${trail}L${tipX} ${basisY-shift}L${history.first} ${basisY-shift}Z`} fill={`url(#${shade})`}/>:null}
    {trail?<Path d={trail} stroke={`url(#${fade})`} strokeWidth={2.5} fill="none"/>:null}
    </G></G>
    {levels.map(l=>{const pos=frame.levels.get(l.id);if(!pos)return null;const color=l.color??colors.action;
     return <G key={l.id}>{!pos.pinned&&<Line x1={0} x2={width} y1={pos.y} y2={pos.y} stroke={color} strokeDasharray="3 4"/>}
      {l.label&&pos.labelTop!=null&&<SvgText x={width-8} y={pos.labelTop+14} textAnchor="end" fontSize={12} fill={color}>{targetTexts.get(l.id)}</SvgText>}</G>;
    })}
    {mark==null?<SvgText x={width/2} y={center} textAnchor="middle" fill={colors.muted}>{status}</SvgText>:
     <G translateX={shake}><Rect x={end} y={center-18} width={pillWidth} height={36} rx={18} fill={colors.background} stroke={pillColor}/><SvgText x={end+pillWidth/2} y={center+5} textAnchor="middle" fontFamily={monoFontFamily} fontSize={16} fontWeight="600" fill={pillColor}>{reading}</SvgText></G>}
    {burst&&<BurstEffect burst={{...burst,color:burst.color??colors.action}} now={now} x={end+pillWidth/2} y={center} width={pillWidth}/>}
   </Svg>}
  </View>
 </View>;
}
