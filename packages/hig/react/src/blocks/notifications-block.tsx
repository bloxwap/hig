"use client";
import React,{useId} from 'react';
import {Button} from '../button.js';
import {ScreenHeader} from './screen-header.js';
import {SettingSwitch,type SettingAction} from './setting-switch.js';
/** One kind of notification. Every word is host text. */
export interface NotificationsItem {
 id:string;label:string;description?:string;
 checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;
 /** Always on and not changeable: shown on at full strength and read as unavailable. */
 locked?:boolean;
 /** Host content after the label, such as a badge. It is part of the switch's name. */
 labelAccessory?:React.ReactNode;
 /** Host words for the `labelAccessory`, read after the label and a pause in place of its content: `Push, New`. */
 labelAccessoryLabel?:string;
 /** A neutral line under the card, announced when it changes, for progress or a hint: Registering this device. */
 hint?:string;
 /** Why turning it on failed, under the card: Push request timed out. It is announced when it appears. */
 error?:string;
 /** A secondary action under the card, such as Open Settings after the permission was refused. `feedback: false` keeps the provider's press feedback off it. */
 action?:SettingAction;
}
/** Notifications under one optional heading: Alert types. */
export interface NotificationsGroup {id:string;title?:string;items:readonly NotificationsItem[]}
export interface NotificationsBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading: Notifications. */
 title:string;
 /** A muted line under the header that explains the screen. */
 description?:string;
 /** One card each, in order. */
 items?:readonly NotificationsItem[];
 /** More cards under the items, in groups with an optional heading, 24 units apart. */
 groups?:readonly NotificationsGroup[];
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
 /** Pins the header to the top of the nearest scrolling container, transparent at rest and filled with `--hig-sticky-header-background` once content scrolls under it. */
 stickyHeader?:boolean;
}
function Item({item}:{item:NotificationsItem}){
 return <div className='hig-notifications-item'>
  <div className='hig-setting-card'><SettingSwitch label={item.label} description={item.description} checked={item.checked} disabled={item.disabled} locked={item.locked} labelAccessory={item.labelAccessory} labelAccessoryLabel={item.labelAccessoryLabel} onCheckedChange={item.onCheckedChange}/></div>
  {item.hint&&<p role='status' className='hig-setting-hint'>{item.hint}</p>}
  {item.error&&<p role='alert' className='hig-setting-error'>{item.error}</p>}
  {item.action&&<Button className='hig-notifications-action' intent='secondary' fullWidth disabled={item.action.disabled} suppressFeedback={item.action.feedback===false} onClick={item.action.onSelect}>{item.action.label}</Button>}
 </div>;
}
function Group({group}:{group:NotificationsGroup}){
 const id=useId();
 return <section className='hig-notifications-group' aria-labelledby={group.title?id:undefined}>
  {group.title&&<div className='hig-signals-group-header'><h3 id={id}>{group.title}</h3></div>}
  {group.items.length>0&&<div className='hig-setting-cards'>{group.items.map(item=><Item key={item.id} item={item}/>)}</div>}
 </section>;
}
/** The notifications the viewer receives: each kind is a card with a switch and a line of explanation, and a failure to turn one on reads under its card. */
export function NotificationsBlock({title,description,items=[],groups,onBack,headerAction,stickyHeader,className,...rest}:NotificationsBlockProps){
 return <section {...rest} className={`hig-settings-block${className?` ${className}`:''}`}>
  <ScreenHeader title={title} onBack={onBack} action={headerAction} stickyHeader={stickyHeader}/>
  {description&&<p className='hig-settings-description'>{description}</p>}
  {items.length>0&&<div className='hig-setting-cards'>{items.map(item=><Item key={item.id} item={item}/>)}</div>}
  {groups?.map(group=><Group key={group.id} group={group}/>)}
 </section>;
}
