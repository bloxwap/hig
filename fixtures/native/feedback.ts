import * as Audio from 'expo-audio';
import * as Haptics from 'expo-haptics';
import tick from '@bloxwap/hig-feedback/assets/tick.wav';
import toggle from '@bloxwap/hig-feedback/assets/toggle.wav';
import success from '@bloxwap/hig-feedback/assets/success.wav';
import error from '@bloxwap/hig-feedback/assets/error.wav';
import {FeedbackController,type FeedbackPreferences} from '@bloxwap/hig-feedback';
import {createNativeSoundAdapter,expoAudioBackend,createNativeHapticAdapter,expoHapticBackend} from '@bloxwap/hig-feedback/native';
import {recordingAudioBackend,recordingHapticBackend,dispatchLatency} from './native-verification';
// The recording wrappers only log adapter calls for simulator/emulator verification.
const names=new Map<unknown,string>([[tick,'tick'],[toggle,'toggle'],[success,'success'],[error,'error']]);
export const createController=(preferences:FeedbackPreferences)=>{
 const sound=createNativeSoundAdapter(recordingAudioBackend(expoAudioBackend(Audio),names),{tick,toggle,success,error});
 // Pre-load players at startup, as product hosts do, so the first cue does not wait on the audio-session bridge.
 void sound.preload().catch(()=>{});
 const controller=new FeedbackController({preferences,sound,haptics:createNativeHapticAdapter(recordingHapticBackend(expoHapticBackend(Haptics)))});
 const emit=controller.emit;controller.emit=event=>{dispatchLatency.mark();emit(event);};
 return controller;
};
