"use client";
import React from 'react';
import {HapticTarget,useIOSNativeHaptics,type HapticTargetProps} from '@bloxwap/haptic';
import {useFeedback} from './react.js';
/** Physical-tap opt-in. Pre-approval is required because an iOS tick precedes delegated cancellation. */
export function HapticFeedbackTarget({eligible=false,children,...props}:Omit<HapticTargetProps,'enabled'|'webHapticsOptions'> & {eligible?:boolean}){const {preferences}=useFeedback();const physicalTap=useIOSNativeHaptics();return <HapticTarget {...props} enabled={physicalTap&&eligible&&preferences.haptics} webHapticsOptions={{debug:false,showSwitch:false}}>{children}</HapticTarget>;}
