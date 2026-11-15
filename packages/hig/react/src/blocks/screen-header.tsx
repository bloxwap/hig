"use client";
import React from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from '../provider.js';
import {SwapIcon} from './swap/shared.js';
export interface ScreenHeaderProps {
 /** The heading, centred. Host text. */
 title:string;
 /** Shows Back on the leading edge. */
 onBack?:()=>void;
 /** A control on the trailing edge, usually an `IconButton`. */
 action?:React.ReactNode;
 /** `id` of the heading, so a dialog or sheet can name itself with `aria-labelledby` instead of repeating the title. */
 headingId?:string;
}
/** Header of a card that is its own screen: Back on the leading edge, the title centred, and an optional control on the trailing edge. The title stays centred with either, both or neither. Every block draws it; import it from `@bloxwap/hig/react/blocks/screen-header` for a host pane that has no block. */
export function ScreenHeader({title,onBack,action,headingId}:ScreenHeaderProps){
 const {messages}=useHIG();
 return <div className='hig-screen-header'>
  <span className='hig-screen-header-side'>{onBack&&<button type='button' className='hig-swap-back' aria-label={messages.back??en.back} onClick={onBack}><SwapIcon name='back'/><PressDecoration kind='back'/></button>}</span>
  <h2 id={headingId} className='hig-screen-title'>{title}</h2>
  <span className='hig-screen-header-side'>{action}</span>
 </div>;
}
/** The QR glyph of a control that shows an address. */
export const qrIcon=<svg aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinejoin='round'><rect x='3' y='3' width='5.5' height='5.5' rx='1'/><rect x='11.5' y='3' width='5.5' height='5.5' rx='1'/><rect x='3' y='11.5' width='5.5' height='5.5' rx='1'/><path d='M11.5 11.5h2v2h-2zM15 15h2v2h-2z' fill='currentColor' stroke='none'/></svg>;
