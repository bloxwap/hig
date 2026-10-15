"use client";
import React,{useEffect,useRef,useState} from 'react';
import {notificationDelta} from '@bloxwap/hig-contracts/announcements';
import {Button} from './button.js';
export function Badge({children}:React.PropsWithChildren){return <span className='hig-badge'>{children}</span>;}
/** `note` and `tip` are documentation severities; every severity colours the inline-start edge from a token role. */
export type Severity='info'|'success'|'warning'|'error'|'note'|'tip';
export interface AlertProps {title?:React.ReactNode;severity?:Severity;action?:React.ReactNode;announce?:boolean}
export function Alert({title,children,severity='info',action,announce=true}:React.PropsWithChildren<AlertProps>){return <section className='hig-surface' data-severity={severity} role={announce?(severity==='error'?'alert':'status'):undefined}>{title!=null&&title!==false&&<strong>{title}</strong>}{children}{action}</section>;}
/** Static guidance such as documentation notes: not a live region unless `announce` is set. */
export function Callout({announce=false,...props}:React.PropsWithChildren<AlertProps>){return <Alert {...props} announce={announce}/>;}
export interface Notice {id:string;message:string;severity:'info'|'success'|'warning'|'error';action?:React.ReactNode}
/** Persistent until dismissed; host deduplicates ids, critical messages remain inline. */
export function Toast({notices,onDismiss}: {notices:readonly Notice[];onDismiss:(id:string)=>void}){
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
 return <aside aria-label='Notifications'>{unique.map(n=><Alert announce={false} key={n.id} title={n.message} severity={n.severity} action={<>{n.action}<Button intent='ghost' aria-label={`Dismiss ${n.message}`} onClick={()=>onDismiss(n.id)}>Dismiss</Button></>}/>)}<span className='hig-sr-only' role={announcement.severity==='error'?'alert':'status'} aria-atomic='true'>{announcement.message}</span></aside>;
}
export function Progress({label,value,max=100}: {label:string;value?:number;max?:number}){return <label className='hig-progress'>{label}<progress aria-label={label} value={value} max={max}/></label>;}
export function Spinner({label='Loading'}: {label?:string}){return <span className='hig-spinner' role='status'><span className='hig-spinner-indicator' aria-hidden='true'/>{label}…</span>;}
export function Skeleton({label='Loading content'}: {label?:string}){return <div className='hig-skeleton' aria-label={label} role='status'/>;}
export function EmptyState({title,description,action}: {title:string;description:string;action?:React.ReactNode}){return <section className='hig-surface'><h3>{title}</h3><p>{description}</p>{action}</section>;}
export function Avatar({name,src}: {name:string;src?:string}){return src?<img className='hig-avatar' alt={name} src={src}/>:<span className='hig-avatar' role='img' aria-label={name}>{name.slice(0,2)}</span>;}
export function StatusIndicator({label,state}: {label:string;state:'online'|'offline'|'stale'}){return <span className='hig-status-indicator' data-state={state}>{label}: {state}</span>;}
