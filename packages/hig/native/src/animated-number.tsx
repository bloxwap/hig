import React,{memo,useEffect,useMemo,useRef,useState} from 'react';
import {PixelRatio,StyleSheet,View,type LayoutChangeEvent,type StyleProp,type TextStyle} from 'react-native';
import Reanimated,{cancelAnimation,defineAnimation,Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {numberFlowDeltas,numberFlowDigitLength,numberFlowEasingSamples,resolveNumberFlowTimings,type NumberFlowDigits,type NumberFlowTiming} from '@bloxwap/hig/contracts/number-flow';
import * as en from '@bloxwap/hig/contracts/messages';
import {presentNumberFormat} from '@bloxwap/hig/contracts';
import {tokens} from '@bloxwap/hig/tokens';
import {type NumberProps} from './data.js';
import {createNumberFlowRoll,createNumberReelModel,formatNumberReadout,numberFlowReelOffset,numberReelPlace,numberReelPlaces,numberTrendDirection,safeNumberLayout,sampleReelEasing,type NumberTrend} from './animated-number-model.js';
import {useColors,useHIG,useNumberLocale} from './provider.js';
import {detectScript,Text,type TextScript} from './surface.js';

export type AnimatedNumberTrend=NumberTrend;
export type {NumberFlowDigits,NumberFlowEasing,NumberFlowTiming} from '@bloxwap/hig/contracts/number-flow';
export interface AnimatedNumberProps extends NumberProps {
 /** How long a change takes, in milliseconds. Sliding: 180 by default, at most 600. Flowing: sets the roll (900 by default) and fades take half of it; the timings below override it. Zero or less draws the new value at once. */
 duration?:number;
 /** Which way digits move: `1` up, `-1` down, `0` each digit its own way, or a function of the old and new value. Defaults to the direction the value moved. */
 trend?:AnimatedNumberTrend;
 /**
  * How a change is drawn. `'flow'` is NumberFlow's motion: every changed digit rolls through the digits between its old and new
  * value on NumberFlow's curve, a place the figure gains rolls up from zero as it fades in, and a new value joins the roll in
  * flight. `'slide'` is the short settle: the reel eases straight to the new digit and a newer value retargets it.
  * `NumberFlow` flows and `AnimatedNumberReadout` slides unless told otherwise. A reading native cannot lay out place by
  * place (right-to-left, unmeasured glyphs) is drawn static either way.
  */
 motion?:'flow'|'slide';
 /** `false` draws every new value at once, with no motion, as reduced motion does. Use it for typed echoes and until first data arrives. Default `true`. */
 animated?:boolean;
 /** Flowing only: the roll of a changed digit. Defaults to `transformTiming`. */
 spinTiming?:NumberFlowTiming;
 /** Flowing only: the roll unless `spinTiming` is set. On web it also times the sideways slide when the figure changes width; native changes width at once. Default 900 ms on NumberFlow's curve. */
 transformTiming?:NumberFlowTiming;
 /** Flowing only: the fade of a place that arrives. Default 450 ms ease-out. */
 opacityTiming?:NumberFlowTiming;
 /** Flowing only: a limit for an integer place, keyed by place (0 is the ones). `{1:{max:5}}` makes the tens of a seconds counter wrap from 5 to 0. */
 digits?:NumberFlowDigits;
 /** Flowing only, with a trend: every place below the highest one that changed turns once all the way round even when its digit is the same, so the figure reads as counting through the values between. */
 continuous?:boolean;
 /** Accepted so one call site serves both platforms. Web keeps the moving parts on their own layers; native reels already are. */
 willChange?:boolean;
 /** With `formattedValue`, moves the host's text place by place: each digit it contains rolls in place, counted from the end, and the rest stays as written. Without it `formattedValue` is drawn static, as before. */
 animateFormatted?:boolean}
const numberTypographyKeys=new Set(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign']);
// Android Fabric reads colour 0 as "unset", so 'transparent' (0x00000000) drew the hidden reading in the default
// black under the reels. Clear white is non-zero there and still invisible.
const hiddenColor='#ffffff00';
// While the reels draw, the reading stays for assistive technology and tests but leaves the flow, so the readout is sized by
// what it draws. It sits on the side the figure is aligned to; in a row it is measured at its own width and never wraps.
const hiddenReading={left:{color:hiddenColor,position:'absolute',top:0,left:0},right:{color:hiddenColor,position:'absolute',top:0,right:0},center:{color:hiddenColor,position:'absolute',top:0,left:0,right:0}} as const;
// The reel row is the readout's in-flow content: it keeps its content width (no shrink) and the readout takes that width.
const reelRowStyle={flexDirection:'row',alignItems:'center',flexShrink:0,direction:'ltr'} as const;
const clampedDuration=(duration:number)=>Number.isFinite(duration)&&duration>0?Math.min(duration,600):0;

const sameGlyphs=(first:readonly string[],second:readonly string[])=>first===second||(first.length===second.length&&first.every((glyph,index)=>glyph===second[index]));
/** `styleKey` is the text style as a string: a readout builds a new style array on every render, and a reel is drawn again only when what it says changes. */
interface DigitReelProps {digits:readonly string[];digit:number;trend:-1|0|1;duration:number;reducedMotion:boolean;width:number;height:number;style:StyleProp<TextStyle>;styleKey:string;script:TextScript;maxFontSizeMultiplier?:number}
/**
 * One place of a sliding figure: twenty glyphs in a column behind a window one glyph high. A readout draws again for every
 * value (and whenever its parent does), and most of its places have the digit they had, so a reel is drawn again only when its
 * digit, its motion or its face changes. The trend alone does not count: it only matters to a digit that changed.
 */
const DigitReel=memo(function DigitReel({digits,digit,trend,duration,reducedMotion,width,height,style,styleKey,script,maxFontSizeMultiplier}:DigitReelProps){
 const position=useSharedValue(digit),previousDigit=useRef(digit);
 const animatedStyle=useAnimatedStyle(()=>{'worklet';return {transform:[{translateY:-position.value*height}]};},[height]);
 useEffect(()=>{
  const motionDuration=clampedDuration(duration);
  if(previousDigit.current===digit){
   if(reducedMotion||!motionDuration){cancelAnimation(position);position.value=digit;}
   return;
  }
  previousDigit.current=digit;cancelAnimation(position);
  if(reducedMotion||!motionDuration){position.value=digit;return;}
  const current=position.value;if(!Number.isFinite(current)){position.value=digit;return;}
  const cycle=trend<0?10:0,normalized=current>=cycle&&current<cycle+10?current:((current%10)+10)%10+cycle;if(normalized!==current)position.value=normalized;
  let destination=trend<0?digit+10:digit;
  if(trend>0)while(destination<=normalized)destination+=10;
  else if(trend<0)while(destination>=normalized)destination-=10;
  if(destination===normalized){position.value=digit;return;}
  position.value=withTiming(destination,{duration:motionDuration,easing:Easing.bezier(...tokens.easing.standard),reduceMotion:ReduceMotion.Never});
 },[digit,trend,duration,reducedMotion,position]);
 useEffect(()=>()=>cancelAnimation(position),[position]);
 // The rows only change with the face, so they are the same elements while the reel turns: a new digit moves the column and draws no text again.
 const rows=useMemo(()=>Array.from({length:20},(_,index)=>{const glyph=digits[index%10];return <Text accessible={false} key={`${index}:${glyph}`} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style,{width,height,textAlign:'center'}]}>{glyph}</Text>;}),[digits,width,height,styleKey,script,maxFontSizeMultiplier]);
 return <View collapsable={false} style={{width,height,overflow:'hidden'}}><Reanimated.View style={animatedStyle}>{rows}</Reanimated.View></View>;
},(previous,next)=>previous.digit===next.digit&&previous.duration===next.duration&&previous.reducedMotion===next.reducedMotion&&sameGlyphs(previous.digits,next.digits)&&previous.width===next.width&&previous.height===next.height&&previous.styleKey===next.styleKey&&previous.script===next.script&&previous.maxFontSizeMultiplier===next.maxFontSizeMultiplier);

