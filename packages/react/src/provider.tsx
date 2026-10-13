"use client";
import type {FeedbackSink} from '@bloxwap/hig-contracts/feedback';
import React,{createContext,useContext,useEffect,useState,useRef,useId} from 'react';
import {defaultEnvironment,type Environment} from '@bloxwap/hig-contracts';
export interface HIGContext extends Environment { onAccepted?: (id:string)=>void; feedback?:FeedbackSink }
const Context=createContext<HIGContext>(defaultEnvironment);
export function HIGProvider({children,density='comfortable',locale='en-US',direction='ltr',reducedMotion,onAccepted,feedback}:React.PropsWithChildren<Partial<HIGContext>>){
 const [osReduced,setOSReduced]=useState(false);
 useEffect(()=>{const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!query)return;const update=()=>setOSReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 return <Context.Provider value={{density,locale,direction,reducedMotion:reducedMotion??osReduced,onAccepted,feedback}}><div data-hig-density={density} data-hig-motion={reducedMotion??osReduced?'reduced':'full'} dir={direction} lang={locale}>{children}</div></Context.Provider>;
}
export const useHIG=()=>useContext(Context);
/** Controlled values never silently switch to internal state. */
export function useControllable<T>(value:T|undefined,initial:T,onChange?: (value:T)=>void):[T,(next:T)=>void]{
 const [internal,setInternal]=useState(initial);const current=value===undefined?internal:value;
 const {feedback}=useHIG();const id=useId();const sequence=useRef(0);const pending=useRef<{value:T}|null>(null);
 useEffect(()=>{const request=pending.current;if(!request)return;pending.current=null;if(Object.is(current,request.value)){try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent:'selection',origin:'programmatic'});}catch{/* Effects remain optional. */}}});
 return [current,(next)=>{if(Object.is(current,next))return;pending.current={value:next};if(value===undefined)setInternal(next);onChange?.(next);}];
}
