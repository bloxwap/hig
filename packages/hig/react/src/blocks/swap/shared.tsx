"use client";
import React from 'react';
import {AnimatedNumberReadout,type AnimatedNumberProps} from '../../animated-number.js';
import {PressDecoration} from '../../provider.js';
/** An asset on one chain. The host supplies every value; HIG formats and lays it out. */
export interface SwapToken {
 /** Unique per asset and chain, for example `${chainId}-${address}`. */
 id:string;symbol:string;name:string;
 /** Chain display name and identity. Two tokens on the same `chainId` swap; different chains bridge. */
 chain:string;chainId:string|number;
 /** Artwork: an image URL, or the host's own element (an inline SVG, say), which fills the disc. A missing token icon falls back to the symbol's first letters. */
 icon?:SwapArtwork;chainIcon?:SwapArtwork;
 /** Most decimal places a token amount may be typed with, for example 6 for USDC. Unlimited when omitted. Dollars always stop at two. */
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
 if(!from||!to||from.symbol===to.symbol)return 'send';
 return from.chainId===to.chainId?'swap':'bridge';
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
export function unitsToEntry(units:number,mode:SwapDenomination,price:number):string{
 if(mode==='token')return trimNumber(units);
 return price>0?String(Math.floor(units*price*100)/100):'0';
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
export function fuzzyMatch(query:string,text:string):boolean{
 const needle=query.toLowerCase().replace(/\s+/g,''),haystack=text.toLowerCase();
 if(haystack.includes(needle))return true;
 let matched=0;for(let index=0;index<haystack.length&&matched<needle.length;index++)if(haystack[index]===needle[matched])matched++;
 return matched===needle.length;
}
const numberMark='\uE000';
/** A number in the swap card that can change while it is on screen. It always updates place by place (never by swapping the text), and `template` keeps it inside its localized sentence: `template={messages.swapFee}` renders "Fee " around the moving amount. */
export function SwapNumber({template,...number}:AnimatedNumberProps&{template?:(value:string)=>string}){
 if(!template)return <AnimatedNumberReadout {...number}/>;
 const [before,after='']=template(numberMark).split(numberMark);
 // One element, so a flex parent spaces the sentence as a single item.
 return <span>{before}<AnimatedNumberReadout {...number}/>{after}</span>;
}
/** A figure the host supplies as a number so it can update place by place: `{value:234.68,options:{style:'currency',currency:'USD'},suffix:' available'}`. */
export interface SwapFigure {value:number;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string}
/** Host text that is either a fixed string or a live figure. */
export const swapFigure=(text:string|SwapFigure)=>typeof text==='string'?text:<SwapNumber value={text.value} options={text.options} prefix={text.prefix} suffix={text.suffix}/>;
/** `SwapNumber` props for a dollar amount and for a slippage fraction (0.005 reads `0.5%`). */
export const usdNumber=(value:number|null|undefined)=>({value,options:{style:'currency',currency:'USD'}} as const);
export const percentNumber=(fraction:number)=>({value:Number((fraction*100).toFixed(4)),suffix:'%',options:{maximumFractionDigits:4,useGrouping:false}} as const);
/** A slippage fraction as a percent string: 0.005 is `0.5%`. */
export const formatPercent=(fraction:number)=>`${Number((fraction*100).toFixed(4))}%`;
/** A small trial amount: 1% of holdings, capped at about one dollar's worth. */
export function testAmount(token:SwapToken):number{
 const balance=token.balance??0,price=token.price??0;
 if(!(balance>0))return 0;
 return Number(Math.min(balance*0.01,price>0?1/price:balance*0.01).toFixed(8));
}
export const shortAddress=(address:string)=>address.length<=12?address:`${address.slice(0,6)}…${address.slice(-4)}`;
/** A stable two-stop gradient for a wallet address, so the same wallet always looks the same. */
export function addressGradient(address:string):string{
 let hash=0;for(const character of address)hash=(hash*31+character.charCodeAt(0))>>>0;
 return `linear-gradient(135deg,hsl(${hash%360} 80% 62%),hsl(${(hash>>>8)%360} 75% 42%))`;
}
const stroke={fill:'none',stroke:'currentColor',strokeWidth:1.75,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
const paths={
 flip:<path d='M6.5 3.5v13m0 0-3-3m3 3 3-3M13.5 16.5v-13m0 0-3 3m3-3 3 3'/>,
 down:<path d='M10 3.5v13m0 0-4.5-4.5M10 16.5l4.5-4.5'/>,
 reset:<path d='M4 10a6 6 0 1 0 2-4.5M4 4v3h3'/>,
 menu:<path d='M4 6h12M4 10h12M4 14h12'/>,
 close:<path d='m5.5 5.5 9 9m0-9-9 9'/>,
 back:<path d='m12 4.5-5.5 5.5 5.5 5.5'/>,
 chevron:<path d='m7.5 4.5 5.5 5.5-5.5 5.5'/>,
 expand:<path d='m5 7.5 5 5 5-5'/>,
 delete:<path d='M7.5 4.5h8a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-8L2.5 10ZM10 8l4 4m0-4-4 4'/>,
 sliders:<path d='M4 6h6m4 0h2M4 14h2m4 0h6M12 4v4M8 12v4'/>,
 flask:<path d='M8 3.5h4M8.75 3.5v4.75L4.5 15.5a1 1 0 0 0 .9 1.5h9.2a1 1 0 0 0 .9-1.5l-4.25-7.25V3.5M6.5 12.5h7'/>,
 scan:<path d='M4 7V5a1 1 0 0 1 1-1h2M13 4h2a1 1 0 0 1 1 1v2M16 13v2a1 1 0 0 1-1 1h-2M7 16H5a1 1 0 0 1-1-1v-2M4 10h12'/>,
 flame:<path d='M10 17a5 5 0 0 0 5-5c0-3-2.5-4.5-3-8-2 1-3.5 3-3.5 5.5C7.5 8.5 7 7.5 7 7c-1.5 1.5-2 3-2 5a5 5 0 0 0 5 5Z'/>,
 logout:<path d='M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M12.5 6.5 16 10l-3.5 3.5M16 10H8'/>,
 wallet:<path d='M3.5 6.5A1.5 1.5 0 0 1 5 5h9.5A1.5 1.5 0 0 1 16 6.5v.75M3.5 6.5v7A1.5 1.5 0 0 0 5 15h10.5a1 1 0 0 0 1-1V8.25a1 1 0 0 0-1-1H5a1.5 1.5 0 0 1-1.5-.75M13.25 11.25v.01'/>,
 info:<path d='M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM10 9.5v4M10 6.5v.01'/>,
 lock:<path d='M5.5 9h9a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1ZM7 9V6.5a3 3 0 0 1 6 0V9'/>,
};
export type SwapIconName=keyof typeof paths;
/** Outline symbol on a 20 unit grid; decorative, so the control that holds it carries the name. */
export function SwapIcon({name,size=20}:{name:SwapIconName;size?:number}){return <svg className='hig-swap-icon' aria-hidden='true' focusable='false' width={size} height={size} viewBox='0 0 20 20' {...stroke}>{paths[name]}</svg>;}
const chainBadge='hig-swap-chain-badge';
/** Token artwork with its chain badge. */
export function TokenIcon({token,size=44}:{token:SwapToken;size?:number}){
 return <span className='hig-swap-token-icon' style={{width:size,height:size}}>
  {token.icon?swapArt(token.icon,undefined,true):<span aria-hidden='true'>{token.symbol.slice(0,3)}</span>}
  {token.chainIcon&&swapArt(token.chainIcon,chainBadge,true)}
 </span>;
}
/** Small capsule action that sits on a card: Max, Test, the slippage setting and the denomination switch. */
export function SwapPill({children,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>){return <button type='button' {...props} className='hig-swap-pill'>{children}<PressDecoration kind='button' disabled={!!props.disabled}/></button>;}
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
