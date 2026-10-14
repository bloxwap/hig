import React,{forwardRef} from 'react';
import {Text as RNText,View,StyleSheet,type TextProps,type ViewProps} from 'react-native';
import {nativeSrgb as colors,nativeMetrics as tokens} from '@bloxwap/hig-tokens';
import {useHIG} from './provider.js';
export const Text=forwardRef<RNText,TextProps>(function Text({style,...props},ref){const env=useHIG();const resolved=StyleSheet.flatten(style);const requested=resolved?.fontWeight??400;const weight=requested==='normal'?400:requested==='bold'?700:requested;const registered=resolved?.fontFamily?undefined:env.fontFamilies?.[weight];return <RNText {...props} ref={ref} style={[{color:colors.text,fontSize:16,lineHeight:24,fontFamily:env.fontFamily,writingDirection:env.direction},style,registered?{fontFamily:registered,fontWeight:'normal'}:undefined]}/>;});
export const Heading=forwardRef<RNText,TextProps>(function Heading({style,...props},ref){return <Text {...props} ref={ref} accessibilityRole='header' style={[{fontSize:24,lineHeight:30,fontWeight:'600'},style]}/>;});
export function Stack({style,...props}:ViewProps){const env=useHIG();return <View {...props} style={[{direction:env.direction,gap:tokens.space.md},style]}/>;}
export function Inline({style,...props}:ViewProps){const env=useHIG();return <View {...props} style={[{direction:env.direction,flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:tokens.space.md},style]}/>;}
export function Surface({style,...props}:ViewProps){const env=useHIG();return <View {...props} style={[{direction:env.direction,backgroundColor:colors.surface,borderRadius:tokens.radius.xl,padding:tokens.space.xl},style]}/>;}
export const Card=Surface;
export function Separator(){return <View accessibilityRole='none' style={{height:1,backgroundColor:colors.border}}/>;}
