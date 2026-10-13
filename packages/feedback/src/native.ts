import type {FeedbackAdapter,FeedbackEvent,FeedbackPreferences} from '@bloxwap/hig-contracts/feedback';
import {presets} from './contract.js';
export interface NativePlayer {play:()=>void;pause:()=>void;seekTo:(seconds:number)=>Promise<void>;remove:()=>void;volume:number}
export interface NativeAudioBackend {create:(asset:unknown)=>NativePlayer;configure?:()=>Promise<void>}
export type CueAssets=Readonly<Partial<Record<'tick'|'toggle'|'success'|'error',unknown>>>;
/** Host provides packaged Metro asset ids and lifecycle hooks; no browser audio at module load. */
export function createNativeSoundAdapter(backend:NativeAudioBackend,assets:CueAssets):FeedbackAdapter & {preload:()=>Promise<void>} {
 const players=new Map<string,NativePlayer>();let dead=false,epoch=0;let configured:Promise<void>|undefined;
 const preload=async()=>{if(dead)return;configured??=backend.configure?.()??Promise.resolve();await configured;if(dead)return;for(const [name,asset] of Object.entries(assets))if(asset!=null&&!players.has(name))players.set(name,backend.create(asset));};
 const cancel=()=>{epoch++;for(const player of players.values())try{player.pause();}catch{/* Continue cleaning other players. */}};
 return {capability:{available:true,mechanism:'native-audio',observed:false,reason:'Backend supplied; playback latency/silent mode/interruption observations pending'},preload,
 async play(event:FeedbackEvent,prefs:FeedbackPreferences){if(dead||!prefs.sound||prefs.volume<=0)return;const cue=presets[event.intent].sound;if(!cue||assets[cue]==null)return;const generation=epoch;await preload();if(dead||generation!==epoch)return;const player=players.get(cue);if(!player)return;cancel();const requested=epoch;player.volume=prefs.volume;await player.seekTo(0);if(!dead&&requested===epoch)player.play();},cancel,
 dispose(){if(dead)return;dead=true;cancel();for(const player of players.values())try{player.remove();}catch{/* Release all remaining players. */}players.clear();}
 };
}
/** Host imports Expo only in its native feedback setup. This bridge keeps the contract injectable. */
export function expoAudioBackend(expo:Pick<typeof import('expo-audio'),'createAudioPlayer'|'setAudioModeAsync'>):NativeAudioBackend{return {create:asset=>expo.createAudioPlayer(asset as Parameters<typeof expo.createAudioPlayer>[0]),configure:()=>expo.setAudioModeAsync({playsInSilentMode:false,shouldPlayInBackground:false,interruptionMode:'doNotMix'})};}
export interface NativeHapticBackend {selection:()=>Promise<void>;impact:(style:'light'|'medium'|'heavy')=>Promise<void>;notification:(type:'success'|'warning'|'error')=>Promise<void>}
export function createNativeHapticAdapter(backend:NativeHapticBackend,available=true):FeedbackAdapter {let dead=false;return {capability:{available,mechanism:available?'native-haptics':'none',observed:false,reason:'Native backend supplied; OS settings/hardware may suppress output'},play(event,prefs){if(dead||!available||!prefs.haptics)return;if(event.impact)return backend.impact(event.impact);const cue=presets[event.intent].haptic;return cue==='selection'?backend.selection():cue?backend.notification(cue):undefined;},dispose(){dead=true;}};}
export function expoHapticBackend(expo:typeof import('expo-haptics')):NativeHapticBackend{return {selection:()=>expo.selectionAsync(),impact:style=>expo.impactAsync(style==='light'?expo.ImpactFeedbackStyle.Light:style==='medium'?expo.ImpactFeedbackStyle.Medium:expo.ImpactFeedbackStyle.Heavy),notification:type=>expo.notificationAsync(type==='success'?expo.NotificationFeedbackType.Success:type==='warning'?expo.NotificationFeedbackType.Warning:expo.NotificationFeedbackType.Error)};}
