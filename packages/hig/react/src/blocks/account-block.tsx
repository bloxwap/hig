"use client";
import React,{useId} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from '../provider.js';
import {initialWindowRows,RowWindow} from '../row-window.js';
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
 /** Host text after the units figure, such as ` PAPER`. */
 unitsSuffix?:string;
 /** Short muted host text under the figures, such as the ledger the holding sits in (Perp, Spot, Staked). */
 tag?:string;
 /** When the value is unknown but the balance is known: `units` (the default) headlines the units; `dash` shows the unknown dash over the units, for a value that is still loading. */
 unknownValue?:'units'|'dash';
}
/** Row order after the pinned asset: `value` (largest first, the default) or `given` (the order the host passed). */
export type AccountOrder='value'|'given';
/** How `accountRows` picks and orders: `order` after the pinned asset, and `pinnedId`, an asset id pinned in place of the symbol match. */
export interface AccountRowsOptions {order?:AccountOrder;pinnedId?:string}
/** A titled group of holdings with its own total, such as one ledger of the account. */
export interface AccountSection {
 id:string;
 /** Heading over the group. */
 title:string;
 /** The group's total in dollars, on the trailing edge of its heading. Defaults to the sum of its asset values; `null` reads as unknown. */
 total?:number|null;
 assets:readonly AccountAsset[];
 /** Row order in this group; defaults to the block's `order`. */
 order?:AccountOrder;
 /** Id of the asset that leads this group; defaults to the block's `pinnedId`, then the `pinnedSymbol` match. */
 pinnedId?:string;
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
 /** Pins the header to the top of the nearest scroller: transparent at rest, filled once content scrolls under it, and still when it starts to stick. See Pinned headers. */
 stickyHeader?:boolean;
 /** `id` of the header's heading, so a host dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
 /** Total in dollars. Defaults to the sum of the asset values (with `sections`, the sum of the totals of the sections that are drawn, which is unknown when any of those totals is); `null` reads as unknown. */
 balance?:number|null;
 /** Every holding as one list: the pinned asset, then the rest by value. Ignored when `sections` is set. */
 assets?:readonly AccountAsset[];
 /** Titled groups, each with its own total, drawn in the order given in place of the flat `assets` list. */
 sections?:readonly AccountSection[];
 /** Symbol of the asset that is always first. Defaults to `USDC`. */
 pinnedSymbol?:string;
 /** Id of the asset that is always first, in place of the `pinnedSymbol` match, for a holding whose symbol is not unique. */
 pinnedId?:string;
 /** Order of the rows after the pinned one: `value` (largest first, the default) or `given` (the order passed). */
 order?:AccountOrder;
 /** Shows the deposit action beside the total. */
 onDeposit?:()=>void;
 /** Text of the deposit action. Defaults to the built-in “Deposit”. */
 depositLabel?:string;
 /** Makes each row a button that reports its asset, and with `sections` the section it is in. */
 onAssetSelect?:(asset:AccountAsset,section?:AccountSection)=>void;
}
const usdCoin='USD Coin',usd={style:'currency',currency:'USD'} as const;
/** Dollar value of a holding: its `value`, or `balance × price` when both are known. */
export const assetValue=(asset:AccountAsset):number|null=>{
 const explicit=asset.value;
 const value=explicit!==undefined?explicit:asset.balance!=null&&asset.price!=null?asset.balance*asset.price:null;
 return value!=null&&Number.isFinite(value)?value:null;
};
/** The account's rows in display order: the pinned asset (the one with `options.pinnedId`, else the first with `pinnedSymbol`, else a zero placeholder), then every other asset by dollar value, largest first, unknown values last and ties by name, or with `options.order` `given` in the order passed. */
export function accountRows(assets:readonly AccountAsset[],pinnedSymbol='USDC',options:AccountRowsOptions={}):{pinned:AccountAsset;rest:AccountAsset[]}{
 const byId=options.pinnedId===undefined?-1:assets.findIndex(asset=>asset.id===options.pinnedId);
 const wanted=pinnedSymbol.toUpperCase();
 const index=byId>=0?byId:assets.findIndex(asset=>asset.symbol.toUpperCase()===wanted);
 const pinned=index>=0?assets[index]:{id:pinnedSymbol,name:pinnedSymbol==='USDC'?usdCoin:pinnedSymbol,symbol:pinnedSymbol,balance:0,value:0};
 const others=assets.filter((_,position)=>position!==index);
 if(options.order==='given'||others.length<2)return {pinned,rest:others};
 const keys=new Float64Array(others.length);
 let descending=true,uniform=true;
 for(let i=0;i<others.length;i++){
  keys[i]=assetValue(others[i])??-Infinity;
  if(i>0){
   if(keys[i]>=keys[i-1])descending=false;
   if(keys[i]!==keys[0])uniform=false;
  }
 }
 if(descending)return {pinned,rest:others};
 const byName=(a:AccountAsset,b:AccountAsset)=>a.name.localeCompare(b.name);
 if(uniform)return {pinned,rest:others.sort(byName)};
 const groups=new Map<number,AccountAsset[]>();
 for(let i=0;i<others.length;i++){
  const group=groups.get(keys[i]);
  if(group)group.push(others[i]);
  else groups.set(keys[i],[others[i]]);
 }
 const values=Float64Array.from(groups.keys()).sort();
 const rest:AccountAsset[]=[];
 for(let i=values.length-1;i>=0;i--){
  const group=groups.get(values[i])!;
  if(group.length>1)group.sort(byName);
  for(const asset of group)rest.push(asset);
 }
 return {pinned,rest};
}
const sum=(assets:readonly AccountAsset[]):number|null=>{let total=0;for(const asset of assets){const value=assetValue(asset);if(value==null||!Number.isFinite(value))return null;total+=value;}return Number.isFinite(total)?total:null;};
/** A section's total: its own `total`, or the sum of its asset values. */
export const accountSectionTotal=(section:AccountSection):number|null=>section.total!==undefined?(section.total!=null&&Number.isFinite(section.total)?section.total:null):sum(section.assets);
/** The block total for `sections`: the sum of the section totals, or unknown (`null`) when any of them is unknown. Pass only the sections that are drawn. */
const accountSectionsTotal=(sections:readonly AccountSection[],readTotal:typeof accountSectionTotal):number|null=>{let all=0;for(const section of sections){const total=readTotal(section);if(total===null)return null;all+=total;}return Number.isFinite(all)?all:null;};
/** A section's rows in display order: the pinned asset first when the section holds it (no placeholder), then the rest by dollar value as in `accountRows`. */
export function accountSectionRows(assets:readonly AccountAsset[],pinnedSymbol='USDC',options:AccountRowsOptions={}):{pinned:AccountAsset|null;rest:AccountAsset[]}{
 const {pinned,rest}=accountRows(assets,pinnedSymbol,options);return {pinned:assets.includes(pinned)?pinned:null,rest};
}
/** An account at a glance: a header, the total with a deposit action, the pinned dollar balance, then every other holding by value. */
const isSelectable=(asset:AccountAsset)=>asset.selectable!==false;
type SelectHolding=((asset:AccountAsset,sectionId?:string)=>void)|undefined;
function renderHoldings(pinned:AccountAsset|null,others:AccountAsset[],pinId:string|undefined,onAssetSelect:SelectHolding,windowed:boolean,first:number,sectionId?:string){
  const renderRow=(asset:AccountAsset)=>{
   const pin=asset===pinned;
   // A row pinned by symbol is the dollar balance, so its units would repeat its value; a row pinned by id keeps its own units setting.
   const value=assetValue(asset),units=(!pin||asset.id===pinId)&&asset.units!==false;
   const select=onAssetSelect&&asset.selectable!==false?()=>onAssetSelect(asset,sectionId):undefined;
   return <li key={asset.id} data-pinned={pin||undefined}><AssetBalanceRow name={asset.name} symbol={asset.symbol} icon={asset.icon} value={value} balance={units?asset.balance??null:undefined} balanceOptions={asset.unitsOptions} unitsSuffix={asset.unitsSuffix} tag={asset.tag} headline={units&&value===null&&asset.balance!=null&&asset.unknownValue!=='dash'?'units':undefined} onSelect={select}/></li>;
  };
 const items=pinned?[pinned,...others]:others;
 return windowed?<RowWindow items={items} first={first} itemKey='id' className='hig-account-assets' rowHeight={60} gap={8} tabThrough={onAssetSelect?isSelectable:false} renderRow={renderRow}/>:
  <ul className='hig-account-assets'>{items.map(renderRow)}</ul>;
}

