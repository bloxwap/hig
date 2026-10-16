import React,{forwardRef,useId,useRef} from 'react';
import {Pressable,Text as RNText,Linking,Platform,View,type PressableProps} from 'react-native';
import {nativeSrgb as colors,nativeMetrics as tokens} from '@bloxwap/hig-tokens';
import type {Intent} from '@bloxwap/hig-contracts';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from './provider.js';
import {Text} from './surface.js';
import {plainText} from './text-content.js';
/** Adjacent text children such as `{label}: {value}` form one Text run so the label wraps as words, not gapped fragments. */
function labelRuns(children:React.ReactNode):React.ReactNode[]{const runs:React.ReactNode[]=[];for(const child of React.Children.toArray(children)){const text=typeof child==='string'||typeof child==='number'?String(child):null;const last=runs.length-1;if(text!==null&&typeof runs[last]==='string')runs[last]+=text;else runs.push(text??child);}return runs;}
export interface ButtonProps extends Omit<PressableProps,'children'> {children:React.ReactNode;intent?:Intent;busy?:boolean;/** Busy suffix for this button; defaults to HIGProvider `messages.busy`. `''` hides it (accessibilityState.busy stays set). */busyLabel?:string;fullWidth?:boolean;suppressFeedback?:boolean;/** Caps Dynamic Type / Android font scale for the label and busy suffix (2 = 200%). Defaults to HIGProvider `maxFontSizeMultiplier`, as for HIG Text. */maxFontSizeMultiplier?:number}
/**
 * Accessible name of a busy Button with text content (#94). React Native Android builds the content description from
 * the label plus state descriptions, so an unlabeled busy Button is announced only as "busy": the name must be set.
 * Android appends its own localized busy state description, so the visible suffix stays out of the name there (Korean
 * `처리 중` would otherwise be spoken twice). Elsewhere the name is the visible `{text} · {busy}`; `''` busy text gives the text alone.
 */
export function busyAccessibilityLabel(text:string,busyText:string,os:string=Platform.OS):string|undefined{if(!text)return undefined;return busyText&&os!=='android'?`${text} · ${busyText}`:text;}
export const Button=forwardRef<View,ButtonProps>(function Button({children,intent='primary',disabled,busy,busyLabel,fullWidth,suppressFeedback,maxFontSizeMultiplier,onPress,style,...props},ref){const env=useHIG();const id=useId();const sequence=useRef(0);const busyText=busyLabel??env.messages.busy??en.busy;const filled=intent==='primary'||intent==='destructive';
 // Label and suffix go through HIG Text: provider/prop font-scale cap, registered family for the weight, per-script tracking (#92).
 const labelStyle={color:filled?colors.onAction:colors.text,fontSize:16,fontWeight:'600' as const,writingDirection:env.direction,textAlign:'center' as const};
 return <Pressable {...props} ref={ref} accessibilityLabel={props.accessibilityLabel??(busy?busyAccessibilityLabel(plainText(children),busyText):undefined)} disabled={disabled||busy} accessibilityRole='button' accessibilityState={{...props.accessibilityState,disabled:!!disabled||!!busy,busy:!!busy}} onPress={e=>{if(disabled||busy)return;e.stopPropagation();onPress?.(e);if(!e.isDefaultPrevented()&&!disabled&&!busy&&!suppressFeedback){try{env.onAccepted?.(id);env.feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent:'activate',origin:'native'});}catch{/* Best effort only. */}}}} style={state=>[{minHeight:Math.max(48,tokens.density[env.density].target),paddingHorizontal:20,paddingVertical:12,borderRadius:9999,alignItems:'center',justifyContent:'center',backgroundColor:filled?(intent==='destructive'?colors.negative:colors.action):colors.nested,opacity:disabled||busy ? 0.5 : state.pressed ? 0.85 : 1,alignSelf:fullWidth?'stretch':'flex-start'},typeof style==='function'?style(state):style]}><View style={{direction:env.direction,flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:8}}>{labelRuns(children).map((child,i)=>typeof child==='string'?<Text key={`label-${i}`} maxFontSizeMultiplier={maxFontSizeMultiplier} style={labelStyle}>{child}</Text>:child)}{busy&&busyText?<Text maxFontSizeMultiplier={maxFontSizeMultiplier} style={labelStyle}> · {busyText}</Text>:null}</View></Pressable>;});
export function IconButton({label,children,...props}:ButtonProps & {label:string}){return <Button {...props} accessibilityLabel={label}>{children}</Button>;}
export function Link({href,children,onError}:React.PropsWithChildren<{href:string;onError?:(error:unknown)=>void}>){return <Pressable accessibilityRole='link' onPress={()=>{void Linking.openURL(href).catch(onError??(()=>{}));}} style={{minHeight:48,justifyContent:'center'}}><RNText style={{color:colors.action,textDecorationLine:'underline'}}>{children}</RNText></Pressable>;}
