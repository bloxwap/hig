import type {FeedbackAdapter,FeedbackCapability} from '@bloxwap/hig-contracts/feedback';
import {presets} from './contract.js';
const vibrationPatterns={selection:[8],success:[30,60,40],warning:[40,100,40],error:[40,40,40,40,40]} as const;
type HapticCue=keyof typeof vibrationPatterns;
export interface BrowserVibrationBackend {vibrate:(pattern:number|number[])=>boolean}
/** Optional structural bridge to the merged @bloxwap/haptic imperative API; no package import. */
export interface ImperativeHapticBackend {
 canTriggerHaptic:()=>FeedbackCapability;
 triggerHaptic:(cue:HapticCue)=>Promise<{delivered:boolean;mechanism:'browser-vibration'|'physical-tap'|'none';reason?:string}>;
}
/** Browser vibration for accepted semantic events. iOS imperative haptics remain unavailable. */
export function createBrowserHapticAdapter(backend?:BrowserVibrationBackend|ImperativeHapticBackend):FeedbackAdapter {
 let dead=false;
 const imperative=backend&&'canTriggerHaptic' in backend?backend:undefined;
 const target=backend&&'vibrate' in backend?backend:typeof navigator!=='undefined'&&typeof navigator.vibrate==='function'?navigator:undefined;
 const capability=():FeedbackCapability=>{
  if(dead)return {available:false,mechanism:'none',observed:false,reason:'Adapter disposed'};
  if(imperative){try{return {...imperative.canTriggerHaptic(),observed:false};}catch{return {available:false,mechanism:'none',observed:false,reason:'Imperative capability probe failed'};}}
  return {available:!!target,mechanism:target?'browser-vibration':'none',observed:false,reason:target?'Patterns approximate native cues; physical observation pending':'Imperative iOS feedback is unavailable; use an eligible physical-tap target'};
 };
 const cancel=()=>{target?.vibrate(0);};
 return {get capability(){return capability();},play(event,prefs){if(dead||!prefs.haptics)return;const cue=presets[event.intent].haptic;if(!cue)return;
  if(imperative){if(!capability().available)return;try{return imperative.triggerHaptic(cue).then(()=>{},()=>{});}catch{return;}}
  target?.vibrate([...vibrationPatterns[cue]]);
 },cancel,dispose(){if(dead)return;dead=true;cancel();}};
}
