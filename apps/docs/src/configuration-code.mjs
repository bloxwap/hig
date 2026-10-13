export function configurationCode(code,platform,preferences){
 if(code.startsWith('Loading'))return code;
 const setup=["import {FeedbackProvider,useFeedback} from '@bloxwap/hig-feedback/react';","import {FeedbackController,type FeedbackPreferences} from '@bloxwap/hig-feedback';"];
 const adapters=[];
 if(preferences.sound){
  if(platform==='react'){setup.push("import {createWebSoundAdapter} from '@bloxwap/hig-feedback/web-sound';");adapters.push('sound:createWebSoundAdapter()');}
  else{setup.push("import * as Audio from 'expo-audio';","import {createNativeSoundAdapter,expoAudioBackend} from '@bloxwap/hig-feedback/native';");for(const name of ['tick','toggle','success','error'])setup.push(`import ${name} from '@bloxwap/hig-feedback/assets/${name}.wav';`);adapters.push('sound:createNativeSoundAdapter(expoAudioBackend(Audio),{tick,toggle,success,error})');}
 }
 if(preferences.haptics){
  if(platform==='react'){setup.push("import {createBrowserHapticAdapter} from '@bloxwap/hig-feedback/browser-haptic';");adapters.push('haptics:createBrowserHapticAdapter()');}
  else{setup.push("import * as Haptics from 'expo-haptics';","import {createNativeHapticAdapter,expoHapticBackend} from '@bloxwap/hig-feedback/native';");adapters.push('haptics:createNativeHapticAdapter(expoHapticBackend(Haptics))');}
 }
 code=code.replace('export default function Example(){','function Preview(){\nconst {sink,preferences}=useFeedback();').replace('<HIGProvider density=','<HIGProvider feedback={sink} reducedMotion={!preferences.motion?true:undefined} density=');
 return `${setup.join('\n')}\n${code}\nconst initialPreferences=${JSON.stringify({...preferences,version:1})} as const;\nconst createController=(preferences:FeedbackPreferences)=>new FeedbackController({preferences,${adapters.join(',')}});\nexport default function Example(){return <FeedbackProvider initialPreferences={initialPreferences} createController={createController}><Preview/></FeedbackProvider>;}\n`;
}
