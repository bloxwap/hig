"use client";
import React from 'react';
import {HapticTarget,useIOSNativeHaptics,type HapticTargetProps} from '@bloxwap/haptic';
import {useHapticsEnabled} from './react.js';
/** Physical-tap opt-in. Pre-approval is required because an iOS tick precedes delegated cancellation. */
export function HapticFeedbackTarget({eligible=false,children,...props}:Omit<HapticTargetProps,'enabled'|'webHapticsOptions'> & {eligible?:boolean}){const enabled=useHapticsEnabled();const physicalTap=useIOSNativeHaptics();return <HapticTarget {...props} enabled={physicalTap&&eligible&&enabled} webHapticsOptions={{debug:false,showSwitch:false}}>{children}</HapticTarget>;}
