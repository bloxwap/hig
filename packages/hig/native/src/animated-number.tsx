import React,{useEffect,useRef,useState} from 'react';
import {PixelRatio,StyleSheet,View,type LayoutChangeEvent,type StyleProp,type TextStyle} from 'react-native';
import Reanimated,{cancelAnimation,Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import * as en from '@bloxwap/hig/contracts/messages';
import {type NumberProps} from './data.js';
import {createNumberReelModel,formatNumberReadout,numberTrendDirection,safeNumberLayout,type NumberTrend} from './animated-number-model.js';
import {useColors,useHIG} from './provider.js';
import {detectScript,Text,type TextScript} from './surface.js';

export type AnimatedNumberTrend=NumberTrend;
export interface AnimatedNumberProps extends NumberProps {duration?:number;trend?:AnimatedNumberTrend}
const numberTypographyKeys=new Set(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign']);
const clampedDuration=(duration:number)=>Number.isFinite(duration)&&duration>0?Math.min(duration,600):0;

interface DigitReelProps {digits:readonly string[];digit:number;trend:-1|0|1;duration:number;reducedMotion:boolean;width:number;height:number;style:StyleProp<TextStyle>;script:TextScript;maxFontSizeMultiplier?:number}
function DigitReel({digits,digit,trend,duration,reducedMotion,width,height,style,script,maxFontSizeMultiplier}:DigitReelProps){
 const position=useSharedValue(digit),previousDigit=useRef(digit);
 const animatedStyle=useAnimatedStyle(()=>({transform:[{translateY:-(position.value+10)*height}]}),[height]);
 useEffect(()=>{
  const motionDuration=clampedDuration(duration);
  if(previousDigit.current===digit){
   if(reducedMotion||!motionDuration){cancelAnimation(position);position.value=digit;}
   return;
  }
  previousDigit.current=digit;cancelAnimation(position);
  if(reducedMotion||!motionDuration){position.value=digit;return;}
  const current=position.value;if(!Number.isFinite(current)){position.value=digit;return;}
  const normalized=current>=0&&current<10?current:((current%10)+10)%10;if(normalized!==current)position.value=normalized;
  let destination=digit;
  if(trend>0)while(destination<=normalized)destination+=10;
  else if(trend<0)while(destination>=normalized)destination-=10;
  if(destination===normalized){position.value=digit;return;}
  position.value=withTiming(destination,{duration:motionDuration,easing:Easing.out(Easing.cubic),reduceMotion:ReduceMotion.Never});
 },[digit,trend,duration,reducedMotion,position]);
 useEffect(()=>()=>cancelAnimation(position),[position]);
 const rows=Array.from({length:30},(_,index)=>digits[index%10]);
 return <View collapsable={false} style={{width,height,overflow:'hidden'}}><Reanimated.View style={animatedStyle}>{rows.map((glyph,index)=><Text accessible={false} key={`${index}:${glyph}`} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style,{width,height,textAlign:'center'}]}>{glyph}</Text>)}</Reanimated.View></View>;
}

function recordGlyph(measurements:React.MutableRefObject<{key:string;values:Map<number,{width:number;height:number}>}>,key:string,index:number,event:LayoutChangeEvent,setMetrics:React.Dispatch<React.SetStateAction<{key:string;width:number;height:number}|null>>){
 const {width,height}=event.nativeEvent.layout;if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
 measurements.current.values.set(index,{width,height});if(measurements.current.values.size!==10)return;
 const values=Array.from(measurements.current.values.values()),measuredWidth=Math.max(...values.map(value=>value.width)),measuredHeight=Math.max(...values.map(value=>value.height));
 if(!Number.isFinite(measuredWidth)||!Number.isFinite(measuredHeight)||measuredWidth<=0||measuredHeight<=0)return;
 setMetrics(current=>current?.key===key&&current.width===measuredWidth&&current.height===measuredHeight?current:{key,width:measuredWidth,height:measuredHeight});
}

export function AnimatedNumberReadout({value,options,formattedValue,stale,label,tone='text',style,testID,maxFontSizeMultiplier,trend,prefix,suffix,duration=180}:AnimatedNumberProps){
 const {locale,messages,direction,reducedMotion,fontFamily,fontFamilies,fontFamiliesByScript,letterSpacingByScript,maxFontSizeMultiplier:providerMaxFontSizeMultiplier}=useHIG(),colors=useColors();
 const reading=formatNumberReadout(value,locale,options,formattedValue,prefix,suffix),staleSuffix=stale?` ${messages.stale??en.stale}`:'';
 const previousValue=useRef(value),directionTrend=numberTrendDirection(trend,previousValue.current,value);
 useEffect(()=>{previousValue.current=value;},[value]);
 const typography=Object.fromEntries(Object.entries(StyleSheet.flatten(style)??{}).filter(([key])=>numberTypographyKeys.has(key))) as TextStyle;
 const color=colors[tone==='positive'||tone==='negative'||tone==='muted'?tone:'text'];
 const textStyle:StyleProp<TextStyle>=[typography,{color,fontVariant:['tabular-nums']}];
 const script=detectScript(`${reading.text}${staleSuffix}`,locale);
 const model=createNumberReelModel(value,locale,options,formattedValue,direction);
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
 return <View collapsable={false} style={{position:'relative'}}>
  <Text accessibilityLabel={label?`${label}: ${reading.text}${staleSuffix}`:undefined} testID={testID} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[textStyle,activeModel?{color:'transparent'}:undefined]}>{reading.text}{staleSuffix}</Text>
  {safeModel&&<View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' pointerEvents='none' style={{position:'absolute',opacity:0,flexDirection:'row'}}>{safeModel.digits.map((glyph,index)=><Text {...visualProps} key={`${measurementKey}:${index}`} onLayout={event=>recordGlyph(measurements,measurementKey,index,event,setMetrics)} style={textStyle}>{glyph}</Text>)}</View>}
  {activeModel&&activeMetrics&&<View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' pointerEvents='none' style={[StyleSheet.absoluteFill,{overflow:'hidden',flexDirection:'row',direction:'ltr',alignItems:'center',justifyContent}]}>
   {prefix&&<Text {...visualProps} style={textStyle}>{prefix}</Text>}
   {activeModel.tokens.map(token=>token.kind==='static'?<Text {...visualProps} key={token.key} style={textStyle}>{token.value}</Text>:<DigitReel key={token.key} digits={activeModel.digits} digit={token.digit??0} trend={directionTrend} duration={duration} reducedMotion={reducedMotion} width={activeMetrics.width} height={activeMetrics.height} style={textStyle} script={script} maxFontSizeMultiplier={maxFontSizeMultiplier}/>)}
   {(suffix||staleSuffix)&&<Text {...visualProps} style={textStyle}>{`${suffix??''}${staleSuffix}`}</Text>}
  </View>}
 </View>;
}
