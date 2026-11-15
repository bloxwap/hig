"use client";
import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from '../provider.js';
import {Button,IconButton} from '../button.js';
import {Input,SearchInput} from '../field.js';
import {Filter} from '../selection.js';
import {SwapIcon,SwapNumber,TokenIcon,usdNumber,addressGradient,chainsOf,fuzzyMatch,shortAddress,type SwapChain,type SwapToken} from './swap/shared.js';
export type {SwapChain,SwapToken} from './swap/shared.js';
export interface SwapWallet {connected:boolean;address?:string|null}
/** The searchable token list both pickers share. */
export interface PickerListProps {
 /** Tokens offered: a wallet's holdings, a whitelist, or a whole catalog. */
 tokens:readonly SwapToken[];
 /** Chain filter options. Derived from the tokens, in first-seen order, when omitted. */
 chains?:readonly SwapChain[];
 /** `false` leaves out the chain filter, for a list on one chain or one that should not be narrowed by chain. */
 chainFilter?:boolean;
 /** Token ids for a Hot section at the top of the unfiltered list, in rank order. */
 hotTokenIds?:readonly string[];
 selected?:SwapToken|null;onSelect:(token:SwapToken)=>void;
 /** Shows the loading text in place of the empty text while the list is empty. */
 loading?:boolean;
 /** With a hardware pointer, focus the search field on mount so typing filters at once. */
 autoFocus?:boolean;
}
function TokenList({tokens,chains,chainFilter=true,hotTokenIds,selected=null,onSelect,loading,autoFocus,label}:PickerListProps&{label:string}){
 const {messages}=useHIG();const id=useId();
 const [query,setQuery]=useState('');const [chainId,setChainId]=useState<string|number|null>(null);const [active,setActive]=useState(0);
 const list=useRef<HTMLDivElement>(null);const search=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(autoFocus&&window.matchMedia?.('(pointer: fine)').matches)search.current?.focus();},[]);
 const options=useMemo(()=>chains??chainsOf(tokens),[chains,tokens]);
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
 const onKeyDown=(event:React.KeyboardEvent)=>{
  if(event.key==='ArrowDown'){event.preventDefault();setActive(index=>Math.min(index+1,rows.length-1));}
  else if(event.key==='ArrowUp'){event.preventDefault();setActive(index=>Math.max(index-1,0));}
  else if(event.key==='Enter'&&rows[active]){event.preventDefault();onSelect(rows[active]);}
 };
 // An empty value is the unfiltered list.
 const filters=[{value:'',label:messages.swapAllChains??en.swapAllChains},...options.map(chain=>({value:String(chain.chainId),label:chain.name,icon:chain.icon}))];
 const row=(token:SwapToken,index:number)=>{const isSelected=selected?.id===token.id;return <div role='listitem' key={token.id}><button type='button' className='hig-swap-row' data-active={index===active} data-selected={isSelected||undefined} onClick={()=>onSelect(token)} onPointerMove={()=>setActive(index)}>
  <TokenIcon token={token}/>
  <span className='hig-swap-row-text'><strong>{token.name}</strong><span>{token.chain}{isSelected?' · '+(messages.swapSelected??en.swapSelected):''}</span></span>
  {(token.balance??0)>0&&<span className='hig-swap-row-balance'><strong><SwapNumber value={token.balance} options={{maximumFractionDigits:6}}/></strong>{(token.price??0)>0&&<SwapNumber {...usdNumber((token.balance??0)*(token.price??0))}/>}</span>}
  <PressDecoration kind='row'/>
 </button></div>;};
 return <>
  <SearchInput ref={search} aria-label={messages.swapSearchTokens??en.swapSearchTokens} placeholder={messages.swapSearchTokens??en.swapSearchTokens} value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={onKeyDown} enterKeyHint='search' autoComplete='off' autoCapitalize='none' autoCorrect='off' spellCheck={false}/>
  {chainFilter&&options.length>1&&<Filter label={messages.swapChains??en.swapChains} options={filters} value={chainId===null?'':String(chainId)} onValueChange={next=>setChainId(options.find(chain=>String(chain.chainId)===next)?.chainId??null)}/>}
  {/* Lists hold only their rows: the empty text and the section headings sit outside them, and each section is its own named list. */}
  <div ref={list} className='hig-swap-list' aria-busy={loading||undefined}>
   {rows.length===0&&<p className='hig-swap-empty' role='status'>{loading?(messages.loading??en.loading)+'…':messages.swapNoTokens??en.swapNoTokens}</p>}
   {hotCount>0&&<p className='hig-swap-section' id={`${id}-hot`}><SwapIcon name='flame' size={14}/>{messages.swapHot??en.swapHot}</p>}
   {hotCount>0&&<div role='list' aria-labelledby={`${id}-hot`}>{rows.slice(0,hotCount).map((token,index)=>row(token,index))}</div>}
   {hotCount>0&&<p className='hig-swap-section' id={`${id}-all`}>{messages.swapAllTokens??en.swapAllTokens}</p>}
   {rows.length>hotCount&&<div role='list' {...(hotCount>0?{'aria-labelledby':`${id}-all`}:{'aria-label':label})}>{rows.slice(hotCount).map((token,index)=>row(token,index+hotCount))}</div>}
  </div>
 </>;
}
export interface FromPickerBlockProps extends PickerListProps {
 /** The connected wallet. Omit for a list with no wallet row at all. */
 wallet?:SwapWallet;
 /** Shows Connect wallet while no wallet is connected. */
 onConnect?:()=>void;
 /** Shows the disconnect button beside a connected wallet. Omit it where signing out does not belong. */
 onDisconnect?:()=>void;
 /** The Generate address switch, offered while no wallet is connected: the user picks a chain and an asset and the host shows an address to send it to. Omit `onGenerateAddressChange` to hide it. */
 generateAddress?:boolean;onGenerateAddressChange?:(generate:boolean)=>void;
 className?:string;
}
/**
 * Where the assets come from. A connected wallet shows its address, with a disconnect button the host can leave out, above
 * the tokens it holds (or a whitelist). With no wallet it offers Connect wallet and a Generate address switch above the list.
 * The host owns the wallet, the token data and the generated address.
 */
