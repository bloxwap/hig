"use client";
import React,{useId} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from '../provider.js';
import {Button} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {AssetBalanceRow,type AssetArtwork} from '../asset-balance-row.js';
import {ScreenHeader,qrIcon} from './screen-header.js';
export {AssetBalanceRow,type AssetArtwork,type AssetBalanceRowProps} from '../asset-balance-row.js';
/** One holding of the account. The host supplies every figure; HIG sorts, formats and lays it out. */
export interface AccountAsset {
 id:string;name:string;symbol:string;icon?:AssetArtwork;
 /** Holding in token units. */
 balance?:number|null;
 /** USD per unit, when the host knows it. */
 price?:number|null;
 /** Dollar value of the holding. Defaults to `balance × price`. */
 value?:number|null;
 /** Set false to draw no units line, for a holding whose units are the same figure as its value. */
 units?:boolean;
 /** Set false to draw this row plain even when the block has `onAssetSelect`. */
 selectable?:boolean;
 /** Format of the units figure. Defaults to at most six fraction digits. */
 unitsOptions?:Intl.NumberFormatOptions;
}
/** A titled group of holdings with its own total, such as one ledger of the account. */
export interface AccountSection {
 id:string;
 /** Heading over the group. */
 title:string;
 /** The group's total in dollars, on the trailing edge of its heading. Defaults to the sum of its asset values; `null` reads as unknown. */
 total?:number|null;
 assets:readonly AccountAsset[];
}
export interface AccountBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading. Defaults to the built-in “Account”. */
 title?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** Shows a QR button on the trailing edge of the header, above the deposit action. The host shows the account address, for example with `WalletAddress`. */
 onShowAddress?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. Replaces the QR button. */
 headerAction?:React.ReactNode;
 /** Total in dollars. Defaults to the sum of the asset values (with `sections`, the sum of the section totals); `null` reads as unknown. */
 balance?:number|null;
 /** Every holding as one list: the pinned asset, then the rest by value. Ignored when `sections` is set. */
 assets?:readonly AccountAsset[];
 /** Titled groups, each with its own total, drawn in the order given in place of the flat `assets` list. */
 sections?:readonly AccountSection[];
 /** Symbol of the asset that is always first. Defaults to `USDC`. */
 pinnedSymbol?:string;
 /** Shows the deposit action beside the total. */
 onDeposit?:()=>void;
 /** Text of the deposit action. Defaults to the built-in “Deposit”. */
 depositLabel?:string;
 /** Makes each row a button that reports its asset, and with `sections` the section it is in. */
 onAssetSelect?:(asset:AccountAsset,section?:AccountSection)=>void;
}
const usdCoin='USD Coin',usd={style:'currency',currency:'USD'} as const;
/** Dollar value of a holding: its `value`, or `balance × price` when both are known. */
export const assetValue=(asset:AccountAsset):number|null=>asset.value!==undefined?asset.value:asset.balance!=null&&asset.price!=null?asset.balance*asset.price:null;
/** The account's rows in display order: the pinned asset (a zero placeholder when the account does not hold it), then every other asset by dollar value, largest first, unknown values last and ties by name. */
export function accountRows(assets:readonly AccountAsset[],pinnedSymbol='USDC'):{pinned:AccountAsset;rest:AccountAsset[]}{
 const index=assets.findIndex(asset=>asset.symbol.toUpperCase()===pinnedSymbol.toUpperCase());
 const pinned=index>=0?assets[index]:{id:pinnedSymbol,name:pinnedSymbol==='USDC'?usdCoin:pinnedSymbol,symbol:pinnedSymbol,balance:0,value:0};
 const rest=assets.filter((_,position)=>position!==index).sort((a,b)=>{const left=assetValue(a),right=assetValue(b);return left===right?a.name.localeCompare(b.name):left===null?1:right===null?-1:right-left||a.name.localeCompare(b.name);});
 return {pinned,rest};
}
const sum=(assets:readonly AccountAsset[])=>assets.reduce((total,asset)=>total+(assetValue(asset)??0),0);
/** A section's total: its own `total`, or the sum of its asset values. */
export const accountSectionTotal=(section:AccountSection):number|null=>section.total!==undefined?section.total:sum(section.assets);
/** A section's rows in display order: the pinned asset first when the section holds it (no placeholder), then the rest by dollar value as in `accountRows`. */
export function accountSectionRows(assets:readonly AccountAsset[],pinnedSymbol='USDC'):{pinned:AccountAsset|null;rest:AccountAsset[]}{
 const {pinned,rest}=accountRows(assets,pinnedSymbol);return {pinned:assets.includes(pinned)?pinned:null,rest};
}
/** An account at a glance: a header, the total with a deposit action, the pinned dollar balance, then every other holding by value. */
export function AccountBlock({title,onBack,onShowAddress,headerAction,balance,assets=[],sections,pinnedSymbol='USDC',onDeposit,depositLabel,onAssetSelect,className,...rest}:AccountBlockProps){
 const {messages}=useHIG();const id=useId();
 const total=balance!==undefined?balance:sections?sections.reduce((all,section)=>all+(accountSectionTotal(section)??0),0):sum(assets);
 const row=(asset:AccountAsset,pin:boolean,section?:AccountSection)=>{
  const value=assetValue(asset),units=!pin&&asset.units!==false;
  const select=onAssetSelect&&asset.selectable!==false?(section?()=>onAssetSelect(asset,section):()=>onAssetSelect(asset)):undefined;
  return <li key={asset.id} data-pinned={pin||undefined}><AssetBalanceRow name={asset.name} symbol={asset.symbol} icon={asset.icon} value={value} balance={units?asset.balance??null:undefined} balanceOptions={asset.unitsOptions} headline={units&&value===null&&asset.balance!=null?'units':undefined} onSelect={select}/></li>;
 };
 let list:React.ReactNode;
 if(sections)list=<div className='hig-account-sections'>{sections.filter(section=>section.assets.length>0).map((section,index)=>{
  const {pinned,rest:others}=accountSectionRows(section.assets,pinnedSymbol),heading=`${id}-section-${index}`;
  return <section key={section.id} className='hig-account-section' aria-labelledby={heading}>
   <div className='hig-account-section-header'><h3 id={heading}>{section.title}</h3><span className='hig-account-section-total'><AnimatedNumberReadout value={accountSectionTotal(section)} options={usd}/></span></div>
   <ul className='hig-account-assets'>{pinned&&row(pinned,true,section)}{others.map(asset=>row(asset,false,section))}</ul>
  </section>;
 })}</div>;
 else{const {pinned,rest:others}=accountRows(assets,pinnedSymbol);list=<ul className='hig-account-assets'>{row(pinned,true)}{others.map(asset=>row(asset,false))}</ul>;}
 return <section {...rest} className={`hig-account-block${className?` ${className}`:''}`}>
  <ScreenHeader title={title??messages.account??en.account} onBack={onBack} action={headerAction??(onShowAddress&&<button type='button' className='hig-swap-back hig-account-address' aria-label={messages.showAddress??en.showAddress} onClick={onShowAddress}>{qrIcon}<PressDecoration kind='back'/></button>)}/>
  <div className='hig-account-summary'>
   <div className='hig-account-balance'><AnimatedNumberReadout value={total} label={messages.accountBalance??en.accountBalance} options={usd}/></div>
   {onDeposit&&<Button onClick={onDeposit}>{depositLabel??messages.deposit??en.deposit}</Button>}
  </div>
  {list}
 </section>;
}
