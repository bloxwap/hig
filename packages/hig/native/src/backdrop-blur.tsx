import React from 'react';
import {useColors} from './provider.js';
import {Platform,StyleSheet,UIManager} from 'react-native';
import type {BlurView as NativeBlurView} from '@react-native-community/blur';

function resolveBlurView():typeof NativeBlurView|null {
 const name=Platform.OS==='ios'?'BlurView':'AndroidBlurView';
 if(!UIManager.hasViewManagerConfig(name))return null;
 try {
  return require('@react-native-community/blur').BlurView;
 } catch {
  return null;
 }
}

const BlurView=resolveBlurView();

export function BackdropBlur(){
 const colors=useColors();
 if(!BlurView)return null;
 return <BlurView pointerEvents="none" accessible={false} importantForAccessibility="no" style={StyleSheet.absoluteFill}
  blurType="dark" blurAmount={20} overlayColor="transparent" reducedTransparencyFallbackColor={colors.overlay}/>;
}
