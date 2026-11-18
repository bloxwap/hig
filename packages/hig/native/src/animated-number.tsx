import React,{memo,useEffect,useLayoutEffect,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import {Dimensions,PixelRatio,StyleSheet,View,type LayoutChangeEvent,type TextLayoutEvent,type StyleProp,type TextStyle} from 'react-native';
import {scheduleOnUI} from 'react-native-worklets';
import Reanimated,{cancelAnimation,defineAnimation,Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming,type SharedValue} from 'react-native-reanimated';
import {forEachNumberFlowTurn,numberFlowDigitLength,numberFlowEasingSamples,resolveNumberFlowTimings,type NumberFlowDigits,type NumberFlowTiming} from '@bloxwap/hig/contracts/number-flow';
import * as en from '@bloxwap/hig/contracts/messages';
import {presentNumberFormat} from '@bloxwap/hig/contracts/environment';
import {tokens} from '@bloxwap/hig/tokens';
import {type NumberProps} from './data.js';
import {createFormattedReelModel,createNumberFlowRoll,createNumberReelModel,formatNumberReadout,numberFlowReelOffset,numberReelPlace,numberReelPlaces,numberTrendDirection,safeNumberLayout,sampleReelEasing,type NumberTrend} from './animated-number-model.js';
import {useColors,useReadoutFormat,useReducedMotion,useTextEnvironment} from './provider.js';
import {detectScript,Text,type TextScript} from './surface.js';

export type AnimatedNumberTrend=NumberTrend;
export type {NumberFlowDigits,NumberFlowEasing,NumberFlowTiming} from '@bloxwap/hig/contracts/number-flow';
export interface AnimatedNumberProps extends NumberProps {
 /** How long a change takes, in milliseconds. Sliding: 180 by default, at most 500. Flowing: sets the roll (500 by default) and fades take half of it; the timings below override it. Zero or less draws the new value at once. */
 duration?:number;
 /** Which way digits move: `1` up, `-1` down, `0` each digit its own way, or a function of the old and new value. Defaults to the direction the value moved. */
 trend?:AnimatedNumberTrend;
 /**
  * How a change is drawn. `'flow'` is NumberFlow's motion: every changed digit rolls through the digits between its old and new
  * value on NumberFlow's curve, a place the figure gains rolls up from zero as it fades in, and a new value joins the roll in
  * flight. `'slide'` is the short settle: the reel eases straight to the new digit and a newer value retargets it.
  * `NumberFlow` flows by default. A reading native cannot lay out place by
  * place (right-to-left, unmeasured glyphs) is drawn static either way.
  */
 motion?:'flow'|'slide';
 /** `false` draws every new value at once, with no motion, as reduced motion does. Use it for typed echoes and until first data arrives. Default `true`. */
 animated?:boolean;
 /** Flowing only: the roll of a changed digit. Defaults to `transformTiming`. */
 spinTiming?:NumberFlowTiming;
 /** Flowing only: the roll unless `spinTiming` is set. On web it also times the sideways slide when the figure changes width; native changes width at once. Default 500 ms on NumberFlow's curve. */
 transformTiming?:NumberFlowTiming;
 /** Flowing only: the fade of a place that arrives. Default 250 ms ease-out. */
 opacityTiming?:NumberFlowTiming;
 /** Flowing only: a limit for an integer place, keyed by place (0 is the ones). `{1:{max:5}}` makes the tens of a seconds counter wrap from 5 to 0. */
 digits?:NumberFlowDigits;
 /** Flowing only, with a trend: every place below the highest one that changed turns once all the way round even when its digit is the same, so the figure reads as counting through the values between. */
 continuous?:boolean;
 /** Accepted so one call site serves both platforms. Web keeps the moving parts on their own layers; native reels already are. */
 willChange?:boolean;
 /** With `formattedValue`, moves the host's text place by place: each digit it contains rolls in place, counted from the end, and the rest stays as written. Without it `formattedValue` is drawn static, as before. */
 animateFormatted?:boolean}
const numberTypographyKeys=new Set(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign','textDecorationLine','textDecorationColor','textDecorationStyle']);
// Android Fabric reads colour 0 as "unset", so 'transparent' (0x00000000) drew the hidden reading in the default
// black under the reels. Clear white is non-zero there and still invisible.
const hiddenColor='#ffffff00';
// While the reels draw, the reading stays for assistive technology and tests but leaves the flow, so the readout is sized by
// what it draws. It sits on the side the figure is aligned to; in a row it is measured at its own width and never wraps.
const hiddenReading={left:{color:hiddenColor,position:'absolute',top:0,left:0},right:{color:hiddenColor,position:'absolute',top:0,right:0},center:{color:hiddenColor,position:'absolute',top:0,left:0,right:0}} as const;
// The reel row is the readout's in-flow content: it keeps its content width (no shrink) and the readout takes that width.
const reelRowStyle={flexDirection:'row',alignItems:'center',flexShrink:0,direction:'ltr'} as const;
const clampedDuration=(duration:number)=>Number.isFinite(duration)&&duration>0?Math.min(duration,500):0;

const sameGlyphs=(first:readonly string[],second:readonly string[])=>first===second||(first.length===second.length&&first.every((glyph,index)=>glyph===second[index]));
function reelColumnText(glyphs:readonly string[],rows:number){
 return Array.from({length:rows},(_,index)=>glyphs[index%10]).join('\n');
}
interface DigitReelProps {column:boolean;digits:readonly string[];digit:number;trend:-1|0|1;duration:number;reducedMotion:boolean;width:number;height:number;style:StyleProp<TextStyle>;styleKey:string;script:TextScript;maxFontSizeMultiplier?:number}
const slideCurve=tokens.easing.standard;
function retargetSlide(position:SharedValue<number>,digit:number,trend:-1|0|1,duration:number){
 'worklet';
 cancelAnimation(position);
 if(duration===0){position.value=digit;return;}
 const current=position.value;
 if(!Number.isFinite(current)){position.value=digit;return;}
 const cycle=trend<0?10:0;
 const normalized=current>=cycle&&current<cycle+10?current:((current%10)+10)%10+cycle;
 if(normalized!==current)position.value=normalized;
 let destination=trend<0?digit+10:digit;
 if(trend>0)while(destination<=normalized)destination+=10;
 else if(trend<0)while(destination>=normalized)destination-=10;
 if(destination===normalized){position.value=digit;return;}
 position.value=withTiming(destination,{duration,easing:Easing.bezier(...slideCurve),reduceMotion:ReduceMotion.Never});
}
let animatedReelText:React.ComponentType<React.ComponentProps<typeof Text>>|undefined;
function getAnimatedReelText(){return animatedReelText??=Reanimated.createAnimatedComponent(Text);}
/** The rolling column starts on the last stationary digit, including on its first turn. */
function SlideStrip({column,digits,digit,trend,duration,reducedMotion,width,height,style,styleKey,script,maxFontSizeMultiplier,from}:DigitReelProps&{from:number}){
 const position=useSharedValue(from),previousDigit=useRef(from);
 const animatedStyle=useAnimatedStyle(()=>{'worklet';return {transform:[{translateY:-position.value*height}]};},[height]);
 useEffect(()=>{
  const motionDuration=reducedMotion?0:clampedDuration(duration);
  if(previousDigit.current===digit&&motionDuration>0)return;
  previousDigit.current=digit;
  scheduleOnUI(retargetSlide,position,digit,trend,motionDuration);
 },[digit,trend,duration,reducedMotion,position]);
 useEffect(()=>()=>cancelAnimation(position),[position]);
 // The rows only change with the face, so they are the same elements while the reel turns: a new digit moves the column and draws no text again.
 const rows=useMemo(()=>{
  if(column){
   const AnimatedReelText=getAnimatedReelText();
   return <AnimatedReelText accessible={false} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier}
    style={[style,{width,height:height*20,textAlign:'center'},animatedStyle]}>{reelColumnText(digits,20)}</AnimatedReelText>;
  }
  return Array.from({length:20},(_,index)=><Text accessible={false} key={index} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style,{width,height,textAlign:'center'}]}>{digits[index%10]}</Text>);
 },[column,digits,width,height,styleKey,script,maxFontSizeMultiplier,column?animatedStyle:null]);
 return column?rows:<Reanimated.View style={animatedStyle}>{rows}</Reanimated.View>;
}

