import React,{useLayoutEffect,useRef,useState} from 'react';
import {Animated,Easing,Platform,Pressable,View} from 'react-native';
import {tokens} from '@bloxwap/hig-tokens';
import {useControllable,useColors,useHIG} from './provider.js';
import {Text} from './surface.js';
import type {ChoicesProps} from './selection-types.js';
export function RadioGroup({label,options,value,defaultValue='',disabled,onValueChange}:ChoicesProps){
 const [current,set]=useControllable(value,defaultValue,onValueChange);const {direction,locale}=useHIG();const colors=useColors();
 return <View accessibilityRole='radiogroup' accessibilityLabel={label} style={{direction}}><Text>{label}</Text>{options.map(o=>{
  const blocked=!!disabled||!!o.disabled;const activate=()=>{if(!blocked)set(o.value);};
  return <Pressable key={o.value} accessible accessibilityRole='radio' aria-checked={current===o.value} aria-disabled={blocked} accessibilityLabel={o.label} accessibilityHint={o.description} accessibilityLanguage={o.lang} accessibilityState={{checked:current===o.value,disabled:blocked}} accessibilityActions={[{name:'activate'}]} disabled={blocked} onPress={activate} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')activate();}} style={{minHeight:48,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:12,opacity:blocked?0.5:1}}><Text accessible={false}>{current===o.value?'●':'○'}</Text><View style={{flex:1}}><Text accessible={false} accessibilityLanguage={o.lang}>{o.label}</Text>{o.description!==undefined&&<Text accessible={false} accessibilityLanguage={locale} style={{color:colors.muted,fontSize:14,lineHeight:20}}>{o.description}</Text>}</View></Pressable>;
 })}</View>;
}
/** Equal-width choices with one interruptible selection indicator. */
export function SegmentedControl({label,options,value,defaultValue='',disabled,onValueChange}:ChoicesProps){
 const [current,set]=useControllable(value,defaultValue,onValueChange);
 const {direction,locale,reducedMotion}=useHIG();const colors=useColors();
 const [width,setWidth]=useState(0);const translateX=useRef(new Animated.Value(0)).current;
 const selected=options.findIndex(option=>option.value===current),count=options.length;
 const segmentWidth=count>0?Math.max(0,(width-(count-1)*4)/count):0;
 const target=selected>=0?(direction==='rtl'?-1:1)*selected*(segmentWidth+4):0;
 // RN Web resolves `start` through its own locale context rather than this View's direction.
 const anchor=Platform.OS==='web'?(direction==='rtl'?{right:0}:{left:0}):{start:0};
 const previous=useRef<{selected:number;width:number;count:number;direction:string}|null>(null);
 useLayoutEffect(()=>{
  const old=previous.current;previous.current={selected,width,count,direction};
  // Initial layout, rotation, option-count changes and reduced motion snap into place.
  // A new selection interrupts the running animation at its current position.
  if(reducedMotion||!old||old.selected===selected||old.selected<0||selected<0||old.width!==width||old.count!==count||old.direction!==direction){
   translateX.stopAnimation();translateX.setValue(target);return;
  }
  const animation=Animated.timing(translateX,{toValue:target,duration:tokens.motion.base,easing:Easing.bezier(...tokens.easing.standard),useNativeDriver:Platform.OS!=='web',isInteraction:false});
  animation.start();return()=>animation.stop();
 },[selected,width,count,direction,reducedMotion,target,translateX]);
 return <View accessibilityRole='radiogroup' accessibilityLabel={label} style={{direction,gap:8}}>
  <Text style={{fontWeight:'600'}}>{label}</Text>
  <View style={{padding:4,borderRadius:9999,backgroundColor:colors.nested}}>
   <View onLayout={event=>setWidth(event.nativeEvent.layout.width)} style={{flexDirection:'row',gap:4}}>
    {selected>=0&&width>0&&<Animated.View pointerEvents='none' accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' style={{position:'absolute',...anchor,top:0,bottom:0,width:segmentWidth,borderRadius:9999,backgroundColor:colors.surface,opacity:disabled||options[selected].disabled?0.5:1,transform:[{translateX}]}}/>}
    {options.map(option=>{
     const checked=current===option.value,blocked=!!disabled||!!option.disabled;
     const activate=()=>{if(!blocked)set(option.value);};
     return <Pressable key={option.value} accessible accessibilityRole='radio' accessibilityLabel={option.label} accessibilityHint={option.description} accessibilityLanguage={option.lang} aria-checked={checked} aria-disabled={blocked} accessibilityState={{checked,disabled:blocked}} accessibilityActions={[{name:'activate'}]} disabled={blocked} onPress={activate} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')activate();}} style={{flex:1,minWidth:0,minHeight:48,paddingHorizontal:12,paddingVertical:8,alignItems:'stretch',justifyContent:'center',borderRadius:9999,opacity:blocked?0.5:1}}>
      <Text accessible={false} accessibilityLanguage={option.lang} style={{color:checked?colors.text:colors.muted,fontWeight:'500',textAlign:'center'}}>{option.label}</Text>
      {option.description!==undefined&&<Text accessible={false} accessibilityLanguage={locale} style={{color:colors.muted,fontSize:14,lineHeight:20,textAlign:'center'}}>{option.description}</Text>}
     </Pressable>;
    })}
   </View>
  </View>
 </View>;
}
