export interface StreamConnection {
 endpoint:string;
 key:string;
}
export interface LiveStreamSettings {
 streaming:StreamConnection;
 appAudio:boolean;
 microphone:boolean;
 /** Show the newest chat lines over the content while live. The host draws them with `LiveStreamFeedBlock`. */
 chatFeed:boolean;
}
export type StreamSection='streaming'|'chat';
/** Where the chat sign-in stands. The host drives it. */
export type LiveStreamChatStatus='signedOut'|'connecting'|'connected'|'failed';
/**
 * Chat through the host's own sign-in. Restream's OAuth needs a client secret and refresh token that stay on the
 * host's server, so the block takes no URL or key: it shows where the sign-in stands and asks the host to connect
 * or sign out.
 */
export interface LiveStreamChatService {
 status:LiveStreamChatStatus;
 /** Shown under the status for `failed` (host text). */
 error?:string;
 /** Start the sign-in; the host opens the browser. Resolving returns to the list; a rejected promise keeps the section open. */
 onConnect:()=>unknown;
 /** Sign out (connected/failed). */
 onDisconnect?:()=>unknown;
 labels:{
  title:string;
  connect:string;
  disconnect:string;
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
 /** Names the chat feed switch: Live chat feed. */
 chatFeedLabel:string;
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
 streaming:{endpoint:'',key:''},appAudio:true,microphone:true,chatFeed:true,
};
/** A stream server link (RTMPS, RTMP or SRT) and a key. */
export function connectionReady(connection:StreamConnection){
 if(!connection.endpoint.trim()||!connection.key.trim())return false;
 try{
  const url=new URL(connection.endpoint);
  return !!url.hostname&&['rtmps:','rtmp:','srt:'].includes(url.protocol);
 }catch{return false;}
}
/** The chat statuses that offer Connect. */
export function chatCanConnect(status:LiveStreamChatStatus){return status!=='connected';}
/** The chat statuses that can sign out. */
export function chatCanDisconnect(status:LiveStreamChatStatus){return status==='connected'||status==='failed';}
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
/**
 * Each platform's logo as one path on a 24 by 24 grid, drawn in the symbol on the sender's photo. The paths are from
 * Simple Icons (CC0); the logos remain their owners' trademarks. Trovo and DLive have no path there, so their symbols
 * draw the letter mark from `platformMarks`.
 */
export const platformIcons:Readonly<Partial<Record<LiveStreamPlatform,string>>>={
 twitch:'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z',
 youtube:'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
 kick:'M1.333 0h8v5.333H12V2.667h2.667V0h8v8H20v2.667h-2.667v2.666H20V16h2.667v8h-8v-2.667H12v-2.666H9.333V24h-8Z',
 x:'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z',
 facebook:'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
 discord:'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z',
 linkedin:'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
 rumble:'M14.4528 13.5458c.8064-.6542.9297-1.8381.2756-2.6445a1.8802 1.8802 0 0 0-.2756-.2756 21.2127 21.2127 0 0 0-4.3121-2.776c-1.066-.51-2.256.2-2.4261 1.414a23.5226 23.5226 0 0 0-.14 5.5021c.116 1.23 1.292 1.964 2.372 1.492a19.6285 19.6285 0 0 0 4.5062-2.704v-.008zm6.9322-5.4002c2.0335 2.228 2.0396 5.637.014 7.8723A26.1487 26.1487 0 0 1 8.2946 23.846c-2.6848.6713-5.4168-.914-6.1662-3.5781-1.524-5.2002-1.3-11.0803.17-16.3045.772-2.744 3.3521-4.4661 6.0102-3.832 4.9242 1.174 9.5443 4.196 13.0764 8.0121v.002z',
};
/** The letter mark drawn in a platform's symbol when `platformIcons` has no logo for it. */
export const platformMarks:Readonly<Record<LiveStreamPlatform,string>>={
 twitch:'T',youtube:'\u25B6\uFE0E',kick:'K',x:'\u{1D54F}',facebook:'f',discord:'D',linkedin:'in',trovo:'Tr',dlive:'DL',rumble:'R',
};
/** The side of a sender's photo in the chat and the feed, and of the platform symbol on its corner. */
export const chatAvatarSize=40,platformSymbolSize=18;
/** One chat line from a connected channel. Every word is host text. */
export interface LiveStreamChatMessage {
 id:string;
 username:string;
 /** Where the line was sent, as the host names it: Twitch, Kick. */
 source:string;
 /** Draws that platform's symbol on the corner of the photo, in its brand colours. Without it `source` shows as a neutral badge beside the name. */
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
 /** How long a line stays before it fades out, in milliseconds. Defaults to 12000. `Infinity` keeps lines until newer ones push them out. */
 lineDuration?:number;
}
/** The opacity of feed line `index` of `count`, oldest first: the newest at full strength, each older one a step fainter towards nothing at the top. */
export function feedLineOpacity(index:number,count:number){return count>0?Math.round((index+1)/count*1000)/1000:0;}
/** How long a feed line stays before it fades out, how long that fade takes, and how long a new line takes to push the others up, in milliseconds. */
export const feedLineDuration=12000,feedFadeDuration=640,feedEnterDuration=320;
/** One line of the feed as drawn now. A line at opacity 0 is fading out and is not read. */
export interface FeedLine<T> {message:T;opacity:number}
/**
 * The feed at `now`: the lines to draw, oldest first, each with its opacity, and when the picture next changes.
 * `seen` remembers when each line first showed and is kept by the caller between calls. A line lives for `duration`,
 * then is drawn at 0 for `feedFadeDuration` and dropped. The line just pushed past `maxVisible` is drawn at 0 too, so it fades as it leaves.
 */
export function feedFrame<T extends {id:string}>(messages:readonly T[],seen:Map<string,number>,now:number,maxVisible?:number,duration?:number):{lines:FeedLine<T>[];next:number|undefined}{
 const count=typeof maxVisible==='number'&&Number.isInteger(maxVisible)&&maxVisible>=1?maxVisible:feedVisibleLines;
 const life=typeof duration==='number'&&duration>0?duration:feedLineDuration;
 const kept=messages.slice(-(count+1)),ids=new Set(kept.map(message=>message.id));
 for(const id of [...seen.keys()])if(!ids.has(id))seen.delete(id);
 for(const message of kept)if(!seen.has(message.id))seen.set(message.id,now);
 const overflow=kept.length>count?kept[0]:undefined;
 let next:number|undefined;
 const due=(at:number)=>{if(Number.isFinite(at)&&at>now&&(next===undefined||at<next))next=at;};
 const drawn=kept.filter(message=>{const end=seen.get(message.id)!+life;due(end);due(end+feedFadeDuration);return now<end+feedFadeDuration;});
 const live=drawn.filter(message=>message!==overflow&&now<seen.get(message.id)!+life);
 return {lines:drawn.map(message=>{const index=live.indexOf(message);return {message,opacity:index<0?0:feedLineOpacity(index,live.length)};}),next};
}
/** How many lines a feed shows when `maxVisible` is left out. */
export const feedVisibleLines=4;
/** The newest `maxVisible` lines, oldest first. A count that is not a whole number of one or more falls back to the default. */
export function feedLines<T>(messages:readonly T[],maxVisible?:number):readonly T[]{
 const count=typeof maxVisible==='number'&&Number.isInteger(maxVisible)&&maxVisible>=1?maxVisible:feedVisibleLines;
 return messages.slice(-count);
}
