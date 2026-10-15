"use client";
import React,{useId,useRef} from 'react';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from './provider.js';
import * as Drop from '@radix-ui/react-dropdown-menu';
import * as Pop from '@radix-ui/react-popover';
import * as Tip from '@radix-ui/react-tooltip';
import {Button} from './button.js';
export {Dialog,Sheet,AlertDialog,type DialogProps,type AlertDialogProps} from './dialog.js';
export function Menu({label,items}: {label:string;items:readonly {label:string;disabled?:boolean;onSelect:(event:Event)=>void}[]}){const {feedback,direction,locale}=useHIG();const id=useId();const sequence=useRef(0);const origin=useRef<'pointer'|'keyboard'>('keyboard');return <Drop.Root dir={direction}><Drop.Trigger asChild><Button intent='secondary' suppressFeedback>{label}</Button></Drop.Trigger><Drop.Portal><Drop.Content className='hig-popover' sideOffset={6} lang={locale}>{items.map((item,i)=><Drop.Item key={i} disabled={item.disabled} className='hig-menu-item' onPointerDown={()=>{origin.current='pointer';}} onKeyDown={()=>{origin.current='keyboard';}} onSelect={event=>{if(item.disabled)return;item.onSelect(event);if(!event.defaultPrevented)try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent:'selection',origin:origin.current});}catch{/* Optional feedback cannot alter the action. */}}}>{item.label}</Drop.Item>)}</Drop.Content></Drop.Portal></Drop.Root>;}
export function Popover({label,children,closeLabel}:React.PropsWithChildren<{label:string;/** Close button text and accessible name; defaults to HIGProvider `messages.close`. */closeLabel?:string}>){const {messages,direction,locale}=useHIG();return <Pop.Root><Pop.Trigger asChild><Button intent='secondary' suppressFeedback>{label}</Button></Pop.Trigger><Pop.Portal><Pop.Content className='hig-popover' sideOffset={6} dir={direction} lang={locale}>{children}<Pop.Close asChild><Button intent='ghost' suppressFeedback>{closeLabel??messages.close??en.close}</Button></Pop.Close></Pop.Content></Pop.Portal></Pop.Root>;}
export function Tooltip({content,children}:React.PropsWithChildren<{content:string}>){return <Tip.Provider><Tip.Root><Tip.Trigger asChild>{children}</Tip.Trigger><Tip.Portal><Tip.Content className='hig-popover' sideOffset={6}>{content}</Tip.Content></Tip.Portal></Tip.Root></Tip.Provider>;}
