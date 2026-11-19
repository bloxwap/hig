"use client";
import { ArrowDown } from '@bloxwap/icons/react/arrow-down';
import { ArrowUpDown } from '@bloxwap/icons/react/arrow-up-down';
import { ChevronDown } from '@bloxwap/icons/react/chevron-down';
import { ChevronLeft } from '@bloxwap/icons/react/chevron-left';
import { ChevronRight } from '@bloxwap/icons/react/chevron-right';
import { Delete } from '@bloxwap/icons/react/delete';
import { Flame } from '@bloxwap/icons/react/flame';
import { FlaskConical } from '@bloxwap/icons/react/flask-conical';
import { Info } from '@bloxwap/icons/react/info';
import { Lock } from '@bloxwap/icons/react/lock';
import { LogOut } from '@bloxwap/icons/react/log-out';
import { Menu } from '@bloxwap/icons/react/menu';
import { RotateCcw } from '@bloxwap/icons/react/rotate-ccw';
import { ScanLine } from '@bloxwap/icons/react/scan-line';
import { SlidersHorizontal } from '@bloxwap/icons/react/sliders-horizontal';
import { Wallet } from '@bloxwap/icons/react/wallet';
import { X } from '@bloxwap/icons/react/x';
import {decimal,decimalMultiply,decimalDivide} from '@bloxwap/hig/contracts/decimal';
import React from 'react';
import {NumberFlow,type AnimatedNumberProps} from '../../animated-number.js';
import {PressDecoration} from '../../provider.js';
import {figureProps} from '../../figure.js';
/** An asset on one chain. The host supplies every value; HIG formats and lays it out. */
export interface SwapToken {
 /** Unique per asset and chain, for example `${chainId}-${address}`. */
 id:string;symbol:string;name:string;
 /** Chain display name and identity. Two tokens on the same `chainId` swap; different chains bridge. */
 chain:string;chainId:string|number;
 /** Artwork: an image URL, or the host's own element (an inline SVG, say), which fills the disc. A missing token icon falls back to the symbol's first letters. */
 icon?:SwapArtwork;chainIcon?:SwapArtwork;
 /** Most decimal places a token amount may be typed with, for example 6 for USDC. Up to 100 when omitted; explicit precision must be an integer from 0 to 100. Dollars always stop at two. */
 decimals?:number;
 /** Holdings in token units, when the host knows them. Enables Max, Test and the balance check. */
 balance?:number|null;
 /** USD per unit, when the host knows it. Enables the dollar and unit conversion. */
 price?:number|null;
 /** Presents the side as an account rather than a token: this line (for example `$22.72 available`) sits under the name, the artwork is a single disc, and only Max is offered. */
 /** Pass a `SwapFigure` when the amount in it can change while the card is shown, so it updates place by place. */
 caption?:string|SwapFigure;
 /** Extra text matched by the picker search, such as the contract address. */
 keywords?:string;
 /** Picker rows: host text after the balance figure, such as ` HYPE`. */
 unitsSuffix?:string;
 /** Picker rows: the second line under the name in place of the chain, for a list that is not about chains. The search still matches the chain. */
 detail?:string;
}
/** An image URL, or an element the host draws. */
export type SwapArtwork=string|React.ReactElement;
/** Artwork in a disc: the URL as an image, the host's element inside a clipped wrapper. */
export const swapArt=(icon:SwapArtwork,className?:string,lazy?:boolean)=>typeof icon==='string'?<img className={className} src={icon} alt='' loading={lazy?'lazy':undefined}/>:<span className={`hig-swap-art${className?` ${className}`:''}`} aria-hidden='true'>{icon}</span>;
export interface SwapChain {chainId:string|number;name:string;icon?:string}
/** Same asset: send. Different asset on one chain: swap. Different asset across chains: bridge. */
export type SwapAction='send'|'swap'|'bridge';
export type SwapDenomination='usd'|'token';
export function swapAction(from:SwapToken|null,to:SwapToken|null):SwapAction{
 if(!from||!to)return 'send';
 if(String(from.chainId)!==String(to.chainId))return 'bridge';
 return from.id===to.id?'send':'swap';
}
/** A clean numeric string: no trailing zeros, at most `digits` decimals. */
export const trimNumber=(value:number,digits=8)=>String(Number((Number.isFinite(value)?value:0).toFixed(digits)));
/** Keeps digits and one decimal point, and strips leading zeros; never returns an empty string. */
export function sanitizeAmount(raw:string):string{
 let value=raw.replace(/[^0-9.]/g,'');const dot=value.indexOf('.');
 if(dot!==-1)value=value.slice(0,dot+1)+value.slice(dot+1).replace(/\./g,'');
 value=value.replace(/^0+(\d)/,'$1');
 return value===''||value==='.'?'0':value;
}
/** Token units shown in the active denomination. Dollars floor to the cent so Max never resolves to more than the balance. */
export function unitsToEntry(units:number|string,mode:SwapDenomination,price:number):string{
 if(mode==='token')return decimal(units);
 return price>0?decimalMultiply(units,price,2):'0';
}
/** Applies one keypad or keyboard key (`0`–`9`, `.`, `back`) to an amount string. Dollars stop at two decimals, token units at `decimals` when given. */
export function applyAmountKey(current:string,key:string,mode:SwapDenomination,decimals?:number):string{
 if(key==='back')return current.length<=1?'0':current.slice(0,-1);
 if(key==='.')return current.includes('.')?current:`${current}.`;
 if(!/^[0-9]$/.test(key))return current;
 const next=sanitizeAmount(current==='0'?key:current+key);const dot=next.indexOf('.');
 const limit=mode==='usd'?2:decimals;
 return limit!==undefined&&dot!==-1&&next.length-dot-1>limit?current:next;
}
/** Case-insensitive substring or in-order subsequence match. */
export {fuzzyMatch} from '@bloxwap/hig/contracts/picker-search';
const numberMark='\uE000';
/** A number in the swap card that can change while it is on screen. It always updates place by place (never by swapping the text), and `template` keeps it inside its localized sentence: `template={messages.swapFee}` renders "Fee " around the moving amount. */
export function SwapNumber({template,...number}:AnimatedNumberProps&{template?:(value:string)=>string}){
 if(!template)return <NumberFlow {...number}/>;
 const [before,after='']=template(numberMark).split(numberMark);
 // One element, so a flex parent spaces the sentence as a single item.
 return <span>{before}<NumberFlow {...number}/>{after}</span>;
}
/** A figure the host supplies as a number so it can update place by place: `{value:234.68,options:{style:'currency',currency:'USD'},suffix:' available'}`. */
export interface SwapFigure {value:number;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string;
 /** Host-formatted text for `value`, drawn and read in place of Intl's and still moving place by place. Never parsed back. */
 formattedValue?:string}
