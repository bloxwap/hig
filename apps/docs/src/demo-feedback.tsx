'use client';
import {useEffect,useMemo,type ReactNode} from 'react';
import {FeedbackProvider,useFeedbackRuntime} from '@bloxwap/hig/feedback/react';
import {FeedbackController,type FeedbackPreferences} from '@bloxwap/hig/feedback';
import {createWebSoundAdapter} from '@bloxwap/hig/feedback/web-sound';
import {createBrowserHapticAdapter} from '@bloxwap/hig/feedback/browser-haptic';
import {jsonStorage} from '@bloxwap/hig/feedback/preferences';

const createController=(preferences:FeedbackPreferences)=>new FeedbackController({
 preferences,sound:createWebSoundAdapter(),haptics:createBrowserHapticAdapter(),
});

export function DemoFeedback({children}:{children:ReactNode}){
 const storage=useMemo(()=>typeof window==='undefined'?undefined:jsonStorage(window.localStorage),[]);
 return <FeedbackProvider createController={createController} storage={storage}>{children}</FeedbackProvider>;
}

export function useDemoFeedback(){
 const feedback=useFeedbackRuntime();
 const {controller}=feedback;
 useEffect(()=>{
  const background=()=>controller()?.setBackground(document.hidden);
  background();
  document.addEventListener('visibilitychange',background);
  return ()=>document.removeEventListener('visibilitychange',background);
 },[controller]);
 return feedback;
}
