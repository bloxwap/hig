import type {FeedbackSink,FeedbackIntent} from '@bloxwap/hig-contracts/feedback';
import React,{createContext,useContext,useEffect,useMemo,useState,useRef,useId} from 'react';
import {AccessibilityInfo,I18nManager} from 'react-native';
import {defaultEnvironment,type Environment} from '@bloxwap/hig-contracts';
import {nativeColors,nativeSrgb} from '@bloxwap/hig-tokens';
import {defaultMessages,resolveMessages,type HIGMessages} from '@bloxwap/hig-contracts/messages';
export type {HIGMessages} from '@bloxwap/hig-contracts/messages';
export interface HIGContext extends Environment {onAccepted?:(id:string)=>void;feedback?:FeedbackSink;fontFamily?:string;fontFamilies?:Readonly<Record<string,string>>;/** Registered static faces by script and weight, e.g. {ko:{400:'BloxwapSansKRRegular'}}. Text prefers its detected script's map; unavailable weights use the nearest registered weight in that script. */fontFamiliesByScript?:Readonly<Partial<Record<'latin'|'ko'|'zh',Readonly<Record<string,string>>>>>;/** Registered monospace face for code/commands, e.g. BloxwapMonoRegular. */monoFontFamily?:string;/** Default Dynamic Type / font-scale cap for HIG Text; a Text prop overrides it. Leave unset for prose. */maxFontSizeMultiplier?:number;/** Per-script letter spacing in em for Korean and Chinese companion faces; overrides `scriptLetterSpacing`. */letterSpacingByScript?:Readonly<Partial<Record<'ko'|'zh',number>>>;/** Host translations of built-in copy, merged through nested providers. Components fall back to the English export per key; read the full resolved catalog with `useMessages()`. */messages:Readonly<Partial<HIGMessages>>}
export type NativeColorSpace='srgb'|'display-p3';
export type NativeColorTable=Readonly<Record<keyof typeof nativeSrgb,string>>;
export interface HIGProviderProps extends Partial<Omit<HIGContext,'messages'|'colors'>> {/** Match the host's native drawing colour space. Nested providers inherit it; only HIG's canonical tables are used. */colorSpace?:NativeColorSpace;/** Translations for HIG's built-in strings; omitted keys fall back to the enclosing provider, then English. */messages?:Partial<HIGMessages>}
type NativeContext=HIGContext&{colorSpace:NativeColorSpace;colors:NativeColorTable};
const Context=createContext<NativeContext>({...defaultEnvironment,direction:I18nManager.isRTL?'rtl':'ltr',colorSpace:'srgb',colors:nativeSrgb,messages:{}});
const rtlScripts=new Set(['Adlm','Arab','Hebr','Mand','Nkoo','Rohg','Samr','Syrc','Thaa']);
/** Locale fallback for RN versions whose Android I18nManager incorrectly reports LTR. An explicit direction always wins. */
export function directionForLocale(locale:string):Environment['direction']{
 try{const script=new Intl.Locale(locale).maximize().script;if(script)return rtlScripts.has(script)?'rtl':'ltr';}catch{/* Older hosts can still supply a BCP-47 locale or an explicit direction. */}
 return /^(?:ar|ckb|dv|fa|he|iw|nqo|ps|sd|syr|ug|ur|yi)(?:-|$)/i.test(locale)?'rtl':'ltr';
}
function systemLocale(){try{return Intl.DateTimeFormat().resolvedOptions().locale;}catch{return defaultEnvironment.locale;}}
/** Native OS RTL is preserved; the app locale also selects RTL when I18nManager reports a false LTR. */
export function HIGProvider({children,density='comfortable',locale:requestedLocale,direction,colorSpace,reducedMotion,onAccepted,feedback,fontFamily,fontFamilies,fontFamiliesByScript,monoFontFamily,maxFontSizeMultiplier,letterSpacingByScript,messages}:React.PropsWithChildren<HIGProviderProps>){
 const locale=requestedLocale??defaultEnvironment.locale;
 const resolvedDirection=direction??(I18nManager.isRTL?'rtl':directionForLocale(requestedLocale??systemLocale()));
 const inherited=useContext(Context);const resolved=useMemo(()=>resolveMessages(inherited.messages,messages),[inherited.messages,messages]);
 const resolvedSpace=colorSpace??inherited.colorSpace;const colors=resolvedSpace==='display-p3'?nativeColors.iosDisplayP3:nativeSrgb;
 const [osReduced,setOSReduced]=useState(false);
 useEffect(()=>{let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setOSReduced(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setOSReduced);return()=>{alive=false;sub.remove();};},[]);
 return <Context.Provider value={{density,locale,direction:resolvedDirection,colorSpace:resolvedSpace,colors,reducedMotion:reducedMotion??osReduced,onAccepted,feedback,fontFamily,fontFamilies,fontFamiliesByScript:fontFamiliesByScript??inherited.fontFamiliesByScript,monoFontFamily,maxFontSizeMultiplier,letterSpacingByScript,messages:resolved}}>{children}</Context.Provider>;
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