/** Host text that is either a fixed string or a live figure. */
export const swapFigure=(text:string|SwapFigure)=>typeof text==='string'?text:<SwapNumber {...figureProps(text)}/>;
/** `SwapNumber` props for a dollar amount and for a slippage fraction (0.005 reads `0.5%`). */
export const usdNumber=(value:number|null|undefined)=>({value,options:{style:'currency',currency:'USD'}} as const);
export const percentNumber=(fraction:number)=>({value:Number((fraction*100).toFixed(4)),suffix:'%',options:{maximumFractionDigits:4,useGrouping:false}} as const);
/** A slippage fraction as a percent string: 0.005 is `0.5%`. */
export const formatPercent=(fraction:number)=>`${Number((fraction*100).toFixed(4))}%`;
/** A small trial amount: 1% of holdings, capped at about one dollar's worth. */
export function testAmount(token:SwapToken):number{
 const balance=token.balance??0,price=token.price??0;
 if(!(balance>0)||!Number.isFinite(balance))return 0;
 const fraction=decimalDivide(balance,100,token.decimals??18);return Number(decimal(price>0?Math.min(Number(fraction),Number(decimalDivide(1,price,token.decimals??18))):fraction,token.decimals??18));
}
export const shortAddress=(address:string)=>address.length<=12?address:`${address.slice(0,6)}…${address.slice(-4)}`;
/** A stable two-stop gradient for a wallet address, so the same wallet always looks the same. */
export function addressGradient(address:string):string{
 let hash=0;for(const character of address)hash=(hash*31+character.charCodeAt(0))>>>0;
 return `linear-gradient(135deg,hsl(${hash%360} 80% 62%),hsl(${(hash>>>8)%360} 75% 42%))`;
}
const symbols={flip:ArrowUpDown,down:ArrowDown,reset:RotateCcw,menu:Menu,close:X,back:ChevronLeft,chevron:ChevronRight,expand:ChevronDown,delete:Delete,sliders:SlidersHorizontal,flask:FlaskConical,scan:ScanLine,flame:Flame,logout:LogOut,wallet:Wallet,info:Info,lock:Lock};
export type SwapIconName=keyof typeof symbols;
/** Shared outline symbol; the containing control carries its accessible name. */
export function SwapIcon({name,size=20}:{name:SwapIconName;size?:number}){const Symbol=symbols[name];return <Symbol className='hig-swap-icon' size={size}/>;}
const chainBadge='hig-swap-chain-badge';
/** Token artwork with its chain badge. */
export function TokenIcon({token,size=44}:{token:SwapToken;size?:number}){
 return <span className='hig-swap-token-icon' style={{width:size,height:size}}>
  {token.icon?swapArt(token.icon,undefined,true):<span aria-hidden='true'>{token.symbol.slice(0,3)}</span>}
  {token.chainIcon&&swapArt(token.chainIcon,chainBadge,true)}
 </span>;
}
/** Small capsule action that sits on a card: Max, Test, the slippage setting and the denomination switch. */
export function SwapPill({children,...props}:React.ComponentPropsWithRef<'button'>){return <button type='button' {...props} className='hig-swap-pill'>{children}<PressDecoration kind='button' disabled={!!props.disabled}/></button>;}
const keys=['1','2','3','4','5','6','7','8','9','.','0','back'];
/** Numeric keypad. Emits `0`–`9`, `.` or `back`. */
export function SwapKeypad({onKey,label,deleteLabel}:{onKey:(key:string)=>void;label:string;deleteLabel:string}){
 return <div className='hig-swap-keypad' role='group' aria-label={label}>{keys.map(key=><button key={key} type='button' className='hig-swap-key' aria-label={key==='back'?deleteLabel:undefined} onClick={()=>onKey(key)}>{key==='back'?<SwapIcon name='delete' size={24}/>:key}<PressDecoration kind='button'/></button>)}</div>;
}
/** Chains present in a token list, in first-seen order. */
export function chainsOf(tokens:readonly SwapToken[]):SwapChain[]{const seen=new Map<string|number,SwapChain>();for(const token of tokens)if(!seen.has(token.chainId))seen.set(token.chainId,{chainId:token.chainId,name:token.chain,icon:typeof token.chainIcon==='string'?token.chainIcon:undefined});return [...seen.values()];}
export type SwapView='main'|'from'|'to'|'settings'|'slippage'|'fees';
/** Where Back leads from a pushed view. */
export const parentView=(view:SwapView):SwapView=>view==='slippage'||view==='fees'?'settings':'main';
/** Header of a pushed view: Back on the leading edge, then the title, which takes focus when the view arrives. */
export function SwapViewHeader({title,titleRef,backLabel,onBack}:{title:string;titleRef:React.Ref<HTMLHeadingElement>;backLabel:string;onBack:()=>void}){
 return <div className='hig-swap-view-header'><button type='button' className='hig-swap-back' aria-label={backLabel} onClick={onBack}><SwapIcon name='back'/><PressDecoration kind='back'/></button><h2 ref={titleRef} tabIndex={-1} className='hig-swap-view-title'>{title}</h2></div>;
}
