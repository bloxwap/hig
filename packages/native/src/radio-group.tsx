import React from 'react';
import {Pressable,View} from 'react-native';
import {useControllable,useHIG} from './provider.js';
import {Text} from './surface.js';
import type {ChoicesProps} from './selection-types.js';
export function RadioGroup({label,options,value,defaultValue='',disabled,onValueChange}:ChoicesProps){
 const [current,set]=useControllable(value,defaultValue,onValueChange);const {colors,direction,locale}=useHIG();
 return <View accessibilityRole='radiogroup' accessibilityLabel={label} style={{direction}}><Text>{label}</Text>{options.map(o=>{
  const blocked=!!disabled||!!o.disabled;const activate=()=>{if(!blocked)set(o.value);};
  return <Pressable key={o.value} accessible accessibilityRole='radio' aria-checked={current===o.value} aria-disabled={blocked} accessibilityLabel={o.label} accessibilityHint={o.description} accessibilityLanguage={o.lang} accessibilityState={{checked:current===o.value,disabled:blocked}} accessibilityActions={[{name:'activate'}]} disabled={blocked} onPress={activate} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')activate();}} style={{minHeight:48,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:12,opacity:blocked?0.5:1}}><Text accessible={false}>{current===o.value?'●':'○'}</Text><View style={{flex:1}}><Text accessible={false} accessibilityLanguage={o.lang}>{o.label}</Text>{o.description!==undefined&&<Text accessible={false} accessibilityLanguage={locale} style={{color:colors.muted,fontSize:14,lineHeight:20}}>{o.description}</Text>}</View></Pressable>;
 })}</View>;
}
export const SegmentedControl=RadioGroup;
