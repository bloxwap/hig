"use client";
import React,{useEffect,useRef,useState} from 'react';
import {notificationDelta} from '@bloxwap/hig-contracts/announcements';
import {Button} from './button.js';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from './provider.js';
export type BadgeTone='neutral'|'positive'|'negative'|'warning'|'info';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>{/** Explicit meaning; never inferred from text or a number's sign. */tone?:BadgeTone}
/** A quiet status label. The host owns announcements and may supply typography or an accessible name. */
export const Badge=React.forwardRef<HTMLSpanElement,BadgeProps>(function Badge({children,tone='neutral',className,...props},ref){const accent=['positive','negative','warning','info'].includes(tone)?tone:undefined;return <span {...props} ref={ref} className={['hig-badge',className].filter(Boolean).join(' ')} data-tone={accent}>{children}</span>;});
/** `note` and `tip` are documentation callout severities: note uses the `info` token role and tip the `positive` role, like info and success. */
export type AlertSeverity='info'|'success'|'warning'|'error'|'note'|'tip';
/** Severity sets the accent edge from a token role (info/note → info, success/tip → positive, warning → warning, error → negative). The title may be any inline node, such as text with a code span. */
export function Alert({title,children,severity='info',action,announce=true}:React.PropsWithChildren<{title:React.ReactNode;severity?:AlertSeverity;action?:React.ReactNode;announce?:boolean}>){return <section className='hig-surface' data-severity={severity} role={announce?(severity==='error'?'alert':'status'):undefined}><strong>{title}</strong>{children}{action}</section>;}
export const Callout=Alert;
export interface Notice {id:string;message:string;severity:'info'|'success'|'warning'|'error';action?:React.ReactNode}
/** Persistent until dismissed; host deduplicates ids, critical messages remain inline. */
export function Toast({notices,onDismiss,dismissLabel}: {notices:readonly Notice[];onDismiss:(id:string)=>void;/** Dismiss button text; defaults to HIGProvider `messages.dismiss`. The accessible name comes from `messages.dismissNotice` and contains it. */dismissLabel?:string}){
 const {messages}=useHIG();const dismiss=dismissLabel??messages.dismiss??en.dismiss;
 const unique=[...new Map(notices.map(n=>[n.id,n])).values()],previous=useRef(new Map<string,string>());
 const [announcement,setAnnouncement]=useState({message:'',severity:'info'});
 const pending=useRef<Notice|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const key=JSON.stringify(unique.map(n=>[n.id,n.message,n.severity]));
 useEffect(()=>{
  const delta=notificationDelta(previous.current,unique);previous.current=delta.next;
  if(!delta.message||!delta.id)return;
  if(pending.current?.severity!=='error'||!unique.some(n=>n.id===pending.current?.id&&n.message===pending.current.message))pending.current={id:delta.id,message:delta.message,severity:delta.severity};
  if(timer.current!==null)return;
  setAnnouncement({message:'',severity:pending.current!.severity});
  timer.current=setTimeout(()=>{timer.current=null;const notice=pending.current;pending.current=null;if(notice&&previous.current.get(notice.id)===JSON.stringify([notice.message,notice.severity]))setAnnouncement({message:notice.message,severity:notice.severity});},25);
 },[key]);
 useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current);},[]);
 return <aside aria-label={messages.notifications??en.notifications}>{unique.map(n=><Alert announce={false} key={n.id} title={n.message} severity={n.severity} action={<>{n.action}<Button intent='ghost' aria-label={(messages.dismissNotice??en.dismissNotice)(n.message,dismiss)} onClick={()=>onDismiss(n.id)}>{dismiss}</Button></>}/>)}<span className='hig-sr-only' role={announcement.severity==='error'?'alert':'status'} aria-atomic='true'>{announcement.message}</span></aside>;
}
export function Progress({label,value,max=100}: {label:string;value?:number;max?:number}){return <label className='hig-progress'>{label}<progress aria-label={label} value={value} max={max}/></label>;}
export function Spinner({label}: {label?:string}){const {messages}=useHIG();return <span className='hig-spinner' role='status'><span className='hig-spinner-indicator' aria-hidden='true'/>{label??messages.loading??en.loading}…</span>;}
export function Skeleton({label}: {label?:string}){const {messages}=useHIG();return <div className='hig-skeleton' aria-label={label??messages.loadingContent??en.loadingContent} role='status'/>;}
export function EmptyState({title,description,action}: {title:string;description:string;action?:React.ReactNode}){return <section className='hig-surface'><h3>{title}</h3><p>{description}</p>{action}</section>;}
export function Avatar({name,src}: {name:string;src?:string}){return src?<img className='hig-avatar' alt={name} src={src}/>:<span className='hig-avatar' role='img' aria-label={name}>{name.slice(0,2)}</span>;}
export function StatusIndicator({label,state}: {label:string;state:'online'|'offline'|'stale'}){const {messages}=useHIG();const text={online:messages.statusOnline??en.statusOnline,offline:messages.statusOffline??en.statusOffline,stale:messages.statusStale??en.statusStale}[state]??state;return <span className='hig-status-indicator' data-state={state}>{label}: {text}</span>;}
