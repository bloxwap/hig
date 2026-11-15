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
}
export interface AccountCardProps {
 /** Defaults to the localized "Account". */
 title?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** Shows a QR button on the trailing edge of the header, above the deposit action. The host shows the account address, for example with WalletAddress. */
 onShowAddress?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. Replaces the QR button. */
 headerAction?:React.ReactNode;
 /** Total in dollars; defaults to the sum of the asset values. `null` shows it as unknown. */
 balance?:number|null;
 assets:readonly AccountAsset[];
 /** Symbol of the asset pinned first; default 'USDC'. */
 pinnedSymbol?:string;
 /** Shows the deposit action beside the total. */
 onDeposit?:()=>void;
 depositLabel?:string;
 /** Makes each row a button. */
 onAssetSelect?:(asset:AccountAsset)=>void;
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
/** The account as one screen: a header, the total with the deposit action, the pinned asset, then every other holding by value. */
export function AccountCard({title,onBack,onShowAddress,headerAction,balance,assets,pinnedSymbol=usdc,onDeposit,depositLabel,onAssetSelect,testID}:AccountCardProps){
 const colors=useColors(),t=useMessages(),{direction}=useHIG();
 const {pinned,rest}=accountRows(assets,pinnedSymbol);
 const total=balance!==undefined?balance:assets.reduce((sum,asset)=>sum+(assetValue(asset)??0),0);
 const select=(asset:AccountAsset)=>onAssetSelect?()=>onAssetSelect(asset):undefined;
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
  <View testID='account-assets' style={{gap:8,marginTop:16}}>
   <AssetBalanceRow key={pinned.id} testID={`account-asset-${pinned.id}`} name={pinned.name} symbol={pinned.symbol} icon={pinned.icon} value={assetValue(pinned)} onSelect={select(pinned)}/>
   {rest.map(asset=><AssetBalanceRow key={asset.id} testID={`account-asset-${asset.id}`} name={asset.name} symbol={asset.symbol} icon={asset.icon} value={assetValue(asset)} balance={asset.balance??null} onSelect={select(asset)}/>)}
  </View>
 </View>;
}