/** At rest a place needs one glyph. Allocate its twenty-row column and UI-thread position on its first animated change. */
const DigitReel=memo(function DigitReel(props:DigitReelProps){
 const {digit,digits,width,height,style,script,maxFontSizeMultiplier}=props;
 const [rest,setRest]=useState({digit,turning:false});
 if(!rest.turning&&rest.digit!==digit){
  const turning=!props.reducedMotion&&clampedDuration(props.duration)>0;
  setRest({digit:turning?rest.digit:digit,turning});
  return null; // React repeats this render before committing the place.
 }
 return <View collapsable={false} style={{width,height,overflow:'hidden'}}>
  {rest.turning?<SlideStrip {...props} from={rest.digit}/>:<Text accessible={false} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style,{width,height,textAlign:'center'}]}>{digits[digit]}</Text>}
 </View>;
},(previous,next)=>previous.column===next.column&&previous.digit===next.digit&&previous.duration===next.duration&&previous.reducedMotion===next.reducedMotion&&sameGlyphs(previous.digits,next.digits)&&previous.width===next.width&&previous.height===next.height&&previous.styleKey===next.styleKey&&previous.script===next.script&&previous.maxFontSizeMultiplier===next.maxFontSizeMultiplier);

interface FlowStripProps {column:boolean;glyphs:readonly string[];length:number;from:number;digit:number;delta:number;step:number;duration:number;samples:readonly number[];fade:number;fadeSamples:readonly number[];width:number;height:number;style:StyleProp<TextStyle>;styleKey:string;script:TextScript;maxFontSizeMultiplier?:number}
function EnteringFlowStrip(props:FlowStripProps){
 const {fade,fadeSamples}=props;
 const opacity=useSharedValue(fade>0?0:1);
 useEffect(()=>{
  if(fade>0)opacity.value=withTiming(1,{duration:fade,easing:(progress:number)=>{'worklet';return sampleReelEasing(fadeSamples,progress);},reduceMotion:ReduceMotion.Never});
  // Motion was turned off while the place was still arriving: it is simply there.
  else{cancelAnimation(opacity);opacity.value=1;}
 },[fade,fadeSamples,opacity]);
 useEffect(()=>()=>cancelAnimation(opacity),[opacity]);
 return <FlowStrip {...props} opacity={opacity}/>;
}
/**
 * The moving part of a flowing place: `length + 1` glyphs in a column, translated on the UI thread. It mounts on the place's
 * first turn, already showing the digit it replaces, and stays for the turns after it. Its position counts glyphs on a reel of
 * `length`, so a turn on a reel of another length (a limited place given a digit past its limit, or back) starts from the
 * digit it replaces rather than from a position counted on the old reel.
 */