interface FlowStripProps {glyphs:readonly string[];length:number;from:number;digit:number;delta:number;step:number;enter:boolean;duration:number;samples:readonly number[];fade:number;fadeSamples:readonly number[];width:number;height:number;style:StyleProp<TextStyle>;styleKey:string;script:TextScript;maxFontSizeMultiplier?:number}
/**
 * The moving part of a flowing place: `length + 1` glyphs in a column, translated on the UI thread. It mounts on the place's
 * first turn, already showing the digit it replaces, and stays for the turns after it. Its position counts glyphs on a reel of
 * `length`, so a turn on a reel of another length (a limited place given a digit past its limit, or back) starts from the
 * digit it replaces rather than from a position counted on the old reel.
 */
function FlowStrip({glyphs,length,from,digit,delta,step,enter,duration,samples,fade,fadeSamples,width,height,style,styleKey,script,maxFontSizeMultiplier}:FlowStripProps){
 const position=useSharedValue(from),opacity=useSharedValue(enter&&fade>0?0:1),applied=useRef<{step:number;digit:number;length:number}|null>(null);
 const animatedStyle=useAnimatedStyle(()=>{'worklet';return {opacity:opacity.value,transform:[{translateY:numberFlowReelOffset(position.value,length,height)}]};},[length,height]);
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
 useEffect(()=>{
  if(!enter)return;
  if(fade>0)opacity.value=withTiming(1,{duration:fade,easing:(progress:number)=>{'worklet';return sampleReelEasing(fadeSamples,progress);},reduceMotion:ReduceMotion.Never});
  // Motion was turned off while the place was still arriving: it is simply there.
  else{cancelAnimation(opacity);opacity.value=1;}
 },[enter,fade,fadeSamples,opacity]);
 // Forgetting the applied turn lets an effect that runs again after this cleanup (React's development double mount) start it again rather than leave the reel where the cancel stopped it.
 useEffect(()=>()=>{cancelAnimation(position);cancelAnimation(opacity);applied.current=null;},[position,opacity]);
 // The rows only change with the reel and the face, so they are the same elements from one turn to the next: a turn moves the strip and draws no text again.
 const rows=useMemo(()=>Array.from({length:length+1},(_,index)=><Text accessible={false} key={index} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style,{width,height,textAlign:'center'}]}>{glyphs[index%length]}</Text>),[glyphs,length,width,height,styleKey,script,maxFontSizeMultiplier]);
 return <Reanimated.View style={animatedStyle}>{rows}</Reanimated.View>;
}
type FlowDigitProps=Omit<FlowStripProps,'from'|'enter'>;
/**
 * One place of a flowing figure. At rest it is a single glyph in a box the size of the widest digit; the strip that rolls
 * mounts the first time the place turns, so a screen of figures that never change mounts one text per digit. A place that
 * joins a figure already on screen arrives turning, from zero.
 */