export function FromPickerBlock({wallet,onConnect,onDisconnect,generateAddress=false,onGenerateAddressChange,className,...list}:FromPickerBlockProps){
 const {messages}=useHIG();const id=useId();const label=messages.swapFrom??en.swapFrom;
 return <div className={`hig-picker${className?` ${className}`:''}`} role='group' aria-label={label}>
  {wallet?.connected
   ?<div className='hig-swap-wallet'><span className='hig-swap-wallet-id'><span className='hig-swap-avatar' aria-hidden='true' style={{background:addressGradient(wallet.address??'')}}/><span>{wallet.address?shortAddress(wallet.address):''}</span><SwapIcon name='lock' size={16}/></span>{onDisconnect&&<IconButton intent='secondary' label={messages.swapDisconnect??en.swapDisconnect} onClick={onDisconnect}><SwapIcon name='logout'/></IconButton>}</div>
   :(onConnect||onGenerateAddressChange)&&<div className='hig-swap-wallet'>
    {onConnect&&<Button onClick={onConnect}><SwapIcon name='wallet'/>{messages.swapConnectWallet??en.swapConnectWallet}</Button>}
    {onGenerateAddressChange&&<label className='hig-picker-toggle hig-choice hig-switch' htmlFor={id}><span>{messages.swapGenerateAddress??en.swapGenerateAddress}</span><input id={id} type='checkbox' role='switch' checked={generateAddress} onChange={event=>onGenerateAddressChange(event.target.checked)}/></label>}
   </div>}
  <TokenList {...list} label={label}/>
 </div>;
}
export interface ToPickerBlockProps extends Partial<PickerListProps> {
 /** The destination address field. Omit `onAddressChange` to hide it. */
 address?:string;onAddressChange?:(address:string)=>void;
 /** Shown while the field is empty, for example the connected wallet shortened; defaults to the built-in label. */
 addressPlaceholder?:string;
 /** Shows the scan button. HIG ships no scanner: the host opens its own and writes the result to `address`. */
 onScan?:()=>void;
 className?:string;
}
/**
 * Where the assets go. On its own it is a destination address field with a scan button. With `tokens` it adds the
 * searchable token list, with the chain filter or, with `chainFilter={false}`, without it.
 */
export function ToPickerBlock({address,onAddressChange,addressPlaceholder,onScan,className,tokens,onSelect,...list}:ToPickerBlockProps){
 const {messages}=useHIG();const label=messages.swapTo??en.swapTo;
 return <div className={`hig-picker${className?` ${className}`:''}`} role='group' aria-label={label}>
  {onAddressChange&&<div className='hig-swap-wallet'><Input aria-label={messages.swapRecipient??en.swapRecipient} placeholder={addressPlaceholder??messages.swapRecipient??en.swapRecipient} value={address??''} onChange={event=>onAddressChange(event.target.value)} autoComplete='off' autoCapitalize='none' autoCorrect='off' spellCheck={false}/>{onScan&&<IconButton intent='secondary' label={messages.swapScan??en.swapScan} onClick={onScan}><SwapIcon name='scan'/></IconButton>}</div>}
  {tokens&&onSelect&&<TokenList {...list} tokens={tokens} onSelect={onSelect} label={label}/>}
 </div>;
}

/** @deprecated Renamed `FromPickerBlock`. The old name keeps working until the next major release. */
export const FromPicker=FromPickerBlock;
/** @deprecated Renamed `FromPickerBlockProps`. */
export type FromPickerProps=FromPickerBlockProps;
/** @deprecated Renamed `ToPickerBlock`. The old name keeps working until the next major release. */
export const ToPicker=ToPickerBlock;
/** @deprecated Renamed `ToPickerBlockProps`. */
export type ToPickerProps=ToPickerBlockProps;
