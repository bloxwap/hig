"use client";
import React from 'react';
import * as Modal from '@radix-ui/react-dialog';
import {Button} from './button.js';
export interface DialogProps {open:boolean;onOpenChange:(open:boolean)=>void;title:string;description:string;trigger?:React.ReactNode;children:React.ReactNode}
export function Dialog({open,onOpenChange,title,description,trigger,children}:DialogProps){return <Modal.Root open={open} onOpenChange={onOpenChange}>{trigger&&<Modal.Trigger asChild>{trigger}</Modal.Trigger>}<Modal.Portal><Modal.Overlay className='hig-backdrop'/><Modal.Content className='hig-dialog'><Modal.Title>{title}</Modal.Title><Modal.Description>{description}</Modal.Description>{children}<Modal.Close asChild><Button intent='secondary' suppressFeedback>Close</Button></Modal.Close></Modal.Content></Modal.Portal></Modal.Root>;}
export const Sheet=Dialog;
/** Critical confirmation stays open on outside interaction and requires an explicit decision. */
export function AlertDialog({open,onOpenChange,title,description,trigger,children}:DialogProps){return <Modal.Root open={open} onOpenChange={onOpenChange}>{trigger&&<Modal.Trigger asChild>{trigger}</Modal.Trigger>}<Modal.Portal><Modal.Overlay className='hig-backdrop'/><Modal.Content role='alertdialog' onPointerDownOutside={e=>e.preventDefault()} className='hig-dialog'><Modal.Title>{title}</Modal.Title><Modal.Description>{description}</Modal.Description>{children}<Modal.Close asChild><Button intent='secondary' suppressFeedback>Cancel</Button></Modal.Close></Modal.Content></Modal.Portal></Modal.Root>;}
