"use client";
import React,{useEffect} from 'react';
import {Toaster as SonnerToaster,toast as sonner,type ToasterProps} from 'sonner';
import * as en from '@bloxwap/hig/contracts/messages';
import {TOAST_DURATION,TOAST_GAP,TOAST_NARROW_OFFSET,TOAST_OFFSET,TOAST_VISIBLE,toastDuration,type ToastBaseOptions,type ToastCall,type ToastId,type ToastSeverity} from '@bloxwap/hig/contracts/toast';
import {useHIG} from './provider.js';
import {ToastNotice} from './status.js';
import {registerNotifier} from './notify.js';
export type {ToasterProps} from 'sonner';
export type {ToastBaseOptions,ToastCall,ToastId,ToastPosition,ToastSeverity,ToastSwipeDirection} from '@bloxwap/hig/contracts/toast';
const edges=['top','right','bottom','left'] as const;
/** A number, for every edge or for one named edge, is a distance added to that edge's safe-area inset, as the native host places its stack; an edge left out keeps the default. A string is the host's own CSS and reaches Sonner untouched. */
const inset=(offset:ToasterProps['offset'],fallback:number):ToasterProps['offset']=>typeof offset==='string'?offset:Object.fromEntries(edges.map(edge=>{const value=typeof offset==='object'?offset[edge]:offset;return [edge,typeof value==='string'?value:`calc(env(safe-area-inset-${edge}, 0px) + ${value??fallback}px)`];}));
/**
 * Sonner's host for transient HIG notices. Mount once near the app root, inside HIGProvider. It shares its defaults with the
 * native `Toaster` (`@bloxwap/hig/contracts/toast`): three visible notices, a 14px gap, four seconds, and offsets that clear
 * the safe area. Any Sonner prop overrides them. As on native, `offset` places the stack at every window width: Sonner's
 * `mobileOffset`, for windows under 600px, takes `offset` unless it is given itself, and an edge neither names keeps the
 * narrow default.
 */
export function Toaster({offset,mobileOffset,...props}:ToasterProps){const {direction,messages}=useHIG();
 // While mounted, HIG components that report a result (InstallCommand) raise it here instead of inline.
 useEffect(()=>registerNotifier(toast),[]);
 return <SonnerToaster position='bottom-center' theme='dark' dir={direction} visibleToasts={TOAST_VISIBLE} gap={TOAST_GAP} duration={TOAST_DURATION} containerAriaLabel={messages.notifications??en.notifications} offset={inset(offset,TOAST_OFFSET)} mobileOffset={inset(mobileOffset??offset,TOAST_NARROW_OFFSET)} {...props}/>;}
export interface ToastOptions extends ToastBaseOptions {/** A control drawn before the close button, such as a `Button` that retries. */action?:React.ReactNode}
/** The capsule as Sonner draws it: inside the Toaster's tree, so the close button's name comes from the provider's translation. */
function Raised({message,options,onClose}:{message:string;options:ToastOptions;onClose:()=>void}){const {messages}=useHIG();
 return <ToastNotice message={message} description={options.description} severity={options.severity??'info'} action={options.action} dismissName={options.dismissName??(messages.dismissNotice??en.dismissNotice)(message,messages.dismiss??en.dismiss)} onDismiss={onClose}/>;}
function raise(message:string,options:ToastOptions={}):ToastId{const {duration,id,onDismiss,onAutoClose}=options;
 return sonner.custom(current=><Raised message={message} options={options} onClose={()=>sonner.dismiss(current)}/>,{duration:toastDuration(duration),id,onDismiss:onDismiss&&(()=>onDismiss()),onAutoClose:onAutoClose&&(()=>onAutoClose())});
}
/** Dismisses one notice by id, or every notice when the id is omitted. */
export function dismissToast(id?:ToastId):void{sonner.dismiss(id);}
const as=(severity:ToastSeverity)=>(message:string,options?:Omit<ToastOptions,'severity'>):ToastId=>raise(message,{...options,severity});
/**
 * Raises a transient HIG capsule through Sonner and returns its id. Needs a mounted `Toaster` (or the host's own Sonner
 * `Toaster`). `toast.success`, `toast.error`, `toast.warning` and `toast.info` set the severity; `toast.dismiss` is
 * `dismissToast`. The same call, options and names work in `@bloxwap/hig/native/toast`.
 */
export const toast:ToastCall<ToastOptions>=Object.assign(raise,{success:as('success'),error:as('error'),warning:as('warning'),info:as('info'),dismiss:dismissToast});
