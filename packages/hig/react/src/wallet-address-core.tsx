"use client";
import { Copy } from '@bloxwap/icons/react/copy';
import React,{useState} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from './provider.js';
import {VerticalAddress,addressKind,addressRows,type AddressKind} from './data.js';
import {notify} from './notify.js';
export {VerticalAddress,addressKind,type AddressKind} from './data.js';
export interface WalletAddressCoreProps {
 address:string;
 /** Row layout; inferred from the address when omitted (`0x…` is Ethereum-style). */
 kind?:AddressKind;
 /** The QR code, drawn by the host (its own encoder, or a `cuer` QR it renders itself), sized to `size`. It is named by the built-in “QR code” label, so keep the host's drawing hidden from assistive technology. */
 qr:React.ReactNode;
 /** QR edge in CSS pixels; default 196. The address column is exactly as tall. */
 size?:number;
 /** Host clipboard adapter. When set the whole component is one button that copies the address and shows the Tap to copy hint. */
 onCopy?:()=>Promise<void>|void;
 /** `false` raises no “Address copied” notice and no status text after a copy, for a host that confirms the copy itself. Defaults to `true`. */
 announce?:boolean;
 className?:string;style?:React.CSSProperties;
}
/**
 * `WalletAddress` without the QR encoder: the host passes the code as `qr`, so the optional `cuer` peer is not needed.
 * The address column, the copy button, its hint and the notice are the same as `WalletAddress` from `wallet-address`.
 */
export function WalletAddress({address,kind,qr,size=196,onCopy,announce=true,className,style}:WalletAddressCoreProps){
 const {messages}=useHIG();const [status,setStatus]=useState('');
 const rows=addressRows(address,kind??addressKind(address)).length;
 const copy=()=>{Promise.resolve().then(onCopy).then(()=>{if(!announce)return;const text=messages.addressCopied??en.addressCopied;setStatus(notify(text,{severity:'success',id:'hig-wallet-address',dismissName:(messages.dismissNotice??en.dismissNotice)(text,messages.dismiss??en.dismiss)})?'':text);}).catch(()=>setStatus(''));};
 const body=<>
  <span className='hig-wallet-address-body'>
   <span className='hig-wallet-address-qr' role='img' aria-label={messages.qrCode??en.qrCode}>{qr}</span>
   <VerticalAddress address={address} kind={kind} rowHeight={size/rows}/>
  </span>
  {onCopy&&<span className='hig-wallet-address-hint'><Copy size={20}/>{messages.tapToCopy??en.tapToCopy}</span>}
 </>;
 const shared={className:`hig-wallet-address${className?` ${className}`:''}`,style:{'--hig-qr':`${size}px`,...style} as React.CSSProperties};
 return onCopy
  ?<><button type='button' {...shared} aria-label={(messages.copyAddress??en.copyAddress)+': '+address} onClick={copy}>{body}<PressDecoration kind='row'/></button>{announce&&<span className='hig-sr-only' role='status'>{status}</span>}</>
  :<div {...shared}>{body}</div>;
}