function FlowStrip({column,glyphs,length,from,digit,delta,step,opacity,duration,samples,width,height,style,styleKey,script,maxFontSizeMultiplier}:FlowStripProps&{opacity?:SharedValue<number>}){
 const position=useSharedValue(from),applied=useRef<{step:number;digit:number;length:number}|null>(null);
 const animatedStyle=useAnimatedStyle(()=>{'worklet';return {opacity:opacity?.value??1,transform:[{translateY:numberFlowReelOffset(position.value,length,height)}]};},[length,height,opacity]);
 useEffect(()=>{
  const last=applied.current;applied.current={step,digit,length};
  if(!last||last.step!==step){
   if(duration>0&&delta){
    // A reel of another length: what is in flight was counted on the old one, so this turn starts from the digit it replaces.
    if(last&&last.length!==length){cancelAnimation(position);position.value=digit-delta;}
    // A new turn joins whatever is still in flight; the roll works out where it ends from where the reel was going.
    position.value=defineAnimation(digit,()=>{'worklet';return createNumberFlowRoll(delta,duration,samples);}) as unknown as number;
   }else{cancelAnimation(position);position.value=digit;}
   return;
  }
  // Motion was turned off, the digit changed without a turn or the reel changed length: land on the digit, cutting short whatever was in flight.
  if(last.digit!==digit||last.length!==length||duration<=0){cancelAnimation(position);position.value=digit;}
 },[step,digit,delta,length,duration,samples,position]);
 // Forgetting the applied turn lets an effect that runs again after this cleanup (React's development double mount) start it again rather than leave the reel where the cancel stopped it.
 useEffect(()=>()=>{cancelAnimation(position);applied.current=null;},[position]);
 // The rows only change with the reel and the face, so they are the same elements from one turn to the next: a turn moves the strip and draws no text again.
 const rows=useMemo(()=>{
  if(column&&length===10){
   const AnimatedReelText=getAnimatedReelText();
   return <AnimatedReelText accessible={false} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier}
   style={[style,{width,height:height*11,textAlign:'center'},animatedStyle]}>{reelColumnText(glyphs,11)}</AnimatedReelText>;
  }
  return Array.from({length:length+1},(_,index)=><Text accessible={false} key={index} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style,{width,height,textAlign:'center'}]}>{glyphs[index%length]}</Text>);
 },[column,glyphs,length,width,height,styleKey,script,maxFontSizeMultiplier,column&&length===10?animatedStyle:null]);
 return column&&length===10?rows:<Reanimated.View style={animatedStyle}>{rows}</Reanimated.View>;
}
type FlowDigitProps=Omit<FlowStripProps,'from'>;
/**
 * One place of a flowing figure. At rest it is a single glyph in a box the size of the widest digit; the strip that rolls
 * mounts the first time the place turns, so a screen of figures that never change mounts one text per digit. A place that
 * joins a figure already on screen arrives turning, from zero.
 */
