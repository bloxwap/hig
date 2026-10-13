"use client";
import React from 'react';
import * as Modal from '@radix-ui/react-dialog';
import * as Drop from '@radix-ui/react-dropdown-menu';
import * as Pop from '@radix-ui/react-popover';
import * as Tip from '@radix-ui/react-tooltip';
import {Button} from './button.js';
export interface DialogProps {open:boolean;onOpenChange:(open:boolean)=>void;title:string;description:string;trigger?:React.ReactNode;children:React.ReactNode}
export function Dialog({open,onOpenChange,title,description,trigger,children}:DialogProps){return <Modal.Root open={open} onOpenChange={onOpenChange}>{trigger&&<Modal.Trigger asChild>{trigger}</Modal.Trigger>}<Modal.Portal><Modal.Overlay className='hig-backdrop'/><Modal.Content className='hig-dialog'><Modal.Title>{title}</Modal.Title><Modal.Description>{description}</Modal.Description>{children}<Modal.Close asChild><Button intent='secondary'>Close</Button></Modal.Close></Modal.Content></Modal.Portal></Modal.Root>;}
export const Sheet=Dialog;
/** Critical confirmation stays open on outside interaction and requires an explicit decision. */
export function AlertDialog({open,onOpenChange,title,description,trigger,children}:DialogProps){return <Modal.Root open={open} onOpenChange={onOpenChange}>{trigger&&<Modal.Trigger asChild>{trigger}</Modal.Trigger>}<Modal.Portal><Modal.Overlay className='hig-backdrop'/><Modal.Content role='alertdialog' onPointerDownOutside={e=>e.preventDefault()} className='hig-dialog'><Modal.Title>{title}</Modal.Title><Modal.Description>{description}</Modal.Description>{children}<Modal.Close asChild><Button intent='secondary'>Cancel</Button></Modal.Close></Modal.Content></Modal.Portal></Modal.Root>;}
export function Menu({label,items}: {label:string;items:readonly {label:string;disabled?:boolean;onSelect:()=>void}[]}){return <Drop.Root><Drop.Trigger asChild><Button intent='secondary'>{label}</Button></Drop.Trigger><Drop.Portal><Drop.Content className='hig-popover' sideOffset={6}>{items.map((item,i)=><Drop.Item key={i} disabled={item.disabled} className='hig-menu-item' onSelect={item.onSelect}>{item.label}</Drop.Item>)}</Drop.Content></Drop.Portal></Drop.Root>;}
export function Popover({label,children}:React.PropsWithChildren<{label:string}>){return <Pop.Root><Pop.Trigger asChild><Button intent='secondary'>{label}</Button></Pop.Trigger><Pop.Portal><Pop.Content className='hig-popover' sideOffset={6}>{children}<Pop.Close asChild><Button intent='ghost'>Close</Button></Pop.Close></Pop.Content></Pop.Portal></Pop.Root>;}
export function Tooltip({content,children}:React.PropsWithChildren<{content:string}>){return <Tip.Provider><Tip.Root><Tip.Trigger asChild>{children}</Tip.Trigger><Tip.Portal><Tip.Content className='hig-popover' sideOffset={6}>{content}</Tip.Content></Tip.Portal></Tip.Root></Tip.Provider>;}
