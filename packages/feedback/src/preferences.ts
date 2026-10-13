import {defaultPreferences} from './contract.js';
import type {FeedbackPreferences,PreferenceStorage} from '@bloxwap/hig-contracts/feedback';
export function migratePreferences(value:unknown):FeedbackPreferences {
 if(!value||typeof value!=='object')return {...defaultPreferences};const saved=value as Record<string,unknown>;
 const sound=saved.sound??saved.soundEnabled,haptics=saved.haptics??saved.hapticsEnabled;
 const volume=typeof saved.volume==='number'&&Number.isFinite(saved.volume)?Math.max(0,Math.min(1,saved.volume)):defaultPreferences.volume;
 return {version:1,sound:typeof sound==='boolean'?sound:defaultPreferences.sound,haptics:typeof haptics==='boolean'?haptics:defaultPreferences.haptics,volume,motion:typeof saved.motion==='boolean'?saved.motion:typeof saved.reducedMotion==='boolean'?!saved.reducedMotion:defaultPreferences.motion};
}
export function jsonStorage(storage:{getItem:(key:string)=>string|null|Promise<string|null>;setItem:(key:string,value:string)=>void|Promise<void>},key='bloxwap.hig.feedback.v1'):PreferenceStorage{return {read:async()=>{try{const raw=await storage.getItem(key);return raw?JSON.parse(raw):undefined;}catch{return undefined;}},write:value=>storage.setItem(key,JSON.stringify(value))};}
/** Avoid overwriting a user's new local choice with a delayed saved read. */
export async function loadPreferences(storage:PreferenceStorage|undefined,revision:()=>number,apply:(value:FeedbackPreferences)=>void){if(!storage)return;const initial=revision();try{const value=await storage.read();if(revision()===initial)apply(migratePreferences(value));}catch{/* Storage is optional. */}}
