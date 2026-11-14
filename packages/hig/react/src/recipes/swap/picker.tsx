"use client";
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../../provider.js';
import {Button,IconButton} from '../../button.js';
import {Input,SearchInput} from '../../field.js';
import {Filter} from '../../selection.js';
import {SwapIcon,SwapViewHeader,TokenIcon,addressGradient,fuzzyMatch,shortAddress,type SwapChain,type SwapToken} from './shared.js';
export interface SwapWallet {connected:boolean;address?:string|null}
export interface SwapPickerProps {
 side:'from'|'to';/** Pops the view. Choosing a token pops it too. */onBack:()=>void;
 tokens:readonly SwapToken[];chains:readonly SwapChain[];hotTokenIds?:readonly string[];
 selected:SwapToken|null;onSelect:(token:SwapToken)=>void;loading?:boolean;
 wallet?:SwapWallet;onConnect?:()=>void;onDisconnect?:()=>void;
 /** From side, before a wallet is connected: switch the panel to its receive view. */
 receiving?:boolean;onReceivingChange?:(receiving:boolean)=>void;
 /** To side: where the assets are sent. Omit `onRecipientChange` to hide the field. */
 recipient?:string;onRecipientChange?:(address:string)=>void;onScanRecipient?:()=>void;
}
/** Pushed view that picks one side's token: wallet or recipient row, search, chain filter and the token list. */
export function SwapPicker({side,onBack,tokens,chains,hotTokenIds,selected,onSelect,loading,wallet,onConnect,onDisconnect,receiving,onReceivingChange,recipient,onRecipientChange,onScanRecipient}:SwapPickerProps){
 const {messages,locale}=useHIG();
 const [query,setQuery]=useState('');const [chainId,setChainId]=useState<string|number|null>(null);const [active,setActive]=useState(0);
 const list=useRef<HTMLDivElement>(null);const search=useRef<HTMLInputElement>(null);
 // With a hardware keyboard the search takes focus so typing filters at once; on touch the header does, so no keyboard opens over the list.
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{(window.matchMedia?.('(pointer: fine)').matches?search.current:heading.current)?.focus();},[]);const title=side==='from'?(messages.swapFrom??en.swapFrom):(messages.swapTo??en.swapTo);
 // Hot tokens lead the unfiltered list; any search or chain filter shows one flat list.
 const {rows,hotCount}=useMemo(()=>{
  const text=query.trim();
  const filtered=tokens.filter(token=>(chainId===null||token.chainId===chainId)&&(text===''||fuzzyMatch(text,`${token.name} ${token.symbol} ${token.chain} ${token.keywords??''}`)));
  if(text!==''||chainId!==null||!hotTokenIds?.length)return {rows:filtered,hotCount:0};
  const hot=hotTokenIds.map(id=>filtered.find(token=>token.id===id)).filter((token):token is SwapToken=>!!token);
  if(!hot.length||hot.length===filtered.length)return {rows:filtered,hotCount:0};
  return {rows:[...hot,...filtered.filter(token=>!hot.includes(token))],hotCount:hot.length};
 },[tokens,hotTokenIds,query,chainId]);
 useEffect(()=>{setActive(0);},[query,chainId]);
 useEffect(()=>{list.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({block:'nearest'});},[active]);
 const choose=(token:SwapToken)=>{onSelect(token);onBack();};
 const onKeyDown=(event:React.KeyboardEvent)=>{
  if(event.key==='ArrowDown'){event.preventDefault();setActive(index=>Math.min(index+1,rows.length-1));}
  else if(event.key==='ArrowUp'){event.preventDefault();setActive(index=>Math.max(index-1,0));}
  else if(event.key==='Enter'&&(event.target as HTMLElement).tagName==='INPUT'&&(event.target as HTMLInputElement).type==='search'&&rows[active]){event.preventDefault();choose(rows[active]);}
 };
 // An empty value is the unfiltered list.
 const filters=[{value:'',label:messages.swapAllChains??en.swapAllChains},...chains.map(chain=>({value:String(chain.chainId),label:chain.name,icon:chain.icon}))];
 return <div className='hig-swap-picker' role='group' aria-label={title} onKeyDown={onKeyDown}>
  <SwapViewHeader title={title} titleRef={heading} backLabel={messages.back??en.back} onBack={onBack}/>
  {side==='from'&&wallet&&(wallet.connected?
   <div className='hig-swap-wallet'><span className='hig-swap-wallet-id'><span className='hig-swap-avatar' aria-hidden='true' style={{background:addressGradient(wallet.address??'')}}/><span>{wallet.address?shortAddress(wallet.address):''}</span><SwapIcon name='lock' size={16}/></span>{onDisconnect&&<IconButton intent='secondary' label={(messages.swapDisconnect??en.swapDisconnect)} onClick={onDisconnect}><SwapIcon name='logout'/></IconButton>}</div>:
   <div className='hig-swap-wallet'>{onConnect&&<Button fullWidth onClick={onConnect}>{(messages.swapConnectWallet??en.swapConnectWallet)}</Button>}{onReceivingChange&&<Button intent='secondary' aria-pressed={!!receiving} onClick={()=>{onReceivingChange(!receiving);onBack();}}>{(messages.swapReceiveToAddress??en.swapReceiveToAddress)}</Button>}</div>)}
  {side==='to'&&onRecipientChange&&<div className='hig-swap-wallet'><Input aria-label={(messages.swapRecipient??en.swapRecipient)} placeholder={wallet?.address?shortAddress(wallet.address):(messages.swapRecipient??en.swapRecipient)} value={recipient??''} onChange={event=>onRecipientChange(event.target.value)} autoComplete='off' autoCapitalize='none' autoCorrect='off' spellCheck={false}/>{onScanRecipient&&<IconButton intent='secondary' label={(messages.swapScan??en.swapScan)} onClick={onScanRecipient}><SwapIcon name='scan'/></IconButton>}</div>}
  <SearchInput ref={search} aria-label={(messages.swapSearchTokens??en.swapSearchTokens)} placeholder={(messages.swapSearchTokens??en.swapSearchTokens)} value={query} onChange={event=>setQuery(event.target.value)} enterKeyHint='search' autoComplete='off' autoCapitalize='none' autoCorrect='off' spellCheck={false}/>
  {chains.length>1&&<Filter label={messages.swapChains??en.swapChains} options={filters} value={chainId===null?'':String(chainId)} onValueChange={next=>setChainId(chains.find(chain=>String(chain.chainId)===next)?.chainId??null)}/>}
  <div ref={list} className='hig-swap-list' role='list' aria-label={title} aria-busy={loading||undefined}>
   {rows.length===0&&<p className='hig-swap-empty' role='status'>{loading?`${(messages.loading??en.loading)}…`:(messages.swapNoTokens??en.swapNoTokens)}</p>}
   {rows.map((token,index)=>{const isSelected=selected?.id===token.id;return <React.Fragment key={token.id}>
    {hotCount>0&&index===0&&<p className='hig-swap-section'><SwapIcon name='flame' size={14}/>{(messages.swapHot??en.swapHot)}</p>}
    {hotCount>0&&index===hotCount&&<p className='hig-swap-section'>{(messages.swapAllTokens??en.swapAllTokens)}</p>}
    <div role='listitem'><button type='button' className='hig-swap-row' data-active={index===active} data-selected={isSelected||undefined} onClick={()=>choose(token)} onPointerMove={()=>setActive(index)}>
     <TokenIcon token={token}/>
     <span className='hig-swap-row-text'><strong>{token.name}</strong><span>{token.chain}{isSelected?` · ${(messages.swapSelected??en.swapSelected)}`:''}</span></span>
     {(token.balance??0)>0&&<span className='hig-swap-row-balance'><strong className='hig-number'>{formatNumber(token.balance,locale,{maximumFractionDigits:6})}</strong>{(token.price??0)>0&&<span className='hig-number'>{formatNumber((token.balance??0)*(token.price??0),locale,{style:'currency',currency:'USD'})}</span>}</span>}
    </button></div>
   </React.Fragment>;})}
  </div>
 </div>;
}
