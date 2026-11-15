"use client";
import React,{useEffect} from 'react';
import {useControllable} from '../provider.js';
import {GestureSheet} from '../gesture-sheet.js';
import {SwapPanelBlock,type SwapPanelBlockProps,type SwapView} from './swap-panel-block.js';
import {parentView} from './swap/shared.js';
export interface SwapSheetProps extends SwapPanelBlockProps {
 open:boolean;onOpenChange:(open:boolean)=>void;
 /** Accessible name of the sheet; not drawn. */
 title:string;
 /** One element that opens the sheet and accepts a ref. */
 trigger?:React.ReactNode;
}
/**
 * SwapPanelBlock presented in a gesture sheet (Vaul). Token pickers and settings push inside the same sheet, which resizes to
 * each view. Escape and Back pop a pushed view first; from the cards, Escape, the scrim and a downward drag close the sheet.
 * Lives in its own entry so the blocks aggregate stays free of the optional Vaul peer.
 */
export function SwapSheet({open,onOpenChange,title,trigger,view:viewProp,onViewChange,...panel}:SwapSheetProps){
 const [view,show]=useControllable<SwapView>(viewProp,'main',onViewChange);
 // A reopened sheet starts on the cards, not on the view it was closed from.
 useEffect(()=>{if(!open&&view!=='main')show('main');},[open]);
 return <GestureSheet open={open} onOpenChange={onOpenChange} title={title} titleHidden trigger={trigger} closeButton={null} contentMode='custom' enableDynamicSizing
  contentProps={{className:'hig-swap-sheet',onEscapeKeyDown:event=>{if(view!=='main'){event.preventDefault();show(parentView(view));}}}}>
  <SwapPanelBlock {...panel} view={view} onViewChange={show}/>
 </GestureSheet>;
}
