import React,{createContext,useContext,useEffect,useState} from 'react';
import {AccessibilityInfo} from 'react-native';
import {defaultEnvironment,type Environment} from '@bloxwap/hig-contracts';
export interface HIGContext extends Environment {onAccepted?:(id:string)=>void;fontFamily?:string}
const Context=createContext<HIGContext>(defaultEnvironment);
export function HIGProvider({children,density='comfortable',locale='en-US',direction='ltr',reducedMotion,onAccepted,fontFamily}:React.PropsWithChildren<Partial<HIGContext>>){
 const [osReduced,setOSReduced]=useState(false);
 useEffect(()=>{let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setOSReduced(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setOSReduced);return()=>{alive=false;sub.remove();};},[]);
 return <Context.Provider value={{density,locale,direction,reducedMotion:reducedMotion??osReduced,onAccepted,fontFamily}}>{children}</Context.Provider>;
}
export const useHIG=()=>useContext(Context);
export function useControllable<T>(value:T|undefined,initial:T,onChange?:(value:T)=>void):[T,(value:T)=>void]{const [state,set]=useState(initial);const current=value===undefined?state:value;return [current,next=>{if(Object.is(next,current))return;if(value===undefined)set(next);onChange?.(next);}];}
