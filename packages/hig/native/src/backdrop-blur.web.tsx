import React from 'react';
import {StyleSheet,View,type ViewStyle} from 'react-native';

export function BackdropBlur(){
 const reduced=typeof matchMedia==='function' && matchMedia('(prefers-reduced-transparency: reduce)').matches;
 if(reduced)return null;
 return <View pointerEvents="none" aria-hidden style={[StyleSheet.absoluteFill,{backdropFilter:'blur(7.2px)',WebkitBackdropFilter:'blur(7.2px)'} as ViewStyle]}/>;
}