const FlowDigit=memo(function FlowDigit(props:FlowDigitProps){
 const {glyphs,digit,delta,step,width,height,style,script,maxFontSizeMultiplier}=props;
 // Where the strip starts from. Set during render, so the strip mounts in the commit that first turns the place.
 const [strip,setStrip]=useState<{from:number;enter:boolean}|null>(step>0&&delta!==0?{from:digit-delta,enter:true}:null);
 if(!strip&&step>0&&delta!==0)setStrip({from:digit-delta,enter:false});
 return <View collapsable={false} style={{width,height,overflow:'hidden'}}>{strip?<FlowStrip {...props} from={strip.from} enter={strip.enter}/>:<Text accessible={false} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style,{width,height,textAlign:'center'}]}>{glyphs[digit]}</Text>}</View>;
},(previous,next)=>previous.digit===next.digit&&previous.step===next.step&&previous.delta===next.delta&&previous.length===next.length&&sameGlyphs(previous.glyphs,next.glyphs)&&previous.width===next.width&&previous.height===next.height&&previous.duration===next.duration&&previous.samples===next.samples&&previous.fade===next.fade&&previous.fadeSamples===next.fadeSamples&&previous.styleKey===next.styleKey&&previous.script===next.script&&previous.maxFontSizeMultiplier===next.maxFontSizeMultiplier);
interface StillPartProps {text:string;style:StyleProp<TextStyle>;styleKey:string;script:TextScript;maxFontSizeMultiplier?:number}
/** A part of the figure that does not turn: a sign, a separator, an affix. Drawn again only when its text or its face changes. */
const StillPart=memo(function StillPart({text,style,script,maxFontSizeMultiplier}:StillPartProps){return <Text accessible={false} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={style}>{text}</Text>;},(previous,next)=>previous.text===next.text&&previous.styleKey===next.styleKey&&previous.script===next.script&&previous.maxFontSizeMultiplier===next.maxFontSizeMultiplier);
/** A place's turn: `step` counts the turns it has taken, `delta` is how far the latest one goes, and `length` is the reel it goes round (long enough for the digit it leaves and the one it reaches). */
interface FlowTurn {step:number;delta:number;length:number}
/** What a flowing figure last drew, how it was measured (`key`) and formatted (`signature`), and each place's turn. */
interface FlowStep {key:string;signature:string;canonical:string;value:number|null|undefined;places:ReturnType<typeof numberReelPlaces>;turns:ReadonlyMap<string,FlowTurn>}
const noTurns:ReadonlyMap<string,FlowTurn>=new Map();