const FlowDigit=memo(function FlowDigit(props:FlowDigitProps){
 const {glyphs,digit,delta,step,width,height,style,script,maxFontSizeMultiplier}=props;
 // Where the strip starts from. Set during render, so the strip mounts in the commit that first turns the place.
 const [strip,setStrip]=useState<{from:number;enter:boolean}|null>(()=>step>0&&delta!==0?{from:digit-delta,enter:props.fade>0}:null);
 if(!strip&&step>0&&delta!==0){setStrip({from:digit-delta,enter:false});return null;}
 const Strip=strip?.enter?EnteringFlowStrip:FlowStrip;
 return <View collapsable={false} style={{width,height,overflow:'hidden'}}>{strip?<Strip {...props} from={strip.from}/>:<Text accessible={false} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style,{width,height,textAlign:'center'}]}>{glyphs[digit]}</Text>}</View>;
},(previous,next)=>previous.column===next.column&&previous.digit===next.digit&&previous.step===next.step&&previous.delta===next.delta&&previous.length===next.length&&sameGlyphs(previous.glyphs,next.glyphs)&&previous.width===next.width&&previous.height===next.height&&previous.duration===next.duration&&previous.samples===next.samples&&previous.fade===next.fade&&previous.fadeSamples===next.fadeSamples&&previous.styleKey===next.styleKey&&previous.script===next.script&&previous.maxFontSizeMultiplier===next.maxFontSizeMultiplier);
interface StillPartProps {text:string;style:StyleProp<TextStyle>;styleKey:string;script:TextScript;maxFontSizeMultiplier?:number}
/** A part of the figure that does not turn: a sign, a separator, an affix. Drawn again only when its text or its face changes. */
const StillPart=memo(function StillPart({text,style,script,maxFontSizeMultiplier}:StillPartProps){return <Text accessible={false} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={style}>{text}</Text>;},(previous,next)=>previous.text===next.text&&previous.styleKey===next.styleKey&&previous.script===next.script&&previous.maxFontSizeMultiplier===next.maxFontSizeMultiplier);
/** A place's turn: `step` counts the turns it has taken, `delta` is how far the latest one goes, and `length` is the reel it goes round (long enough for the digit it leaves and the one it reaches). */
interface FlowTurn {step:number;delta:number;length:number}
/** What a flowing figure last drew, how it was measured (`key`) and formatted (`signature`), and each place's turn. */
interface FlowStep {key:string;signature:string;canonical:string;places:ReturnType<typeof numberReelPlaces>;turns:ReadonlyMap<string,FlowTurn>}
const noTurns:ReadonlyMap<string,FlowTurn>=new Map();