const WalletHoldings=React.memo(function WalletHoldings({section,total,heading,pinnedSymbol,pinId,order,onAssetSelect,windowed,first}:{
 section:AccountSection;total:number|null;heading:string;pinnedSymbol:string;pinId?:string;order?:AccountOrder;
 onAssetSelect:SelectHolding;windowed:boolean;first:number;
}){
 const {assets}=section;
 const sectionId=section.id;
 const ordered=React.useMemo(()=>windowed?null:accountSectionRows(assets,pinnedSymbol,{order,pinnedId:pinId}),[windowed,assets,pinnedSymbol,order,pinId]);
 const holdings=React.useMemo(()=>ordered?renderHoldings(ordered.pinned,ordered.rest,pinId,onAssetSelect,false,first,sectionId):
  <LargeWalletHoldings assets={assets} pinnedSymbol={pinnedSymbol} pinnedId={pinId} order={order} onAssetSelect={onAssetSelect} sectionId={sectionId} first={first}/>,
  [ordered,assets,pinnedSymbol,pinId,order,onAssetSelect,first,sectionId]);
 return <section className='hig-account-section' aria-labelledby={heading}>
  <div className='hig-account-section-header'><h3 id={heading}>{section.title}</h3><span className='hig-account-section-total'><AnimatedNumberReadout value={total} options={usd}/></span></div>
  {holdings}
 </section>;
});
const subscribeToHydration=()=>()=>{};
const clientRender=()=>false,serverRender=()=>true;
function LargeWalletHoldings({assets,pinnedSymbol,pinnedId,order,onAssetSelect,sectionId,first=0}:{
 assets:readonly AccountAsset[];pinnedSymbol:string;pinnedId?:string;order?:AccountOrder;onAssetSelect:SelectHolding;sectionId?:string;first?:number;
}){
 const hydrating=React.useSyncExternalStore(subscribeToHydration,clientRender,serverRender);
 const [released,setReleased]=React.useState(hydrating||sectionId===undefined);
 React.useEffect(()=>{
  if(released)return;
  if(first<initialWindowRows){
   const task=window.setTimeout(()=>setReleased(true),0);
   return ()=>window.clearTimeout(task);
  }
  // Give the initial window a paint before sorting ledgers below it.
  let frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>setReleased(true));});
  return ()=>cancelAnimationFrame(frame);
 },[first,released]);
 const deferred=React.useDeferredValue(released,hydrating);
 const ready=sectionId===undefined?deferred:released;
 return React.useMemo(()=>{
  if(!ready){
   const wanted=pinnedSymbol.toUpperCase();
   const hasPinned=sectionId!==undefined||assets.some(asset=>(pinnedId!==undefined&&asset.id===pinnedId)||asset.symbol.toUpperCase()===wanted);
   const count=assets.length+(hasPinned?0:1);
   return <div aria-hidden="true" style={{height:count*68-8}}/>;
  }
  const rowsFor=sectionId===undefined?accountRows:accountSectionRows;
  const {pinned,rest}=rowsFor(assets,pinnedSymbol,{order,pinnedId});
  return renderHoldings(pinned,rest,pinnedId,onAssetSelect,true,first,sectionId);
 },[ready,assets,pinnedSymbol,pinnedId,order,onAssetSelect,first,sectionId]);
}
const noAssets:readonly AccountAsset[]=[];
export function AccountBlock({title,onBack,onShowAddress,headerAction,balance,assets=noAssets,sections,pinnedSymbol='USDC',pinnedId,order,onDeposit,depositLabel,onAssetSelect:hostSelect,stickyHeader,headingId,className,...rest}:AccountBlockProps){
 const {messages}=useHIG();const id=useId();
 const selection=React.useRef({hostSelect,sections});
 React.useLayoutEffect(()=>{selection.current={hostSelect,sections};},[hostSelect,sections]);
 const select=React.useCallback((asset:AccountAsset,sectionId?:string)=>{
  const current=selection.current;
  if(sectionId===undefined)current.hostSelect?.(asset);
  else{
   const section=current.sections?.find(wallet=>wallet.id===sectionId);
   if(section)current.hostSelect?.(asset,section);
  }
 },[]);
 const onAssetSelect=hostSelect?select:undefined;
 const shown=React.useMemo(()=>sections?.filter(section=>section.assets.length>0),[sections]);
 // The summary and section headings use the same valuation for this holdings update.
 const holdingsTotal=React.useMemo(()=>{
  const totals=new WeakMap<readonly AccountAsset[],number|null>();
  return (holdings:readonly AccountAsset[])=>{
   const cached=totals.get(holdings);
   if(cached!==undefined)return cached;
   const value=sum(holdings);
   totals.set(holdings,value);
   return value;
  };
 },[]);
 const readTotal=React.useCallback((section:AccountSection)=>section.total===undefined?holdingsTotal(section.assets):accountSectionTotal(section),[holdingsTotal]);
 const total=React.useMemo(()=>balance!==undefined?balance:shown?accountSectionsTotal(shown,readTotal):holdingsTotal(assets),[balance,shown,assets,readTotal,holdingsTotal]);
 const list=React.useMemo(()=>{
  if(shown){
   const windowed=shown.reduce((count,section)=>count+section.assets.length,0)>50;
   let first=0;
   return <div className='hig-account-sections'>{shown.map((section,index)=>{
    const offset=first;
    first+=section.assets.length;
    return <WalletHoldings key={section.id} section={section} total={readTotal(section)} heading={`${id}-section-${index}`}
     pinnedSymbol={pinnedSymbol} pinId={section.pinnedId??pinnedId} order={section.order??order}
     onAssetSelect={onAssetSelect} first={offset} windowed={windowed}/>;
   })}</div>;
  }
  if(assets.length>50)return <LargeWalletHoldings assets={assets} pinnedSymbol={pinnedSymbol} pinnedId={pinnedId} order={order} onAssetSelect={onAssetSelect}/>;
  const {pinned,rest:others}=accountRows(assets,pinnedSymbol,{order,pinnedId});
  return renderHoldings(pinned,others,pinnedId,onAssetSelect,others.length+1>50,0);
 },[assets,shown,pinnedSymbol,pinnedId,order,onAssetSelect,id,readTotal]);
 return <section {...rest} className={`hig-account-block${className?` ${className}`:''}`}>
  <ScreenHeader title={title??messages.account??en.account} onBack={onBack} headingId={headingId} stickyHeader={stickyHeader} action={headerAction??(onShowAddress&&<button type='button' className='hig-swap-back hig-account-address' aria-label={messages.showAddress??en.showAddress} onClick={onShowAddress}>{qrIcon}<PressDecoration kind='back'/></button>)}/>
  <div className='hig-account-summary'>
   <div className='hig-account-balance'><AnimatedNumberReadout value={total} label={messages.accountBalance??en.accountBalance} options={usd}/></div>
   {onDeposit&&<Button onClick={onDeposit}>{depositLabel??messages.deposit??en.deposit}</Button>}
  </div>
  {list}
 </section>;
}
