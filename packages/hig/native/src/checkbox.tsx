import { Check } from '@bloxwap/icons/native/check';
import React from 'react';
import {Pressable,View} from 'react-native';
import {nativeMetrics as tokens} from '@bloxwap/hig/tokens';
import {useColors,useControllable,useLayoutDirection} from './provider.js';
import {Text} from './surface.js';
import type {CheckedProps} from './selection-types.js';
export function Checkbox({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){
 const [current,set]=useControllable(checked,defaultChecked,onCheckedChange);const colors=useColors(),direction=useLayoutDirection();
 return <Pressable accessibilityRole='checkbox' aria-checked={current} aria-disabled={!!disabled} accessibilityLabel={label} accessibilityState={{checked:current,disabled:!!disabled}} disabled={disabled} onPress={()=>{if(!disabled)set(!current);}} style={{direction,minHeight:48,minWidth:44,flexDirection:'row',alignItems:'center',gap:tokens.space.sm,opacity:disabled?.5:1}}>
  <View pointerEvents='none' accessibilityElementsHidden importantForAccessibility='no-hide-descendants' aria-hidden style={{width:20,height:20,flexShrink:0,borderWidth:1.5,borderColor:current?colors.action:colors.muted,borderRadius:tokens.radius.sm,backgroundColor:current?colors.action:colors.surface,alignItems:'center',justifyContent:'center'}}>
   {current&&<Check size={14} color={colors.onAction}/>}
  </View>
  <Text style={{flexShrink:1,minWidth:0}}>{label}</Text>
 </Pressable>;
}
