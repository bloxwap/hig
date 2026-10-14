import React from 'react';
import {Switch as RNSwitch} from 'react-native';
import {nativeSrgb as colors} from '@bloxwap/hig-tokens';
import {useControllable} from './provider.js';
import {Text,Inline} from './surface.js';
import type {CheckedProps} from './selection-types.js';
export function Switch({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){const [current,set]=useControllable(checked,defaultChecked,onCheckedChange);return <Inline><Text>{label}</Text><RNSwitch accessibilityLabel={label} value={current} disabled={disabled} accessibilityState={{checked:current,disabled:!!disabled}} onValueChange={next=>{if(!disabled)set(next);}} trackColor={{true:colors.action,false:colors.nested}}/></Inline>;}
