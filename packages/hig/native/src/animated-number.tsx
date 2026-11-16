import React,{useEffect,useRef,useState} from 'react';
import {PixelRatio,StyleSheet,View,type LayoutChangeEvent,type StyleProp,type TextStyle} from 'react-native';
import Reanimated,{cancelAnimation,Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import * as en from '@bloxwap/hig/contracts/messages';
import {presentNumberFormat} from '@bloxwap/hig/contracts';
import {tokens} from '@bloxwap/hig/tokens';
import {type NumberProps} from './data.js';
import {createNumberReelModel,formatNumberReadout,numberTrendDirection,safeNumberLayout,type NumberTrend} from './animated-number-model.js';
import {useColors,useHIG,useNumberLocale} from './provider.js';
import {detectScript,Text,type TextScript} from './surface.js';

export type AnimatedNumberTrend=NumberTrend;
export interface AnimatedNumberProps extends NumberProps {duration?:number;trend?:AnimatedNumberTrend;
 /** With `formattedValue`, moves the host's text place by place: each digit it contains rolls in place, counted from the end, and the rest stays as written. Without it `formattedValue` is drawn static, as before. */
 animateFormatted?:boolean}
const numberTypographyKeys=new Set(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign']);
// Android Fabric reads colour 0 as "unset", so 'transparent' (0x00000000) drew the hidden reading in the default
// black under the reels. Clear white is non-zero there and still invisible.
const hiddenReading={color:'#ffffff00'};
// The reel row keeps its content width (no shrink), so it can be measured wider than the readout.
const reelRowStyle={flexDirection:'row',alignItems:'center',flexShrink:0} as const;
const clampedDuration=(duration:number)=>Number.isFinite(duration)&&duration>0?Math.min(duration,600):0;

interface DigitReelProps {digits:readonly string[];digit:number;trend:-1|0|1;duration:number;reducedMotion:boolean;width:number;height:number;style:StyleProp<TextStyle>;script:TextScript;maxFontSizeMultiplier?:number}
function DigitReel({digits,digit,trend,duration,reducedMotion,width,height,style,script,maxFontSizeMultiplier}:DigitReelProps){
 const position=useSharedValue(digit),previousDigit=useRef(digit);
 const animatedStyle=useAnimatedStyle(()=>({transform:[{translateY:-position.value*height}]}),[height]);
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
 const rows=Array.from({length:20},(_,index)=>digits[index%10]);
 return <View collapsable={false} style={{width,height,overflow:'hidden'}}><Reanimated.View style={animatedStyle}>{rows.map((glyph,index)=><Text accessible={false} key={`${index}:${glyph}`} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style,{width,height,textAlign:'center'}]}>{glyph}</Text>)}</Reanimated.View></View>;
}

function recordGlyph(measurements:React.MutableRefObject<{key:string;values:Map<number,{width:number;height:number}>}>,key:string,index:number,event:LayoutChangeEvent,setMetrics:React.Dispatch<React.SetStateAction<{key:string;width:number;height:number}|null>>){
 const {width,height}=event.nativeEvent.layout;if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
 measurements.current.values.set(index,{width,height});if(measurements.current.values.size!==10)return;
 const values=Array.from(measurements.current.values.values()),measuredWidth=Math.max(...values.map(value=>value.width)),measuredHeight=Math.max(...values.map(value=>value.height));
 if(!Number.isFinite(measuredWidth)||!Number.isFinite(measuredHeight)||measuredWidth<=0||measuredHeight<=0)return;
 setMetrics(current=>current?.key===key&&current.width===measuredWidth&&current.height===measuredHeight?current:{key,width:measuredWidth,height:measuredHeight});
}

