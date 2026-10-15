"use client";
import React,{forwardRef,useId,useRef} from 'react';
import type {Intent} from '@bloxwap/hig-contracts';
import {useHIG} from './provider.js';
import * as en from '@bloxwap/hig-contracts/messages';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>{intent?:Intent;busy?:boolean;fullWidth?:boolean;suppressFeedback?:boolean;/** Busy suffix override; `''` hides the suffix. Defaults to the provider's `messages.busy`. */busyLabel?:string}
export const Button=forwardRef<HTMLButtonElement,ButtonProps>(function Button({intent='primary',busy=false,disabled,fullWidth,suppressFeedback,busyLabel,onClick,children,type='button',...props},ref){
 const context=useHIG();const id=useId();const busyText=busyLabel??(context.messages.busy??en.busy);const sequence=useRef(0);
 return <button {...props} ref={ref} type={type} className={`hig-button ${props.className??''}`} data-intent={intent} data-full={fullWidth||undefined} data-density={context.density} disabled={disabled||busy} aria-busy={busy||undefined} onClick={e=>{e.stopPropagation();onClick?.(e);if(!e.defaultPrevented&&!disabled&&!busy&&!suppressFeedback){try{context.onAccepted?.(id);context.feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent:'activate',origin:e.detail===0?'keyboard':'pointer'});}catch{/* Optional feedback cannot alter the action. */}}}}>{children}{busy&&busyText&&<span role='status' className='hig-busy'>{` · ${busyText}`}</span>}</button>;
});
export const IconButton=forwardRef<HTMLButtonElement,Omit<ButtonProps,'aria-label'> & {label:string}>(function IconButton({label,children,...props},ref){return <Button {...props} ref={ref} aria-label={label}><span aria-hidden='true'>{children}</span></Button>;});
export const Link=forwardRef<HTMLAnchorElement,React.AnchorHTMLAttributes<HTMLAnchorElement>>(function Link(props,ref){return <a {...props} ref={ref} className={`hig-link ${props.className??''}`}/>;});
