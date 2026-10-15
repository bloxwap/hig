import React from 'react';
import {Pressable,Switch as RNSwitch,View} from 'react-native';
import {nativeSrgb as colors,nativeMetrics as tokens} from '@bloxwap/hig-tokens';
import {useControllable,useHIG} from './provider.js';
import {Text} from './surface.js';
import type {CheckedProps} from './selection-types.js';
/** The whole labeled row is one 48dp switch target; the platform track is a hidden visual indicator. */
export function Switch({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){const env=useHIG();const [current,set]=useControllable(checked,defaultChecked,onCheckedChange);return <Pressable accessibilityRole='switch' accessibilityLabel={label} accessibilityState={{checked:current,disabled:!!disabled}} aria-checked={current} aria-disabled={!!disabled} disabled={disabled} onPress={()=>{if(!disabled)set(!current);}} style={{direction:env.direction,minHeight:48,flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:tokens.space.md}}><Text>{label}</Text><View pointerEvents='none' accessibilityElementsHidden importantForAccessibility='no-hide-descendants'><RNSwitch value={current} disabled={disabled} onValueChange={next=>{if(!disabled)set(next);}} trackColor={{true:colors.action,false:colors.nested}}/></View></Pressable>;}