function recordGlyph(measurements:React.MutableRefObject<{key:string;values:Map<number,{width:number;height:number}>}>,key:string,index:number,event:LayoutChangeEvent,setMetrics:React.Dispatch<React.SetStateAction<{key:string;width:number;height:number}|null>>){
 const {width,height}=event.nativeEvent.layout;if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
 measurements.current.values.set(index,{width,height});if(measurements.current.values.size!==10)return;
 const values=Array.from(measurements.current.values.values()),measuredWidth=Math.max(...values.map(value=>value.width)),measuredHeight=Math.max(...values.map(value=>value.height));
 if(!Number.isFinite(measuredWidth)||!Number.isFinite(measuredHeight)||measuredWidth<=0||measuredHeight<=0)return;
 setMetrics(current=>current?.key===key&&current.width===measuredWidth&&current.height===measuredHeight?current:{key,width:measuredWidth,height:measuredHeight});
}

/** `AnimatedNumberReadout` with NumberFlow's motion by default: the same component and the same props, under the name the product uses for it. */
export function NumberFlow({motion='flow',...props}:AnimatedNumberProps){return <AnimatedNumberReadout motion={motion} {...props}/>;}
export type NumberFlowProps=AnimatedNumberProps;
/** On web, moves the flowing figures inside it together when one changes width. Native figures change width at once, so this draws its children and nothing else; it exists so one tree serves both platforms. */
export function NumberFlowGroup({children}:{children?:React.ReactNode}){return <>{children}</>;}
/**
 * A number that moves place by place when its value changes. It slides by default; `motion='flow'` (or `NumberFlow`, which is
 * this component flowing by default) gives it NumberFlow's motion. Either way assistive technology gets one static reading,
 * and reduced motion draws each new value at once.
 */
