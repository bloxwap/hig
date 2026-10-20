import {describe,it,expect,vi} from 'vitest';
import {createWebSoundAdapter} from '../packages/feedback/src/web-sound';
import {createBrowserHapticAdapter} from '../packages/feedback/src/browser-haptic';
import {createNativeSoundAdapter,createNativeHapticAdapter,type NativePlayer} from '../packages/feedback/src/native';
import {FeedbackController} from '../packages/feedback/src/contract';
import {migratePreferences,jsonStorage,loadPreferences} from '../packages/feedback/src/preferences';
import type {FeedbackEvent} from '../packages/contracts/src/feedback';
type SfxEngine=Pick<typeof import('@bloxwap/sfx'),'unlock'|'play'|'preload'|'dispose'>;
const prefs={version:1 as const,sound:true,haptics:true,volume:.4,motion:false};
const event:FeedbackEvent={id:'1',source:'test',intent:'activate',origin:'keyboard'};
describe('adapter lifecycle and preference bridges',()=>{
 it('keeps muted web audio unloaded and cancels pending startup',async()=>{let resolve!: (v:SfxEngine)=>void;const play=vi.fn<SfxEngine["play"]>();const load=vi.fn(()=>new Promise<Parameters<typeof resolve>[0]>(r=>{resolve=r;}));const sound=createWebSoundAdapter(load);await sound.play(event,{...prefs,sound:false});expect(load).not.toHaveBeenCalled();const pending=sound.play(event,prefs);sound.cancel?.();resolve({unlock:async()=>true,play,preload:vi.fn<SfxEngine["preload"]>(),dispose:vi.fn<SfxEngine["dispose"]>()});await pending;expect(play).not.toHaveBeenCalled();});
 it('passes per-call web volume without global preference mutations',async()=>{const play=vi.fn();const sound=createWebSoundAdapter(async()=>({unlock:async()=>true,play,preload:vi.fn(),dispose:vi.fn()}));await sound.play(event,prefs);expect(play).toHaveBeenCalledWith('tick',{volume:.4,minInterval:80,signal:expect.any(AbortSignal)});});
 it('maps browser vibration once and exposes no iOS imperative promise',()=>{const vibrate=vi.fn(()=>true);const h=createBrowserHapticAdapter({vibrate});h.play({...event,intent:'success'},prefs);expect(vibrate).toHaveBeenCalledWith([30,60,40]);expect(h.capability.observed).toBe(false);h.cancel?.();expect(vibrate).toHaveBeenLastCalledWith(0);});
 it('caches native players, honors volume/missing assets and releases every player',async()=>{const players:NativePlayer[]=[];const backend={create:vi.fn(()=>{const p={play:vi.fn(),pause:vi.fn(),seekTo:vi.fn(async()=>{}),remove:vi.fn(),volume:1};players.push(p);return p;}),configure:vi.fn(async()=>{})};const sound=createNativeSoundAdapter(backend,{tick:1,toggle:2});await sound.preload();await sound.preload();expect(backend.create).toHaveBeenCalledTimes(2);await sound.play(event,prefs);expect(players[0].volume).toBe(.4);expect(players[0].play).toHaveBeenCalledOnce();await sound.play({...event,intent:'success'},prefs);expect(backend.create).toHaveBeenCalledTimes(2);sound.dispose?.();sound.dispose?.();expect(players.every(p=>(p.remove as ReturnType<typeof vi.fn>).mock.calls.length===1)).toBe(true);});
 it('drops native playback after disposal during asynchronous preload',async()=>{let resolve!:()=>void;const play=vi.fn();const sound=createNativeSoundAdapter({configure:()=>new Promise<void>(r=>{resolve=r;}),create:()=>({play,pause:vi.fn(),seekTo:async()=>{},remove:vi.fn(),volume:1})},{tick:1});const pending=sound.play(event,prefs);sound.dispose?.();resolve();await pending;expect(play).not.toHaveBeenCalled();});
 it('maps native selection/impact/outcomes and disables unavailable hardware',async()=>{const backend={selection:vi.fn(async()=>{}),impact:vi.fn(async()=>{}),notification:vi.fn(async()=>{})};const h=createNativeHapticAdapter(backend);await h.play(event,prefs);await h.play({...event,impact:'heavy'},prefs);await h.play({...event,intent:'error'},prefs);expect(backend.selection).toHaveBeenCalledOnce();expect(backend.impact).toHaveBeenCalledWith('heavy');expect(backend.notification).toHaveBeenCalledWith('error');createNativeHapticAdapter(backend,false).play(event,prefs);expect(backend.selection).toHaveBeenCalledOnce();});
 it('migrates saved false choices, clamps volume and retains separate motion',()=>{expect(migratePreferences({soundEnabled:false,hapticsEnabled:true,volume:2,reducedMotion:true})).toEqual({...prefs,sound:false,volume:1});expect(migratePreferences({sound:'true',volume:NaN})).toEqual({version:1,sound:false,haptics:false,volume:.3,motion:true});});
 it('handles corrupt/missing storage and rejects stale reads',async()=>{const storage=jsonStorage({getItem:()=>'{bad',setItem:vi.fn()});expect(await storage.read()).toBeUndefined();let revision=0,resolve!: (v:unknown)=>void;const apply=vi.fn();const pending=loadPreferences({read:()=>new Promise(r=>{resolve=r;}),write:()=>{}},()=>revision,apply);revision++;resolve({sound:true});await pending;expect(apply).not.toHaveBeenCalled();});
});
it('keeps only the latest native request while configure is pending and dispatches cached cues without awaiting seek',async()=>{
 let configured!:()=>void;const play=vi.fn(),pause=vi.fn(),seekTo=vi.fn(()=>new Promise<void>(()=>{}));
 const sound=createNativeSoundAdapter({configure:()=>new Promise<void>(r=>{configured=r;}),create:()=>({play,pause,seekTo,remove:vi.fn(),volume:1})},{tick:1});
 const first=sound.play({...event,id:'first'},prefs);const second=sound.play({...event,id:'second'},prefs);configured();await first;await second;expect(play).toHaveBeenCalledOnce();
 const third=sound.play({...event,id:'third'},prefs);expect(third).toBeUndefined();expect(seekTo).toHaveBeenCalledTimes(2);expect(play).toHaveBeenCalledTimes(2);
 sound.cancel?.();expect(pause).toHaveBeenCalled();
 const pending=sound.play({...event,id:'fourth'},{...prefs,sound:false});expect(pending).toBeUndefined();expect(play).toHaveBeenCalledTimes(2);
});
it('stops only the previous native cue and survives a rejected or throwing seek',async()=>{
 const players:Record<string,NativePlayer & {pause:ReturnType<typeof vi.fn>;play:ReturnType<typeof vi.fn>}>={};
 const sound=createNativeSoundAdapter({create:asset=>{const p={play:vi.fn(),pause:vi.fn(),seekTo:asset===1?vi.fn(async()=>{throw Error('seek');}):vi.fn(()=>{throw Error('sync seek');}),remove:vi.fn(),volume:1};players[String(asset)]=p;return p;}},{tick:1,toggle:2,success:3});
 await sound.preload();sound.play(event,prefs);sound.play({...event,intent:'toggle'},prefs);await Promise.resolve();
 expect(players[1].play).toHaveBeenCalledOnce();expect(players[2].play).toHaveBeenCalledOnce();expect(players[1].pause).toHaveBeenCalledOnce();expect(players[3].pause).not.toHaveBeenCalled();
});
it('keeps native dispatch p95 within one 16 ms frame while bridge round trips are slow',async()=>{
 // Simulated bridge: configure and seek resolve only after simulator/emulator-like delays (#70 measured 47–595 ms p95 when awaited).
 const bridge=(ms:number)=>()=>new Promise<void>(r=>setTimeout(r,ms));const timings:number[]=[];let started=0;
 const sound=createNativeSoundAdapter({configure:bridge(60),create:()=>({play:()=>{timings.push(performance.now()-started);},pause:vi.fn(),seekTo:bridge(40),remove:vi.fn(),volume:1})},{tick:1,toggle:2,success:3,error:4});
 await sound.preload();let clock=0;const controller=new FeedbackController({preferences:prefs,sound,now:()=>clock+=1000});const intents=['activate','toggle','success','error'] as const;
 for(let i=0;i<400;i++){started=performance.now();controller.emit({id:`latency-${i}`,source:'latency',intent:intents[i%4],origin:'native'});}
 expect(timings).toHaveLength(400);
 const sorted=[...timings].sort((a,b)=>a-b);const p95=sorted[Math.ceil(sorted.length*.95)-1];
 console.info(`native sound dispatch: n=${sorted.length} p50=${sorted[Math.floor(sorted.length/2)].toFixed(3)}ms p95=${p95.toFixed(3)}ms`);
 expect(p95).toBeLessThan(16);controller.dispose();
});
it('retries failed native configuration and isolates pause/remove failures during disposal',async()=>{
 const configure=vi.fn().mockRejectedValueOnce(Error('interruption')).mockResolvedValue(undefined);const remove=vi.fn(()=>{throw Error('released');}),play=vi.fn();
 const sound=createNativeSoundAdapter({configure,create:()=>({play,pause:()=>{throw Error('paused');},seekTo:async()=>{},remove,volume:1})},{tick:1,toggle:2});
 await expect(sound.preload()).rejects.toThrow('interruption');await sound.play(event,prefs);expect(play).toHaveBeenCalledOnce();expect(()=>sound.dispose?.()).not.toThrow();expect(remove).toHaveBeenCalledTimes(2);
});
