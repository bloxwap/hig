"use client";
import React,{useId} from 'react';
import {ScreenHeader} from './screen-header.js';
import {SettingSwitch} from './setting-switch.js';
import {SwapPill} from './swap/shared.js';
/** One signal the viewer can turn on. */
export interface SignalsItem {
 id:string;label:string;description?:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;
 /** Always on and not changeable: shown on at full strength and read as unavailable. */
 locked?:boolean;
 /** Host content after the label, such as a badge. It is part of the switch's name. */
 labelAccessory?:React.ReactNode;
 /** A neutral line under the switch, announced when it changes: Needs this browser's permission. */
 hint?:string;
 /** A failure under the switch, in the negative role and announced. */
 error?:string;
}
/** A family of signals under one heading: Trend, Swing. Every word is host text. */
export interface SignalsGroup {
 id:string;title:string;
 /** Shows the verified mark after the title. */
 verified?:boolean;
 /** A small pill on the trailing edge of the heading: How it works. The host opens its own explanation. `ref` reaches the pill, so the host can return focus to it when the explanation closes. */
 help?:{label:string;onSelect:()=>void;ref?:React.Ref<HTMLButtonElement>};
 items:readonly SignalsItem[];
}
export interface SignalsBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading: Signals. */
 title:string;
 /** A muted line under the header that explains the screen. */
 description?:string;
 groups:readonly SignalsGroup[];
 /** Accessible name of the verified mark. The mark is decorative without it. */
 verifiedLabel?:string;
 /** Host content in place of the built-in verified mark. It stays in the accessibility tree, so it may be interactive, such as a badge with a popover; `verifiedLabel` is then read before it. */
 verifiedMark?:React.ReactNode;
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
 /** Pins the header to the top of the nearest scrolling container, transparent at rest and filled with `--hig-sticky-header-background` once content scrolls under it. */
 stickyHeader?:boolean;
}
const verifiedGlyph=<svg aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><circle cx='10' cy='10' r='7.5'/><path d='m6.75 10.25 2.25 2.25 4.25-4.75'/></svg>;
function Group({group,verifiedLabel,verifiedMark}:{group:SignalsGroup;verifiedLabel?:string;verifiedMark?:React.ReactNode}){
 const id=useId();
 return <section className='hig-signals-group' aria-labelledby={id}>
  <div className='hig-signals-group-header'>
   <h3 id={id}>{group.title}{group.verified&&(verifiedMark!=null?<span className='hig-reward-verified'>{verifiedLabel&&<span className='hig-sr-only'>{verifiedLabel}</span>}{verifiedMark}</span>:<span className='hig-reward-verified' role={verifiedLabel?'img':undefined} aria-label={verifiedLabel}>{verifiedGlyph}</span>)}</h3>
   {group.help&&<SwapPill ref={group.help.ref} onClick={group.help.onSelect}>{group.help.label}</SwapPill>}
  </div>
  {group.items.length>0&&<div className='hig-setting-list'>{group.items.map(item=><div key={item.id} className='hig-setting-card'>
   <SettingSwitch label={item.label} description={item.description} checked={item.checked} disabled={item.disabled} locked={item.locked} labelAccessory={item.labelAccessory} onCheckedChange={item.onCheckedChange}/>
   {(item.hint||item.error)&&<div className='hig-setting-notes'>
    {item.hint&&<p role='status' className='hig-setting-hint'>{item.hint}</p>}
    {item.error&&<p role='alert' className='hig-setting-error'>{item.error}</p>}
   </div>}
  </div>)}</div>}
 </section>;
}
/** The signals the viewer receives, in groups: each group has a heading with an optional verified mark and a small help pill, and its signals as switches with a line of explanation, sharing one rounded container. */
export function SignalsBlock({title,description,groups,verifiedLabel,verifiedMark,onBack,headerAction,stickyHeader,className,...rest}:SignalsBlockProps){
 return <section {...rest} className={`hig-settings-block${className?` ${className}`:''}`}>
  <ScreenHeader title={title} onBack={onBack} action={headerAction} stickyHeader={stickyHeader}/>
  {description&&<p className='hig-settings-description'>{description}</p>}
  {groups.map(group=><Group key={group.id} group={group} verifiedLabel={verifiedLabel} verifiedMark={verifiedMark}/>)}
 </section>;
}
