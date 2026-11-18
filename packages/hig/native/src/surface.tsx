import React,{forwardRef} from 'react';
import {Text as RNText,View,StyleSheet,type TextProps,type ViewProps} from 'react-native';
import {nativeMetrics as tokens} from '@bloxwap/hig/tokens';
import {Raised,useColors,useFills,useLayoutDirection,useTextEnvironment} from './provider.js';
import {plainText} from './text-content.js';
export type TextScript='latin'|'ko'|'zh';
/** Korean and Chinese companion faces are set at their own spacing (0em): Latin tracking spreads CJK glyphs apart. Hosts override per script through HIGProvider `letterSpacingByScript`. */
export const scriptLetterSpacing:Readonly<Record<Exclude<TextScript,'latin'>,number>>={ko:0,zh:0};
const HANGUL=/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/u,HAN=/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u,CJK_PUNCTUATION=/[\u3000-\u303f\uff01-\uff60\uffe0-\uffe6]/u;
/** Hangul selects the Korean companion; Han (which the KR face does not carry) the Chinese one; shared CJK punctuation follows the locale. */
export function detectScript(text:string,locale:string):TextScript{if(HANGUL.test(text))return 'ko';if(HAN.test(text))return 'zh';if(CJK_PUNCTUATION.test(text))return /^ko\b/i.test(locale)?'ko':'zh';return 'latin';}
export interface HIGTextProps extends TextProps {/** Script used for registered font selection and letter spacing; detected from children when omitted. Shared punctuation follows accessibilityLanguage, then the provider locale. */script?:TextScript;/** Caps Dynamic Type / Android font scale for dense numeric readouts (2 = 200%). Defaults to HIGProvider `maxFontSizeMultiplier`; never disable scaling. */maxFontSizeMultiplier?:number;/** `muted` draws secondary text, such as a note under a group, in the muted role. A `style` colour still wins. */tone?:'muted';/** `caption` draws the 12/18 caption size instead of the 16/24 body size. A `style` size still wins. */size?:'caption'}
const lastFallback = new WeakMap<Readonly<Record<string,string>>, {weight:string|number; family:string|undefined}>();
/** Keep a script in its registered companion face even when that family ships fewer static weights. */
function scriptFont(families:Readonly<Record<string,string>>|undefined,weight:string|number):string|undefined{
 if (!families) return undefined;
 const exact = families[weight];
 if (exact) return exact;
 const cached = lastFallback.get(families);
 if (cached?.weight === weight) return cached.family;

 const target = Number(weight);
 let nearest = Infinity;
 let distance = Infinity;
 for (const key of Object.keys(families)) {
  const candidate = Number(key);
  if (!Number.isFinite(candidate) || !families[candidate]) continue;
  const gap = Number.isNaN(target) ? 0 : Math.abs(candidate - target);
  if (gap < distance || (gap === distance && candidate < nearest)) {
   nearest = candidate;
   distance = gap;
  }
 }
 const family = Number.isFinite(nearest) ? families[nearest] : undefined;
 lastFallback.set(families, {weight, family});
 return family;
}
export const Text:React.ForwardRefExoticComponent<HIGTextProps&React.RefAttributes<React.ComponentRef<typeof RNText>>>=forwardRef<React.ComponentRef<typeof RNText>,HIGTextProps>(function Text({style:own,script,maxFontSizeMultiplier,tone,size,...props},ref){const env=useTextEnvironment();const colors=useColors();const style=tone||size?[tone==='muted'?{color:colors.muted}:null,size==='caption'?{fontSize:12,lineHeight:18}:null,own]:own;const resolved=StyleSheet.flatten(style);const requested=resolved?.fontWeight??400;const weight=requested==='normal'?400:requested==='bold'?700:requested;
 const resolvedScript=script??detectScript(typeof props.children==='string'?props.children:plainText(props.children),props.accessibilityLanguage??env.locale);const registered=resolved?.fontFamily?undefined:scriptFont(env.fontFamiliesByScript?.[resolvedScript],weight)??env.fontFamilies?.[weight];
 const tracking=resolvedScript==='latin'?undefined:{letterSpacing:(env.letterSpacingByScript?.[resolvedScript]??scriptLetterSpacing[resolvedScript])*(resolved?.fontSize??16)};
 return <RNText {...props} ref={ref} maxFontSizeMultiplier={maxFontSizeMultiplier??env.maxFontSizeMultiplier} style={[{color:colors.text,fontSize:16,lineHeight:24,fontFamily:env.fontFamily,writingDirection:env.direction},style,registered?{fontFamily:registered,fontWeight:'normal'}:undefined,tracking]}/>;});
export const Heading:React.ForwardRefExoticComponent<HIGTextProps&React.RefAttributes<React.ComponentRef<typeof RNText>>>=forwardRef<React.ComponentRef<typeof RNText>,HIGTextProps>(function Heading({style,...props},ref){return <Text {...props} ref={ref} accessibilityRole='header' style={[{fontSize:24,lineHeight:30,fontWeight:'600'},style]}/>;});
export function Stack({style,...props}:ViewProps){const direction=useLayoutDirection();return <View {...props} style={[{direction,gap:tokens.space.md},style]}/>;}
export function Inline({style,...props}:ViewProps){const direction=useLayoutDirection();return <View {...props} style={[{direction,flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:tokens.space.md},style]}/>;}
/** A filled card with no stroke; its fill and the space around it separate it from the page. */
export function Surface({style,children,...props}:ViewProps){const direction=useLayoutDirection();const colors=useColors();return <View {...props} style={[{direction,backgroundColor:colors.surface,borderRadius:tokens.radius.xl,padding:tokens.space.xl,minWidth:0},style]}><Raised>{children}</Raised></View>;}
export const Card=Surface;
export function Separator(){const fills=useFills();return <View accessibilityRole='none' style={{height:2,borderRadius:9999,backgroundColor:fills.raised}}/>;}
