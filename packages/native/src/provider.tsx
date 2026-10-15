import type {FeedbackSink,FeedbackIntent} from '@bloxwap/hig-contracts/feedback';
import React,{createContext,useContext,useEffect,useState,useRef,useId} from 'react';
import {AccessibilityInfo,I18nManager} from 'react-native';
import {defaultEnvironment,type Environment} from '@bloxwap/hig-contracts';
export interface HIGContext extends Environment {onAccepted?:(id:string)=>void;feedback?:FeedbackSink;fontFamily?:string;fontFamilies?:Readonly<Record<string,string>>;/** Registered monospace face for code/commands, e.g. BloxwapMonoRegular. */monoFontFamily?:string;/** Default Dynamic Type / font-scale cap for HIG Text; a Text prop overrides it. Leave unset for prose. */maxFontSizeMultiplier?:number;/** Per-script letter spacing in em for Korean and Chinese companion faces; overrides `scriptLetterSpacing`. */letterSpacingByScript?:Readonly<Partial<Record<'ko'|'zh',number>>>}
const Context=createContext<HIGContext>({...defaultEnvironment,direction:I18nManager.isRTL?'rtl':'ltr'});
/** Direction defaults to the OS layout direction (I18nManager) so HIG roots never force LTR inside an RTL app. */
export function HIGProvider({children,density='comfortable',locale='en-US',direction=I18nManager.isRTL?'rtl':'ltr',reducedMotion,onAccepted,feedback,fontFamily,fontFamilies,monoFontFamily,maxFontSizeMultiplier,letterSpacingByScript}:React.PropsWithChildren<Partial<HIGContext>>){
 const [osReduced,setOSReduced]=useState(false);
 useEffect(()=>{let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setOSReduced(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setOSReduced);return()=>{alive=false;sub.remove();};},[]);
 return <Context.Provider value={{density,locale,direction,reducedMotion:reducedMotion??osReduced,onAccepted,feedback,fontFamily,fontFamilies,monoFontFamily,maxFontSizeMultiplier,letterSpacingByScript}}>{children}</Context.Provider>;
}
export const useHIG=()=>useContext(Context);
export function useControllable<T>(value:T|undefined,initial:T,onChange?: (value:T)=>void,intent:FeedbackIntent='selection'):[T,(next:T)=>void]{
 const [internal,setInternal]=useState(initial);const current=value===undefined?internal:value;
 const {feedback}=useHIG();const id=useId();const sequence=useRef(0);const pending=useRef<{value:T}|null>(null);
 useEffect(()=>{const request=pending.current;if(!request)return;pending.current=null;if(Object.is(current,request.value)){try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent,origin:'native'});}catch{/* Effects remain optional. */}}});
 return [current,(next)=>{if(Object.is(current,next))return;pending.current={value:next};if(value===undefined)setInternal(next);onChange?.(next);}];
}
