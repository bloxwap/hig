// Pure helpers for the SwapPanel recipe. Same behaviour as the web recipe's helpers; kept separate so native never imports the react entry.
/** An asset on one chain. The host supplies every value; HIG formats and lays it out. */
export interface SwapToken {
 /** Unique per asset and chain, for example `${chainId}-${address}`. */
 id:string;symbol:string;name:string;
 /** Chain display name and identity. Two tokens on the same `chainId` swap; different chains bridge. */
 chain:string;chainId:string|number;
 /** Image URLs. A missing token icon falls back to the symbol's first letters. */
 icon?:string;chainIcon?:string;
 /** Holdings in token units, when the host knows them. Enables Max, Test and the balance check. */
 balance?:number|null;
 /** USD per unit, when the host knows it. Enables the dollar and unit conversion. */
 price?:number|null;
 /** Extra text matched by the picker search, such as the contract address. */
 keywords?:string;
}
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
 if(!from||!to||from.symbol===to.symbol)return 'send';
 return from.chainId===to.chainId?'swap':'bridge';
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
export function unitsToEntry(units:number,mode:SwapDenomination,price:number):string{
 if(mode==='token')return trimNumber(units);
 return price>0?String(Math.floor(units*price*100)/100):'0';
}
/** Applies one keypad key (`0`–`9`, `.`, `back`) to an amount string. Dollars stop at two decimals. */
export function applyAmountKey(current:string,key:string,mode:SwapDenomination):string{
 if(key==='back')return current.length<=1?'0':current.slice(0,-1);
 if(key==='.')return current.includes('.')?current:`${current}.`;
 if(!/^[0-9]$/.test(key))return current;
 const next=sanitizeAmount(current==='0'?key:current+key);const dot=next.indexOf('.');
 return mode==='usd'&&dot!==-1&&next.length-dot-1>2?current:next;
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
 if(!(balance>0))return 0;
 return Number(Math.min(balance*0.01,price>0?1/price:balance*0.01).toFixed(8));
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
