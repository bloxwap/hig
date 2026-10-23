"use client";
import React from 'react';
import * as Modal from '@radix-ui/react-dialog';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG,useThemeStyle} from './provider.js';
import {Button} from './button.js';
/** Layout, focus and dismissal events on the owned Radix content element. */
export type DialogContentProps = Omit<React.ComponentPropsWithoutRef<typeof Modal.Content>,
 'children'|'asChild'|'forceMount'|'role'|'dir'|'lang'|'id'|'aria-labelledby'|'aria-describedby'|'dangerouslySetInnerHTML'>;
const OWNED_CONTENT_PROPS=new Set(['children','asChild','forceMount','role','dir','lang','id','ref','aria-labelledby','aria-describedby','dangerouslySetInnerHTML']);
export interface DialogProps {
 open:boolean;
 onOpenChange:(open:boolean)=>void;
 title:string;
 description?:string;
 trigger?:React.ReactNode;
 children:React.ReactNode;
 /** Keep the required accessible title while the host supplies its visible heading. */
 titleHidden?:boolean;
 /** Keep supporting text available to assistive technology without rendering it visibly. */
 descriptionHidden?:boolean;
 contentProps?:DialogContentProps;
 contentRef?:React.Ref<HTMLDivElement>;
 /** Undefined keeps the standard action; null omits it. A custom ref-capable button is composed with Close. */
 closeButton?:React.ReactElement|null;
 /** Close button text and accessible name; defaults to HIGProvider `messages.close`. */
 closeLabel?:string;
}
export interface AlertDialogProps extends Omit<DialogProps,'closeLabel'> {/** Decline button text and accessible name; defaults to HIGProvider `messages.cancel`. */cancelLabel?:string}
function DialogFrame({open,onOpenChange,title,description,trigger,children,closeLabel,titleHidden,descriptionHidden,contentProps,contentRef,closeButton,alert=false}:DialogProps&{alert?:boolean}){
 const {messages,direction,locale}=useHIG();
 const themeStyle=useThemeStyle();
 // JavaScript callers receive the same ownership guarantees as typed callers. Copy first;
 // a host may share or freeze its props object across several modal instances.
 const safeContent=Object.fromEntries(Object.entries(contentProps??{}).filter(([key])=>!OWNED_CONTENT_PROPS.has(key))) as DialogContentProps;
 const {className,onPointerDownOutside,style,...content}=safeContent;
 return <Modal.Root open={open} onOpenChange={onOpenChange}>
  {trigger&&<Modal.Trigger asChild>{trigger}</Modal.Trigger>}
  <Modal.Portal>
   <Modal.Overlay className='hig-backdrop'/>
   <Modal.Content {...content} {...(!description?{'aria-describedby':undefined}:{})}
    ref={contentRef} role={alert?'alertdialog':'dialog'}
    className={['hig-dialog',className].filter(Boolean).join(' ')} dir={direction} lang={locale} style={{...themeStyle,...style}}
    onPointerDownOutside={event=>{onPointerDownOutside?.(event);if(alert)event.preventDefault();}}>
    <Modal.Title className={titleHidden?'hig-sr-only':undefined}>{title}</Modal.Title>
    {description&&<Modal.Description className={descriptionHidden?'hig-sr-only':undefined}>{description}</Modal.Description>}
    {children}
    {closeButton!==null&&<Modal.Close asChild>{closeButton??<Button intent='secondary' suppressFeedback>{closeLabel??messages.close??en.close}</Button>}</Modal.Close>}
   </Modal.Content>
  </Modal.Portal>
 </Modal.Root>;
}
export function Dialog(props:DialogProps){return <DialogFrame {...props}/>;}
export const Sheet=Dialog;
/** Critical confirmation stays open on outside interaction and requires an explicit decision. */
export function AlertDialog({cancelLabel,...props}:AlertDialogProps){const {messages}=useHIG();return <DialogFrame {...props} alert closeLabel={cancelLabel??messages.cancel??en.cancel}/>;}
