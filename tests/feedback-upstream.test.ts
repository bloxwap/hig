import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import * as sfx from '@bloxwap/sfx';
import * as haptic from '@bloxwap/haptic';
import {FakeAudioContext,FakeOfflineAudioContext,tick} from '@bloxwap/sfx/fake-audio';
import {createWebSoundAdapter} from '../packages/feedback/src/web-sound';
import {createBrowserHapticAdapter} from '../packages/feedback/src/browser-haptic';
import {FeedbackController} from '../packages/feedback/src/contract';
import type {FeedbackAdapter,FeedbackEvent} from '../packages/contracts/src/feedback';

const prefs={version:1 as const,sound:true,haptics:true,volume:.4,motion:false};
const event=(intent:FeedbackEvent['intent']='activate',id:string=intent):FeedbackEvent=>({id,source:'upstream-check',intent,origin:'keyboard'});
let adapters:FeedbackAdapter[]=[];
function sound(load:Parameters<typeof createWebSoundAdapter>[0]=async()=>sfx){const adapter=createWebSoundAdapter(load);adapters.push(adapter);return adapter;}

beforeEach(()=>{
 FakeAudioContext.reset();FakeOfflineAudioContext.reset();
 vi.stubGlobal('window',{AudioContext:FakeAudioContext});
 vi.stubGlobal('OfflineAudioContext',FakeOfflineAudioContext);
 vi.stubGlobal('navigator',{userActivation:{hasBeenActive:true}});
 vi.stubGlobal('document',{hidden:false});
});
afterEach(async()=>{
 for(const adapter of adapters)adapter.dispose?.();adapters=[];
 await tick();sfx.dispose();
 vi.doUnmock('@bloxwap/sfx');vi.restoreAllMocks();vi.unstubAllGlobals();
});

describe('SFX per-root cancellation with 0.2.0',()=>{
 it('cancels only one root, renews its scope, and leaves host-owned playback running',async()=>{
  const clock=vi.spyOn(performance,'now').mockReturnValue(0);
  await sfx.preload(['tick','toggle','success','error']);
  const a=sound(),b=sound();
  await a.play(event(),prefs);await a.play(event('success'),prefs);await b.play(event('toggle'),prefs);sfx.play('error');
  const sources=FakeAudioContext.instances[0].of('source');
  expect(sfx.activeVoices()).toBe(4);
  a.cancel?.();await tick();
  expect(sources[0].stoppedAt).toBe(0);expect(sources[1].stoppedAt).toBe(0);expect(sources[2].stoppedAt).toBeUndefined();expect(sources[3].stoppedAt).toBeUndefined();
  expect(sfx.activeVoices()).toBe(2);
  clock.mockReturnValue(1000);
  await a.play(event('success'),prefs);expect(sfx.activeVoices()).toBe(3);
  a.dispose?.();await tick();expect(sfx.activeVoices()).toBe(2);
  await a.play(event('success','after-dispose'),prefs);expect(sfx.activeVoices()).toBe(2);
 });

 it('aborts the live synthesis path without stopping another root',async()=>{
  const a=sound(),b=sound();
  await a.play(event(),prefs);await b.play(event('toggle'),prefs);
  expect(sfx.activeVoices()).toBe(2);
  a.cancel?.();expect(sfx.activeVoices()).toBe(1);
  b.dispose?.();expect(sfx.activeVoices()).toBe(0);
 });

 it('drops a canceled unlock request and still accepts a later request after resume',async()=>{
  let resume!:()=>void;
  FakeAudioContext.next={state:'suspended',resume:context=>new Promise<void>(resolve=>{resume=()=>{context.state='running';resolve();};})};
  const a=sound();const pending=a.play(event(),prefs);await tick();
  expect(resume).toBeTypeOf('function');a.cancel?.();
  const next=a.play(event('success'),prefs);resume();await pending;await next;
  expect(sfx.activeVoices()).toBe(1);
  a.cancel?.();await tick();expect(sfx.activeVoices()).toBe(0);
 });

 it('routes controller mute/background cancellation through the adapter and can resume',async()=>{
  await sfx.preload(['tick','toggle','success']);
  let clock=0;const a=sound();const controller=new FeedbackController({sound:a,preferences:prefs,now:()=>clock+=1000});
  controller.emit(event());await tick();expect(sfx.activeVoices()).toBe(1);
  controller.updatePreferences({volume:0});await tick();expect(sfx.activeVoices()).toBe(0);
  controller.updatePreferences({volume:.4});controller.emit(event('toggle'));await tick();expect(sfx.activeVoices()).toBe(1);
  controller.setBackground(true);await tick();expect(sfx.activeVoices()).toBe(0);
  controller.emit(event('success'));await tick();expect(sfx.activeVoices()).toBe(0);
  controller.setBackground(false);controller.emit(event('success','foreground'));await tick();expect(sfx.activeVoices()).toBe(1);
  controller.dispose();await tick();expect(sfx.activeVoices()).toBe(0);
 });

 it('retains shared default engine ownership until the last adapter disposes',async()=>{
  await sfx.preload(['tick','toggle']);
  const dispose=vi.fn(sfx.dispose);vi.doMock('@bloxwap/sfx',()=>({...sfx,dispose}));
  const a=createWebSoundAdapter(),b=createWebSoundAdapter();adapters.push(a,b);
  await a.play(event(),prefs);await b.play(event('toggle'),prefs);
  expect(FakeAudioContext.constructed).toBe(1);expect(sfx.activeVoices()).toBe(2);
  a.dispose?.();await tick();expect(dispose).not.toHaveBeenCalled();expect(sfx.activeVoices()).toBe(1);
  expect(FakeAudioContext.instances[0].closed).toBe(false);
  b.dispose?.();await tick();expect(dispose).toHaveBeenCalledOnce();expect(FakeAudioContext.instances[0].closed).toBe(true);
 });
});

