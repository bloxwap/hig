"use client";
import React from 'react';
import {feedLines,type LiveStreamFeedBlockProps} from '@bloxwap/hig/contracts/live-stream';
export type {LiveStreamFeedBlockProps,LiveStreamChatMessage,LiveStreamPlatform} from '@bloxwap/hig/contracts/live-stream';
export {platformColors} from '@bloxwap/hig/contracts/live-stream';
import {Avatar} from '../avatar.js';
import {PlatformBadge} from './live-stream-platform.js';
/** Chat lines drawn over other content, such as a chart. It fills the bottom of the nearest positioned ancestor and takes no pointer input, so the content under it stays usable. */
export function LiveStreamFeedBlock({label,messages,maxVisible}:LiveStreamFeedBlockProps){
 const lines=feedLines(messages,maxVisible);
 return <div className='hig-live-feed' role='log' aria-label={label}><ol className='hig-live-feed-list'>
  {lines.map(message=><li key={message.id} className='hig-live-feed-line'>
   <Avatar name={message.username} src={message.avatarUrl} size={32} decorative/>
   <div className='hig-live-feed-body'>
    <div className='hig-live-chat-meta'><span className='hig-live-chat-name'>{message.username}</span><PlatformBadge message={message}/></div>
    <p className='hig-live-feed-text'>{message.text}</p>
   </div>
  </li>)}
 </ol></div>;
}
