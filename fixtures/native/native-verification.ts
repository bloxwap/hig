import type {NativeAudioBackend,NativeHapticBackend,NativePlayer} from '@bloxwap/hig-feedback/native';
/**
 * Simulator/emulator verification harness for the native gallery.
 * Deep links (bloxwaphig://gallery?component=Slider&state=default&dir=rtl&diag=1&rows=2000&messages=ko&colorSpace=display-p3)
 * select examples without UI automation, and the feedback recorder makes
 * adapter calls observable on targets without speakers or tactile hardware.
 * Recording a call is not evidence of audible or tactile output.
 */
/**
 * Verification-only host catalogs (#94, #87): HIG approves no translation locale and ships English only, so these stand in
 * for a host's own `HIGProvider messages`. `label` is a host button label rendered busy next to the generated example.
 */
export const fixtureCatalogs={
 en:{locale:'en-US',label:'Log out',messages:{}},
 fr:{locale:'fr-FR',label:'Déconnexion',messages:{busy:'En cours',increase:'Augmenter',decrease:'Diminuer'}},
 ko:{locale:'ko-KR',label:'로그아웃',messages:{busy:'처리 중',increase:'증가',decrease:'감소'}},
} as const;
export type FixtureCatalog=keyof typeof fixtureCatalogs;
/** `colorSpace` sets HIGProvider `colorSpace` (#93); it matches the app only when the iOS build paints in that space (prepare-app.sh HIG_IOS_COLOR_SPACE). */
export interface GalleryRoute {component?:string;state?:string;direction?:'ltr'|'rtl';diagnostics?:boolean;rows?:number;messages?:FixtureCatalog;colorSpace?:'srgb'|'display-p3'}
export function parseGalleryRoute(url:string|null|undefined):GalleryRoute|null{
 if(!url)return null;const query=url.split('#')[0].split('?')[1];if(!query)return null;const route:GalleryRoute={};
 for(const part of query.split('&')){const [rawKey,rawValue='']=part.split('=');let key:string,value:string;try{key=decodeURIComponent(rawKey);value=decodeURIComponent(rawValue.replace(/\+/g,' '));}catch{continue;}
  if(key==='component'&&value)route.component=value;else if(key==='state'&&value)route.state=value;else if(key==='dir'&&(value==='ltr'||value==='rtl'))route.direction=value;else if(key==='diag')route.diagnostics=value==='1'||value==='true';else if(key==='rows'&&/^\d+$/.test(value))route.rows=Math.min(10000,Number(value));else if(key==='messages'&&Object.hasOwn(fixtureCatalogs,value))route.messages=value as FixtureCatalog;else if(key==='colorSpace'&&(value==='srgb'||value==='display-p3'))route.colorSpace=value;}
 return route;
}
export interface FeedbackLogEntry {sequence:number;channel:'sound'|'haptic';call:string;result:string}
const entries:FeedbackLogEntry[]=[];const listeners=new Set<()=>void>();let sequence=0;
export function recordFeedback(channel:FeedbackLogEntry['channel'],call:string,result:string){entries.push({sequence:++sequence,channel,call,result});if(entries.length>50)entries.shift();for(const listener of listeners)listener();}
export const feedbackLog={entries:(limit=6)=>entries.slice(-limit),subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},clear(){entries.length=0;sequence=0;for(const listener of listeners)listener();}};
async function track<T>(channel:FeedbackLogEntry['channel'],call:string,run:()=>Promise<T>|T):Promise<T>{recordFeedback(channel,call,'called');try{const value=await run();recordFeedback(channel,call,'resolved');return value;}catch(error){recordFeedback(channel,call,`rejected: ${error instanceof Error?error.message:String(error)}`);throw error;}}
export function recordingHapticBackend(backend:NativeHapticBackend):NativeHapticBackend{return {selection:()=>track('haptic','selection',()=>backend.selection()),impact:style=>track('haptic',`impact:${style}`,()=>backend.impact(style)),notification:type=>track('haptic',`notification:${type}`,()=>backend.notification(type))};}
/** JS dispatch timing from FeedbackController.emit to the native player's play() call; not speaker latency (#55). */
const dispatches:number[]=[];let emittedAt:number|undefined;const clock=()=>globalThis.performance?.now()??Date.now();
export const dispatchLatency={mark(){emittedAt=clock();},settle():number|undefined{if(emittedAt===undefined)return undefined;const elapsed=clock()-emittedAt;emittedAt=undefined;dispatches.push(elapsed);if(dispatches.length>500)dispatches.shift();return elapsed;},
 summary(){const sorted=[...dispatches].sort((a,b)=>a-b);const at=(q:number)=>sorted.length?sorted[Math.max(0,Math.ceil(sorted.length*q)-1)]:undefined;return {count:sorted.length,p50:at(.5),p95:at(.95)};},clear(){dispatches.length=0;emittedAt=undefined;}};
