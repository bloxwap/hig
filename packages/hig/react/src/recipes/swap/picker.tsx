"use client";
import React,{useEffect,useRef} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../../provider.js';
import {FromPicker,ToPicker,type SwapWallet} from '../pickers.js';
import {SwapViewHeader,shortAddress,type SwapChain,type SwapToken} from './shared.js';
export type {SwapWallet} from '../pickers.js';
export interface SwapPickerProps {
 side:'from'|'to';/** Pops the view. Choosing a token pops it too. */onBack:()=>void;
 tokens:readonly SwapToken[];chains:readonly SwapChain[];hotTokenIds?:readonly string[];
 selected:SwapToken|null;onSelect:(token:SwapToken)=>void;loading?:boolean;
 wallet?:SwapWallet;onConnect?:()=>void;onDisconnect?:()=>void;
 /** From side, before a wallet is connected: the Generate address switch, which puts the panel in its receive view. */
 receiving?:boolean;onReceivingChange?:(receiving:boolean)=>void;
 /** To side: where the assets are sent. Omit `onRecipientChange` to hide the field. */
 recipient?:string;onRecipientChange?:(address:string)=>void;onScanRecipient?:()=>void;
}
/** The panel's pushed picker view: a header with Back above the From or To picker recipe. */
export function SwapPicker({side,onBack,selected,onSelect,wallet,onConnect,onDisconnect,receiving,onReceivingChange,recipient,onRecipientChange,onScanRecipient,...list}:SwapPickerProps){
 const {messages}=useHIG();const title=side==='from'?messages.swapFrom??en.swapFrom:messages.swapTo??en.swapTo;
 // On touch the header takes focus, so no keyboard opens over the list; with a hardware pointer the picker focuses its search.
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(!window.matchMedia?.('(pointer: fine)').matches)heading.current?.focus();},[]);
 const choose=(token:SwapToken)=>{onSelect(token);onBack();};
 return <div className='hig-swap-picker'>
  <SwapViewHeader title={title} titleRef={heading} backLabel={messages.back??en.back} onBack={onBack}/>
  {side==='from'
   ?<FromPicker {...list} autoFocus selected={selected} onSelect={choose} wallet={wallet??{connected:false}} onConnect={onConnect} onDisconnect={onDisconnect} generateAddress={!!receiving} onGenerateAddressChange={onReceivingChange}/>
   :<ToPicker {...list} autoFocus selected={selected} onSelect={choose} address={recipient} onAddressChange={onRecipientChange} addressPlaceholder={wallet?.address?shortAddress(wallet.address):undefined} onScan={onScanRecipient}/>}
 </div>;
}
