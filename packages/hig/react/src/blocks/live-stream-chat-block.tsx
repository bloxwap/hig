"use client";
import React,{useLayoutEffect,useRef} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {chatFollowSlack,type LiveStreamChatBlockProps} from '@bloxwap/hig/contracts/live-stream';
export type {LiveStreamChatBlockProps,LiveStreamChatMessage} from '@bloxwap/hig/contracts/live-stream';
import {useMessageOverrides} from '../provider.js';
import {IconButton} from '../button.js';
import {Avatar} from '../avatar.js';
import {Badge} from '../status.js';
import {ScreenHeader} from './screen-header.js';
import {SwapIcon} from './swap/shared.js';
export function LiveStreamChatBlock({title,messages,emptyLabel,onClose,headingId}:LiveStreamChatBlockProps){
 const overrides=useMessageOverrides();
 const log=useRef<HTMLOListElement>(null),following=useRef(true);
 // A new line keeps the newest in view unless the reader scrolled back to read earlier ones.
 useLayoutEffect(()=>{const node=log.current;if(node&&following.current)node.scrollTop=node.scrollHeight;},[messages]);
 return <section className='hig-live-chat'>
  <ScreenHeader title={title} headingId={headingId} action={onClose&&<IconButton intent='ghost' label={overrides.close??en.close} onClick={onClose}><SwapIcon name='close'/></IconButton>}/>
  {messages.length===0&&<p className='hig-settings-description'>{emptyLabel}</p>}
  <ol ref={log} className='hig-live-chat-log' role='log' aria-label={title} hidden={messages.length===0}
   onScroll={event=>{const node=event.currentTarget;following.current=node.scrollHeight-node.scrollTop-node.clientHeight<=chatFollowSlack;}}>
   {messages.map(message=><li key={message.id} className='hig-live-chat-message'>
    <Avatar name={message.username} src={message.avatarUrl} size={32} decorative/>
    <div className='hig-live-chat-body'>
     <div className='hig-live-chat-meta'><span className='hig-live-chat-name'>{message.username}</span><Badge>{message.source}</Badge></div>
     <p className='hig-live-chat-text'>{message.text}</p>
    </div>
   </li>)}
  </ol>
 </section>;
}
