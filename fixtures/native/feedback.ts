import * as Audio from 'expo-audio';
import * as Haptics from 'expo-haptics';
import tick from '@bloxwap/hig-feedback/assets/tick.wav';
import toggle from '@bloxwap/hig-feedback/assets/toggle.wav';
import success from '@bloxwap/hig-feedback/assets/success.wav';
import error from '@bloxwap/hig-feedback/assets/error.wav';
import {FeedbackController,type FeedbackPreferences} from '@bloxwap/hig-feedback';
import {createNativeSoundAdapter,expoAudioBackend,createNativeHapticAdapter,expoHapticBackend} from '@bloxwap/hig-feedback/native';
export const createController=(preferences:FeedbackPreferences)=>new FeedbackController({preferences,sound:createNativeSoundAdapter(expoAudioBackend(Audio),{tick,toggle,success,error}),haptics:createNativeHapticAdapter(expoHapticBackend(Haptics))});
