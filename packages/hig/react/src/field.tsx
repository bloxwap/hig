"use client";
import React,{createContext,useContext,useId,useRef,forwardRef} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from './provider.js';
const Context=createContext<{id:string;description?:string;invalid?:boolean;disabled?:boolean;required?:boolean}>({id:''});
export interface FieldProps {id?:string;label:string;description?:string;/** `positive` draws the description as a success line, such as a name that is available, and announces it when it changes. The words carry the meaning; the colour repeats it. */descriptionTone?:'muted'|'positive';error?:string;required?:boolean;disabled?:boolean}
export function Field({id:provided,label,description,descriptionTone,error,required,disabled,children}:React.PropsWithChildren<FieldProps>){
 const {messages}=useHIG();const generated=useId();const id=provided??generated;const ids=[description&&`${id}-help`,error&&`${id}-error`].filter(Boolean).join(' ')||undefined;
 const positive=descriptionTone==='positive';
 return <Context.Provider value={{id,description:ids,invalid:!!error,disabled,required}}><div className='hig-field'><label htmlFor={id}>{label}{required?` ${messages.required??en.required}`:''}</label>{children}{description&&<p id={`${id}-help`} data-tone={positive?'positive':undefined} aria-live={positive?'polite':undefined}>{description}</p>}{error&&<p id={`${id}-error`} role='alert'>{error}</p>}</div></Context.Provider>;
}
export const Label=(props:React.LabelHTMLAttributes<HTMLLabelElement>)=><label {...props}/>;
export const Input=forwardRef<HTMLInputElement,React.InputHTMLAttributes<HTMLInputElement>>(function Input(props,ref){const field=useContext(Context);return <input id={field.id||undefined} aria-describedby={field.description} aria-invalid={field.invalid||undefined} required={field.required} {...props} disabled={!!field.disabled||props.disabled} ref={ref} className={`hig-input ${props.className??''}`}/>;});
export const TextArea=forwardRef<HTMLTextAreaElement,React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(props,ref){const field=useContext(Context);return <textarea id={field.id||undefined} aria-describedby={field.description} aria-invalid={field.invalid||undefined} required={field.required} {...props} disabled={!!field.disabled||props.disabled} ref={ref} className={`hig-input ${props.className??''}`}/>;});
/** The magnifying glass sits inset on the leading edge; the input keeps the ref, class and every prop. Marked pure so a bundle that imports another field drops the icon. */
export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
 /** Host content on the trailing edge inside the field, such as a filter button. The text stops 48 units short of the edge; wider content sets the input's `padding-inline-end`. */
 trailing?:React.ReactNode;
 /** Shows a clear button on the trailing edge while the controlled `value` is not empty. It calls this and returns focus to the field. */
 onClear?:()=>void;
 /** Accessible name of the clear button; defaults to HIGProvider `messages.clearSearch`. */
 clearLabel?:string;
}
export const SearchInput=/* @__PURE__ */forwardRef<HTMLInputElement,SearchInputProps>(function SearchInput({trailing,onClear,clearLabel,...props},ref){
 const {messages}=useHIG();const inner=useRef<HTMLInputElement|null>(null);const off=!!useContext(Context).disabled||!!props.disabled;
 const attach=(node:HTMLInputElement|null)=>{inner.current=node;if(typeof ref==='function')ref(node);else if(ref)ref.current=node;};
 const clear=onClear&&props.value!=null&&String(props.value)!==''?<button type='button' className='hig-search-clear' aria-label={clearLabel??messages.clearSearch??en.clearSearch} disabled={off} onClick={()=>{onClear();inner.current?.focus();}}><svg aria-hidden='true' focusable='false' viewBox='0 0 16 16'><path d='m4 4 8 8m0-8-8 8'/></svg><PressDecoration kind='icon-button' disabled={off}/></button>:null;
 const extra=trailing!=null&&trailing!==false;
 const end=extra||clear?<span className='hig-search-trailing'>{trailing}{clear}</span>:null;
 // The end padding stays while the clear button comes and goes, so typed text never reflows.
 return <span className='hig-search-input' data-trailing={extra||onClear?'':undefined}><svg className='hig-search-icon' aria-hidden='true' focusable='false' viewBox='0 0 20 20'><circle cx='9' cy='9' r='5.25'/><path d='m13 13 3.5 3.5'/></svg><Input type='search' {...props} ref={onClear?attach:ref}/>{end}</span>;
});
