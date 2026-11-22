"use client";
import { Copy } from '@bloxwap/icons/react/copy';
import {useAsyncResult} from './async-result.js';
import React,{useState} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from './provider.js';
import {HorizontalAddress,VerticalAddress,addressKind,addressRows,type AddressKind} from './data.js';
import {notify} from './notify.js';
import {QRCode} from './qr-code.js';
export {AddressLockup,Address,HorizontalAddress,VerticalAddress,addressKind,type AddressKind} from './data.js';
export interface WalletAddressProps {
 /** Horizontal (default) puts the QR left of the address column. Vertical puts the QR above a two-row address. */
 orientation?:'horizontal'|'vertical';
 address:string;
 /** Row layout; inferred from the address when omitted (`0x…` is Ethereum-style). */
 kind?:AddressKind;
 /** The QR code, drawn by the host with its own encoder, sized to `size`. It is named by the built-in “QR code” label, so keep the host's drawing hidden from assistive technology. Omitted or `null`, HIG draws its own `QRCode` of `qrValue`, which needs no package. */
 qr?:React.ReactNode;
 /** QR payload of HIG's own code when it differs from the address, for example an EIP-681 or Solana Pay URI. Defaults to the address. Unused with `qr`. */
 qrValue?:string;
 /** Image URL shown in the centre of HIG's own code, which then uses high error correction. Unused with `qr`. */
 arena?:string;
 /** Horizontal QR edge in CSS pixels, default 196. Vertical sizes the square to the address. */
 size?:number;
 /** Host clipboard adapter. When set the whole component is one button that copies the address and shows the Tap to copy hint. */
 onCopy?:()=>Promise<void>|void;
 /** `false` raises no “Address copied” notice and no status text after a copy, for a host that confirms the copy itself. Defaults to `true`. */
 announce?:boolean;
 className?:string;style?:React.CSSProperties;
}
/**
 * A wallet address to scan or copy: HIG's own `QRCode`, or the host's drawing passed as `qr`, beside the address in HIG's
 * vertical style, for Ethereum-style and Solana addresses. The host owns the clipboard through `onCopy`.
 */
export function WalletAddress({address,kind,qr,qrValue,arena,orientation='horizontal',size=196,onCopy,announce=true,className,style}:WalletAddressProps){
 const {messages}=useHIG();const [status,setStatus]=useState('');
 const rows=Math.max(1,addressRows(address,kind??addressKind(address)).length);
 const beginCopy=useAsyncResult(address);
 const copy=()=>{const current=beginCopy();Promise.resolve().then(onCopy).then(()=>{if(!current()||!announce)return;const text=messages.addressCopied??en.addressCopied;setStatus(notify(text,{severity:'success',id:'hig-wallet-address',dismissName:(messages.dismissNotice??en.dismissNotice)(text,messages.dismiss??en.dismiss)})?'':text);}).catch(()=>{if(current())setStatus('');});};
 const body=<>
  <span className='hig-wallet-address-body'>
   <span className='hig-wallet-address-qr' role='img' aria-label={messages.qrCode??en.qrCode}>{qr??<QRCode value={qrValue??address} arena={arena} size={size} quietZone={0} background='none' color='currentColor' decorative/>}</span>
   {orientation==='vertical'?<HorizontalAddress address={address} kind={kind} rowHeight={18}/>:<VerticalAddress address={address} kind={kind} rowHeight={size/rows}/>}
  </span>
  {onCopy&&<span className='hig-wallet-address-hint'><Copy size={20}/>{messages.tapToCopy??en.tapToCopy}</span>}
 </>;
 const shared={'data-orientation':orientation,className:`hig-wallet-address${className?` ${className}`:''}`,style:{'--hig-qr':`${size}px`,...style} as React.CSSProperties};
 return onCopy
  ?<><button type='button' {...shared} aria-label={(messages.copyAddress??en.copyAddress)+': '+address} onClick={copy}>{body}<PressDecoration kind='row'/></button>{announce&&<span className='hig-sr-only' role='status'>{status}</span>}</>
  :<div {...shared}>{body}</div>;
}
