"use client";
import type {FeedbackSink,FeedbackIntent} from '@bloxwap/hig-contracts/feedback';
import React,{createContext,useContext,useEffect,useMemo,useState,useRef,useId} from 'react';
import {defaultEnvironment,type Environment,type HIGMessages} from '@bloxwap/hig-contracts';
export interface HIGContext extends Environment { onAccepted?: (id:string)=>void; feedback?:FeedbackSink; /** Host overrides for built-in strings (#62); components fall back to the English export for missing keys. */ messages:Partial<HIGMessages> }
export type HIGProviderProps=React.PropsWithChildren<Partial<Omit<HIGContext,'messages'>> & {/** Translated built-in strings; missing keys inherit from an outer provider, then English. */ messages?:Partial<HIGMessages>}>;
const Context=createContext<HIGContext>({...defaultEnvironment,messages:{}});
export function HIGProvider({children,density='comfortable',locale='en-US',direction='ltr',reducedMotion,onAccepted,feedback,messages}:HIGProviderProps){
 const [osReduced,setOSReduced]=useState(false);const outer=useContext(Context).messages;const resolved=useMemo(()=>messages?{...outer,...Object.fromEntries(Object.entries(messages).filter(([,v])=>v!==undefined))}:outer,[outer,messages]);
 useEffect(()=>{const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!query)return;const update=()=>setOSReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 return <Context.Provider value={{density,locale,direction,reducedMotion:reducedMotion??osReduced,onAccepted,feedback,messages:resolved}}><div data-hig-density={density} data-hig-motion={reducedMotion??osReduced?'reduced':'full'} dir={direction} lang={locale}>{children}</div></Context.Provider>;
}
export const useHIG=()=>useContext(Context);
/** Built-in string overrides from the nearest HIGProviders; read `messages.key ?? en.key`. */
export const useMessages=()=>useContext(Context).messages;
/** Controlled values never silently switch to internal state. */
export function useControllable<T>(value:T|undefined,initial:T,onChange?: (value:T)=>void,intent:FeedbackIntent='selection'):[T,(next:T)=>void]{
 const [internal,setInternal]=useState(initial);const current=value===undefined?internal:value;
 const {feedback}=useHIG();const id=useId();const sequence=useRef(0);const pending=useRef<{value:T}|null>(null);
 useEffect(()=>{const request=pending.current;if(!request)return;pending.current=null;if(Object.is(current,request.value)){try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent,origin:'programmatic'});}catch{/* Effects remain optional. */}}});
 return [current,(next)=>{if(Object.is(current,next))return;pending.current={value:next};if(value===undefined)setInternal(next);onChange?.(next);}];
}
