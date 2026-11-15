"use client";
import React,{useState} from 'react';
import {Cuer} from 'cuer';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from './provider.js';
import {VerticalAddress,addressKind,addressRows,type AddressKind} from './data.js';
import {notify} from './notify.js';
export {VerticalAddress,addressKind,type AddressKind} from './data.js';
export interface WalletAddressProps {
 address:string;
 /** Row layout; inferred from the address when omitted (`0x…` is Ethereum-style). */
 kind?:AddressKind;
 /** QR payload when it differs from the address, for example an EIP-681 or Solana Pay URI. Defaults to the address. */
 qrValue?:string;
 /** Image URL shown in the centre of the QR; the code then uses high error correction. */
 arena?:string;
 /** QR edge in CSS pixels; default 196. The address column is exactly as tall. */
 size?:number;
 /** Host clipboard adapter. When set the whole component is one button that copies the address and shows the Tap to copy hint. */
 onCopy?:()=>Promise<void>|void;
 className?:string;style?:React.CSSProperties;
}
/**
 * A wallet address to scan or copy: a Cuer QR code beside the address in HIG's vertical style, for Ethereum-style and
 * Solana addresses. Needs the optional `cuer` peer. The host owns the clipboard through `onCopy`.
 */
export function WalletAddress({address,kind,qrValue,arena,size=196,onCopy,className,style}:WalletAddressProps){
 const {messages}=useHIG();const [status,setStatus]=useState('');
 const rows=addressRows(address,kind??addressKind(address)).length;
 const copy=()=>{Promise.resolve().then(onCopy).then(()=>{const text=messages.addressCopied??en.addressCopied;setStatus(notify(text,{severity:'success',id:'hig-wallet-address',dismissName:(messages.dismissNotice??en.dismissNotice)(text,messages.dismiss??en.dismiss)})?'':text);}).catch(()=>setStatus(''));};
 const body=<>
  <span className='hig-wallet-address-body'>
   <span className='hig-wallet-address-qr' role='img' aria-label={messages.qrCode??en.qrCode}><Cuer.Root value={qrValue??address} errorCorrection={arena?'high':'medium'} color='currentColor' aria-hidden='true'><Cuer.Finder/><Cuer.Cells/>{arena&&<Cuer.Arena><img src={arena} alt='' style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:1}}/></Cuer.Arena>}</Cuer.Root></span>
   <VerticalAddress address={address} kind={kind} rowHeight={size/rows}/>
  </span>
  {onCopy&&<span className='hig-wallet-address-hint'><svg aria-hidden='true' focusable='false' viewBox='0 0 20 20'><rect x='7' y='7' width='9.5' height='9.5' rx='2'/><path d='M4.5 13H4a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 4 3.5h6.5A1.5 1.5 0 0 1 12 5v.5'/></svg>{messages.tapToCopy??en.tapToCopy}</span>}
 </>;
 const shared={className:`hig-wallet-address${className?` ${className}`:''}`,style:{'--hig-qr':`${size}px`,...style} as React.CSSProperties};
 return onCopy
  ?<><button type='button' {...shared} aria-label={(messages.copyAddress??en.copyAddress)+': '+address} onClick={copy}>{body}</button><span className='hig-sr-only' role='status'>{status}</span></>
  :<div {...shared}>{body}</div>;
}
