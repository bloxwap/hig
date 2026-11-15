"use client";
import React,{useId} from 'react';
import {Button} from '../button.js';
import {ScreenHeader} from './screen-header.js';
import {SettingSwitch} from './setting-switch.js';
/** One signal the viewer can turn on. */
export interface SignalsItem {id:string;label:string;description?:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean}
/** A family of signals under one heading: Trend, Swing. Every word is host text. */
export interface SignalsGroup {
 id:string;title:string;
 /** Shows the verified mark after the title. */
 verified?:boolean;
 /** A capsule on the trailing edge of the heading: How it works. The host opens its own explanation. */
 help?:{label:string;onSelect:()=>void};
 items:readonly SignalsItem[];
}
export interface SignalsBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading: Signals. */
 title:string;
 groups:readonly SignalsGroup[];
 /** Accessible name of the verified mark. The mark is decorative without it. */
 verifiedLabel?:string;
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
}
const verifiedMark=<svg aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><circle cx='10' cy='10' r='7.5'/><path d='m6.75 10.25 2.25 2.25 4.25-4.75'/></svg>;
function Group({group,verifiedLabel}:{group:SignalsGroup;verifiedLabel?:string}){
 const id=useId();
 return <section className='hig-signals-group' aria-labelledby={id}>
  <div className='hig-signals-group-header'>
   <h3 id={id}>{group.title}{group.verified&&<span className='hig-leaderboard-verified' role={verifiedLabel?'img':undefined} aria-label={verifiedLabel}>{verifiedMark}</span>}</h3>
   {group.help&&<Button intent='secondary' onClick={group.help.onSelect}>{group.help.label}</Button>}
  </div>
  {group.items.length>0&&<div className='hig-setting-list'>{group.items.map(item=><div key={item.id} className='hig-setting-card'><SettingSwitch label={item.label} description={item.description} checked={item.checked} disabled={item.disabled} onCheckedChange={item.onCheckedChange}/></div>)}</div>}
 </section>;
}
/** The signals the viewer receives, in groups: each group has a heading with an optional verified mark and a help capsule, and its signals as switches with a line of explanation, sharing one rounded container. */
export function SignalsBlock({title,groups,verifiedLabel,onBack,headerAction,className,...rest}:SignalsBlockProps){
 return <section {...rest} className={`hig-settings-block${className?` ${className}`:''}`}>
  <ScreenHeader title={title} onBack={onBack} action={headerAction}/>
  {groups.map(group=><Group key={group.id} group={group} verifiedLabel={verifiedLabel}/>)}
 </section>;
}
