import type {FeedbackSink,FeedbackIntent} from '@bloxwap/hig-contracts/feedback';
import React,{createContext,useContext,useEffect,useMemo,useState,useRef,useId} from 'react';
import {AccessibilityInfo,I18nManager} from 'react-native';
import {defaultEnvironment,type Environment} from '@bloxwap/hig-contracts';
import {defaultMessages,resolveMessages,type HIGMessages} from '@bloxwap/hig-contracts/messages';
export type {HIGMessages} from '@bloxwap/hig-contracts/messages';
export interface HIGContext extends Environment {onAccepted?:(id:string)=>void;feedback?:FeedbackSink;fontFamily?:string;fontFamilies?:Readonly<Record<string,string>>;/** Registered monospace face for code/commands, e.g. BloxwapMonoRegular. */monoFontFamily?:string;/** Default Dynamic Type / font-scale cap for HIG Text; a Text prop overrides it. Leave unset for prose. */maxFontSizeMultiplier?:number;/** Per-script letter spacing in em for Korean and Chinese companion faces; overrides `scriptLetterSpacing`. */letterSpacingByScript?:Readonly<Partial<Record<'ko'|'zh',number>>>;/** Host translations of built-in copy, merged through nested providers. Components fall back to the English export per key; read the full resolved catalog with `useMessages()`. */messages:Readonly<Partial<HIGMessages>>}
export interface HIGProviderProps extends Partial<Omit<HIGContext,'messages'>> {/** Translations for HIG's built-in strings; omitted keys fall back to the enclosing provider, then English. */messages?:Partial<HIGMessages>}
const Context=createContext<HIGContext>({...defaultEnvironment,direction:I18nManager.isRTL?'rtl':'ltr',messages:{}});
/** Direction defaults to the OS layout direction (I18nManager) so HIG roots never force LTR inside an RTL app. */
export function HIGProvider({children,density='comfortable',locale='en-US',direction=I18nManager.isRTL?'rtl':'ltr',reducedMotion,onAccepted,feedback,fontFamily,fontFamilies,monoFontFamily,maxFontSizeMultiplier,letterSpacingByScript,messages}:React.PropsWithChildren<HIGProviderProps>){
 const inherited=useContext(Context).messages;const resolved=useMemo(()=>resolveMessages(inherited,messages),[inherited,messages]);
 const [osReduced,setOSReduced]=useState(false);
 useEffect(()=>{let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setOSReduced(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setOSReduced);return()=>{alive=false;sub.remove();};},[]);
 return <Context.Provider value={{density,locale,direction,reducedMotion:reducedMotion??osReduced,onAccepted,feedback,fontFamily,fontFamilies,monoFontFamily,maxFontSizeMultiplier,letterSpacingByScript,messages:resolved}}>{children}</Context.Provider>;
}
export const useHIG=()=>useContext(Context);
/** Complete built-in copy for the nearest HIGProvider: host translations over the English defaults. */
export function useMessages():HIGMessages{const overrides=useContext(Context).messages;return useMemo(()=>resolveMessages({...defaultMessages},overrides),[overrides]);}
export function useControllable<T>(value:T|undefined,initial:T,onChange?: (value:T)=>void,intent:FeedbackIntent='selection'):[T,(next:T)=>void]{
 const [internal,setInternal]=useState(initial);const current=value===undefined?internal:value;
 const {feedback}=useHIG();const id=useId();const sequence=useRef(0);const pending=useRef<{value:T}|null>(null);
 useEffect(()=>{const request=pending.current;if(!request)return;pending.current=null;if(Object.is(current,request.value)){try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent,origin:'native'});}catch{/* Effects remain optional. */}}});
 return [current,(next)=>{if(Object.is(current,next))return;pending.current={value:next};if(value===undefined)setInternal(next);onChange?.(next);}];
}
