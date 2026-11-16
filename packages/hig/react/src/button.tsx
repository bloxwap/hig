"use client";
import React,{forwardRef,useId,useRef} from 'react';
import type {Intent} from '@bloxwap/hig/contracts';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG,type PressDecorationKind} from './provider.js';
/** A button's intent: the shared `Intent`, or a market-direction fill, `up` (buy, long) or `down` (sell, short), that follows `HIGProvider marketColors` (default the buy and sell colours) with a dark label. */
export type ButtonIntent=Intent|'up'|'down';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{intent?:ButtonIntent;/** Shows a leading spinner and blocks activation. */busy?:boolean;/** Busy text appended to the accessible name (not drawn; the spinner is the visible cue); defaults to HIGProvider `messages.busy`. `''` omits it (busy state stays exposed). */busyLabel?:string;fullWidth?:boolean;suppressFeedback?:boolean}
function useButton({intent='primary',busy=false,busyLabel,disabled,fullWidth,suppressFeedback,onClick,children,type='button',...props}:ButtonProps,ref:React.ForwardedRef<HTMLButtonElement>,kind:PressDecorationKind){
 // The provider puts its press layer on the context (see PressDecoration); calling it here keeps the layer out of a lone Button bundle.
 const context=useHIG() as ReturnType<typeof useHIG>&{drawPress?:(kind:PressDecorationKind,disabled:boolean)=>React.ReactNode};const id=useId();const sequence=useRef(0);const busyText=busyLabel??context.messages.busy??en.busy;
 return <button {...props} ref={ref} type={type} className={`hig-button ${props.className??''}`} data-intent={intent} data-full={fullWidth||undefined} data-density={context.density} disabled={disabled||busy} aria-busy={busy||undefined} onClick={e=>{e.stopPropagation();onClick?.(e);if(!e.defaultPrevented&&!disabled&&!busy&&!suppressFeedback){try{context.onAccepted?.(id);context.feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent:'activate',origin:e.detail===0?'keyboard':'pointer'});}catch{/* Optional feedback cannot alter the action. */}}}}>{busy&&<span className='hig-button-spinner' aria-hidden='true'/>}{children}{busy&&busyText?<span role='status' className='hig-busy hig-sr-only'> · {busyText}</span>:null}{context.drawPress?.(kind,!!disabled||busy)}</button>;
}
export const Button=forwardRef<HTMLButtonElement,ButtonProps>(function Button(props,ref){return useButton(props,ref,'button');});
export const IconButton=forwardRef<HTMLButtonElement,Omit<ButtonProps,'aria-label'> & {label:string}>(function IconButton({label,children,className,...props},ref){return useButton({...props,className:`hig-icon-button ${className??''}`,'aria-label':label,children:<span aria-hidden='true'>{children}</span>},ref,'icon-button');});
export const Link=forwardRef<HTMLAnchorElement,React.AnchorHTMLAttributes<HTMLAnchorElement>>(function Link(props,ref){return <a {...props} ref={ref} className={`hig-link ${props.className??''}`}/>;});
