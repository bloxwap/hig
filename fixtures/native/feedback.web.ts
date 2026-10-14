import {FeedbackController,type FeedbackPreferences} from '@bloxwap/hig-feedback';
import {createWebSoundAdapter} from '@bloxwap/hig-feedback/web-sound';
import {createBrowserHapticAdapter} from '@bloxwap/hig-feedback/browser-haptic';
// Expo web selects browser lifecycle adapters; native builds retain feedback.ts.
export const createController=(preferences:FeedbackPreferences)=>new FeedbackController({preferences,sound:createWebSoundAdapter(),haptics:createBrowserHapticAdapter()});
