import type {FeedbackAdapter,FeedbackEvent,FeedbackPreferences,FeedbackSink} from '@bloxwap/hig/contracts/feedback';
export type {FeedbackAdapter,FeedbackEvent,FeedbackPreferences,FeedbackSink,FeedbackCapability,PreferenceStorage,FeedbackIntent} from '@bloxwap/hig/contracts/feedback';
export const defaultPreferences:FeedbackPreferences={version:1,sound:false,haptics:false,volume:0.3,motion:true};
import {presets} from './presets.js';
export {presets} from './presets.js';
function attempt(fn?:()=>void|Promise<void>){if(!fn)return;try{Promise.resolve(fn()).catch(()=>{});}catch{/* Feedback never changes the primary action. */}}
export interface ControllerOptions {sound?:FeedbackAdapter;/** Warm an opted-in sound backend when playback first becomes audible. */prepareSound?:()=>void|Promise<void>;haptics?:FeedbackAdapter;preferences?:Partial<FeedbackPreferences>;now?:()=>number;policy?:{sound?:boolean;haptics?:boolean};maxRemembered?:number}
export class FeedbackController implements FeedbackSink {
 private preferences:FeedbackPreferences;private seen=new Map<string,number>();private cadence=new Map<string,number>();private dead=false;private background=false;private clock:()=>number;
 constructor(private options:ControllerOptions={}){this.preferences={...defaultPreferences};this.clock=options.now??Date.now;this.updatePreferences(options.preferences??{});}
 getPreferences(){return {...this.preferences};}
 getCapabilities(){return {sound:this.options.sound?.capability??{available:false,mechanism:'none',observed:false},haptics:this.options.haptics?.capability??{available:false,mechanism:'none',observed:false}};}
 updatePreferences(next:Partial<FeedbackPreferences>){
  const wasAudible=this.preferences.sound&&this.preferences.volume>0;
  this.preferences={...this.preferences,...next,version:1};
  this.preferences.volume=Number.isFinite(this.preferences.volume)?Math.max(0,Math.min(1,this.preferences.volume)):defaultPreferences.volume;
  if(!this.preferences.sound||this.preferences.volume<=0)attempt(this.options.sound?.cancel?.bind(this.options.sound));
  else if(!wasAudible)this.prepareSound();
  if(!this.preferences.haptics)attempt(this.options.haptics?.cancel?.bind(this.options.haptics));
 }
 private prepareSound(){
  if(!this.dead&&!this.background&&this.preferences.sound&&this.preferences.volume>0&&this.options.policy?.sound!==false&&this.options.sound)attempt(this.options.prepareSound);
 }
 setBackground(value:boolean){
  const wasBackground=this.background;
  this.background=value;
  if(value){attempt(this.options.sound?.cancel?.bind(this.options.sound));attempt(this.options.haptics?.cancel?.bind(this.options.haptics));}
  else if(wasBackground)this.prepareSound();
 }
 emit=(event:FeedbackEvent):void=>{
  if(this.dead||this.background||event.cancelled||event.disabled||event.busy||event.suppressed)return;
  if(event.intent==='cancel'){attempt(this.options.sound?.cancel?.bind(this.options.sound));attempt(this.options.haptics?.cancel?.bind(this.options.haptics));return;}
  const now=this.clock(),key=JSON.stringify([event.source,event.id,event.intent]),cadenceKey=JSON.stringify([event.source,event.intent]);
  if(this.seen.has(key)||now-(this.cadence.get(cadenceKey)??-Infinity)<presets[event.intent].cooldown)return;
  this.seen.set(key,now);this.cadence.set(cadenceKey,now);
  const requestedCap=this.options.maxRemembered??256;const cap=Number.isFinite(requestedCap)?Math.max(1,Math.trunc(requestedCap)):256;while(this.seen.size>cap)this.seen.delete(this.seen.keys().next().value!);while(this.cadence.size>cap)this.cadence.delete(this.cadence.keys().next().value!);
  const prefs=this.getPreferences();
  if(prefs.sound&&prefs.volume>0&&this.options.policy?.sound!==false&&this.options.sound?.capability.available&&presets[event.intent].sound)attempt(()=>this.options.sound!.play(event,prefs));
  if(prefs.haptics&&this.options.policy?.haptics!==false&&this.options.haptics?.capability.available&&(presets[event.intent].haptic||event.impact))attempt(()=>this.options.haptics!.play(event,prefs));
 };
 dispose(){if(this.dead)return;this.dead=true;attempt(this.options.sound?.dispose?.bind(this.options.sound));attempt(this.options.haptics?.dispose?.bind(this.options.haptics));this.seen.clear();this.cadence.clear();}
}
