"use client";
import React,{useRef} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from '../provider.js';
import {useStickyHeader} from './sticky-header.js';
import {Button,IconButton} from '../button.js';
import {ListGroup,ListRow} from '../list-group.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {figureProps,type Figure} from '../figure.js';
import type {AssetArtwork} from '../asset-balance-row.js';
import {qrIcon} from './screen-header.js';
import {SwapIcon,addressGradient} from './swap/shared.js';
/** A row value that can change while the profile is shown, such as a balance: formatted with `options` between `prefix` and `suffix`, and updated place by place. `null` reads as unknown. */
export type ProfileFigure=Figure;
/** One row of a profile section. With `onSelect` it opens something and shows a chevron; with `onCheckedChange` it is a switch. */
export interface ProfileRow {
 id:string;label:string;
 /** Artwork before the label, such as an icon. */
 leading?:React.ReactNode;
 /** Short text on the trailing edge, such as a balance or `Off`, or a live figure that updates place by place. */
 value?:React.ReactNode|ProfileFigure;
 /** Colours the value. Without it the value keeps the row's muted value style. */
 tone?:'positive'|'warning'|'negative'|'muted';
 /** Anything richer on the trailing edge: icons or a `Badge`. */
 trailing?:React.ReactNode;
 onSelect?:()=>void;disabled?:boolean;
 /** With `onCheckedChange`, the row is a switch: the track trails, the label names it, and a press anywhere on the row toggles it. */
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
/** The primary action under the name, such as Log in for a signed-out viewer. The host writes the label. */
export interface ProfileAction {
 label:string;onSelect:()=>void;disabled?:boolean;
 /** Defaults to `primary`. */
 intent?:'primary'|'secondary';
}
export interface ProfileBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** The name under the avatar: a display name or a shortened address. It may be left out when `action` is set, for a signed-out viewer. */
 name?:string;
 /** Host content beside the name, such as a badge. It stays in the accessibility tree, so give an interactive badge its own name. */
 nameAccessory?:React.ReactNode;
 /** Colours the avatar when there is no artwork. */
 address?:string;
 /** An image URL or an element the host draws. */
 avatar?:AssetArtwork;
 /** Makes the avatar a button, for example to choose a picture. `avatarLabel` names it. */
 onAvatarPress?:()=>void;
 /** The accessible name of the avatar button, such as Change profile picture. Defaults to `name`, then the built-in “Change profile picture”. */
 avatarLabel?:string;
 status?:ProfileStatus;
 /** Shows the edit control after the name. */
 onEditName?:()=>void;
 /** Shows the address control on the leading edge of the top bar. */
 onShowAddress?:()=>void;
 /** Shows Close on the trailing edge of the top bar. */
 onClose?:()=>void;
 /** A full-width button under the name, such as Log in. */
 action?:ProfileAction;
 sections:readonly ProfileSection[];
 /** Host content under the sections, such as legal links. */
 footer?:React.ReactNode;
 /** Pins the top bar (address and Close) to the top of the nearest scroller, transparent at rest and filled once content scrolls under it, without moving when it starts to stick. See Pinned headers. */
 stickyHeader?:boolean;
 /** `id` of the name heading, so a host dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
}
const editIcon=<svg aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'><path d='M12.5 4.5 15.5 7.5 7.5 15.5H4.5V12.5ZM10.5 15.5H16'/></svg>;
/** True for a `ProfileFigure`: a plain object with a `value`, not an element, array or other node. */
const isProfileFigure=(value:unknown):value is ProfileFigure=>value!=null&&typeof value==='object'&&!React.isValidElement(value)&&!Array.isArray(value)&&!(Symbol.iterator in value)&&'value' in value;
function rowValue(row:ProfileRow):React.ReactNode{
 const {value,tone}=row;if(value==null)return value;
 if(isProfileFigure(value))return <span className='hig-profile-value' data-tone={tone}><AnimatedNumberReadout {...figureProps(value)}/></span>;
 return tone?<span className='hig-profile-value' data-tone={tone}>{value}</span>:value;
}
/**
 * A switch row whose whole row is the target: `ListRow`'s switch row. A press anywhere outside the switch toggles it, the switch
 * input stays the one named control, named by the visible label (so the name is read once), and the host's press decoration
 * covers the whole row.
 */
function ProfileSwitchRow({row}:{row:ProfileRow}){
 return <ListRow label={row.label} leading={row.leading} value={rowValue(row)} disabled={row.disabled} checked={!!row.checked} onCheckedChange={row.onCheckedChange}/>;
}
/** A person's profile as one screen: who they are (avatar, status, name), then grouped rows that open their accounts, history, rewards and settings. */
export function ProfileBlock({name,nameAccessory,address,avatar,onAvatarPress,avatarLabel,status,onEditName,onShowAddress,onClose,action,sections,footer,stickyHeader,headingId,className,...rest}:ProfileBlockProps){
 const {messages}=useHIG();const bar=useRef<HTMLDivElement>(null);
 useStickyHeader(bar,!!stickyHeader);
 const artwork=typeof avatar==='string'?<img src={avatar} alt=''/>:avatar??(address?null:name?.slice(0,2));
 return <section {...rest} className={`hig-profile-block${className?` ${className}`:''}`}>
  <div ref={bar} className='hig-profile-bar' data-sticky={stickyHeader||undefined}>
   <span>{onShowAddress&&<IconButton intent='ghost' label={messages.showAddress??en.showAddress} onClick={onShowAddress}>{qrIcon}</IconButton>}</span>
   <span>{onClose&&<IconButton intent='ghost' label={messages.close??en.close} onClick={onClose}><SwapIcon name='close'/></IconButton>}</span>
  </div>
  <div className='hig-profile-identity'>
   <span className='hig-profile-avatar' style={avatar==null&&address?{background:addressGradient(address)}:undefined}>
    {onAvatarPress?<button type='button' className='hig-profile-artwork' aria-label={avatarLabel??name??messages.changeProfilePicture??en.changeProfilePicture} onClick={onAvatarPress}>{artwork}<PressDecoration kind='icon-button'/></button>:<span className='hig-profile-artwork' aria-hidden='true'>{artwork}</span>}
    {status&&<span className='hig-profile-status' data-tone={status.tone??'warning'}><span className='hig-sr-only'>{status.label}</span></span>}
   </span>
   {name!=null&&<div className='hig-profile-name'><h2 id={headingId}>{name}</h2>{nameAccessory!=null&&<span className='hig-profile-name-accessory'>{nameAccessory}</span>}{onEditName&&<IconButton intent='ghost' label={messages.editName??en.editName} onClick={onEditName}>{editIcon}</IconButton>}</div>}
   {action&&<Button className='hig-profile-action' fullWidth intent={action.intent??'primary'} disabled={action.disabled} onClick={action.onSelect}>{action.label}</Button>}
  </div>
  {sections.filter(section=>section.rows.length>0).map(section=><ListGroup key={section.id} title={section.title}>{section.rows.map(row=>row.onCheckedChange?<ProfileSwitchRow key={row.id} row={row}/>:<ListRow key={row.id} label={row.label} leading={row.leading} value={rowValue(row)} disabled={row.disabled} onSelect={row.onSelect} trailing={row.trailing}/>)}</ListGroup>)}
  {footer!=null&&<div className='hig-profile-footer'>{footer}</div>}
 </section>;
}
