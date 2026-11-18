import React from 'react';
import {StyleSheet,View,type ViewStyle} from 'react-native';

export function BackdropBlur(){
 const reduced=typeof matchMedia==='function' && matchMedia('(prefers-reduced-transparency: reduce)').matches;
 if(reduced)return null;
 return <View pointerEvents="none" aria-hidden style={[StyleSheet.absoluteFill,{backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)'} as ViewStyle]}/>;
}
