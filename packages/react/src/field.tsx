"use client";
import React,{createContext,useContext,useId,forwardRef} from 'react';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from './provider.js';
const Context=createContext<{id:string;description?:string;invalid?:boolean;disabled?:boolean;required?:boolean}>({id:''});
export function Field({id:provided,label,description,error,required,disabled,children}:React.PropsWithChildren<{id?:string;label:string;description?:string;error?:string;required?:boolean;disabled?:boolean}>){
 const {messages}=useHIG();const generated=useId();const id=provided??generated;const ids=[description&&`${id}-help`,error&&`${id}-error`].filter(Boolean).join(' ')||undefined;
 return <Context.Provider value={{id,description:ids,invalid:!!error,disabled,required}}><div className='hig-field'><label htmlFor={id}>{label}{required?` ${messages.required??en.required}`:''}</label>{children}{description&&<p id={`${id}-help`}>{description}</p>}{error&&<p id={`${id}-error`} role='alert'>{error}</p>}</div></Context.Provider>;
}
export const Label=(props:React.LabelHTMLAttributes<HTMLLabelElement>)=><label {...props}/>;
export const Input=forwardRef<HTMLInputElement,React.InputHTMLAttributes<HTMLInputElement>>(function Input(props,ref){const field=useContext(Context);return <input id={field.id||undefined} aria-describedby={field.description} aria-invalid={field.invalid||undefined} required={field.required} {...props} disabled={!!field.disabled||props.disabled} ref={ref} className={`hig-input ${props.className??''}`}/>;});
export const TextArea=forwardRef<HTMLTextAreaElement,React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(props,ref){const field=useContext(Context);return <textarea id={field.id||undefined} aria-describedby={field.description} aria-invalid={field.invalid||undefined} required={field.required} {...props} disabled={!!field.disabled||props.disabled} ref={ref} className={`hig-input ${props.className??''}`}/>;});
/** Raw string and selection stay untouched; host parses/validates precision on submit. */
export const AmountInput=forwardRef<HTMLInputElement,Omit<React.InputHTMLAttributes<HTMLInputElement>,'type'>>(function AmountInput(props,ref){return <Input {...props} ref={ref} type='text' inputMode={props.inputMode??'decimal'}/>;});
export const SearchInput=forwardRef<HTMLInputElement,React.InputHTMLAttributes<HTMLInputElement>>(function SearchInput(props,ref){return <Input {...props} ref={ref} type='search'/>;});
