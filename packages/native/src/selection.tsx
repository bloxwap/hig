import React,{useState} from 'react';
import {Switch as RNSwitch,Pressable,View} from 'react-native';
import SliderBackend from '@react-native-community/slider';
import {nativeColors as colors} from '@bloxwap/hig-tokens';
import {useControllable} from './provider.js';
import {Text,Inline} from './surface.js';
import {Button} from './button.js';
import {Dialog} from './overlay.js';
export interface Choice {value:string;label:string;disabled?:boolean}
interface CheckedProps {label:string;checked?:boolean;defaultChecked?:boolean;disabled?:boolean;onCheckedChange?:(v:boolean)=>void}
export function Switch({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){const [current,set]=useControllable(checked,defaultChecked,onCheckedChange);return <Inline><Text>{label}</Text><RNSwitch accessibilityLabel={label} value={current} disabled={disabled} onValueChange={set} trackColor={{true:colors.android.action,false:colors.android.nested}}/></Inline>;}
export function Checkbox({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){const [current,set]=useControllable(checked,defaultChecked,onCheckedChange);return <Pressable accessibilityRole='checkbox' accessibilityLabel={label} accessibilityState={{checked:current,disabled:!!disabled}} disabled={disabled} onPress={()=>set(!current)} style={{minHeight:48,justifyContent:'center'}}><Text>{current?'☑':'☐'} {label}</Text></Pressable>;}
export interface ChoicesProps {label:string;options:readonly Choice[];value?:string;defaultValue?:string;disabled?:boolean;onValueChange?:(v:string)=>void}
export function RadioGroup({label,options,value,defaultValue='',disabled,onValueChange}:ChoicesProps){const [current,set]=useControllable(value,defaultValue,onValueChange);return <View accessibilityRole='radiogroup' accessibilityLabel={label}><Text>{label}</Text>{options.map(o=><Pressable key={o.value} accessibilityRole='radio' accessibilityLabel={o.label} accessibilityState={{checked:current===o.value,disabled:!!disabled||!!o.disabled}} disabled={disabled||o.disabled} onPress={()=>set(o.value)} style={{minHeight:48,justifyContent:'center'}}><Text>{current===o.value?'●':'○'} {o.label}</Text></Pressable>)}</View>;}
export const SegmentedControl=RadioGroup;
export function Select(props:ChoicesProps){const [open,setOpen]=useState(false);const [current,set]=useControllable(props.value,props.defaultValue??'',props.onValueChange);return <View><Button disabled={props.disabled} intent='secondary' onPress={()=>setOpen(true)}>{props.label}: {props.options.find(o=>o.value===current)?.label??'Choose'}</Button><Dialog title={props.label} description='Choose one option.' open={open} onOpenChange={setOpen}><RadioGroup {...props} value={current} onValueChange={v=>{set(v);setOpen(false);}}/></Dialog></View>;}
export function Slider({label,value,defaultValue=0,min=0,max=100,step=1,disabled,onValueChange}: {label:string;value?:number;defaultValue?:number;min?:number;max?:number;step?:number;disabled?:boolean;onValueChange?:(v:number)=>void}){const [current,set]=useControllable(value,defaultValue,onValueChange);return <View><Text>{label}: {current}</Text><SliderBackend accessibilityLabel={label} accessibilityValue={{min,max,now:current}} minimumValue={min} maximumValue={max} step={step} value={current} disabled={disabled} onValueChange={set} minimumTrackTintColor={colors.android.action}/></View>;}
