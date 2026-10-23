"use client";
import type {FeedbackSink,FeedbackIntent} from '@bloxwap/hig-contracts/feedback';
import React,{createContext,useContext,useEffect,useMemo,useState,useRef,useId} from 'react';
import {defaultEnvironment,type Environment} from '@bloxwap/hig-contracts';
import {defaultMessages,resolveMessages,type HIGMessages} from '@bloxwap/hig-contracts/messages';
import {nativeSrgb,resolvePrimaryColor} from '@bloxwap/hig-tokens';
export type {HIGMessages} from '@bloxwap/hig-contracts/messages';
export interface HIGContext extends Environment { onAccepted?: (id:string)=>void; feedback?:FeedbackSink; /** Brand accent as opaque sRGB hex (#RGB or #RRGGBB). Nested providers inherit it; omitted at the root, Bloxwap green applies. */ primaryColor?:string; /** Host translations of built-in copy, merged through nested providers. Components fall back to the English export per key; read the full resolved catalog with `useMessages()`. */ messages:Readonly<Partial<HIGMessages>> }
export interface HIGProviderProps extends Partial<Omit<HIGContext,'messages'>> { /** Translations for HIG's built-in strings; omitted keys fall back to the enclosing provider, then English. */ messages?:Partial<HIGMessages> }
const Context=createContext<HIGContext>({...defaultEnvironment,messages:{}});
export function HIGProvider({children,density='comfortable',locale='en-US',direction='ltr',reducedMotion,onAccepted,feedback,primaryColor,messages}:React.PropsWithChildren<HIGProviderProps>){
 const parent=useContext(Context);const inherited=parent.messages;const resolved=useMemo(()=>resolveMessages(inherited,messages),[inherited,messages]);
 const accent=primaryColor??parent.primaryColor;const theme=useMemo(()=>primaryStyle(accent),[accent]);
 const [osReduced,setOSReduced]=useState(false);
 useEffect(()=>{const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!query)return;const update=()=>setOSReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 return <Context.Provider value={{density,locale,direction,reducedMotion:reducedMotion??osReduced,onAccepted,feedback,primaryColor:accent,messages:resolved}}><div style={theme} data-hig-density={density} data-hig-motion={reducedMotion??osReduced?'reduced':'full'} dir={direction} lang={locale}>{children}</div></Context.Provider>;
}
export const useHIG=()=>useContext(Context);
function primaryStyle(primaryColor?:string):React.CSSProperties|undefined {
 if(primaryColor===undefined)return undefined;
 const colors=resolvePrimaryColor(primaryColor);
 return {'--hig-action':colors.action,'--hig-focus':colors.focus,'--hig-onAction':colors.onAction} as React.CSSProperties;
}
/** Scoped primary colour variables for host-owned portals outside the provider's DOM. */
export function useThemeStyle():React.CSSProperties|undefined {const {primaryColor}=useHIG();return useMemo(()=>primaryStyle(primaryColor),[primaryColor]);}
/** Resolved sRGB roles for canvas and host-drawn content. CSS retains the default wide-gamut palette. */
export function useColors():Readonly<Record<keyof typeof nativeSrgb,string>> {const {primaryColor}=useHIG();return useMemo(()=>primaryColor===undefined?nativeSrgb:{...nativeSrgb,...resolvePrimaryColor(primaryColor)},[primaryColor]);}
/** Complete built-in copy for the nearest HIGProvider: host translations over the English defaults. */
export function useMessages():HIGMessages{const overrides=useContext(Context).messages;return useMemo(()=>resolveMessages({...defaultMessages},overrides),[overrides]);}
/** Controlled values never silently switch to internal state. */
export function useControllable<T>(value:T|undefined,initial:T,onChange?: (value:T)=>void,intent:FeedbackIntent='selection'):[T,(next:T)=>void]{
 const [internal,setInternal]=useState(initial);const current=value===undefined?internal:value;
 const {feedback}=useHIG();const id=useId();const sequence=useRef(0);const pending=useRef<{value:T}|null>(null);
 useEffect(()=>{const request=pending.current;if(!request)return;pending.current=null;if(Object.is(current,request.value)){try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent,origin:'programmatic'});}catch{/* Effects remain optional. */}}});
 return [current,(next)=>{if(Object.is(current,next))return;pending.current={value:next};if(value===undefined)setInternal(next);onChange?.(next);}];
}
