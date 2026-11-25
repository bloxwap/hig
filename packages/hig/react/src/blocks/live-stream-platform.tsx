import React from 'react';
import {chatAvatarSize,platformColors,platformIcons,platformMarks,type LiveStreamChatMessage} from '@bloxwap/hig/contracts/live-stream';
import {Avatar} from '../avatar.js';
import {Badge} from '../status.js';
const known=(message:LiveStreamChatMessage)=>!!message.platform&&message.platform in platformColors;
/** The sender's photo with the platform's symbol on its bottom trailing corner when the host names the platform. */
export function ChatAvatar({message}:{message:LiveStreamChatMessage}){
 const colors=known(message)?platformColors[message.platform!]:undefined;
 return <span className='hig-live-chat-avatar'>
  <Avatar name={message.username} src={message.avatarUrl} size={chatAvatarSize} decorative/>
  {known(message)&&<span className='hig-live-platform' data-platform={message.platform} style={colors?{background:colors.fill,color:colors.ink}:undefined}>
   {platformIcons[message.platform!]?<svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'><path d={platformIcons[message.platform!]} fill='currentColor'/></svg>:<span aria-hidden='true'>{platformMarks[message.platform!]}</span>}<span className='hig-sr-only'>{message.source}</span>
  </span>}
 </span>;
}
/** The source of a chat line as a neutral badge, for a line whose platform has no symbol. */
export function SourceBadge({message}:{message:LiveStreamChatMessage}){
 return known(message)?null:<Badge>{message.source}</Badge>;
}
