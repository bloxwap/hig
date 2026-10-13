import React from 'react';
import {View} from 'react-native';
import SliderBackend from '@react-native-community/slider';
import {nativeColors as colors} from '@bloxwap/hig-tokens';
import {useControllable} from './provider.js';
import {Text} from './surface.js';
export function Slider({label,value,defaultValue=0,min=0,max=100,step=1,disabled,onValueChange}: {label:string;value?:number;defaultValue?:number;min?:number;max?:number;step?:number;disabled?:boolean;onValueChange?:(v:number)=>void}){const [current,set]=useControllable(value,defaultValue,onValueChange);return <View><Text>{label}: {current}</Text><SliderBackend accessibilityLabel={label} accessibilityValue={{min,max,now:current}} minimumValue={min} maximumValue={max} step={step} value={current} disabled={disabled} onValueChange={set} minimumTrackTintColor={colors.android.action}/></View>;}

