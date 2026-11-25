export interface StreamConnection {
 endpoint:string;
 key:string;
}
export interface LiveStreamSettings {
 streaming:StreamConnection;
 appAudio:boolean;
 microphone:boolean;
}
export type StreamSection='streaming'|'chat';
/** Where the chat authorization service stands. The host drives it. */
export type LiveStreamChatStatus='unconfigured'|'signedOut'|'connecting'|'connected'|'failed';
/**
 * Chat through a trusted HTTPS authorization service the host's user configures. The service holds the confidential
 * application secret and refresh token on its server, so the block only takes its URL and shows where it stands.
 */
export interface LiveStreamChatService {
 status:LiveStreamChatStatus;
 /** The saved service URL, shown in the field when the section opens. */
 serviceUrl?:string;
 /** Shown under the status for `failed` (host text). */
 error?:string;
 /** Save the URL (trimmed) and start authorization. The host validates and opens the browser. A rejected promise keeps the section open. */
 onConnect:(serviceUrl:string)=>unknown;
 /** Sign out of the service (connected/signedOut/failed). */
 onDisconnect?:()=>unknown;
 /** Retry authorization with the saved URL (signedOut/failed). */
 onReconnect?:()=>unknown;
 labels:{
  title:string;
  serviceLabel:string;
  connect:string;
  disconnect:string;
  reconnect?:string;
  note:string;
  status:(status:LiveStreamChatStatus)=>string;
 };
}
export interface LiveStreamBlockProps {
 title:string;
 description?:string;
 streaming:{title:string;endpointLabel:string;keyLabel:string};
 chat:LiveStreamChatService;
 appAudioLabel:string;
 microphoneLabel:string;
 saveLabel:string;
 playLabel:string;
 settings?:LiveStreamSettings;
 defaultSettings?:LiveStreamSettings;
 onSettingsChange?:(settings:LiveStreamSettings)=>void;
 /** The host presents platform consent and starts the broadcast. */
 onPlay:(settings:LiveStreamSettings)=>void;
 onBack?:()=>void;
}
export const initialStreamSettings:LiveStreamSettings={
 streaming:{endpoint:'',key:''},appAudio:true,microphone:true,
};
/** A stream server link (RTMPS, RTMP or SRT) and a key. */
export function connectionReady(connection:StreamConnection){
 if(!connection.endpoint.trim()||!connection.key.trim())return false;
 try{
  const url=new URL(connection.endpoint);
  return !!url.hostname&&['rtmps:','rtmp:','srt:'].includes(url.protocol);
 }catch{return false;}
}
/**
 * A chat authorization service origin: `https`, a host, and nothing else (no user or password, port, query or
 * fragment, and an empty or `/` path). Surrounding spaces are ignored.
 */
export function chatServiceUrlValid(value:string):boolean{
 const text=value.trim();
 // The raw text is checked too: URL drops a default port and an empty `?` or `#`, which still count as given.
 if(!/^https:\/\/[^\s/\\?#@:[\]]+\/?$/i.test(text))return false;
 try{
  const url=new URL(text);
  return url.protocol==='https:'&&!!url.hostname&&!url.username&&!url.password&&!url.port&&!url.search&&!url.hash&&url.pathname==='/';
 }catch{return false;}
}
/** The chat statuses that can sign out of the service. */
export function chatCanDisconnect(status:LiveStreamChatStatus){return status==='connected'||status==='signedOut'||status==='failed';}
/** The chat statuses that can retry authorization with the saved URL. */
export function chatCanReconnect(status:LiveStreamChatStatus){return status==='signedOut'||status==='failed';}
/** The chat platforms Restream relays (its chat event sources), by stable id. */
export type LiveStreamPlatform='twitch'|'youtube'|'kick'|'x'|'facebook'|'discord'|'linkedin'|'trovo'|'dlive'|'rumble';
/**
 * Each platform's brand fill and the ink that reads on it. `x` is `null`: its brand is black and white, so its badge
 * draws in the theme's text colour with the background as ink, and stays visible in light and dark.
 */
export const platformColors:Readonly<Record<LiveStreamPlatform,{fill:string;ink:string}|null>>={
 twitch:{fill:'#9146ff',ink:'#ffffff'},
 youtube:{fill:'#e60000',ink:'#ffffff'},
 kick:{fill:'#53fc18',ink:'#000000'},
 x:null,
 facebook:{fill:'#0866ff',ink:'#ffffff'},
 discord:{fill:'#5865f2',ink:'#ffffff'},
 linkedin:{fill:'#0a66c2',ink:'#ffffff'},
 trovo:{fill:'#19d66b',ink:'#000000'},
 dlive:{fill:'#ffd300',ink:'#000000'},
 rumble:{fill:'#85c742',ink:'#000000'},
};
/** One chat line from a connected channel. Every word is host text. */
export interface LiveStreamChatMessage {
 id:string;
 username:string;
 /** Where the line was sent, as the host names it: Twitch, Kick. */
 source:string;
 /** Colours the source badge with that platform's brand. Without it the badge is neutral. */
 platform?:LiveStreamPlatform;
 text:string;
 /** The sender's photo. Without it, or if it fails to load, the first two letters of `username` show. */
 avatarUrl?:string;
}
export interface LiveStreamChatBlockProps {
 /** Heading: Chat. It also names the message log. */
 title:string;
 /** Oldest first. The log follows the newest line until the reader scrolls back. */
 messages:readonly LiveStreamChatMessage[];
 /** Shown while there are no messages. */
 emptyLabel:string;
 /** Shows Close on the trailing edge of the header. The host closes its drawer. */
 onClose?:()=>void;
 /** `id` of the heading, so the host drawer can name itself with it. */
 headingId?:string;
}
/** How close to the newest line, in pixels, still counts as following the chat. */
export const chatFollowSlack=24;
export interface LiveStreamFeedBlockProps {
 /** The accessible name of the feed: Live chat. It is not drawn. */
 label:string;
 /** Oldest first, the same list `LiveStreamChatBlock` takes. Only the newest lines are drawn. */
 messages:readonly LiveStreamChatMessage[];
 /** How many of the newest lines show at once. Defaults to 4. */
 maxVisible?:number;
}
/** How many lines a feed shows when `maxVisible` is left out. */
export const feedVisibleLines=4;
/** The newest `maxVisible` lines, oldest first. A count that is not a whole number of one or more falls back to the default. */
export function feedLines<T>(messages:readonly T[],maxVisible?:number):readonly T[]{
 const count=typeof maxVisible==='number'&&Number.isInteger(maxVisible)&&maxVisible>=1?maxVisible:feedVisibleLines;
 return messages.slice(-count);
}
