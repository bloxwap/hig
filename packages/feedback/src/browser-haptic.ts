import type {FeedbackAdapter} from '@bloxwap/hig-contracts/feedback';
import {presets} from './contract.js';
const vibrationPatterns={selection:[8],success:[30,60,40],warning:[40,100,40],error:[40,40,40,40,40]} as const;
/** Browser vibration for accepted semantic events. iOS async haptics are explicitly unavailable. */
export function createBrowserHapticAdapter(backend?:{vibrate:(pattern:number|number[])=>boolean}):FeedbackAdapter {
 const target=backend??(typeof navigator!=='undefined'&&typeof navigator.vibrate==='function'?navigator:undefined);
 return {capability:{available:!!target,mechanism:target?'browser-vibration':'none',observed:false,reason:target?'Patterns approximate native cues; physical observation pending':'@bloxwap/haptic exposes physical targets, not iOS async imperative feedback'},play(event,prefs){if(!prefs.haptics)return;const cue=presets[event.intent].haptic;if(cue)target?.vibrate([...vibrationPatterns[cue]]);},cancel(){target?.vibrate(0);},dispose(){target?.vibrate(0);}};
}
