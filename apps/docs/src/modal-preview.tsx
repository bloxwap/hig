'use client';
import React,{useState} from 'react';
import {Dialog} from '@bloxwap/hig/react/overlay';
import {useHIG} from '@bloxwap/hig/react/provider';

export default function ModalPreview({open,onOpenChange,title,children,trigger,contentProps,closeButton,titleHidden}:React.ComponentProps<typeof Dialog>){
 const [popup,setPopup]=useState(false);
 const {reducedMotion}=useHIG();
 const toggleDialog=(next:boolean)=>{setPopup(next);onOpenChange(next);};
 const inlineClose=React.isValidElement<{onClick?:()=>void}>(closeButton)?React.cloneElement(closeButton,{onClick:()=>onOpenChange(false)}):null;
 return <>
  {!popup&&<div inert={!open} data-state={open?'open':'closed'} data-modal-motion={reducedMotion?'reduced':'full'} className={contentProps?.className} style={contentProps?.style}>{!titleHidden&&<h2 className='hig-dialog-title'>{title}</h2>}{children}{inlineClose}</div>}
  <Dialog open={popup&&open} onOpenChange={toggleDialog} trigger={trigger} title={title} titleHidden={titleHidden} contentProps={contentProps} closeButton={closeButton}>{children}</Dialog>
 </>;
}
