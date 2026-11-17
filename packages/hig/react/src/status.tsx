"use client";
import React,{useEffect,useRef,useState} from 'react';
import {notificationDelta} from '@bloxwap/hig/contracts/announcements';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from './provider.js';
export type BadgeTone='neutral'|'positive'|'negative'|'warning'|'info';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>{/** Explicit meaning; never inferred from text or a number's sign. */tone?:BadgeTone}
/** A quiet status label. The host owns announcements and may supply typography or an accessible name. */
export const Badge=React.forwardRef<HTMLSpanElement,BadgeProps>(function Badge({children,tone='neutral',className,...props},ref){const accent=['positive','negative','warning','info'].includes(tone)?tone:undefined;return <span {...props} ref={ref} className={['hig-badge',className].filter(Boolean).join(' ')} data-tone={accent}>{children}</span>;});
/** `note` and `tip` are documentation callout severities: note uses the `info` token role and tip the `positive` role, like info and success. `default` is the neutral variant: a faint `text` tint with the title in `text`. */
export type AlertSeverity='default'|'info'|'success'|'warning'|'error'|'note'|'tip';
/** Severity tints the fill 10% and colours the title from a token role (info/note → info, success/tip → positive, warning → warning, error → negative; default → 6% of text), with no stroke or glow. The title may be any inline node, such as text with a code span. */
export function Alert({title,children,severity='info',action,announce=true}:React.PropsWithChildren<{title:React.ReactNode;severity?:AlertSeverity;action?:React.ReactNode;announce?:boolean}>){return <section className='hig-surface hig-alert' data-severity={severity} role={announce?(severity==='error'?'alert':'status'):undefined}><strong>{title}</strong>{children}{action!=null&&<div className='hig-alert-actions'>{action}</div>}</section>;}
export const Callout=Alert;
export interface Notice {id:string;message:string;severity:'info'|'success'|'warning'|'error';action?:React.ReactNode}
const noticeSymbol={info:<><circle cx='10' cy='10' r='7.25'/><path d='M10 9.25v4.25M10 6.5v.01'/></>,success:<><circle cx='10' cy='10' r='7.25'/><path d='m6.75 10.25 2.25 2.25 4.25-4.5'/></>,warning:<><path d='M10 3.5 17.25 16H2.75Z'/><path d='M10 8.5v3.25M10 14v.01'/></>,error:<><circle cx='10' cy='10' r='7.25'/><path d='m7.5 7.5 5 5m0-5-5 5'/></>};
/** One notice as a single capsule row: severity symbol on the leading edge, message, optional action, close on the trailing edge. Shared by `Toast` and the Sonner-backed `toast()`; it announces nothing itself. */
export function ToastNotice({message,severity='info',action,dismissName,onDismiss}: {message:React.ReactNode;severity?:Notice['severity'];action?:React.ReactNode;/** Accessible name of the close button. */dismissName:string;onDismiss:()=>void}){return <div className='hig-toast-item' data-severity={severity}><svg className='hig-toast-icon' aria-hidden='true' focusable='false' viewBox='0 0 20 20'>{noticeSymbol[severity]??noticeSymbol.info}</svg><span className='hig-toast-message'>{message}</span>{action}<button type='button' className='hig-toast-close' aria-label={dismissName} onClick={onDismiss}><svg aria-hidden='true' focusable='false' viewBox='0 0 20 20'><path d='m5.5 5.5 9 9m0-9-9 9'/></svg></button></div>;}
/** Persistent until dismissed; host deduplicates ids, critical messages remain inline. */
export function Toast({notices,onDismiss,dismissLabel}: {notices:readonly Notice[];onDismiss:(id:string)=>void;/** Dismiss wording inside the close button's accessible name (`messages.dismissNotice`); the button itself draws a close symbol. Defaults to HIGProvider `messages.dismiss`. */dismissLabel?:string}){
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
 return <aside className='hig-toast' aria-label={messages.notifications??en.notifications}>{unique.map(n=><ToastNotice key={n.id} message={n.message} severity={n.severity} action={n.action} dismissName={(messages.dismissNotice??en.dismissNotice)(n.message,dismiss)} onDismiss={()=>onDismiss(n.id)}/>)}<span className='hig-sr-only' role={announcement.severity==='error'?'alert':'status'} aria-atomic='true'>{announcement.message}</span></aside>;
}
export function Progress({label,value,max=100}: {label:string;value?:number;max?:number}){return <label className='hig-progress'>{label}<progress aria-label={label} value={value} max={max}/></label>;}
export interface SpinnerProps {
 /** What is loading; defaults to HIGProvider `messages.loading`. */
 label?:string;
 /** Draws the ring alone, for a tight spot such as a row or a button-sized slot: the label is not drawn but stays the status's accessible text. */
 hideLabel?:boolean;
}
export function Spinner({label,hideLabel}:SpinnerProps){const {messages}=useHIG();const text=`${label??messages.loading??en.loading}…`;return <span className='hig-spinner' role='status'><span className='hig-spinner-indicator' aria-hidden='true'/>{hideLabel?<span className='hig-sr-only'>{text}</span>:text}</span>;}
export function Skeleton({label}: {label?:string}){const {messages}=useHIG();return <div className='hig-skeleton' aria-label={label??messages.loadingContent??en.loadingContent} role='status'/>;}
const emptySymbol=<svg aria-hidden='true' focusable='false' viewBox='0 0 32 32'><path d='M5 18.5 8.6 8.9A2 2 0 0 1 10.5 7.5h11a2 2 0 0 1 1.9 1.4L27 18.5v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z'/><path d='M5 18.5h6.5a4.5 4.5 0 0 0 9 0H27'/></svg>;
/** Centred stack: symbol, title, optional description, optional action. Decorative `illustration` replaces the default symbol (same prop as native); `null` omits it. */
export function EmptyState({title,description,action,illustration}: {title:string;description?:string;action?:React.ReactNode;illustration?:React.ReactNode}){return <section className='hig-surface hig-empty-state'>{illustration!==null&&<span className='hig-empty-state-icon' aria-hidden='true'>{illustration??emptySymbol}</span>}<h3>{title}</h3>{description&&<p>{description}</p>}{action}</section>;}
export function Avatar({name,src}: {name:string;src?:string}){return src?<img className='hig-avatar' alt={name} src={src}/>:<span className='hig-avatar' role='img' aria-label={name}>{name.slice(0,2)}</span>;}
export function StatusIndicator({label,state}: {label:string;state:'online'|'offline'|'stale'}){const {messages}=useHIG();const text={online:messages.statusOnline??en.statusOnline,offline:messages.statusOffline??en.statusOffline,stale:messages.statusStale??en.statusStale}[state]??state;return <span className='hig-status-indicator' data-state={state}>{label}: {text}</span>;}