interface GlyphMetrics {key:string;width:number;height:number;column:boolean}
interface GlyphProbe {key:string;record:(index:number,event:LayoutChangeEvent)=>void;lines:(index:number,event:TextLayoutEvent,width?:number)=>void}
interface GlyphReader {startMeasuring:()=>void;receive:(metrics:GlyphMetrics)=>void}
interface GlyphGroup {
 metrics:GlyphMetrics|null;
 // Insertion order picks a single mounted readout to watch the native font's actual layout.
 readers:Set<GlyphReader>;
}
const glyphGroups=new Map<string,GlyphGroup>();
const fontScaleReaders=new Set<()=>void>();
let fontScaleSubscription:ReturnType<typeof Dimensions.addEventListener>|undefined;
function subscribeFontScale(notify:()=>void){
 fontScaleReaders.add(notify);
 if(!fontScaleSubscription){
  let scale=currentFontScale();
  fontScaleSubscription=Dimensions.addEventListener('change',()=>{
   const next=currentFontScale();
   if(Object.is(next,scale))return;
   scale=next;
   for(const reader of fontScaleReaders)reader();
  });
 }
 return ()=>{
  fontScaleReaders.delete(notify);
  if(!fontScaleReaders.size){fontScaleSubscription?.remove();fontScaleSubscription=undefined;}
 };
}
const skipFontScale=()=>()=>{};
const unmeasuredFontScale=()=>0;
function currentFontScale(){
 try{return PixelRatio.getFontScale();}catch{return 0;}
}
function useGlyphMetrics(key:string|null,columnRows:number){
 const [metrics,setMetrics]=useState<GlyphMetrics|null>(null);
 const [probe,setProbe]=useState<GlyphProbe|null>(null);
 useLayoutEffect(()=>{
  if(key===null){setProbe(null);return;}
  const group:GlyphGroup=glyphGroups.get(key)??{metrics:null,readers:new Set()};
  glyphGroups.set(key,group);
  const startMeasuring=()=>{
   const sizes=new Map<number,{width:number;height:number}>();
   const baselines=new Map<number,number>();
   let columnWidth:number|undefined;
   let columnLines:TextLayoutEvent['nativeEvent']['lines']=[];
   const publish=()=>{
    if(group.readers.values().next().value!==reader||sizes.size!==10)return;
    let widest=0,tallest=0;
    for(const size of sizes.values()){widest=Math.max(widest,size.width);tallest=Math.max(tallest,size.height);}
    // A multiline paragraph can space fallback fonts differently from isolated glyphs.
    // Use one text node only when every baseline, including the closing zero, agrees.
    const column=columnWidth===widest&&columnLines.length===columnRows&&columnLines.every((line,index)=>{
     const baseline=baselines.get(index%10);
     return baseline!==undefined&&Math.abs(line.y+line.ascender-index*tallest-baseline)<0.01;
    });
    if(group.metrics?.width===widest&&group.metrics.height===tallest&&group.metrics.column===column)return;
    group.metrics={key,width:widest,height:tallest,column};
    for(const subscriber of group.readers)subscriber.receive(group.metrics);
   };
   setProbe({key,record(index,event){
    const {width,height}=event.nativeEvent.layout;
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
    sizes.set(index,{width,height});publish();
   },lines(index,event,width){
    const lines=event.nativeEvent.lines;
    if(index===10){columnWidth=width;columnLines=lines;}
    else if(lines.length===1)baselines.set(index,lines[0].y+lines[0].ascender);
    else baselines.delete(index);
    publish();
   }});
  };
  const reader:GlyphReader={startMeasuring,receive:setMetrics};
  group.readers.add(reader);
  if(group.metrics)setMetrics(group.metrics);
  if(group.readers.size===1)startMeasuring();else setProbe(null);
  return ()=>{
   const wasMeasuring=group.readers.values().next().value===reader;
   group.readers.delete(reader);
   if(!group.readers.size)glyphGroups.delete(key);
   else if(wasMeasuring)group.readers.values().next().value?.startMeasuring();
  };
 },[key,columnRows]);
 return {metrics:metrics?.key===key?metrics:null,probe:probe?.key===key?probe:null};
}