describe('optional canonical Haptic backend with 0.2.0',()=>{
 it('rechecks current activation/visibility, uses upstream presets and creates no helper DOM',async()=>{
  const vibrate=vi.fn<(pattern:number|number[])=>boolean>(()=>true),createElement=vi.fn();
  const activation={hasBeenActive:false};const doc={hidden:false,createElement};
  vi.stubGlobal('navigator',{vibrate,userActivation:activation});vi.stubGlobal('document',doc);
  const trigger=vi.spyOn(haptic,'triggerHaptic');const adapter=createBrowserHapticAdapter(haptic);adapters.push(adapter);
  expect(adapter.capability.available).toBe(false);await adapter.play(event(),prefs);expect(trigger).not.toHaveBeenCalled();
  activation.hasBeenActive=true;expect(adapter.capability.available).toBe(true);
  await adapter.play(event(),{...prefs,haptics:false});expect(trigger).not.toHaveBeenCalled();
  await adapter.play(event('warning'),prefs);expect(trigger).toHaveBeenCalledWith('warning');expect(vibrate).toHaveBeenCalledOnce();
  expect(vibrate.mock.calls[0][0]).toBeInstanceOf(Array);expect(adapter.capability.observed).toBe(false);
  doc.hidden=true;expect(adapter.capability.available).toBe(false);await adapter.play(event('success'),prefs);expect(trigger).toHaveBeenCalledTimes(1);
  doc.hidden=false;vibrate.mockReturnValue(false);await expect(adapter.play(event('error'),prefs)).resolves.toBeUndefined();expect(adapter.capability.observed).toBe(false);
  expect(createElement).not.toHaveBeenCalled();
  adapter.dispose?.();expect(adapter.capability.available).toBe(false);await adapter.play(event('success'),prefs);expect(trigger).toHaveBeenCalledTimes(2);
 });

 it('reports iOS unavailable even during a trusted activation and never manufactures a physical tap',async()=>{
  const createElement=vi.fn();vi.stubGlobal('document',{hidden:false,createElement});
  vi.stubGlobal('navigator',{platform:'iPhone',userAgent:'AppleWebKit',userActivation:{hasBeenActive:true,isActive:true}});
  const adapter=createBrowserHapticAdapter(haptic);adapters.push(adapter);
  expect(adapter.capability).toMatchObject({available:false,mechanism:'none',observed:false,reason:'trusted-physical-tap-required'});
  await adapter.play(event('success'),prefs);await Promise.resolve();await adapter.play(event('error'),prefs);
  expect(createElement).not.toHaveBeenCalled();
  expect(await haptic.triggerHaptic('success')).toEqual({delivered:false,mechanism:'none',reason:'trusted-physical-tap-required'});
 });

 it('is silent under SSR and isolates a failed injected probe or request',async()=>{
  vi.stubGlobal('document',undefined);vi.stubGlobal('navigator',undefined);
  const ssr=createBrowserHapticAdapter(haptic);expect(ssr.capability.available).toBe(false);expect(()=>ssr.play(event(),prefs)).not.toThrow();
  const failed=createBrowserHapticAdapter({canTriggerHaptic:()=>{throw Error('capability');},triggerHaptic:vi.fn()});expect(failed.capability.available).toBe(false);
  const rejecting=createBrowserHapticAdapter({canTriggerHaptic:()=>({available:true,mechanism:'browser-vibration',observed:false}),triggerHaptic:async()=>{throw Error('backend');}});
  await expect(rejecting.play(event(),prefs)).resolves.toBeUndefined();
 });

 it('preserves the default fallback patterns and cancellation without injecting custom backend',()=>{
  const vibrate=vi.fn(()=>true);vi.stubGlobal('navigator',{vibrate});
  const adapter=createBrowserHapticAdapter();adapters.push(adapter);
  expect(adapter.capability).toMatchObject({available:true,mechanism:'browser-vibration',observed:false});
  adapter.play(event('success'),prefs);expect(vibrate).toHaveBeenCalledWith([30,60,40]);
  adapter.cancel?.();expect(vibrate).toHaveBeenLastCalledWith(0);
  adapter.dispose?.();const count=vibrate.mock.calls.length;adapter.play(event('error'),prefs);expect(vibrate).toHaveBeenCalledTimes(count);
 });
});
