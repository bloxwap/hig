"use client";
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {feedEnterDuration,feedFrame,type LiveStreamFeedBlockProps} from '@bloxwap/hig/contracts/live-stream';
export type {LiveStreamFeedBlockProps,LiveStreamChatMessage,LiveStreamPlatform} from '@bloxwap/hig/contracts/live-stream';
export {platformColors,platformIcons,platformMarks} from '@bloxwap/hig/contracts/live-stream';
import {useReducedMotion} from '../provider.js';
import {ChatAvatar,SourceBadge} from './live-stream-platform.js';
/** The space between two feed lines, as `.hig-live-feed-list` sets it. */
const lineGap=4;
/**
 * Chat lines drawn over other content, such as a chart. A new line rises from under the bottom edge and pushes the others up;
 * lines fade from the newest at full strength to nothing at the top, and each fades out once it has been up for `lineDuration`.
 * It fills the bottom of the nearest positioned ancestor and takes no pointer input, so the content under it stays usable.
 */
export function LiveStreamFeedBlock({label,messages,maxVisible,lineDuration}:LiveStreamFeedBlockProps){
 const reduced=useReducedMotion();
 const seen=useRef(new Map<string,number>()),list=useRef<HTMLOListElement>(null),shown=useRef<Set<string>|null>(null);
 const [,tick]=useState(0);
 const {lines,next}=feedFrame(messages,seen.current,Date.now(),maxVisible,lineDuration);
 // Wake when the next line is due to fade or to go.
 useEffect(()=>{
  if(next===undefined)return;
  const timer=setTimeout(()=>tick(count=>count+1),Math.max(0,next-Date.now()));
  return ()=>clearTimeout(timer);
 });
 const ids=lines.map(line=>line.message.id).join('\n');
 // New lines land at the bottom: start the list lower by their height, so they rise from under the edge and push the rest up.
 useLayoutEffect(()=>{
  const node=list.current,before=shown.current,now=ids?ids.split('\n'):[];
  shown.current=new Set(now);
  if(!node||!before||reduced||typeof node.animate!=='function')return;
  const entering=now.filter(id=>!before.has(id)).length;
  if(!entering)return;
  const rows=Array.from(node.children).slice(-entering);
  const rise=rows.reduce((sum,row)=>sum+row.getBoundingClientRect().height+lineGap,0);
  if(rise>0)node.animate([{transform:`translateY(${rise}px)`},{transform:'translateY(0)'}],{duration:feedEnterDuration,easing:'cubic-bezier(.22,1,.36,1)'});
 },[ids,reduced]);
 return <div className='hig-live-feed' role='log' aria-label={label}><ol ref={list} className='hig-live-feed-list'>
  {lines.map(({message,opacity})=><li key={message.id} className='hig-live-feed-line' aria-hidden={opacity===0||undefined} style={{opacity}}>
   <ChatAvatar message={message}/>
   <div className='hig-live-feed-body'>
    <div className='hig-live-chat-meta'><span className='hig-live-chat-name'>{message.username}</span><SourceBadge message={message}/></div>
    <p className='hig-live-feed-text'>{message.text}</p>
   </div>
  </li>)}
 </ol></div>;
}