/** A localized number that rolls through changes and honors reduced motion. */
export function NumberFlow(props:NumberFlowProps){
 // A parent render can observe a new system font scale before the dimensions notification arrives.
 return <MemoNumberReadout {...props} requestedOptionsKey={JSON.stringify(props.options)} renderFontScale={currentFontScale()}/>;
}
export type NumberFlowProps=AnimatedNumberProps;
/** On web, moves the flowing figures inside it together when one changes width. Native figures change width at once, so this draws its children and nothing else; it exists so one tree serves both platforms. */
export function NumberFlowGroup({children}:{children?:React.ReactNode}){return <>{children}</>;}
const MemoNumberReadout=memo(function NativeNumberReadout({requestedOptionsKey,renderFontScale,value,options:requested,formattedValue,animateFormatted,stale,label,tone='text',style,testID,maxFontSizeMultiplier,trend,prefix,suffix,duration:requestedDuration,motion='flow',animated=true,spinTiming,transformTiming,opacityTiming,digits,continuous=false}:AnimatedNumberProps&{requestedOptionsKey?:string;renderFontScale:number}){
 const duration=requestedDuration??180,flow=motion==='flow';
 const {locale,staleLabel,numberFormat}=useReadoutFormat(requested?.style==='currency');
 const {direction,fontFamily,fontFamilies,fontFamiliesByScript,letterSpacingByScript,maxFontSizeMultiplier:providerMaxFontSizeMultiplier}=useTextEnvironment();
 const colors=useColors(),reducedMotion=useReducedMotion()||!animated;const options=presentNumberFormat(requested,numberFormat),optionsKey=options===requested?(requestedOptionsKey??''):JSON.stringify(options);
 // The reading and its reels depend on the value and the format alone. A readout draws more often than its value changes (its
 // parent draws, the digits are measured, a turn is worked out), and none of those renders formats anything again.
 const {reading,formatter}=useMemo(()=>({reading:formatNumberReadout(value,locale,options,formattedValue,prefix,suffix),formatter:globalThis.Intl?.NumberFormat}),[value,locale,optionsKey,formattedValue,prefix,suffix]),staleSuffix=stale?` ${staleLabel??en.stale}`:'';
 const previousValue=useRef(value);
 useEffect(()=>{previousValue.current=value;},[value]);
 const typography=useMemo(()=>{
  const result=Object.fromEntries(Object.entries(StyleSheet.flatten(style)??{}).filter(([key])=>numberTypographyKeys.has(key))) as TextStyle;
  if(result.fontSize!==undefined && result.lineHeight===undefined)result.lineHeight=undefined;
  return result;
 },[style]);
 const color=colors[tone==='positive'||tone==='negative'||tone==='warning'||tone==='muted'||tone==='faint'||tone==='up'||tone==='down'||tone==='action'?tone:'text'];
 const textStyle=useMemo<StyleProp<TextStyle>>(()=>[typography,{color,fontVariant:['tabular-nums']}],[typography,color]);
 const script=detectScript(`${reading.text}${staleSuffix}`,locale);
 const safeAffixes=useMemo(()=>safeNumberLayout(`${prefix??''}${suffix??''}${staleSuffix}`,direction),[prefix,suffix,staleSuffix,direction]);
 const own=reading.known&&!!formattedValue;
 const safeModel=useMemo(()=>{
  if(!safeAffixes)return null;
  if(own)return animateFormatted&&typeof Intl!=='undefined'?createFormattedReelModel(reading.core,locale,direction):null;
  return createNumberReelModel(value,locale,options,formattedValue,direction,animateFormatted,reading.core);
 },[safeAffixes,own,reading.known,locale,optionsKey,formattedValue,direction,animateFormatted,reading.core,formatter]);
 const getFontScale=safeModel?currentFontScale:unmeasuredFontScale;
 const fontScale=useSyncExternalStore(safeModel?subscribeFontScale:skipFontScale,getFontScale,()=>safeModel?renderFontScale:0);
 const glyphs=safeModel?.digits;
 const measurementKey=useMemo(()=>glyphs?JSON.stringify([flow,glyphs,typography,fontScale,maxFontSizeMultiplier,providerMaxFontSizeMultiplier,script,fontFamily,fontFamilies,fontFamiliesByScript,letterSpacingByScript]):'',[flow,glyphs,typography,fontScale,maxFontSizeMultiplier,providerMaxFontSizeMultiplier,script,fontFamily,fontFamilies,fontFamiliesByScript,letterSpacingByScript]);
 const columnRows=flow?11:20;
 const {metrics:activeMetrics,probe}=useGlyphMetrics(safeModel&&fontScale>0&&Number.isFinite(fontScale)?measurementKey:null,columnRows);
 const activeModel=activeMetrics?safeModel:null;
 // Raw ticks advance previousValue, but only a visible change needs a direction.
 const directionTrend=useMemo(()=>activeModel?numberTrendDirection(trend,previousValue.current,value):0,[activeModel,trend]);
 const align=typography.textAlign==='right'?'right':typography.textAlign==='center'?'center':'left';
 const justifyContent=align==='right'?'flex-end':align==='center'?'center':'flex-start';
 const visualProps={accessible:false,script,maxFontSizeMultiplier};
 // Flowing: the turn of every place for this change, worked out in the render that first draws the new reading so the places
 // that turn get their strip in the same commit. Only a committed render advances the previous reading.
 const flowMotion=useMemo(()=>{
  if(!flow)return null;
  const timings=resolveNumberFlowTimings({duration:requestedDuration,spinTiming,transformTiming,opacityTiming});
  return {timings,spinSamples:numberFlowEasingSamples(timings.spin.easing),fadeSamples:numberFlowEasingSamples(timings.opacity.easing)};
 },[flow,requestedDuration,spinTiming,transformTiming,opacityTiming]);
 const previousStep=useRef<FlowStep|null>(null);
 const flowStep=previousStep.current;let nextStep=flowStep;
 if(flowMotion&&activeModel){
  // A new locale or format is a different reading rather than a new value, as on web: it is drawn at once and the next value rolls from it.
  const signature=`${locale}\u0000${optionsKey}\u0000${formattedValue?1:0}`;
  if(!flowStep||flowStep.key!==measurementKey||flowStep.signature!==signature)nextStep={key:measurementKey,signature,canonical:activeModel.canonical,places:numberReelPlaces(activeModel),turns:noTurns};
  else if(flowStep.canonical!==activeModel.canonical){
   const places=numberReelPlaces(activeModel),next=new Map<string,FlowTurn>();
   const keepTurn=(place:typeof places[number],_from:number,delta:number,length:number)=>{
    const old=flowStep.turns.get(place.key);
    if(delta)next.set(place.key,{step:(old?.step??0)+1,delta,length});
    else if(old)next.set(place.key,place.digit<old.length?old:{...old,length:numberFlowDigitLength(digits,place.place,place.digit)});
   };
   if(!reducedMotion&&flowMotion.timings.spin.duration>0){
    forEachNumberFlowTurn(flowStep.places,places,{trend:directionTrend,digits,continuous,uniqueKeys:true},keepTurn);
   }else for(const place of places)keepTurn(place,0,0,0);
   nextStep={key:measurementKey,signature,canonical:activeModel.canonical,places,turns:next};
  }
 }else nextStep=null;
 useLayoutEffect(()=>{previousStep.current=nextStep;},[nextStep]);
 const turns=nextStep?.turns??noTurns;
 const styleKey=useMemo(()=>JSON.stringify([typography,color]),[typography,color]);
 // The same digit, turn and display settings can keep the element already reconciled by React.
 const drawFlowParts=useMemo(()=>{
  if(!activeMetrics||!flowMotion)return null;
  const glyphs=activeModel?.digits;
  if(!glyphs)return null;
  type Cached={digit:number;length:number;turn:FlowTurn|undefined;element:React.ReactElement};
  let previous=new Map<string,Cached>();
  return (model:NonNullable<typeof activeModel>,updates:ReadonlyMap<string,FlowTurn>)=>{
   const next=new Map<string,Cached>();
   const elements=model.tokens.map(token=>{
    if(token.kind==='static')return <StillPart key={token.key} text={token.value} style={textStyle} styleKey={styleKey} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier}/>;
    const digit=token.digit??0,turn=updates.get(token.key);
    const length=turn?.length??numberFlowDigitLength(digits,numberReelPlace(token),digit);
    let cached=previous.get(token.key);
    if(!cached||cached.digit!==digit||cached.turn!==turn||cached.length!==length){
     const element=<FlowDigit key={token.key} column={activeMetrics.column} glyphs={glyphs} length={length} digit={digit}
      delta={turn?.delta??0} step={turn?.step??0} duration={reducedMotion?0:flowMotion.timings.spin.duration} samples={flowMotion.spinSamples}
      fade={reducedMotion?0:flowMotion.timings.opacity.duration} fadeSamples={flowMotion.fadeSamples} width={activeMetrics.width} height={activeMetrics.height}
      style={textStyle} styleKey={styleKey} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier}/>;
     cached={digit,length,turn,element};
    }
    next.set(token.key,cached);return cached.element;
   });
   previous=next;return elements;
  };
 },[activeMetrics,flowMotion?.timings.spin.duration,flowMotion?.timings.opacity.duration,flowMotion?.spinSamples,flowMotion?.fadeSamples,activeModel?.digits,digits,reducedMotion,textStyle,styleKey,script,maxFontSizeMultiplier]);
 // The ten digits, measured for a face and size: drawn again when what is measured changes, not with every value.
 const probes=useMemo(()=>probe&&safeModel?<View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' pointerEvents='none' style={{position:'absolute',opacity:0,flexDirection:'row'}}>{safeModel.digits.map((glyph,index)=><Text {...visualProps} key={`${measurementKey}:${index}`} onTextLayout={event=>probe.lines(index,event)} onLayout={event=>probe.record(index,event)} style={textStyle}>{glyph}</Text>)}{activeMetrics&&<Text {...visualProps} onTextLayout={event=>probe.lines(10,event,activeMetrics.width)} style={[textStyle,{position:'absolute',top:0,left:0,width:activeMetrics.width,textAlign:'center'}]}>{reelColumnText(safeModel.digits,columnRows)}</Text>}</View>:null,[probe,measurementKey,color,activeMetrics?.width,columnRows]);
 const readingStyle=activeModel?hiddenReading[align]:undefined;
 const accessibleReading=useMemo(()=><Text accessibilityLabel={label?`${label}: ${reading.text}${staleSuffix}`:undefined} testID={testID} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[textStyle,readingStyle]}>{reading.text}{staleSuffix}</Text>,[label,reading.text,staleSuffix,testID,maxFontSizeMultiplier,textStyle,readingStyle]);
 // The reels are drawn in the readout's flow, so the readout is exactly as wide as the row it draws: the composed sign, every
 // static part read from the text, each reel at the widest digit's advance and the affixes, each its own text, measured by
 // the layout pass that draws it. The reading they replace leaves the flow (it stays, invisible, for assistive technology).
 // Before, the reels were an overlay on the reading, and the readout only grew to the reels after their row reported its
 // width; on the Seeker (Android) the readout kept the reading's width, so `+100.00%` drew past its box into the following
 // ` on margin`. Wherever the parts are wider than the reading (separate texts lose the reading's kerning, a face without
 // tabular digits), the readout is now wider by that much; where they match (iOS), nothing moves. Each reel clips its own
 // column, so nothing bleeds vertically, and no frame clips a glyph.
 return useMemo(()=>{
  const partProps={style:textStyle,styleKey,script,maxFontSizeMultiplier};
  return <View collapsable={false} style={activeModel?{position:'relative',flexDirection:'row',alignItems:'center',justifyContent}:{position:'relative'}}>
   {accessibleReading}
   {probes}
   {activeModel&&activeMetrics&&<View collapsable={false} accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' pointerEvents='none' style={reelRowStyle}>
    {prefix&&<StillPart {...partProps} text={prefix}/>}
    {drawFlowParts?drawFlowParts(activeModel,turns):activeModel.tokens.map(token=>token.kind==='static'?<StillPart {...partProps} key={token.key} text={token.value}/>:<DigitReel column={activeMetrics.column} key={token.key} digits={activeModel.digits} digit={token.digit??0} trend={directionTrend} duration={duration} reducedMotion={reducedMotion} width={activeMetrics.width} height={activeMetrics.height} style={textStyle} styleKey={styleKey} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier}/>)}
    {(suffix||staleSuffix)&&<StillPart {...partProps} text={`${suffix??''}${staleSuffix}`}/>}
   </View>}
  </View>;
 },[drawFlowParts,accessibleReading,probes,activeModel,activeMetrics,justifyContent,prefix,suffix,staleSuffix,flowMotion?.timings.spin.duration,flowMotion?.timings.opacity.duration,flowMotion?.spinSamples,flowMotion?.fadeSamples,turns,digits,duration,directionTrend,reducedMotion,textStyle,styleKey,script,maxFontSizeMultiplier]);
});
