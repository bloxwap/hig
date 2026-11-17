import {decimal,decimalMultiply,decimalDivide} from '@bloxwap/hig/contracts';
import type React from 'react';
// Pure helpers for the SwapBlock block. Same behaviour as the web block's helpers; kept separate so native never imports the react entry.
/** An asset on one chain. The host supplies every value; HIG formats and lays it out. */
/** A live figure in place of a line of text: formatted with `options` between `prefix` and `suffix`, and updated through `AnimatedNumberReadout` when `value` changes. For example `{value:234.68,options:{style:'currency',currency:'USD'},suffix:' available'}`. */
export interface SwapFigure {value:number;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string;
 /** Host-formatted text for `value`, drawn and read in place of Intl's and still moving place by place. Never parsed back. */
 formattedValue?:string}
export interface SwapToken {
 /** Unique per asset and chain, for example `${chainId}-${address}`. */
 id:string;symbol:string;name:string;
 /** Chain display name and identity. Two tokens on the same `chainId` swap; different chains bridge. */
 chain:string;chainId:string|number;
 /** Artwork: an image URL, or the host's own element (an SVG component, say), which fills the disc. A missing token icon falls back to the symbol's first letters. */
 icon?:SwapArtwork;chainIcon?:SwapArtwork;
 /** Most decimal places a token amount may be typed with, for example 6 for USDC. Up to 100 when omitted; explicit precision must be an integer from 0 to 100. Dollars always stop at two. */
 decimals?:number;
 /** Holdings in token units, when the host knows them. Enables Max, Test and the balance check. */
 balance?:number|null;
 /** USD per unit, when the host knows it. Enables the dollar and unit conversion. */
 price?:number|null;
 /** Presents the side as an account rather than a token: this line (for example `$22.72 available`, as text or as a `SwapFigure` that updates in place) sits under the name, the artwork is a single disc, and only Max is offered. */
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
export interface SwapChain {chainId:string|number;name:string;icon?:string}
/** Same asset: send. Different asset on one chain: swap. Different asset across chains: bridge. */
export type SwapAction='send'|'swap'|'bridge';
export type SwapDenomination='usd'|'token';
/** The panel's view stack: the main form, a side's token picker, or a settings view. Exactly one shows at a time. */
export type SwapView='main'|'from'|'to'|'settings'|'slippage'|'fees';
/** Where Back leads: slippage and fees return to settings, everything else to the main form. */
export const swapParentView=(view:SwapView):SwapView=>view==='slippage'||view==='fees'?'settings':'main';
export interface SwapWallet {connected:boolean;address?:string|null}
export interface SwapFee {label:string;usd:number}
export const slippagePresets=[0.001,0.005,0.01] as const;
export function swapAction(from:SwapToken|null,to:SwapToken|null):SwapAction{
 if(!from||!to)return 'send';
 if(String(from.chainId)!==String(to.chainId))return 'bridge';
 return from.id===to.id?'send':'swap';
}
/** A clean numeric string: no trailing zeros, at most `digits` decimals. */
export const trimNumber=(value:number,digits=8):string=>String(Number((Number.isFinite(value)?value:0).toFixed(digits)));
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
/** Applies one keypad key (`0`–`9`, `.`, `back`) to an amount string. Dollars stop at two decimals. */
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
/** A slippage fraction as a percent string: 0.005 is `0.5%`. */
export const formatPercent=(fraction:number):string=>`${Number((fraction*100).toFixed(4))}%`;
/** A small trial amount: 1% of holdings, capped at about one dollar's worth. */
export function testAmount(token:SwapToken):number{
 const balance=token.balance??0,price=token.price??0;
 if(!(balance>0)||!Number.isFinite(balance))return 0;
 const fraction=decimalDivide(balance,100,token.decimals??18);return Number(decimal(price>0?Math.min(Number(fraction),Number(decimalDivide(1,price,token.decimals??18))):fraction,token.decimals??18));
}
export const shortAddress=(address:string):string=>address.length<=12?address:`${address.slice(0,6)}…${address.slice(-4)}`;
/** A stable flat colour for a wallet address, so the same wallet always looks the same. */
export function addressColor(address:string):string{
 let hash=0;for(const character of address)hash=(hash*31+character.charCodeAt(0))>>>0;
 return `hsl(${hash%360}, 75%, 55%)`;
}
/** Picker rows: hot tokens lead the unfiltered list; any search or chain filter gives one flat list. */
export function pickerRows(tokens:readonly SwapToken[],query:string,chainId:string|number|null,hotTokenIds?:readonly string[]):{rows:SwapToken[];hotCount:number}{
 const text=query.trim();
 const filtered=tokens.filter(token=>(chainId===null||token.chainId===chainId)&&(text===''||fuzzyMatch(text,`${token.name} ${token.symbol} ${token.chain} ${token.keywords??''}`)));
 if(text!==''||chainId!==null||!hotTokenIds?.length)return {rows:filtered,hotCount:0};
 const hot=hotTokenIds.map(id=>filtered.find(token=>token.id===id)).filter((token):token is SwapToken=>!!token);
 if(!hot.length||hot.length===filtered.length)return {rows:filtered,hotCount:0};
 return {rows:[...hot,...filtered.filter(token=>!hot.includes(token))],hotCount:hot.length};
}
