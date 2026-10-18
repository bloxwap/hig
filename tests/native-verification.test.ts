import {it,expect,vi} from 'vitest';
import {parseGalleryRoute,feedbackLog,recordingHapticBackend,recordingAudioBackend,dispatchLatency,soundCounts} from '../fixtures/native/native-verification';
it('parses simulator deep links for the native gallery harness',()=>{
 expect(parseGalleryRoute('bloxwaphig://gallery?component=Slider&state=disabled&dir=rtl&diag=1&rows=20000')).toEqual({component:'Slider',state:'disabled',direction:'rtl',diagnostics:true,rows:10000});
 expect(parseGalleryRoute('bloxwaphig://gallery?dir=up&rows=-1&component=%E2%80%A6')).toEqual({component:'…'});
 expect(parseGalleryRoute('bloxwaphig://gallery?component=Button&state=busy&messages=ko')).toEqual({component:'Button',state:'busy',messages:'ko'});
 expect(parseGalleryRoute('bloxwaphig://gallery?messages=toString')).toEqual({});
 expect(parseGalleryRoute('bloxwaphig://gallery?component=Alert&state=warning&colorSpace=display-p3')).toEqual({component:'Alert',state:'warning',colorSpace:'display-p3'});
 expect(parseGalleryRoute('bloxwaphig://gallery?colorSpace=%23ff0000')).toEqual({});
 expect(parseGalleryRoute('bloxwaphig://gallery')).toBeNull();expect(parseGalleryRoute(null)).toBeNull();
});
it('records haptic and sound adapter calls without changing their outcome',async()=>{
 feedbackLog.clear();
 const haptics=recordingHapticBackend({selection:vi.fn(async()=>{}),impact:vi.fn(async()=>{throw new Error('unsupported hardware');}),notification:vi.fn(async()=>{})});
 await haptics.selection();await expect(haptics.impact('light')).rejects.toThrow('unsupported hardware');
 const player={play:vi.fn(),pause:vi.fn(),seekTo:vi.fn(async()=>{}),remove:vi.fn(),volume:1};
 const audio=recordingAudioBackend({create:()=>player},new Map([['tick-asset','tick']]));const wrapped=audio.create('tick-asset');wrapped.volume=0.3;wrapped.play();
 expect(player.volume).toBe(0.3);expect(player.play).toHaveBeenCalledTimes(1);
 expect(feedbackLog.entries(10).map(e=>`${e.channel} ${e.call} ${e.result}`)).toEqual(['haptic selection called','haptic selection resolved','haptic impact:light called','haptic impact:light rejected: unsupported hardware','sound play:tick volume 0.30']);
});
it('measures emit-to-play dispatch for simulator/emulator runs',()=>{
 feedbackLog.clear();dispatchLatency.clear();const player={play:vi.fn(),pause:vi.fn(),seekTo:vi.fn(async()=>{}),remove:vi.fn(),volume:1};
 const wrapped=recordingAudioBackend({create:()=>player},new Map([['tick-asset','tick']])).create('tick-asset');
 for(let i=0;i<20;i++){dispatchLatency.mark();wrapped.play();}wrapped.play();
 const summary=dispatchLatency.summary();expect(summary.count).toBe(20);expect(summary.p95).toBeLessThan(16);expect(player.play).toHaveBeenCalledTimes(21);
 expect(feedbackLog.entries(2).map(e=>e.result)).toEqual([expect.stringMatching(/^volume 1\.00 dispatch \d+\.\dms p95 \d+\.\dms$/),'volume 1.00']);
});
it('counts play() calls against playbackStatusUpdate events per cue (#89)',()=>{
 soundCounts.clear();let emit:(status:{didJustFinish?:boolean;playing?:boolean;currentTime?:number;duration?:number})=>void=()=>{};
 const player={play:vi.fn(),pause:vi.fn(),seekTo:vi.fn(async()=>{}),remove:vi.fn(),volume:1,addListener:(_event:string,listener:typeof emit)=>{emit=listener;}};
 const wrapped=recordingAudioBackend({create:()=>player},new Map([['tick-asset','tick']])).create('tick-asset');
 // expo-audio 1.1 on Android: one play, a playing status, then two didJustFinish statuses (isPlaying and playback-state listeners).
 wrapped.play();emit({playing:true});emit({playing:false,didJustFinish:true});emit({playing:false,didJustFinish:true});
 // SDK 55: one didJustFinish per play.
 wrapped.play();emit({playing:true});emit({playing:false,didJustFinish:true});
 // A second play that never reports playing still resets the repeat check.
 wrapped.play();emit({didJustFinish:true});
 expect(soundCounts.get('tick')).toEqual({plays:3,statuses:6,starts:2,finishes:4,repeats:1});
 expect(soundCounts.summary()).toBe('tick play 3 · start 2 · status 6 · didJustFinish 4 (repeat 1)');
 soundCounts.clear();expect(soundCounts.summary()).toBe('none');
});
