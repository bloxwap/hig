"use client";
import { CircleCheck } from '@bloxwap/icons/react/circle-check';
import { CircleX } from '@bloxwap/icons/react/circle-x';
import { Inbox } from '@bloxwap/icons/react/inbox';
import { Info } from '@bloxwap/icons/react/info';
import { TriangleAlert } from '@bloxwap/icons/react/triangle-alert';
import { X } from '@bloxwap/icons/react/x';
import {useBusySpinner} from './use-busy-spinner.js';
import {progressValue} from '@bloxwap/hig/contracts';
import React,{useEffect,useRef,useState} from 'react';
import {notificationDelta} from '@bloxwap/hig/contracts/announcements';
import * as en from '@bloxwap/hig/contracts/messages';
import {useMessageOverrides} from './provider.js';
export type BadgeTone='neutral'|'positive'|'negative'|'warning'|'info';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>{/** Explicit meaning; never inferred from text or a number's sign. */tone?:BadgeTone;/** A 6px status dot in the label colour on the leading edge, hidden from assistive technology. */dot?:boolean}
/** A quiet status label. The host owns announcements and may supply typography or an accessible name. */
export const Badge=React.forwardRef<HTMLSpanElement,BadgeProps>(function Badge({children,tone='neutral',dot,className,...props},ref){const accent=['positive','negative','warning','info'].includes(tone)?tone:undefined;return <span {...props} ref={ref} className={['hig-badge',className].filter(Boolean).join(' ')} data-tone={accent}>{dot&&<span className='hig-badge-dot' aria-hidden='true'/>}{children}</span>;});
/** `note` and `tip` are documentation callout severities: note uses the `info` token role and tip the `positive` role, like info and success. `default` is the neutral variant: a faint `text` tint with the title in `text`. */
export type AlertSeverity='default'|'info'|'success'|'warning'|'error'|'note'|'tip';
/** Severity tints the fill 10% and colours the title from a token role (info/note → info, success/tip → positive, warning → warning, error → negative; default → 6% of text), with no stroke or glow. The title may be any inline node, such as text with a code span. */
export function Alert({title,children,severity='info',action,announce=true}:React.PropsWithChildren<{title:React.ReactNode;severity?:AlertSeverity;action?:React.ReactNode;announce?:boolean}>){return <section className='hig-surface hig-alert' data-severity={severity} role={announce?(severity==='error'?'alert':'status'):undefined}><strong>{title}</strong>{children}{action!=null&&<div className='hig-alert-actions'>{action}</div>}</section>;}
export const Callout=Alert;
export interface Notice {id:string;message:string;severity:'info'|'success'|'warning'|'error';action?:React.ReactNode}
const noticeSymbol={info:Info,success:CircleCheck,warning:TriangleAlert,error:CircleX};
/** One notice as a single capsule row: severity symbol on the leading edge, message with an optional description under it, optional action, close on the trailing edge. Shared by `Toast` and the Sonner-backed `toast()`; it announces nothing itself. */
export function ToastNotice({message,description,severity='info',action,dismissName,onDismiss}: {message:React.ReactNode;/** A second line under the message, in regular weight. With one the capsule keeps a fixed corner radius, not a full pill. */description?:React.ReactNode;severity?:Notice['severity'];action?:React.ReactNode;/** Accessible name of the close button. */dismissName:string;onDismiss:()=>void}){const Symbol=noticeSymbol[severity]??Info;const described=description!=null&&description!==false&&description!=='';return <div className='hig-toast-item' data-severity={severity} data-described={described?'':undefined}><Symbol size={20} className='hig-toast-icon'/><span className='hig-toast-message'>{message}{described&&<span className='hig-toast-description'>{description}</span>}</span>{action}<button type='button' className='hig-toast-close' aria-label={dismissName} onClick={onDismiss}><X size={20}/></button></div>;}
const PersistentNotice = React.memo(function PersistentNotice({
 id, message, severity, action, dismiss, formatDismiss, onDismiss
}: Notice & {dismiss:string; formatDismiss:typeof en.dismissNotice; onDismiss:(id:string)=>void}) {
 return <ToastNotice message={message} severity={severity} action={action}
  dismissName={formatDismiss(message,dismiss)} onDismiss={()=>onDismiss(id)}/>;
});
/** Persistent until dismissed; host deduplicates ids, critical messages remain inline. */
export function Toast({notices,onDismiss,dismissLabel}: {notices:readonly Notice[];onDismiss:(id:string)=>void;/** Dismiss wording inside the close button's accessible name (`messages.dismissNotice`); the button itself draws a close symbol. Defaults to HIGProvider `messages.dismiss`. */dismissLabel?:string}){
 const messages=useMessageOverrides();const dismiss=dismissLabel??messages.dismiss??en.dismiss;
 const unique=React.useMemo(()=>[...new Map(notices.map(n=>[n.id,n])).values()],[notices]),previous=useRef(new Map<string,string>());
 const [announcement,setAnnouncement]=useState({message:'',severity:'info'});
 const pending=useRef<Notice|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  const delta=notificationDelta(previous.current,unique);previous.current=delta.next;
  if(!delta.message||!delta.id)return;
  if(pending.current?.severity!=='error'||!unique.some(n=>n.id===pending.current?.id&&n.message===pending.current.message))pending.current={id:delta.id,message:delta.message,severity:delta.severity};
  if(timer.current!==null)return;
  setAnnouncement({message:'',severity:pending.current!.severity});
  timer.current=setTimeout(()=>{timer.current=null;const notice=pending.current;pending.current=null;if(notice&&previous.current.get(notice.id)===JSON.stringify([notice.message,notice.severity]))setAnnouncement({message:notice.message,severity:notice.severity});},25);
 },[unique]);
 useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current);},[]);
 return <aside className='hig-toast' aria-label={messages.notifications??en.notifications}>{unique.map(n=><PersistentNotice key={n.id} {...n} dismiss={dismiss} formatDismiss={messages.dismissNotice??en.dismissNotice} onDismiss={onDismiss}/>)}<span className='hig-sr-only' role={announcement.severity==='error'?'alert':'status'} aria-atomic='true'>{announcement.message}</span></aside>;
}
export function Progress({label,value,max=100}: {label:string;value?:number;max?:number}){({value,max}=progressValue(value,max));return <label className='hig-progress'>{label}<span className='hig-progress-track' data-indeterminate={value===undefined||undefined}><progress aria-label={label} value={value} max={max}/></span></label>;}
export interface SpinnerProps {
 /** What is loading; defaults to HIGProvider `messages.loading`. */
 label?:string;
 /** Draws the ring alone, for a tight spot such as a row or a button-sized slot: the label is not drawn but stays the status's accessible text. */
 hideLabel?:boolean;
}
export function Spinner({label,hideLabel}:SpinnerProps){
 const messages=useMessageOverrides(),visible=useBusySpinner(true);
 const text=`${label??messages.loading??en.loading}…`;
 return <span className='hig-spinner' role='status'>
  <span className={visible?'hig-spinner-indicator':'hig-spinner-placeholder'} aria-hidden='true'/>
  {hideLabel?<span className='hig-sr-only'>{text}</span>:text}
 </span>;
}
export function Skeleton({label}: {label?:string}){const messages=useMessageOverrides();return <div className='hig-skeleton' aria-label={label??messages.loadingContent??en.loadingContent} role='status'/>;}
const emptySymbol=<Inbox size={48}/>;
/** Centred stack: symbol, title, optional description, optional action. Decorative `illustration` replaces the default symbol (same prop as native); `null` omits it. */
export function EmptyState({title,description,action,illustration}: {title:string;description?:string;action?:React.ReactNode;illustration?:React.ReactNode}){return <section className='hig-surface hig-empty-state'>{illustration!==null&&<span className='hig-empty-state-icon' aria-hidden='true'>{illustration??emptySymbol}</span>}<h3>{title}</h3>{description&&<p>{description}</p>}{action}</section>;}
/** `Avatar` is its own entry, `@bloxwap/hig/react/avatar`; this entry keeps exporting it for the imports that predate that one. */
export {Avatar,type AvatarProps} from './avatar.js';
export function StatusIndicator({label,state}: {label:string;state:'online'|'offline'|'stale'}){const messages=useMessageOverrides();const text={online:messages.statusOnline??en.statusOnline,offline:messages.statusOffline??en.statusOffline,stale:messages.statusStale??en.statusStale}[state]??state;return <span className='hig-status-indicator' data-state={state}>{label}: {text}</span>;}
