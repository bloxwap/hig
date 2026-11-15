"use client";
import React from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {IconButton} from '../button.js';
import {Switch} from '../selection.js';
import {ListGroup,ListRow} from '../list-group.js';
import type {AssetArtwork} from '../asset-balance-row.js';
import {qrIcon} from './screen-header.js';
import {SwapIcon,addressGradient} from './swap/shared.js';
/** One row of a profile section. With `onSelect` it opens something and shows a chevron; with `onCheckedChange` it is a switch. */
export interface ProfileRow {
 id:string;label:string;
 /** Artwork before the label, such as an icon. */
 leading?:React.ReactNode;
 /** Short text on the trailing edge, such as a balance or `Off`. */
 value?:React.ReactNode;
 /** Anything richer on the trailing edge: icons or a `Badge`. */
 trailing?:React.ReactNode;
 onSelect?:()=>void;disabled?:boolean;
 /** With `onCheckedChange`, the row is a switch: the track trails and the label names it. */
 checked?:boolean;onCheckedChange?:(checked:boolean)=>void;
}
export interface ProfileSection {
 id:string;
 /** Heading above the group, such as Rewards or Settings. */
 title?:string;
 rows:readonly ProfileRow[];
}
/** The dot on the avatar: an account mode or state the host names, such as Demo. */
export interface ProfileStatus {
 /** Read out for the dot. */
 label:string;
 tone?:'positive'|'warning'|'negative'|'info';
}
export interface ProfileBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** The name under the avatar: a display name or a shortened address. */
 name:string;
 /** Colours the avatar when there is no artwork. */
 address?:string;
 /** An image URL or an element the host draws. */
 avatar?:AssetArtwork;
 status?:ProfileStatus;
 /** Shows the edit control after the name. */
 onEditName?:()=>void;
 /** Shows the address control on the leading edge of the top bar. */
 onShowAddress?:()=>void;
 /** Shows Close on the trailing edge of the top bar. */
 onClose?:()=>void;
 sections:readonly ProfileSection[];
}
const editIcon=<svg aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'><path d='M12.5 4.5 15.5 7.5 7.5 15.5H4.5V12.5ZM10.5 15.5H16'/></svg>;
/** A person's profile as one screen: who they are (avatar, status, name), then grouped rows that open their accounts, history, rewards and settings. */
export function ProfileBlock({name,address,avatar,status,onEditName,onShowAddress,onClose,sections,className,...rest}:ProfileBlockProps){
 const {messages}=useHIG();
 return <section {...rest} className={`hig-profile-block${className?` ${className}`:''}`}>
  <div className='hig-profile-bar'>
   <span>{onShowAddress&&<IconButton intent='ghost' label={messages.showAddress??en.showAddress} onClick={onShowAddress}>{qrIcon}</IconButton>}</span>
   <span>{onClose&&<IconButton intent='ghost' label={messages.close??en.close} onClick={onClose}><SwapIcon name='close'/></IconButton>}</span>
  </div>
  <div className='hig-profile-identity'>
   <span className='hig-profile-avatar' style={avatar==null&&address?{background:addressGradient(address)}:undefined}>
    <span className='hig-profile-artwork' aria-hidden='true'>{typeof avatar==='string'?<img src={avatar} alt=''/>:avatar??(address?null:name.slice(0,2))}</span>
    {status&&<span className='hig-profile-status' data-tone={status.tone??'warning'}><span className='hig-sr-only'>{status.label}</span></span>}
   </span>
   <div className='hig-profile-name'><h2>{name}</h2>{onEditName&&<IconButton intent='ghost' label={messages.editName??en.editName} onClick={onEditName}>{editIcon}</IconButton>}</div>
  </div>
  {sections.filter(section=>section.rows.length>0).map(section=><ListGroup key={section.id} title={section.title}>{section.rows.map(row=><ListRow key={row.id} label={row.label} leading={row.leading} value={row.value} disabled={row.disabled} onSelect={row.onCheckedChange?undefined:row.onSelect} trailing={row.onCheckedChange?<Switch label={row.label} checked={!!row.checked} disabled={row.disabled} onCheckedChange={row.onCheckedChange}/>:row.trailing}/>)}</ListGroup>)}
 </section>;
}