export function AnimatedNumberReadout({value,options:requested,formattedValue,animateFormatted,stale,label,tone='text',style,testID,maxFontSizeMultiplier,trend,prefix,suffix,duration:requestedDuration,motion='slide',animated=true,spinTiming,transformTiming,opacityTiming,digits,continuous=false}:AnimatedNumberProps){
 const duration=requestedDuration??180,flow=motion==='flow';
 const locale=useNumberLocale();
 const {messages,direction,reducedMotion:reduced,fontFamily,fontFamilies,fontFamiliesByScript,letterSpacingByScript,maxFontSizeMultiplier:providerMaxFontSizeMultiplier,numberFormat}=useHIG(),colors=useColors(),reducedMotion=reduced||!animated;const options=presentNumberFormat(requested,numberFormat),optionsKey=options?JSON.stringify(options):'';
 // The reading and its reels depend on the value and the format alone. A readout draws more often than its value changes (its
 // parent draws, the digits are measured, a turn is worked out), and none of those renders formats anything again.
 const reading=useMemo(()=>formatNumberReadout(value,locale,options,formattedValue,prefix,suffix),[value,locale,optionsKey,formattedValue,prefix,suffix]),staleSuffix=stale?` ${messages.stale??en.stale}`:'';
 const previousValue=useRef(value),directionTrend=numberTrendDirection(trend,previousValue.current,value);
 useEffect(()=>{previousValue.current=value;},[value]);
 const typography=Object.fromEntries(Object.entries(StyleSheet.flatten(style)??{}).filter(([key])=>numberTypographyKeys.has(key))) as TextStyle;
 const color=colors[tone==='positive'||tone==='negative'||tone==='warning'||tone==='muted'||tone==='faint'||tone==='up'||tone==='down'?tone:'text'];
 const textStyle:StyleProp<TextStyle>=[typography,{color,fontVariant:['tabular-nums']}];
 const script=detectScript(`${reading.text}${staleSuffix}`,locale);
 const model=useMemo(()=>createNumberReelModel(value,locale,options,formattedValue,direction,animateFormatted,reading.core),[value,locale,optionsKey,formattedValue,direction,animateFormatted]);
 const safeModel=model&&safeNumberLayout(`${prefix??''}${suffix??''}${staleSuffix}`,direction)?model:null;
 let fontScale=0;try{fontScale=PixelRatio.getFontScale();}catch{/* Static until native font metrics are available. */}
 const measurementKey=JSON.stringify([safeModel?.digits,typography,fontScale,maxFontSizeMultiplier,providerMaxFontSizeMultiplier,script,fontFamily,fontFamilies,fontFamiliesByScript,letterSpacingByScript]);
 const measurements=useRef<{key:string;values:Map<number,{width:number;height:number}>}>({key:'',values:new Map()});
 if(measurements.current.key!==measurementKey)measurements.current={key:measurementKey,values:new Map()};
 const [metrics,setMetrics]=useState<{key:string;width:number;height:number}|null>(null);
 const activeModel=safeModel&&fontScale>0&&Number.isFinite(fontScale)&&metrics?.key===measurementKey?safeModel:null;
 const activeMetrics=activeModel?metrics:null;
 const align=typography.textAlign==='right'?'right':typography.textAlign==='center'?'center':'left';
 const justifyContent=align==='right'?'flex-end':align==='center'?'center':'flex-start';
 const visualProps={accessible:false,script,maxFontSizeMultiplier};
 // Flowing: the turn of every place for this change, worked out in the render that first draws the new reading so the places
 // that turn get their strip in the same commit. Kept in state (not a ref) so a render React throws away leaves no trace.
 const timings=resolveNumberFlowTimings({duration:requestedDuration,spinTiming,transformTiming,opacityTiming}),spinSamples=numberFlowEasingSamples(timings.spin.easing),fadeSamples=numberFlowEasingSamples(timings.opacity.easing);
 const [flowStep,setFlowStep]=useState<FlowStep|null>(null);let turns=noTurns;
 if(flow&&activeModel){
  // A new locale or format is a different reading rather than a new value, as on web: it is drawn at once and the next value rolls from it.
  const signature=`${locale}\u0000${optionsKey}\u0000${formattedValue?1:0}`;
  if(!flowStep||flowStep.key!==measurementKey||flowStep.signature!==signature)setFlowStep({key:measurementKey,signature,canonical:activeModel.canonical,value,places:numberReelPlaces(activeModel),turns:noTurns});
  else if(flowStep.canonical!==activeModel.canonical){
   const places=numberReelPlaces(activeModel),moving=!reducedMotion&&timings.spin.duration>0,deltas=moving?numberFlowDeltas(flowStep.places,places,{trend:numberTrendDirection(trend,flowStep.value,value),digits,continuous}):null,before=new Map(flowStep.places.map(place=>[place.key,place.digit])),next=new Map<string,FlowTurn>();
   for(const place of places){
    const delta=deltas?.get(place.key)??0,old=flowStep.turns.get(place.key);
    // The same reel the shared model counted the turn on: long enough for both ends of it.
    if(delta)next.set(place.key,{step:(old?.step??0)+1,delta,length:numberFlowDigitLength(digits,place.place,Math.max(place.digit,before.get(place.key)??0))});
    // No turn: the place keeps its reel while its digit still fits it.
    else if(old)next.set(place.key,place.digit<old.length?old:{...old,length:numberFlowDigitLength(digits,place.place,place.digit)});
   }
   setFlowStep({key:measurementKey,signature,canonical:activeModel.canonical,value,places,turns:next});turns=next;
  }else turns=flowStep.turns;
 }else if(flowStep)setFlowStep(null);
 const styleKey=JSON.stringify([typography,color]),partProps={style:textStyle,styleKey,script,maxFontSizeMultiplier};
 // The ten digits, measured for a face and size: drawn again when what is measured changes, not with every value.
 const probes=useMemo(()=>safeModel?<View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' pointerEvents='none' style={{position:'absolute',opacity:0,flexDirection:'row'}}>{safeModel.digits.map((glyph,index)=><Text {...visualProps} key={`${measurementKey}:${index}`} onLayout={event=>recordGlyph(measurements,measurementKey,index,event,setMetrics)} style={textStyle}>{glyph}</Text>)}</View>:null,[measurementKey,color]);
 // The reels are drawn in the readout's flow, so the readout is exactly as wide as the row it draws: the composed sign, every
 // static part read from the text, each reel at the widest digit's advance and the affixes, each its own text, measured by
 // the layout pass that draws it. The reading they replace leaves the flow (it stays, invisible, for assistive technology).
 // Before, the reels were an overlay on the reading, and the readout only grew to the reels after their row reported its
 // width; on the Seeker (Android) the readout kept the reading's width, so `+100.00%` drew past its box into the following
 // ` on margin`. Wherever the parts are wider than the reading (separate texts lose the reading's kerning, a face without
 // tabular digits), the readout is now wider by that much; where they match (iOS), nothing moves. Each reel clips its own
 // column, so nothing bleeds vertically, and no frame clips a glyph.
 return <View collapsable={false} style={activeModel?{position:'relative',flexDirection:'row',alignItems:'center',justifyContent}:{position:'relative'}}>
  <Text accessibilityLabel={label?`${label}: ${reading.text}${staleSuffix}`:undefined} testID={testID} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[textStyle,activeModel?hiddenReading[align]:undefined]}>{reading.text}{staleSuffix}</Text>
  {probes}
  {activeModel&&activeMetrics&&<View collapsable={false} accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' pointerEvents='none' style={reelRowStyle}>
   {prefix&&<StillPart {...partProps} text={prefix}/>}
   {activeModel.tokens.map(token=>token.kind==='static'?<StillPart {...partProps} key={token.key} text={token.value}/>:flow?<FlowDigit key={token.key} glyphs={activeModel.digits} length={turns.get(token.key)?.length??numberFlowDigitLength(digits,numberReelPlace(token),token.digit??0)} digit={token.digit??0} delta={turns.get(token.key)?.delta??0} step={turns.get(token.key)?.step??0} duration={reducedMotion?0:timings.spin.duration} samples={spinSamples} fade={reducedMotion?0:timings.opacity.duration} fadeSamples={fadeSamples} width={activeMetrics.width} height={activeMetrics.height} style={textStyle} styleKey={styleKey} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier}/>:<DigitReel key={token.key} digits={activeModel.digits} digit={token.digit??0} trend={directionTrend} duration={duration} reducedMotion={reducedMotion} width={activeMetrics.width} height={activeMetrics.height} style={textStyle} styleKey={styleKey} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier}/>)}
   {(suffix||staleSuffix)&&<StillPart {...partProps} text={`${suffix??''}${staleSuffix}`}/>}
  </View>}
 </View>;
}
