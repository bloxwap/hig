import type {FeedbackSink} from '@bloxwap/hig-contracts/feedback';
import React,{createContext,useContext,useEffect,useState,useRef,useId} from 'react';
import {AccessibilityInfo} from 'react-native';
import {defaultEnvironment,type Environment} from '@bloxwap/hig-contracts';
export interface HIGContext extends Environment {onAccepted?:(id:string)=>void;feedback?:FeedbackSink;fontFamily?:string}
const Context=createContext<HIGContext>(defaultEnvironment);
export function HIGProvider({children,density='comfortable',locale='en-US',direction='ltr',reducedMotion,onAccepted,feedback,fontFamily}:React.PropsWithChildren<Partial<HIGContext>>){
 const [osReduced,setOSReduced]=useState(false);
 useEffect(()=>{let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setOSReduced(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setOSReduced);return()=>{alive=false;sub.remove();};},[]);
 return <Context.Provider value={{density,locale,direction,reducedMotion:reducedMotion??osReduced,onAccepted,feedback,fontFamily}}>{children}</Context.Provider>;
}
export const useHIG=()=>useContext(Context);
export function useControllable<T>(value:T|undefined,initial:T,onChange?: (value:T)=>void):[T,(next:T)=>void]{
 const [internal,setInternal]=useState(initial);const current=value===undefined?internal:value;
 const {feedback}=useHIG();const id=useId();const sequence=useRef(0);const pending=useRef<{value:T}|null>(null);
 useEffect(()=>{const request=pending.current;if(!request)return;pending.current=null;if(Object.is(current,request.value)){try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent:'selection',origin:'native'});}catch{/* Effects remain optional. */}}});
 return [current,(next)=>{if(Object.is(current,next))return;pending.current={value:next};if(value===undefined)setInternal(next);onChange?.(next);}];
}
