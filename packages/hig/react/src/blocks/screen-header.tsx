"use client";
import React,{useRef} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from '../provider.js';
import {SwapIcon} from './swap/shared.js';
import {useStickyHeader} from './sticky-header.js';
/** Attributes passed through to a header control's `<button>`, such as a data attribute or a pointer handler. HIG keeps its own type, class, name and click. */
export type ScreenHeaderControlProps=Omit<React.ButtonHTMLAttributes<HTMLButtonElement>,'type'|'className'|'onClick'|'aria-label'|'children'|'disabled'>;
export interface ScreenHeaderProps {
 /** The heading, centred. Host text. */
 title:string;
 /** Shows Back on the leading edge. */
 onBack?:()=>void;
 /** Draws Back unavailable: dimmed, `disabled` and not pressable, for example while a close is being signed. */
 backDisabled?:boolean;
 /** Attributes for the Back `<button>`. */
 backProps?:ScreenHeaderControlProps;
 /** A control on the trailing edge, usually an `IconButton`. */
 action?:React.ReactNode;
 /** `id` of the heading, so a dialog or sheet can name itself with `aria-labelledby` instead of repeating the title. */
 headingId?:string;
 /** Short host text in a badge beside the title, read as part of the heading after a pause: Demo. */
 badge?:string;
 /** Hides the title visually while it stays the accessible heading, for a host that draws its own visible title and must not have it read twice. The header keeps its height and its two sides. */
 hideTitle?:boolean;
 /** Host text that describes the pane, never drawn and read after the heading: a visually hidden paragraph that follows it, `id` `<headingId>-description` when `headingId` is set, so a dialog can point `aria-describedby` at it. */
 description?:string;
 /** Pins the header to the top of the nearest scrolling container. It is transparent at rest and takes its fill (`--hig-sticky-header-background`) only once content has scrolled under it. */
 stickyHeader?:boolean;
}
/** The block header's Close control, shared by the blocks that draw one. */
export function HeaderClose({onClose,label,closeProps}:{onClose:()=>void;label:string;closeProps?:ScreenHeaderControlProps}){
 return <button {...closeProps} type='button' className='hig-swap-back' aria-label={label} onClick={onClose}><SwapIcon name='close'/><PressDecoration kind='back'/></button>;
}
/** Header of a card that is its own screen: Back on the leading edge, the title centred, and an optional control on the trailing edge. The title stays centred with either, both or neither. Every block draws it; import it from `@bloxwap/hig/react/blocks/screen-header` for a host pane that has no block. */
export function ScreenHeader({title,onBack,backDisabled,backProps,action,headingId,badge,hideTitle,description,stickyHeader}:ScreenHeaderProps){
 const {messages}=useHIG();const header=useRef<HTMLDivElement>(null);
 useStickyHeader(header,!!stickyHeader);
 return <div ref={header} className='hig-screen-header' data-sticky={stickyHeader||undefined}>
  <span className='hig-screen-header-side'>{onBack&&<button {...backProps} type='button' className='hig-swap-back' aria-label={messages.back??en.back} disabled={backDisabled||undefined} onClick={onBack}><SwapIcon name='back'/><PressDecoration kind='back' disabled={!!backDisabled}/></button>}</span>
  <h2 id={headingId} className={`hig-screen-title${hideTitle?' hig-sr-only':''}`}>{badge?<>{title}<span className='hig-sr-only'>,</span> <span className='hig-badge hig-screen-badge'>{badge}</span></>:title}</h2>
  {description?<p id={headingId?`${headingId}-description`:undefined} className='hig-sr-only'>{description}</p>:null}
  <span className='hig-screen-header-side'>{action}</span>
 </div>;
}
/** The QR glyph of a control that shows an address. */
export const qrIcon=<svg aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinejoin='round'><rect x='3' y='3' width='5.5' height='5.5' rx='1'/><rect x='11.5' y='3' width='5.5' height='5.5' rx='1'/><rect x='3' y='11.5' width='5.5' height='5.5' rx='1'/><path d='M11.5 11.5h2v2h-2zM15 15h2v2h-2z' fill='currentColor' stroke='none'/></svg>;
