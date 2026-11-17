"use client";
import React,{useEffect,useRef,useState} from 'react';
import {notificationDelta} from '@bloxwap/hig/contracts/announcements';
import * as en from '@bloxwap/hig/contracts/messages';
import {beamAvatar,beamEye,beamSize} from '@bloxwap/hig/contracts/avatar';
import {useColors,useHIG} from './provider.js';
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
export function Spinner({label}: {label?:string}){const {messages}=useHIG();return <span className='hig-spinner' role='status'><span className='hig-spinner-indicator' aria-hidden='true'/>{label??messages.loading??en.loading}…</span>;}
export function Skeleton({label}: {label?:string}){const {messages}=useHIG();return <div className='hig-skeleton' aria-label={label??messages.loadingContent??en.loadingContent} role='status'/>;}
const emptySymbol=<svg aria-hidden='true' focusable='false' viewBox='0 0 32 32'><path d='M5 18.5 8.6 8.9A2 2 0 0 1 10.5 7.5h11a2 2 0 0 1 1.9 1.4L27 18.5v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z'/><path d='M5 18.5h6.5a4.5 4.5 0 0 0 9 0H27'/></svg>;
/** Centred stack: symbol, title, optional description, optional action. Decorative `illustration` replaces the default symbol (same prop as native); `null` omits it. */
export function EmptyState({title,description,action,illustration}: {title:string;description?:string;action?:React.ReactNode;illustration?:React.ReactNode}){return <section className='hig-surface hig-empty-state'>{illustration!==null&&<span className='hig-empty-state-icon' aria-hidden='true'>{illustration??emptySymbol}</span>}<h3>{title}</h3>{description&&<p>{description}</p>}{action}</section>;}
/** Token roles of the default face palette, in this order. The order and the number of colours decide which colours a seed lands on. */
export const avatarColorRoles=['action','info','negative','warning'] as const;
export interface AvatarProps {
 /** The person or account. It is the accessible name, the first two letters are the initials, and it is the seed of the generated face unless `seed` is given. */
 name:string;
 /** An image to show instead. If it fails to load, the initials or the generated face show in its place. */
 src?:string;
 /** What the generated face is drawn from, such as a wallet address. The same seed and colours draw the same face on web and native. It is case-sensitive. Passing it selects the generated face. Defaults to `name`. */
 seed?:string;
 /** What shows without an image: `initials`, the first two letters of `name` on the well fill, or `beam`, a generated face. Defaults to `initials`, or to `beam` when `seed` is given. */
 variant?:'initials'|'beam';
 /** Width and height in CSS pixels. Defaults to 40. */
 size?:number;
 /** Palette of the generated face, as CSS colours. Defaults to the `action`, `info`, `negative` and `warning` token roles (`avatarColorRoles`), which are Display P3 where the screen supports it. A seed picks by position, so the same list in the same order keeps the same faces. */
 colors?:readonly string[];
 /** One colour for the eyes and mouth of every generated face. Left out, each face takes the `background` role on a bright colour and the `text` role on a deep one. */
 faceColor?:string;
 /** A square with no rounded corners instead of a disc, for a host that clips it to its own shape. */
 square?:boolean;
 /** Hides the avatar from assistive technology, for an avatar beside the name it stands for. */
 decorative?:boolean;
}
const beamPaints=avatarColorRoles.map(role=>`var(--hig-${role})`),beamInks={dark:'var(--hig-background)',light:'var(--hig-text)'},beamBox=`0 0 ${beamSize} ${beamSize}`;
const samePalette=(a?:readonly string[],b?:readonly string[])=>a===b||(a!==undefined&&b!==undefined&&a.length===b.length&&a.every((color,index)=>color===b[index]));
/** The generated face as inline SVG. Memoised on what it draws, so a parent that re-renders with the same seed and colours costs nothing here. */
const BeamFace=React.memo(function BeamFace({seed,colors,faceColor}: {seed:string;colors?:readonly string[];faceColor?:string}){
 // The default palette paints the CSS variables (Display P3 where supported) and chooses each ink from the provider's resolved roles, so a host `primaryColor` is read too.
 const roles=useColors(),own=colors&&colors.length>0?colors:undefined;
 const face=beamAvatar(seed,own??avatarColorRoles.map(role=>roles[role]),beamInks),paint=own??beamPaints,ink=faceColor??face.faceColor;
 return <svg viewBox={beamBox} aria-hidden='true' focusable='false'>
  <rect width={beamSize} height={beamSize} style={{fill:paint[face.backgroundIndex]}}/>
  <rect width={beamSize} height={beamSize} rx={face.wrapperRadius} transform={face.wrapperTransform} style={{fill:paint[face.wrapperIndex]}}/>
  <g transform={face.faceTransform}>
   <path d={face.mouthPath} style={face.mouthStroked?{fill:'none',stroke:ink,strokeLinecap:'round'}:{fill:ink}}/>
   <rect x={face.leftEyeX} y={beamEye.y} width={beamEye.width} height={beamEye.height} rx={beamEye.radius} style={{fill:ink}}/>
   <rect x={face.rightEyeX} y={beamEye.y} width={beamEye.width} height={beamEye.height} rx={beamEye.radius} style={{fill:ink}}/>
  </g>
 </svg>;
},(previous,next)=>previous.seed===next.seed&&previous.faceColor===next.faceColor&&samePalette(previous.colors,next.colors));
/** A person or account as a 40px disc: an image, else the first two letters of the name, else (with `variant='beam'` or a `seed`) a face generated from the seed. The face is an identity picture, so it is the same in right-to-left layouts and it never moves. */
export function Avatar({name,src,seed,variant,size,colors,faceColor,square,decorative}:AvatarProps){
 const [failed,setFailed]=useState<string>();
 const box=size===undefined?undefined:{width:size,height:size},flat=square||undefined;
 if(src&&failed!==src)return <img className='hig-avatar' alt={decorative?'':name} src={src} style={box} data-square={flat} onError={()=>setFailed(src)}/>;
 const named=decorative?{'aria-hidden':true}:{role:'img','aria-label':name};
 if((variant??(seed===undefined?'initials':'beam'))==='beam')return <span {...named} className='hig-avatar' data-variant='beam' data-square={flat} style={box}><BeamFace seed={seed??name} colors={colors} faceColor={faceColor}/></span>;
 return <span {...named} className='hig-avatar' data-square={flat} style={size===undefined?undefined:{width:size,height:size,fontSize:size*0.4,lineHeight:1}}>{name.slice(0,2)}</span>;
}
export function StatusIndicator({label,state}: {label:string;state:'online'|'offline'|'stale'}){const {messages}=useHIG();const text={online:messages.statusOnline??en.statusOnline,offline:messages.statusOffline??en.statusOffline,stale:messages.statusStale??en.statusStale}[state]??state;return <span className='hig-status-indicator' data-state={state}>{label}: {text}</span>;}
