import React from 'react';
import {Switch as RNSwitch} from 'react-native';
import {nativeColors as colors} from '@bloxwap/hig-tokens';
import {useControllable} from './provider.js';
import {Text,Inline} from './surface.js';
import type {CheckedProps} from './selection-types.js';
export function Switch({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){const [current,set]=useControllable(checked,defaultChecked,onCheckedChange);return <Inline><Text>{label}</Text><RNSwitch accessibilityLabel={label} value={current} disabled={disabled} onValueChange={set} trackColor={{true:colors.android.action,false:colors.android.nested}}/></Inline>;}
