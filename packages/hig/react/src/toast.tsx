"use client";
import React from 'react';
import {Toaster as SonnerToaster,toast as sonner,type ToasterProps} from 'sonner';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from './provider.js';
import {ToastNotice,type Notice} from './status.js';
export type {ToasterProps} from 'sonner';
/** Sonner's host for transient HIG notices. Mount once near the app root, inside HIGProvider; any Sonner prop overrides the defaults. */
export function Toaster(props:ToasterProps){const {direction}=useHIG();return <SonnerToaster position='bottom-center' theme='dark' dir={direction} {...props}/>;}
export interface ToastOptions {severity?:Notice['severity'];action?:React.ReactNode;/** Accessible name of the close button; defaults to the English `dismissNotice`. Pass the provider's translation from a component. */dismissName?:string;/** Milliseconds before auto-dismiss; Sonner's default when omitted. */duration?:number;/** Reuse an id to replace a notice instead of stacking it. */id?:string|number}
/** Raises a transient HIG capsule through Sonner and returns its id. Needs a mounted `Toaster` (or the host's own Sonner `Toaster`). */
export function toast(message:string,{severity='info',action,dismissName,duration,id}:ToastOptions={}):string|number{
 return sonner.custom(current=><ToastNotice message={message} severity={severity} action={action} dismissName={dismissName??en.dismissNotice(message,en.dismiss)} onDismiss={()=>sonner.dismiss(current)}/>,{duration,id});
}
/** Dismisses one notice by id, or every notice when the id is omitted. */
export function dismissToast(id?:string|number):void{sonner.dismiss(id);}
