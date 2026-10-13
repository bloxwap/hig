"use client";
import React,{createContext,useContext,useEffect,useState} from 'react';
import {defaultEnvironment,type Environment} from '@bloxwap/hig-contracts';
export interface HIGContext extends Environment { onAccepted?: (id:string)=>void }
const Context=createContext<HIGContext>(defaultEnvironment);
export function HIGProvider({children,density='comfortable',locale='en-US',direction='ltr',reducedMotion,onAccepted}:React.PropsWithChildren<Partial<HIGContext>>){
 const [osReduced,setOSReduced]=useState(false);
 useEffect(()=>{const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!query)return;const update=()=>setOSReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 return <Context.Provider value={{density,locale,direction,reducedMotion:reducedMotion??osReduced,onAccepted}}><div data-hig-density={density} data-hig-motion={reducedMotion??osReduced?'reduced':'full'} dir={direction} lang={locale}>{children}</div></Context.Provider>;
}
export const useHIG=()=>useContext(Context);
/** Controlled values never silently switch to internal state. */
export function useControllable<T>(value:T|undefined,initial:T,onChange?: (value:T)=>void):[T,(next:T)=>void]{
 const [internal,setInternal]=useState(initial);const current=value===undefined?internal:value;
 return [current,(next)=>{if(Object.is(current,next))return;if(value===undefined)setInternal(next);onChange?.(next);}];
}
