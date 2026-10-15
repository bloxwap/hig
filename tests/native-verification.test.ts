import {it,expect,vi} from 'vitest';
import {parseGalleryRoute,feedbackLog,recordingHapticBackend,recordingAudioBackend} from '../fixtures/native/native-verification';
it('parses simulator deep links for the native gallery harness',()=>{
 expect(parseGalleryRoute('bloxwaphig://gallery?component=Slider&state=disabled&dir=rtl&diag=1&rows=20000')).toEqual({component:'Slider',state:'disabled',direction:'rtl',diagnostics:true,rows:10000});
 expect(parseGalleryRoute('bloxwaphig://gallery?dir=up&rows=-1&component=%E2%80%A6')).toEqual({component:'…'});
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
