"use client";
import React,{createContext,useContext,useEffect,useRef,useState,useCallback} from 'react';
import type {FeedbackPreferences,FeedbackSink,PreferenceStorage} from '@bloxwap/hig-contracts/feedback';
import {FeedbackController,defaultPreferences} from './contract.js';
import {loadPreferences,migratePreferences} from './preferences.js';
interface FeedbackContext {preferences:FeedbackPreferences;update:(next:Partial<FeedbackPreferences>)=>void;sink:FeedbackSink;controller:()=>FeedbackController|null}
const Context=createContext<FeedbackContext>({preferences:defaultPreferences,update:()=>{},sink:{emit:()=>{}},controller:()=>null});
export function FeedbackProvider({children,createController,storage}:React.PropsWithChildren<{createController:(prefs:FeedbackPreferences)=>FeedbackController;storage?:PreferenceStorage}>){
 const [preferences,setPreferences]=useState({...defaultPreferences});const current=useRef(preferences);const revision=useRef(0);const controller=useRef<FeedbackController|null>(null);
 const [sink]=useState<FeedbackSink>(()=>({emit:event=>controller.current?.emit(event)}));
 useEffect(()=>{const instance=createController(current.current);controller.current=instance;let alive=true;void loadPreferences(storage,()=>revision.current,value=>{if(!alive)return;current.current=value;setPreferences(value);instance.updatePreferences(value);});return()=>{alive=false;controller.current=null;instance.dispose();};},[createController,storage]);
 const update=useCallback((next:Partial<FeedbackPreferences>)=>{revision.current++;const value=migratePreferences({...current.current,...next});current.current=value;setPreferences(value);controller.current?.updatePreferences(value);try{Promise.resolve(storage?.write(value)).catch(()=>{});}catch{/* Preferences remain live without storage. */}},[storage]);
 const getController=useCallback(()=>controller.current,[]);
 return <Context.Provider value={{preferences,update,sink,controller:getController}}>{children}</Context.Provider>;
}
export const useFeedback=()=>useContext(Context);
export function FeedbackPreferencesControl({children}: {children:(context:Pick<FeedbackContext,'preferences'|'update'>)=>React.ReactNode}){const {preferences,update}=useFeedback();return <>{children({preferences,update})}</>;}