export function AnimatedNumberReadout({value,options:requested,formattedValue,animateFormatted,stale,label,tone='text',style,testID,maxFontSizeMultiplier,trend,prefix,suffix,duration=180}:AnimatedNumberProps){
 const locale=useNumberLocale();
 const {messages,direction,reducedMotion,fontFamily,fontFamilies,fontFamiliesByScript,letterSpacingByScript,maxFontSizeMultiplier:providerMaxFontSizeMultiplier,numberFormat}=useHIG(),colors=useColors();const options=presentNumberFormat(requested,numberFormat);
 const reading=formatNumberReadout(value,locale,options,formattedValue,prefix,suffix),staleSuffix=stale?` ${messages.stale??en.stale}`:'';
 const previousValue=useRef(value),directionTrend=numberTrendDirection(trend,previousValue.current,value);
 useEffect(()=>{previousValue.current=value;},[value]);
 const typography=Object.fromEntries(Object.entries(StyleSheet.flatten(style)??{}).filter(([key])=>numberTypographyKeys.has(key))) as TextStyle;
 const color=colors[tone==='positive'||tone==='negative'||tone==='warning'||tone==='muted'||tone==='faint'||tone==='up'||tone==='down'?tone:'text'];
 const textStyle:StyleProp<TextStyle>=[typography,{color,fontVariant:['tabular-nums']}];
 const script=detectScript(`${reading.text}${staleSuffix}`,locale);
 const model=createNumberReelModel(value,locale,options,formattedValue,direction,animateFormatted);
 const safeModel=model&&safeNumberLayout(`${prefix??''}${suffix??''}${staleSuffix}`,direction)?model:null;
 let fontScale=0;try{fontScale=PixelRatio.getFontScale();}catch{/* Static until native font metrics are available. */}
 const measurementKey=JSON.stringify([safeModel?.digits,typography,fontScale,maxFontSizeMultiplier,providerMaxFontSizeMultiplier,script,fontFamily,fontFamilies,fontFamiliesByScript,letterSpacingByScript]);
 const measurements=useRef<{key:string;values:Map<number,{width:number;height:number}>}>({key:'',values:new Map()});
 if(measurements.current.key!==measurementKey)measurements.current={key:measurementKey,values:new Map()};
 const [metrics,setMetrics]=useState<{key:string;width:number;height:number}|null>(null);
 const activeModel=safeModel&&fontScale>0&&Number.isFinite(fontScale)&&metrics?.key===measurementKey?safeModel:null;
 const activeMetrics=activeModel?metrics:null;
 const justifyContent=typography.textAlign==='right'?'flex-end':typography.textAlign==='center'?'center':'flex-start';
 const visualProps={accessible:false,script,maxFontSizeMultiplier};
 // Every reel takes the widest digit's advance, while the hidden reading keeps the font's own digit advances wherever
 // `tabular-nums` is not honoured (Android's custom faces), so the reel row can be wider than the reading. The row is
 // measured at its own width and the readout grows to it, so the clipping overlay never cuts the first or last glyph.
 // Where the reading is already as wide as the reels (iOS), the minimum is at most its width and changes nothing.
 // Until the row's onLayout has reported the width of the row now drawn (first frame, or a new digit count or separator),
 // the overlay does not clip: the reels draw past the readout for that frame instead of losing a glyph. Each reel still
 // clips its own column, so nothing bleeds vertically. The width is keyed by what sets it: the glyph metrics, the
 // static tokens, the number of reels and the affixes. If a new key lays out at the same width, onLayout does not fire
 // and the overlay stays unclipped, which is harmless: the row is then no wider than the readout it already sized.
 const reelRowKey=activeModel?JSON.stringify([measurementKey,activeModel.tokens.map(token=>token.kind==='static'?token.value:0),prefix,suffix,staleSuffix]):'';
 const [reelRow,setReelRow]=useState<{key:string;width:number}|null>(null);
 const minWidth=activeModel&&activeMetrics&&reelRow?reelRow.width:undefined;
 const clipped=reelRow!==null&&reelRow.key===reelRowKey;
 const recordReelRow=(event:LayoutChangeEvent)=>{const {width}=event.nativeEvent.layout;if(Number.isFinite(width)&&width>0)setReelRow(current=>current?.key===reelRowKey&&current.width===width?current:{key:reelRowKey,width});};
 return <View collapsable={false} style={minWidth===undefined?{position:'relative'}:{position:'relative',minWidth}}>
  <Text accessibilityLabel={label?`${label}: ${reading.text}${staleSuffix}`:undefined} testID={testID} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[textStyle,activeModel?hiddenReading:undefined]}>{reading.text}{staleSuffix}</Text>
  {safeModel&&<View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' pointerEvents='none' style={{position:'absolute',opacity:0,flexDirection:'row'}}>{safeModel.digits.map((glyph,index)=><Text {...visualProps} key={`${measurementKey}:${index}`} onLayout={event=>recordGlyph(measurements,measurementKey,index,event,setMetrics)} style={textStyle}>{glyph}</Text>)}</View>}
  {activeModel&&activeMetrics&&<View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' pointerEvents='none' style={[StyleSheet.absoluteFill,{overflow:clipped?'hidden':'visible',flexDirection:'row',direction:'ltr',alignItems:'center',justifyContent}]}>
   <View collapsable={false} onLayout={recordReelRow} style={reelRowStyle}>
    {prefix&&<Text {...visualProps} style={textStyle}>{prefix}</Text>}
    {activeModel.tokens.map(token=>token.kind==='static'?<Text {...visualProps} key={token.key} style={textStyle}>{token.value}</Text>:<DigitReel key={token.key} digits={activeModel.digits} digit={token.digit??0} trend={directionTrend} duration={duration} reducedMotion={reducedMotion} width={activeMetrics.width} height={activeMetrics.height} style={textStyle} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier}/>)}
    {(suffix||staleSuffix)&&<Text {...visualProps} style={textStyle}>{`${suffix??''}${staleSuffix}`}</Text>}
   </View>
  </View>}
 </View>;
}
