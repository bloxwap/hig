import tick from '@bloxwap/hig/feedback/assets/tick.wav';
import toggle from '@bloxwap/hig/feedback/assets/toggle.wav';
import success from '@bloxwap/hig/feedback/assets/success.wav';
import error from '@bloxwap/hig/feedback/assets/error.wav';
import {FeedbackController,type FeedbackPreferences} from '@bloxwap/hig/feedback';
import {createNativeSoundAdapter,expoAudioBackend,createNativeHapticAdapter,expoHapticBackend} from '@bloxwap/hig/feedback/native';
import {recordingAudioBackend,recordingHapticBackend,dispatchLatency} from './native-verification';
// The recording wrappers only log adapter calls for simulator/emulator verification.
const names=new Map<unknown,string>([[tick,'tick'],[toggle,'toggle'],[success,'success'],[error,'error']]);
export const createController=(preferences:FeedbackPreferences)=>{
 const sound=createNativeSoundAdapter(recordingAudioBackend(expoAudioBackend(()=>require('expo-audio') as typeof import('expo-audio')),names),{tick,toggle,success,error});
 const controller=new FeedbackController({preferences,sound,prepareSound:sound.preload,haptics:createNativeHapticAdapter(recordingHapticBackend(expoHapticBackend(()=>require('expo-haptics') as typeof import('expo-haptics'))))});
 // The Sound switch emits selection immediately after enabling playback.
 if(!preferences.sound||preferences.volume<=0)void sound.preload('tick').catch(()=>{});
 const emit=controller.emit;controller.emit=event=>{dispatchLatency.mark();emit(event);};
 return controller;
};
