"use client";
import React from 'react';
import * as Modal from '@radix-ui/react-dialog';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from './provider.js';
import {Button} from './button.js';
export interface DialogProps {open:boolean;onOpenChange:(open:boolean)=>void;title:string;description:string;trigger?:React.ReactNode;children:React.ReactNode;/** Close button text and accessible name; defaults to HIGProvider `messages.close`. */closeLabel?:string}
export interface AlertDialogProps extends Omit<DialogProps,'closeLabel'> {/** Decline button text and accessible name; defaults to HIGProvider `messages.cancel`. */cancelLabel?:string}
export function Dialog({open,onOpenChange,title,description,trigger,children,closeLabel}:DialogProps){const {messages,direction,locale}=useHIG();return <Modal.Root open={open} onOpenChange={onOpenChange}>{trigger&&<Modal.Trigger asChild>{trigger}</Modal.Trigger>}<Modal.Portal><Modal.Overlay className='hig-backdrop'/><Modal.Content className='hig-dialog' dir={direction} lang={locale}><Modal.Title>{title}</Modal.Title><Modal.Description>{description}</Modal.Description>{children}<Modal.Close asChild><Button intent='secondary' suppressFeedback>{closeLabel??messages.close??en.close}</Button></Modal.Close></Modal.Content></Modal.Portal></Modal.Root>;}
export const Sheet=Dialog;
/** Critical confirmation stays open on outside interaction and requires an explicit decision. */
export function AlertDialog({open,onOpenChange,title,description,trigger,children,cancelLabel}:AlertDialogProps){const {messages,direction,locale}=useHIG();return <Modal.Root open={open} onOpenChange={onOpenChange}>{trigger&&<Modal.Trigger asChild>{trigger}</Modal.Trigger>}<Modal.Portal><Modal.Overlay className='hig-backdrop'/><Modal.Content role='alertdialog' onPointerDownOutside={e=>e.preventDefault()} className='hig-dialog' dir={direction} lang={locale}><Modal.Title>{title}</Modal.Title><Modal.Description>{description}</Modal.Description>{children}<Modal.Close asChild><Button intent='secondary' suppressFeedback>{cancelLabel??messages.cancel??en.cancel}</Button></Modal.Close></Modal.Content></Modal.Portal></Modal.Root>;}
