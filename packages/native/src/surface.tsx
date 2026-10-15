import React,{forwardRef} from 'react';
import {Text as RNText,View,StyleSheet,type TextProps,type ViewProps} from 'react-native';
import {nativeSrgb as colors,nativeMetrics as tokens} from '@bloxwap/hig-tokens';
import {useHIG} from './provider.js';
import {plainText} from './text-content.js';
export type TextScript='latin'|'ko'|'zh';
/** Korean and Chinese companion faces are set at their own spacing (0em): Latin tracking spreads CJK glyphs apart. Hosts override per script through HIGProvider `letterSpacingByScript`. */
export const scriptLetterSpacing:Readonly<Record<Exclude<TextScript,'latin'>,number>>={ko:0,zh:0};
const HANGUL=/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/u,HAN=/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u,CJK_PUNCTUATION=/[\u3000-\u303f\uff01-\uff60\uffe0-\uffe6]/u;
/** Hangul selects the Korean companion; Han (which the KR face does not carry) the Chinese one; shared CJK punctuation follows the locale. */
export function detectScript(text:string,locale:string):TextScript{if(HANGUL.test(text))return 'ko';if(HAN.test(text))return 'zh';if(CJK_PUNCTUATION.test(text))return /^ko\b/i.test(locale)?'ko':'zh';return 'latin';}
export interface HIGTextProps extends TextProps {/** Script used for letter spacing; detected from string children when omitted. */script?:TextScript;/** Caps Dynamic Type / Android font scale for dense numeric readouts (2 = 200%). Defaults to HIGProvider `maxFontSizeMultiplier`; never disable scaling. */maxFontSizeMultiplier?:number}
export const Text=forwardRef<RNText,HIGTextProps>(function Text({style,script,maxFontSizeMultiplier,...props},ref){const env=useHIG();const resolved=StyleSheet.flatten(style);const requested=resolved?.fontWeight??400;const weight=requested==='normal'?400:requested==='bold'?700:requested;const registered=resolved?.fontFamily?undefined:env.fontFamilies?.[weight];
 const resolvedScript=script??detectScript(plainText(props.children),env.locale);const tracking=resolvedScript==='latin'?undefined:{letterSpacing:(env.letterSpacingByScript?.[resolvedScript]??scriptLetterSpacing[resolvedScript])*(resolved?.fontSize??16)};
 return <RNText {...props} ref={ref} maxFontSizeMultiplier={maxFontSizeMultiplier??env.maxFontSizeMultiplier} style={[{color:colors.text,fontSize:16,lineHeight:24,fontFamily:env.fontFamily,writingDirection:env.direction},style,registered?{fontFamily:registered,fontWeight:'normal'}:undefined,tracking]}/>;});
export const Heading=forwardRef<RNText,HIGTextProps>(function Heading({style,...props},ref){return <Text {...props} ref={ref} accessibilityRole='header' style={[{fontSize:24,lineHeight:30,fontWeight:'600'},style]}/>;});
export function Stack({style,...props}:ViewProps){const env=useHIG();return <View {...props} style={[{direction:env.direction,gap:tokens.space.md},style]}/>;}
export function Inline({style,...props}:ViewProps){const env=useHIG();return <View {...props} style={[{direction:env.direction,flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:tokens.space.md},style]}/>;}
export function Surface({style,...props}:ViewProps){const env=useHIG();return <View {...props} style={[{direction:env.direction,backgroundColor:colors.surface,borderRadius:tokens.radius.xl,padding:tokens.space.xl},style]}/>;}
export const Card=Surface;
export function Separator(){return <View accessibilityRole='none' style={{height:1,backgroundColor:colors.border}}/>;}
