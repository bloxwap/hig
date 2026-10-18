import React from 'react';
import {Platform,Pressable,Switch as RNSwitch,View} from 'react-native';
import {nativeMetrics as tokens} from '@bloxwap/hig-tokens';
import {useControllable,useHIG} from './provider.js';
import {Text,Inline} from './surface.js';
import type {CheckedProps} from './selection-types.js';
import {roleColor,type AccentRole} from './roles.js';
export type {AccentRole} from './roles.js';
export interface SwitchProps extends CheckedProps {/** Token role for the on track; defaults to `action`. */tone?:AccentRole}
/** On iOS/Android the whole labeled row is one 48dp switch target; the platform track is a hidden visual indicator. */
export function Switch({label,checked,defaultChecked=false,disabled,tone,onCheckedChange}:SwitchProps){const env=useHIG();const {colors}=env;const track={true:roleColor(tone,'action',colors),false:colors.nested};
 // Android otherwise paints the thumb with the app theme accent (Material teal on the emulator), a colour outside the token roles; iOS keeps its native white thumb.
 const thumb=Platform.OS==='android'?colors.text:undefined;const [current,set]=useControllable(checked,defaultChecked,onCheckedChange);
 // react-native-web renders the track as a labeled native checkbox switch; wrapping it would nest interactive controls (axe).
 if(Platform.OS==='web')return <Inline><Text>{label}</Text><RNSwitch accessibilityLabel={label} value={current} disabled={disabled} accessibilityState={{checked:current,disabled:!!disabled}} onValueChange={next=>{if(!disabled)set(next);}} trackColor={track}/></Inline>;
 return <Pressable accessibilityRole='switch' accessibilityLabel={label} accessibilityState={{checked:current,disabled:!!disabled}} aria-checked={current} aria-disabled={!!disabled} disabled={disabled} onPress={()=>{if(!disabled)set(!current);}} style={{direction:env.direction,minHeight:48,flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:tokens.space.md}}><Text>{label}</Text><View pointerEvents='none' accessibilityElementsHidden importantForAccessibility='no-hide-descendants'><RNSwitch value={current} disabled={disabled} onValueChange={next=>{if(!disabled)set(next);}} trackColor={track} thumbColor={thumb} ios_backgroundColor={colors.nested}/></View></Pressable>;}
