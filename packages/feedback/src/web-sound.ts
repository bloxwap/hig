import type {FeedbackAdapter,FeedbackEvent,FeedbackPreferences} from '@bloxwap/hig-contracts/feedback';
import {presets} from './contract.js';
type SfxEngine=Pick<typeof import('@bloxwap/sfx'),'unlock'|'play'|'preload'|'dispose'>;
let shared:Promise<SfxEngine>|undefined;let users=0;
/** No import/AudioContext until an enabled semantic request follows a trusted gesture. */
export function createWebSoundAdapter(load:()=>Promise<SfxEngine>=()=>import('@bloxwap/sfx')):FeedbackAdapter {
 let dead=false,generation=0,used=false;let scope:AbortController|undefined;const defaultEngine=arguments.length===0;
 const cancel=()=>{generation++;scope?.abort();scope=undefined;};
 return {capability:{available:typeof window!=='undefined',mechanism:'web-audio',observed:false,reason:'Shared engine with per-root abort where supported; API readiness is not observed playback'},
 async play(event:FeedbackEvent,prefs:FeedbackPreferences){if(dead||!prefs.sound||prefs.volume<=0)return;const recipe=presets[event.intent].sound;if(!recipe)return;const epoch=++generation;const signal=(scope??=new AbortController()).signal;if(!used){used=true;if(defaultEngine)users++;}const engine=await (defaultEngine?(shared??=load()):load());if(dead||epoch!==generation)return;if(await engine.unlock()){if(!dead&&epoch===generation){const options={volume:prefs.volume,minInterval:presets[event.intent].cooldown,signal};engine.play(recipe,options);}}},
 cancel,
 dispose(){if(dead)return;dead=true;cancel();if(used&&defaultEngine&&--users===0){const last=shared;shared=undefined;void last?.then(engine=>{if(users===0)engine.dispose();}).catch(()=>{});}}
 };
}
