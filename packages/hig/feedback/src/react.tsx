"use client";
import React,{createContext,useContext,useEffect,useMemo,useRef,useState,useCallback} from 'react';
import type {FeedbackPreferences,FeedbackSink,PreferenceStorage} from '@bloxwap/hig/contracts/feedback';
import {FeedbackController,defaultPreferences} from './contract.js';
import {loadPreferences,migratePreferences} from './preferences.js';
interface FeedbackContext {preferences:FeedbackPreferences;update:(next:Partial<FeedbackPreferences>)=>void;sink:FeedbackSink;controller:()=>FeedbackController|null}
const defaults:FeedbackContext={preferences:defaultPreferences,update:()=>{},sink:{emit:()=>{}},controller:()=>null};
const Context=createContext(defaults);
const RuntimeContext=createContext({sink:defaults.sink,controller:defaults.controller,motion:defaultPreferences.motion});
const HapticsContext=createContext(defaultPreferences.haptics);
function samePreferences(a:FeedbackPreferences,b:FeedbackPreferences){
 return a.sound===b.sound&&a.haptics===b.haptics&&a.volume===b.volume&&a.motion===b.motion;
}
export function FeedbackProvider({children,createController,storage,initialPreferences}:React.PropsWithChildren<{initialPreferences?:Partial<FeedbackPreferences>;createController:(prefs:FeedbackPreferences)=>FeedbackController;storage?:PreferenceStorage}>){
 const [preferences,setPreferences]=useState(()=>migratePreferences({...defaultPreferences,...initialPreferences}));const current=useRef(preferences);const revision=useRef(0);const controller=useRef<FeedbackController|null>(null);
 const publish=useCallback((value:FeedbackPreferences)=>{
  const previous=current.current;
  if(!samePreferences(previous,value)){
   current.current=value;
   setPreferences(value);
   controller.current?.updatePreferences(value);
  }else if(controller.current&&!samePreferences(controller.current.getPreferences(),value)){
   controller.current.updatePreferences(value);
  }
 },[]);
 const writes=useRef(Promise.resolve());
 const [sink]=useState<FeedbackSink>(()=>({emit:event=>controller.current?.emit(event)}));
 useEffect(()=>{const instance=createController(current.current);controller.current=instance;let alive=true;void loadPreferences(storage,()=>revision.current,value=>{if(alive)publish(value);});return()=>{alive=false;controller.current=null;instance.dispose();};},[createController,storage,publish]);
 const update=useCallback((next:Partial<FeedbackPreferences>)=>{revision.current++;const value=migratePreferences({...current.current,...next});publish(value);writes.current=writes.current.then(()=>storage?.write(value)).then(()=>{},()=>{});},[storage,publish]);
 const getController=useCallback(()=>controller.current,[]);
 const context=useMemo(()=>({preferences,update,sink,controller:getController}),[preferences,update,sink,getController]);
 const runtime=useMemo(()=>({sink,controller:getController,motion:preferences.motion}),[sink,getController,preferences.motion]);
 return <Context.Provider value={context}><RuntimeContext.Provider value={runtime}><HapticsContext.Provider value={preferences.haptics}>
  {children}
 </HapticsContext.Provider></RuntimeContext.Provider></Context.Provider>;
}
export const useFeedbackRuntime=()=>useContext(RuntimeContext);
export const useHapticsEnabled=()=>useContext(HapticsContext);
export const useFeedback=()=>useContext(Context);
export function FeedbackPreferencesControl({children}: {children:(context:Pick<FeedbackContext,'preferences'|'update'>)=>React.ReactNode}){const {preferences,update}=useFeedback();return <>{children({preferences,update})}</>;}
