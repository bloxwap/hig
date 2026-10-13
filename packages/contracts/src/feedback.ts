export type FeedbackIntent = 'press'|'activate'|'release'|'cancel'|'selection'|'toggle'|'disclosure'|'success'|'warning'|'error'|'notification';
export type FeedbackOrigin = 'pointer'|'keyboard'|'native'|'programmatic';
/** Async outcomes use the host operation id. A successful call is not proof of physical output. */
export interface FeedbackEvent {id:string;source:string;intent:FeedbackIntent;origin:FeedbackOrigin;cancelled?:boolean;disabled?:boolean;busy?:boolean;suppressed?:boolean}
export interface FeedbackSink {emit:(event:FeedbackEvent)=>void}
export interface FeedbackPreferences {version:1;sound:boolean;haptics:boolean;volume:number;motion:boolean}
export interface FeedbackCapability {available:boolean;mechanism:'none'|'web-audio'|'browser-vibration'|'physical-tap'|'native-audio'|'native-haptics';observed:boolean;reason?:string}
export interface FeedbackAdapter {capability:FeedbackCapability;play:(event:FeedbackEvent,preferences:FeedbackPreferences)=>void|Promise<void>;cancel?:()=>void|Promise<void>;dispose?:()=>void|Promise<void>}
export interface PreferenceStorage {read:()=>unknown|Promise<unknown>;write:(value:FeedbackPreferences)=>void|Promise<void>}
