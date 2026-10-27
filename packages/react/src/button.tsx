"use client";
import React,{forwardRef,useId,useRef} from 'react';
import type {Intent} from '@bloxwap/hig-contracts';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from './provider.js';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{intent?:Intent;busy?:boolean;/** Busy suffix for this button; defaults to HIGProvider `messages.busy`. `''` hides it (busy state stays exposed). */busyLabel?:string;fullWidth?:boolean;suppressFeedback?:boolean}
export const Button=forwardRef<HTMLButtonElement,ButtonProps>(function Button({intent='primary',busy=false,busyLabel,disabled,fullWidth,suppressFeedback,onClick,children,type='button',...props},ref){
 const context=useHIG();const id=useId();const sequence=useRef(0);const busyText=busyLabel??context.messages.busy??en.busy;
 return <button {...props} ref={ref} type={type} className={`hig-button ${props.className??''}`} data-intent={intent} data-full={fullWidth||undefined} data-density={context.density} disabled={disabled||busy} aria-busy={busy||undefined} onClick={e=>{e.stopPropagation();onClick?.(e);if(!e.defaultPrevented&&!disabled&&!busy&&!suppressFeedback){try{context.onAccepted?.(id);context.feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent:'activate',origin:e.detail===0?'keyboard':'pointer'});}catch{/* Optional feedback cannot alter the action. */}}}}>{children}{busy&&busyText?<span role='status' className='hig-busy'> · {busyText}</span>:null}</button>;
});
export const IconButton=forwardRef<HTMLButtonElement,Omit<ButtonProps,'aria-label'> & {label:string}>(function IconButton({label,children,className,...props},ref){return <Button {...props} ref={ref} className={`hig-icon-button ${className??''}`} aria-label={label}><span aria-hidden='true'>{children}</span></Button>;});
export const Link=forwardRef<HTMLAnchorElement,React.AnchorHTMLAttributes<HTMLAnchorElement>>(function Link(props,ref){return <a {...props} ref={ref} className={`hig-link ${props.className??''}`}/>;});