interface PlaybackStatus {didJustFinish?:boolean;playing?:boolean;currentTime?:number;duration?:number}
interface StatusPlayer extends NativePlayer {addListener?:(event:'playbackStatusUpdate',listener:(status:PlaybackStatus)=>void)=>unknown}
/**
 * #89: per-cue counts of play() calls against playbackStatusUpdate events. `starts` counts statuses whose `playing` turns true; a
 * `repeat` is a didJustFinish with no play() call and no playing status since that player's previous didJustFinish, i.e. a second
 * notification of the same finish rather than a second play. Counts observe the JS bridge, not audible output (#55).
 */
interface CueCounts {plays:number;statuses:number;starts:number;finishes:number;repeats:number}
const cueCounts=new Map<string,CueCounts>();const countListeners=new Set<()=>void>();
const countsFor=(name:string)=>{let counts=cueCounts.get(name);if(!counts){counts={plays:0,statuses:0,starts:0,finishes:0,repeats:0};cueCounts.set(name,counts);}return counts;};
const countsChanged=()=>{for(const listener of countListeners)listener();};
export const soundCounts={
 get:(name:string):Readonly<CueCounts>|undefined=>cueCounts.get(name),
 summary:()=>cueCounts.size?[...cueCounts].map(([name,c])=>`${name} play ${c.plays} · start ${c.starts} · status ${c.statuses} · didJustFinish ${c.finishes} (repeat ${c.repeats})`).join(' | '):'none',
 subscribe(listener:()=>void){countListeners.add(listener);return()=>{countListeners.delete(listener);};},
 clear(){cueCounts.clear();countsChanged();},
};
export function recordingAudioBackend(backend:NativeAudioBackend,names:ReadonlyMap<unknown,string>):NativeAudioBackend{
 return {configure:backend.configure?()=>track('sound','configure',()=>backend.configure!()):undefined,create(asset){const name=names.get(asset)??'cue';const player=backend.create(asset) as StatusPlayer;
  let playing=false,finishedSinceStart=false;
  player.addListener?.('playbackStatusUpdate',status=>{const counts=countsFor(name);counts.statuses++;
   if(status.playing&&!playing){counts.starts++;finishedSinceStart=false;}if(status.playing!==undefined)playing=status.playing;
   if(status.didJustFinish){counts.finishes++;if(finishedSinceStart)counts.repeats++;finishedSinceStart=true;recordFeedback('sound',`${name} finished`,`${(status.currentTime??0).toFixed(2)}s of ${(status.duration??0).toFixed(2)}s`);}
   countsChanged();});
  return {play(){const elapsed=dispatchLatency.settle();countsFor(name).plays++;finishedSinceStart=false;player.play();countsChanged();recordFeedback('sound',`play:${name}`,`volume ${player.volume.toFixed(2)}${elapsed===undefined?'':` dispatch ${elapsed.toFixed(1)}ms p95 ${dispatchLatency.summary().p95!.toFixed(1)}ms`}`);},pause:()=>player.pause(),seekTo:seconds=>player.seekTo(seconds),remove:()=>player.remove(),get volume(){return player.volume;},set volume(next:number){player.volume=next;}};}};
}
