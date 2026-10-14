import React from 'react';
import {Pressable} from 'react-native';
import {useControllable} from './provider.js';
import {Text} from './surface.js';
import type {CheckedProps} from './selection-types.js';
export function Checkbox({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){const [current,set]=useControllable(checked,defaultChecked,onCheckedChange);return <Pressable accessibilityRole='checkbox' aria-checked={current} aria-disabled={!!disabled} accessibilityLabel={label} accessibilityState={{checked:current,disabled:!!disabled}} disabled={disabled} onPress={()=>{if(!disabled)set(!current);}} style={{minHeight:48,justifyContent:'center'}}><Text>{current?'☑':'☐'} {label}</Text></Pressable>;}
