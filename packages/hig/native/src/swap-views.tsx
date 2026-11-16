import React,{useState} from 'react';
import {Pressable,View} from 'react-native';
import {formatNumber} from './number-format.js';
import {useColors,useFills,useHIG,useMessages,useNumberLocale,usePresentNumber} from './provider.js';
import {Text} from './surface.js';
import {Field,Input} from './field.js';
import {SegmentedControl} from './radio-group.js';
import {ChevronIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {SwapSubview} from './swap-parts.js';
import {FromPickerBlock,ToPickerBlock} from './pickers.js';
import {formatPercent,shortAddress,slippagePresets,type SwapChain,type SwapDenomination,type SwapFee,type SwapToken,type SwapWallet} from './swap-shared.js';
export interface SwapPickerProps {
 side:'from'|'to';onBack:()=>void;
 tokens:readonly SwapToken[];chains:readonly SwapChain[];hotTokenIds?:readonly string[];
 selected:SwapToken|null;onSelect:(token:SwapToken)=>void;loading?:boolean;
 wallet?:SwapWallet;onConnect?:()=>void;onDisconnect?:()=>void;
 /** From side, before a wallet is connected: the Generate address switch, which puts the panel in its receive view. */
 receiving?:boolean;onReceivingChange?:(receiving:boolean)=>void;
 /** To side: where the assets are sent. Omit `onRecipientChange` to hide the field. */
 recipient?:string;onRecipientChange?:(address:string)=>void;onScanRecipient?:()=>void;
}
/** The panel's pushed picker view: the sub-view header over the From or To picker block. Choosing a token pops back; the Generate address switch does not. */
export function SwapPicker({side,onBack,selected,onSelect,wallet,onConnect,onDisconnect,receiving,onReceivingChange,recipient,onRecipientChange,onScanRecipient,...list}:SwapPickerProps){
 const t=useMessages();const choose=(token:SwapToken)=>{onSelect(token);onBack();};
 return <SwapSubview title={side==='from'?t.swapFrom:t.swapTo} onBack={onBack} testID={`swap-picker-${side}`}>
  {side==='from'
   ?<FromPickerBlock {...list} selected={selected} onSelect={choose} wallet={wallet??{connected:false}} onConnect={onConnect} onDisconnect={onDisconnect} generateAddress={!!receiving} onGenerateAddressChange={onReceivingChange}/>
   :<ToPickerBlock {...list} selected={selected} onSelect={choose} address={recipient} onAddressChange={onRecipientChange} addressPlaceholder={wallet?.address?shortAddress(wallet.address):undefined} onScan={onScanRecipient}/>}
 </SwapSubview>;
}
export type SwapSettingsView='settings'|'slippage'|'fees';
export interface SwapSettingsProps {
 view:SwapSettingsView;onViewChange:(view:SwapSettingsView)=>void;onBack:()=>void;
 denomination:SwapDenomination;/** Omit to hide the denomination setting. */onDenominationChange?:(denomination:SwapDenomination)=>void;
 slippage:number;onSlippageChange?:(slippage:number)=>void;
 fee?:number|null;fees?:readonly SwapFee[];quoteLoading?:boolean;
 /** Host rows shown under the built-in settings, such as language or theme. */
 children?:React.ReactNode;
}
/** The settings views. Slippage and the fee breakdown push from the settings list, and Back returns to it. */
export function SwapSettings({view,onViewChange,onBack,denomination,onDenominationChange,slippage,onSlippageChange,fee,fees,quoteLoading,children}:SwapSettingsProps){
 const {direction}=useHIG();const locale=useNumberLocale();const colors=useColors();const fills=useFills();const t=useMessages();const present=usePresentNumber();
 const usd=(value:number)=>formatNumber(value,locale,present({style:'currency',currency:'USD'}));
 const [custom,setCustom]=useState<string|null>(null);
 const title=view==='slippage'?t.swapSlippageTitle:view==='fees'?t.swapFees:t.swapSettings;
 const feeText=quoteLoading?'…':fee!=null?usd(fee):'—';
 const preset=slippagePresets.find(value=>Math.abs(value-slippage)<1e-9);
 const usdOptions={style:'currency',currency:'USD'} as const,feeKnown=!quoteLoading&&fee!=null;
 // `value` is the accessible reading; `live` is the same value drawn as a number that updates in place.
 const row=(name:string,value:string,target:SwapSettingsView,live?:React.ReactNode)=><Pressable accessibilityRole='button' accessibilityLabel={`${name}: ${value}`} testID={`swap-setting-${target}`} onPress={()=>onViewChange(target)} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:48,paddingVertical:8,paddingHorizontal:16,borderRadius:9999,backgroundColor:pressed?fills.raised:fills.well})}>
  <Text style={{fontWeight:'600'}}>{name}</Text><View style={{flexDirection:'row',alignItems:'center',gap:6}}>{live??<Text style={{color:colors.muted}}>{value}</Text>}<View style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View></View>
 </Pressable>;
 const feeRow=(name:string,amount:number|null,total?:boolean)=><View key={name} style={{flexDirection:'row',justifyContent:'space-between',gap:12,paddingTop:total?12:0}}><Text style={{color:total?colors.text:colors.muted,fontWeight:total?'600':'400'}}>{name}</Text>{amount!=null?<AnimatedNumberReadout testID={total?'swap-fee-total':undefined} value={amount} options={usdOptions} style={{fontWeight:total?'600':'400'}}/>:<Text testID={total?'swap-fee-total':undefined} style={{fontWeight:total?'600':'400'}}>{feeText}</Text>}</View>;
 const slippageRow=onSlippageChange?row(t.swapSlippageTitle,formatPercent(slippage),'slippage',<AnimatedNumberReadout value={slippage*100} formattedValue={formatPercent(slippage).slice(0,-1)} suffix='%' tone='muted'/>):null,feesRow=row(t.swapFees,feeText,'fees',feeKnown?<AnimatedNumberReadout value={fee} options={usdOptions} tone='muted'/>:undefined);
 return <SwapSubview title={title} onBack={onBack} testID={`swap-view-${view}`}>
  {view==='settings'?<View style={{gap:12}}>
   {onDenominationChange&&<SegmentedControl label={t.swapDenomination} options={[{value:'usd',label:t.swapDollars},{value:'token',label:t.swapUnits}]} value={denomination} onValueChange={value=>onDenominationChange(value as SwapDenomination)}/>}
   {slippageRow}
   {feesRow}
   {children}
  </View>:null}
  {view==='slippage'&&onSlippageChange?<View style={{gap:12}}>
   <SegmentedControl label={t.swapSlippageTitle} options={slippagePresets.map(value=>({value:String(value),label:formatPercent(value)}))} value={preset===undefined?'':String(preset)} onValueChange={value=>{setCustom(null);onSlippageChange(Number(value));}}/>
   <Field label={t.swapSlippageCustom}><Input keyboardType='decimal-pad' value={custom??String(Number((slippage*100).toFixed(4)))} onChangeText={entered=>{const raw=entered.replace(/[^0-9.]/g,'');setCustom(raw);const percent=Number.parseFloat(raw);if(Number.isFinite(percent)&&percent>=0&&percent<=50)onSlippageChange(percent/100);}}/></Field>
  </View>:null}
  {view==='fees'?<View style={{gap:12}}>{fees?.map(item=>feeRow(item.label,item.usd))}{feeRow(t.swapFeeTotal,feeKnown?fee:null,true)}</View>:null}
 </SwapSubview>;
}
