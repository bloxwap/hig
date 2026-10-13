import React from 'react';
import {Text as RNText,View,type TextProps,type ViewProps} from 'react-native';
import {nativeColors as colors,tokens} from '@bloxwap/hig-tokens';
import {useHIG} from './provider.js';
export function Text({style,...props}:TextProps){const env=useHIG();return <RNText {...props} style={[{color:colors.android.text,fontSize:16,lineHeight:24,fontFamily:env.fontFamily,writingDirection:env.direction},style]}/>;}
export function Heading({style,...props}:TextProps){return <Text {...props} accessibilityRole='header' style={[{fontSize:24,lineHeight:30,fontWeight:'600'},style]}/>;}
export function Stack({style,...props}:ViewProps){return <View {...props} style={[{gap:tokens.space.md},style]}/>;}
export function Inline({style,...props}:ViewProps){return <View {...props} style={[{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:tokens.space.md},style]}/>;}
export function Surface({style,...props}:ViewProps){return <View {...props} style={[{backgroundColor:colors.android.surface,borderRadius:tokens.radius.xl,padding:tokens.space.xl},style]}/>;}
export const Card=Surface;
export function Separator(){return <View accessibilityRole='none' style={{height:1,backgroundColor:colors.android.border}}/>;}
