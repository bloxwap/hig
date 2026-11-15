"use client";
import React from 'react';
import {ScreenHeader} from './screen-header.js';
import {SettingSwitch} from './setting-switch.js';
/** One kind of notification. Every word is host text. */
export interface NotificationsItem {
 id:string;label:string;description?:string;
 checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;
 /** Why turning it on failed, under the card: Push request timed out. It is announced when it appears. */
 error?:string;
}
export interface NotificationsBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading: Notifications. */
 title:string;
 /** One card each, in order. */
 items:readonly NotificationsItem[];
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
}
/** The notifications the viewer receives: each kind is a card with a switch and a line of explanation, and a failure to turn one on reads under its card. */
export function NotificationsBlock({title,items,onBack,headerAction,className,...rest}:NotificationsBlockProps){
 return <section {...rest} className={`hig-settings-block${className?` ${className}`:''}`}>
  <ScreenHeader title={title} onBack={onBack} action={headerAction}/>
  {items.length>0&&<div className='hig-setting-cards'>{items.map(item=><div key={item.id} className='hig-notifications-item'>
   <div className='hig-setting-card'><SettingSwitch label={item.label} description={item.description} checked={item.checked} disabled={item.disabled} onCheckedChange={item.onCheckedChange}/></div>
   {item.error&&<p role='alert' className='hig-setting-error'>{item.error}</p>}
  </div>)}</div>}
 </section>;
}
