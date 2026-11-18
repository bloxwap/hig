'use client';
import {useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {GestureSheet} from '@bloxwap/hig/react/gesture-sheet';
import {Button} from '@bloxwap/hig/react/button';

export function createLoginSheet<FormComponent>(load:()=>Promise<FormComponent>){
 let prepared:FormComponent|undefined;
 let pending:Promise<FormComponent>|undefined;
 function loadForm(){
  pending??=load().then(component=>(prepared=component)).finally(()=>{pending=undefined;});
  return pending;
 }
 function prepare(){if(!prepared)void loadForm().catch(()=>{});}

 return function LoginSheet({children}:{children:(Form:FormComponent,close:()=>void)=>ReactNode}){
  const [Form,setForm]=useState<FormComponent|undefined>(()=>prepared);
  const [open,setOpen]=useState(false);
  const panel=useRef<HTMLDivElement>(null);
  const [failed,setFailed]=useState(false);
  function requestForm(){
   setFailed(false);
   if(prepared){setForm(()=>prepared);return;}
   loadForm().then(component=>setForm(()=>component),()=>setFailed(true));
  }
  return <GestureSheet open={open} onOpenChange={next=>{if(next&&!Form)requestForm();setOpen(next);}} title="Log in"
   titleHidden={!!Form} enableDynamicSizing closeButton={Form?null:undefined} contentRef={panel}
   trigger={<Button onFocus={prepare} onPointerEnter={prepare} onPointerDown={prepare}>Log in</Button>}
   contentProps={{style:{maxWidth:390,marginInline:'auto'},onOpenAutoFocus:event=>{
    if(!Form){event.preventDefault();panel.current?.focus();}
   }}}>
   {Form?children(Form,()=>setOpen(false)):failed?<>
     <p role="alert">The login preview could not load.</p><Button onClick={()=>{panel.current?.focus();requestForm();}}>Retry</Button>
    </>:<p role="status">Loading login options…</p>}
  </GestureSheet>;
 }
}
