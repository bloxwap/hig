export interface StreamConnection {
 endpoint:string;
 key:string;
}
export interface LiveStreamSettings {
 streaming:StreamConnection;
 chat:StreamConnection;
 appAudio:boolean;
 microphone:boolean;
}
export type StreamSection='streaming'|'chat';
export interface LiveStreamBlockProps {
 title:string;
 description?:string;
 streaming:{title:string;endpointLabel:string;keyLabel:string};
 chat:{title:string;endpointLabel:string;keyLabel:string};
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
 streaming:{endpoint:'',key:''},chat:{endpoint:'',key:''},appAudio:true,microphone:true,
};
export function connectionReady(section:StreamSection,connection:StreamConnection){
 if(!connection.endpoint.trim()||!connection.key.trim())return false;
 if(section==='chat')return true;
 try{
  const url=new URL(connection.endpoint);
  return !!url.hostname&&['rtmps:','rtmp:','srt:'].includes(url.protocol);
 }catch{return false;}
}
/** One chat line from a connected channel. Every word is host text. */
export interface LiveStreamChatMessage {
 id:string;
 username:string;
 /** Where the line was sent, as the host names it: Twitch, Kick. */
 source:string;
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
/** How strongly a line is drawn: the newest at full strength, each older one a step fainter, never below a quarter. */
export function feedLineOpacity(fromNewest:number){return Math.max(25,100-fromNewest*20)/100;}
