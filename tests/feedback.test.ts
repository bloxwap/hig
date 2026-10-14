import {describe,it,expect,vi} from 'vitest';
import {FeedbackController} from '../packages/feedback/src/contract';
import type {FeedbackAdapter,FeedbackEvent} from '../packages/contracts/src/feedback';
const event=(intent:FeedbackEvent['intent']='activate',id='1'):FeedbackEvent=>({id,source:'button',intent,origin:'keyboard'});
function adapter():FeedbackAdapter{return {capability:{available:true,mechanism:'native-haptics',observed:false},play:vi.fn(),cancel:vi.fn(),dispose:vi.fn()};}
describe('semantic feedback contract before adapters',()=>{
 it.each([[false,false],[true,false],[false,true],[true,true]])('composes sound %s haptics %s independently',(sound,haptics)=>{const s=adapter(),h=adapter();const c=new FeedbackController({sound:s,haptics:h,preferences:{sound,haptics}});c.emit(event());expect(s.play).toHaveBeenCalledTimes(sound?1:0);expect(h.play).toHaveBeenCalledTimes(haptics?1:0);});
 it('deduplicates intended gesture and bounds rapid selection without a queue',()=>{let now=0;const s=adapter();const c=new FeedbackController({sound:s,preferences:{sound:true},now:()=>now});c.emit(event());c.emit(event());c.emit(event('activate','2'));expect(s.play).toHaveBeenCalledTimes(1);now=100;c.emit(event('activate','3'));expect(s.play).toHaveBeenCalledTimes(2);});
 it('blocks cancellation, busy, disabled, suppression and background',()=>{const s=adapter();const c=new FeedbackController({sound:s,preferences:{sound:true}});for(const flag of ['cancelled','disabled','busy','suppressed'])c.emit({...event(),[flag]:true});c.setBackground(true);c.emit(event());expect(s.play).not.toHaveBeenCalled();});
 it('keeps outcome ids separate from interaction and isolates throw/reject',()=>{const s=adapter();s.play=vi.fn(()=>{throw Error('audio unavailable');});const h=adapter();h.play=vi.fn(()=>Promise.reject(Error('hardware unavailable')));const c=new FeedbackController({sound:s,haptics:h,preferences:{sound:true,haptics:true}});expect(()=>c.emit(event('success','operation-1'))).not.toThrow();expect(s.play).toHaveBeenCalledOnce();expect(h.play).toHaveBeenCalledOnce();});
 it('honors policy, volume/mute and lifecycle without tactile claims',()=>{const s=adapter();const c=new FeedbackController({sound:s,preferences:{sound:true,volume:2},policy:{sound:false}});expect(c.getPreferences().volume).toBe(1);expect(c.getCapabilities().sound.observed).toBe(false);c.emit(event());expect(s.play).not.toHaveBeenCalled();c.dispose();c.dispose();expect(s.dispose).toHaveBeenCalledOnce();c.emit(event('success'));expect(s.play).not.toHaveBeenCalled();});
});
it('cancels pending sound when volume becomes zero and dispatches explicit native impact',()=>{
 const sound=adapter(),haptics=adapter();const controller=new FeedbackController({sound,haptics,preferences:{sound:true,haptics:true}});
 controller.updatePreferences({volume:0});expect(sound.cancel).toHaveBeenCalledOnce();
 controller.emit({...event('press'),impact:'heavy'});expect(haptics.play).toHaveBeenCalledOnce();expect(sound.play).not.toHaveBeenCalled();
});
it.each([-1,0,NaN,Infinity])('bounds invalid remembered-event capacities without blocking actions (%s)',maxRemembered=>{
 const sound=adapter();const controller=new FeedbackController({sound,maxRemembered,preferences:{sound:true}});controller.emit(event());controller.emit(event());expect(sound.play).toHaveBeenCalledOnce();
});
