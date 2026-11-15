"use client";
import React from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {AssetBalanceRow,type AssetArtwork} from '../asset-balance-row.js';
import {ScreenHeader} from './screen-header.js';
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
 /** Total in dollars. Defaults to the sum of the asset values; `null` reads as unknown. */
 balance?:number|null;
 assets:readonly AccountAsset[];
 /** Symbol of the asset that is always first. Defaults to `USDC`. */
 pinnedSymbol?:string;
 /** Shows the deposit action beside the total. */
 onDeposit?:()=>void;
 /** Text of the deposit action. Defaults to the built-in “Deposit”. */
 depositLabel?:string;
 /** Makes each row a button that reports its asset. */
 onAssetSelect?:(asset:AccountAsset)=>void;
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
/** An account at a glance: a header, the total with a deposit action, the pinned dollar balance, then every other holding by value. */
const qrIcon=<svg aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinejoin='round'><rect x='3' y='3' width='5.5' height='5.5' rx='1'/><rect x='11.5' y='3' width='5.5' height='5.5' rx='1'/><rect x='3' y='11.5' width='5.5' height='5.5' rx='1'/><path d='M11.5 11.5h2v2h-2zM15 15h2v2h-2z' fill='currentColor' stroke='none'/></svg>;
export function AccountBlock({title,onBack,onShowAddress,headerAction,balance,assets,pinnedSymbol='USDC',onDeposit,depositLabel,onAssetSelect,className,...rest}:AccountBlockProps){
 const {messages}=useHIG();const {pinned,rest:others}=accountRows(assets,pinnedSymbol);
 const total=balance!==undefined?balance:assets.reduce((sum,asset)=>sum+(assetValue(asset)??0),0);
 const row=(asset:AccountAsset,pin:boolean)=><li key={asset.id} data-pinned={pin||undefined}><AssetBalanceRow name={asset.name} symbol={asset.symbol} icon={asset.icon} value={assetValue(asset)} balance={pin?undefined:asset.balance??null} onSelect={onAssetSelect&&(()=>onAssetSelect(asset))}/></li>;
 return <section {...rest} className={`hig-account-block${className?` ${className}`:''}`}>
  <ScreenHeader title={title??messages.account??en.account} onBack={onBack} action={headerAction??(onShowAddress&&<button type='button' className='hig-swap-back hig-account-address' aria-label={messages.showAddress??en.showAddress} onClick={onShowAddress}>{qrIcon}</button>)}/>
  <div className='hig-account-summary'>
   <div className='hig-account-balance'><AnimatedNumberReadout value={total} label={messages.accountBalance??en.accountBalance} options={usd}/></div>
   {onDeposit&&<Button onClick={onDeposit}>{depositLabel??messages.deposit??en.deposit}</Button>}
  </div>
  <ul className='hig-account-assets'>{row(pinned,true)}{others.map(asset=>row(asset,false))}</ul>
 </section>;
}
