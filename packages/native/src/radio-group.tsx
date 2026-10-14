import React from 'react';
import {Pressable,View} from 'react-native';
import {useControllable} from './provider.js';
import {Text} from './surface.js';
import type {ChoicesProps} from './selection-types.js';
export function RadioGroup({label,options,value,defaultValue='',disabled,onValueChange}:ChoicesProps){const [current,set]=useControllable(value,defaultValue,onValueChange);return <View accessibilityRole='radiogroup' accessibilityLabel={label}><Text>{label}</Text>{options.map(o=><Pressable key={o.value} accessibilityRole='radio' aria-checked={current===o.value} aria-disabled={!!disabled||!!o.disabled} accessibilityLabel={o.label} accessibilityState={{checked:current===o.value,disabled:!!disabled||!!o.disabled}} disabled={disabled||o.disabled} onPress={()=>{if(!disabled&&!o.disabled)set(o.value);}} style={{minHeight:48,justifyContent:'center'}}><Text>{current===o.value?'●':'○'} {o.label}</Text></Pressable>)}</View>;}
export const SegmentedControl=RadioGroup;
