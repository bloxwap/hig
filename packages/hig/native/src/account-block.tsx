import React from 'react';
import {View} from 'react-native';
import {useColors,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {ChevronIcon,QrIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {AssetBalanceRow,type AssetArtwork} from './asset-balance-row.js';
export {AssetBalanceRow,type AssetArtwork,type AssetBalanceRowProps} from './asset-balance-row.js';
/** One holding in the account. The host supplies every value; HIG sorts, formats and lays it out. */
export interface AccountAsset {
 id:string;name:string;symbol:string;icon?:AssetArtwork;
 /** Holding in token units. */
 balance?:number|null;
 /** USD per unit. */
 price?:number|null;
 /** USD value; defaults to balance × price. */
 value?:number|null;
 /** Set false to draw no units line, for a holding whose units are the same figure as its value. */
 units?:boolean;
 /** Set false to draw this row plain even when the block has `onAssetSelect`. */
 selectable?:boolean;
 /** Format of the units figure; default `{maximumFractionDigits:6}`. */
 unitsOptions?:Intl.NumberFormatOptions;
}
/** A titled group of holdings with its own total, such as one ledger of the account. */
export interface AccountSection {
 id:string;
 /** Heading over the group. */
 title:string;
 /** The group's total in dollars, on the trailing edge of its heading; defaults to the sum of its asset values. `null` shows it as unknown. */
 total?:number|null;
 assets:readonly AccountAsset[];
}
export interface AccountBlockProps {
 /** Defaults to the localized "Account". */
 title?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** Shows a QR button on the trailing edge of the header, above the deposit action. The host shows the account address, for example with WalletAddress. */
 onShowAddress?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. Replaces the QR button. */
 headerAction?:React.ReactNode;
 /** Total in dollars; defaults to the sum of the asset values (with `sections`, the sum of the totals of the sections that are drawn, which is unknown when any of those totals is). `null` shows it as unknown. */
 balance?:number|null;
 /** Every holding as one list: the pinned asset, then the rest by value. Ignored when `sections` is set. */
 assets?:readonly AccountAsset[];
 /** Titled groups, each with its own total, drawn in the order given in place of the flat `assets` list. */
 sections?:readonly AccountSection[];
 /** Symbol of the asset pinned first; default 'USDC'. */
 pinnedSymbol?:string;
 /** Shows the deposit action beside the total. */
 onDeposit?:()=>void;
 depositLabel?:string;
 /** Makes each row a button that reports its asset, and with `sections` the section it is in. */
 onAssetSelect?:(asset:AccountAsset,section?:AccountSection)=>void;
 testID?:string;
}
const usdc='USDC',usdCoin='USD Coin';
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
/** An asset's dollar value: its own `value`, else balance × price, else unknown. */
export const assetValue=(asset:AccountAsset):number|null=>asset.value!==undefined?asset.value:asset.balance!=null&&asset.price!=null?asset.balance*asset.price:null;
/** The pinned asset (a zero placeholder when the account does not hold it) and the rest by dollar value, largest first, unknown values last, ties by name. */
export function accountRows(assets:readonly AccountAsset[],pinnedSymbol:string=usdc):{pinned:AccountAsset;rest:AccountAsset[]}{
 const wanted=pinnedSymbol.toLowerCase(),found=assets.find(asset=>asset.symbol.toLowerCase()===wanted);
 const pinned=found??{id:pinnedSymbol,name:pinnedSymbol===usdc?usdCoin:pinnedSymbol,symbol:pinnedSymbol,balance:0,value:0};
 const rest=assets.filter(asset=>asset!==found).sort((a,b)=>{const x=assetValue(a),y=assetValue(b);return x===y?a.name.localeCompare(b.name):x===null?1:y===null?-1:y-x||a.name.localeCompare(b.name);});
 return {pinned,rest};
}
const sum=(assets:readonly AccountAsset[])=>assets.reduce((total,asset)=>total+(assetValue(asset)??0),0);
/** A section's total: its own `total`, or the sum of its asset values. */
export const accountSectionTotal=(section:AccountSection):number|null=>section.total!==undefined?section.total:sum(section.assets);
/** The block total for `sections`: the sum of the section totals, or unknown (`null`) when any of them is unknown. Pass only the sections that are drawn. */
const accountSectionsTotal=(sections:readonly AccountSection[]):number|null=>{let all=0;for(const section of sections){const total=accountSectionTotal(section);if(total===null)return null;all+=total;}return all;};
/** A section's rows in display order: the pinned asset first when the section holds it (no placeholder), then the rest by value as in `accountRows`. */
export function accountSectionRows(assets:readonly AccountAsset[],pinnedSymbol:string=usdc):{pinned:AccountAsset|null;rest:AccountAsset[]}{
 const {pinned,rest}=accountRows(assets,pinnedSymbol);return {pinned:assets.includes(pinned)?pinned:null,rest};
}
/** The account as one screen: a header, the total with the deposit action, the pinned asset, then every other holding by value. */
export function AccountBlock({title,onBack,onShowAddress,headerAction,balance,assets=[],sections,pinnedSymbol=usdc,onDeposit,depositLabel,onAssetSelect,testID}:AccountBlockProps){
 const colors=useColors(),t=useMessages(),{direction}=useHIG();
 const shown=sections?.filter(section=>section.assets.length>0);
 const total=balance!==undefined?balance:shown?accountSectionsTotal(shown):sum(assets);
 const row=(asset:AccountAsset,pin:boolean,section?:AccountSection,prefix='account-asset')=>{
  const value=assetValue(asset),units=!pin&&asset.units!==false;
  const select=onAssetSelect&&asset.selectable!==false?(section?()=>onAssetSelect(asset,section):()=>onAssetSelect(asset)):undefined;
  return <AssetBalanceRow key={asset.id} testID={`${prefix}-${asset.id}`} name={asset.name} symbol={asset.symbol} icon={asset.icon} value={value} balance={units?asset.balance??null:undefined} balanceOptions={asset.unitsOptions} headline={units&&value===null&&asset.balance!=null?'units':undefined} onSelect={select}/>;
 };
 let list:React.ReactNode;
 if(shown)list=<View testID='account-sections' style={{gap:24,marginTop:16}}>{shown.map(section=>{
  const {pinned,rest}=accountSectionRows(section.assets,pinnedSymbol),prefix=`account-section-${section.id}`,rowPrefix=`${prefix}-asset`;
  return <View key={section.id} testID={prefix} style={{gap:8}}>
   <View testID={`${prefix}-header`} style={{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12,paddingHorizontal:4}}>
    <Text accessibilityRole='header' testID={`${prefix}-title`} style={{flexShrink:1,color:colors.muted,fontSize:14,lineHeight:20,fontWeight:'500'}}>{section.title}</Text>
    <AnimatedNumberReadout value={accountSectionTotal(section)} options={usd} tone='muted' testID={`${prefix}-total`} style={{fontSize:14,lineHeight:20,fontWeight:'500'}}/>
   </View>
   <View testID={`${prefix}-assets`} style={{gap:8}}>{pinned?row(pinned,true,section,rowPrefix):null}{rest.map(asset=>row(asset,false,section,rowPrefix))}</View>
  </View>;
 })}</View>;
 else{const {pinned,rest}=accountRows(assets,pinnedSymbol);list=<View testID='account-assets' style={{gap:8,marginTop:16}}>{row(pinned,true)}{rest.map(asset=>row(asset,false))}</View>;}
 return <View testID={testID} style={{padding:16}}>
  <View testID='account-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='account-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID='account-title' accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{title??t.account}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction??(onShowAddress?<IconButton intent='ghost' label={t.showAddress} testID='account-address' onPress={onShowAddress}><QrIcon color={colors.text}/></IconButton>:null)}</View>
  </View>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginTop:8}}>
   <View style={{flexShrink:1}}><AnimatedNumberReadout value={total} options={usd} label={t.accountBalance} testID='account-balance' style={{fontSize:32,lineHeight:40,fontWeight:'600'}}/></View>
   {onDeposit?<Button testID='account-deposit' onPress={onDeposit}>{depositLabel??t.deposit}</Button>:null}
  </View>
  {list}
 </View>;
}
