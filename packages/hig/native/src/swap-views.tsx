import React,{useMemo,useState} from 'react';
import {FlatList,Pressable,View,useWindowDimensions,type FlatListProps} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {Field,Input,SearchInput} from './field.js';
import {Filter,SegmentedControl} from './radio-group.js';
import {ChevronIcon} from './icons.js';
import {LeaveIcon,ScanIcon,SwapSubview,TokenIcon} from './swap-parts.js';
import {addressColor,formatPercent,pickerRows,shortAddress,slippagePresets,type SwapChain,type SwapDenomination,type SwapFee,type SwapToken,type SwapWallet} from './swap-shared.js';
export interface SwapPickerProps {
 side:'from'|'to';onBack:()=>void;
 tokens:readonly SwapToken[];chains:readonly SwapChain[];hotTokenIds?:readonly string[];
 selected:SwapToken|null;onSelect:(token:SwapToken)=>void;loading?:boolean;
 wallet?:SwapWallet;onConnect?:()=>void;onDisconnect?:()=>void;
 /** From side, before a wallet is connected: switch the panel to its receive view. */
 receiving?:boolean;onReceivingChange?:(receiving:boolean)=>void;
 /** To side: where the assets are sent. Omit `onRecipientChange` to hide the field. */
 recipient?:string;onRecipientChange?:(address:string)=>void;onScanRecipient?:()=>void;
 /** The scrolling list implementation; a sheet host passes its backend's list so drags hand off to the sheet. */
 listComponent?:React.ComponentType<FlatListProps<SwapToken>>;
}
/** The token picker as a pushed view: wallet or recipient row, search, chain filter and the token list. Choosing a token pops back. */
export function SwapPicker({side,onBack,tokens,chains,hotTokenIds,selected,onSelect,loading,wallet,onConnect,onDisconnect,receiving,onReceivingChange,recipient,onRecipientChange,onScanRecipient,listComponent}:SwapPickerProps){
 const {locale,direction}=useHIG();const colors=useColors();const fills=useFills();const t=useMessages();const window=useWindowDimensions();
 const [query,setQuery]=useState('');const [chain,pickChain]=useState('');
 // The filter speaks in strings; an empty value is every chain.
 const chainId=chain===''?null:chains.find(item=>String(item.chainId)===chain)?.chainId??null;
 const title=side==='from'?t.swapFrom:t.swapTo;const List=listComponent??FlatList;
 const {rows,hotCount}=useMemo(()=>pickerRows(tokens,query,chainId,hotTokenIds),[tokens,hotTokenIds,query,chainId]);
 const choose=(token:SwapToken)=>{onSelect(token);onBack();};
 const section=(heading:string)=><Text accessibilityRole='header' style={{paddingHorizontal:8,paddingTop:12,paddingBottom:6,fontSize:12,lineHeight:18,fontWeight:'600',letterSpacing:1,textTransform:'uppercase',color:colors.muted}}>{heading}</Text>;
 const chainOptions=useMemo(()=>[{value:'',label:t.swapAllChains},...chains.map(chain=>({value:String(chain.chainId),label:chain.name,icon:chain.icon}))],[chains,t.swapAllChains]);
 const empty=<Text accessibilityLiveRegion='polite' style={{paddingVertical:32,textAlign:'center',fontSize:14,lineHeight:21,color:colors.muted}}>{loading?`${t.loading}…`:t.swapNoTokens}</Text>;
 return <SwapSubview title={title} onBack={onBack} testID={`swap-picker-${side}`}>
  {side==='from'&&wallet?(wallet.connected?
   <View style={{flexDirection:'row',alignItems:'stretch',gap:8}}>
    <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:12,minHeight:48,paddingVertical:8,paddingHorizontal:16,borderRadius:9999,backgroundColor:fills.well}}><View style={{width:28,height:28,borderRadius:14,backgroundColor:addressColor(wallet.address??'')}}/><Text numberOfLines={1} style={{flex:1,fontWeight:'600'}}>{wallet.address?shortAddress(wallet.address):''}</Text></View>
    {onDisconnect?<IconButton intent='secondary' label={t.swapDisconnect} onPress={onDisconnect} style={{minWidth:48,minHeight:48}}><LeaveIcon color={colors.text}/></IconButton>:null}
   </View>:
   <View style={{gap:8}}>
    {onConnect?<Button fullWidth onPress={onConnect} style={{minHeight:48}}>{t.swapConnectWallet}</Button>:null}
    {onReceivingChange?<Button fullWidth intent='secondary' accessibilityState={{selected:!!receiving}} onPress={()=>{onReceivingChange(!receiving);onBack();}} style={{minHeight:48}}>{t.swapReceiveToAddress}</Button>:null}
   </View>):null}
  {side==='to'&&onRecipientChange?<View style={{flexDirection:'row',alignItems:'center',gap:8}}>
   <View style={{flex:1}}><Input accessibilityLabel={t.swapRecipient} placeholder={wallet?.address?shortAddress(wallet.address):t.swapRecipient} value={recipient??''} onChangeText={onRecipientChange} autoCapitalize='none' autoCorrect={false} autoComplete='off' spellCheck={false}/></View>
   {onScanRecipient?<IconButton intent='secondary' label={t.swapScan} onPress={onScanRecipient} style={{minWidth:48,minHeight:48}}><ScanIcon color={colors.text}/></IconButton>:null}
  </View>:null}
  <SearchInput accessibilityLabel={t.swapSearchTokens} placeholder={t.swapSearchTokens} value={query} onChangeText={setQuery} autoCapitalize='none' autoCorrect={false} autoComplete='off' spellCheck={false}/>
  {chains.length>1?<Filter label={t.swapChains} options={chainOptions} value={chain} onValueChange={pickChain}/>:null}
  {/* A bounded height so the list scrolls inside the panel (and inside a sheet) instead of stretching it. */}
  <List style={{height:Math.max(240,Math.round(window.height*0.5))}} data={rows} keyExtractor={token=>token.id} keyboardShouldPersistTaps='handled' accessibilityLabel={title} testID={`swap-list-${side}`} initialNumToRender={12} ListEmptyComponent={empty}
   renderItem={({item:token,index})=>{const isSelected=selected?.id===token.id,balance=token.balance??0,price=token.price??0;return <View>
    {hotCount>0&&index===0?section(t.swapHot):null}{hotCount>0&&index===hotCount?section(t.swapAllTokens):null}
    <Pressable accessibilityRole='button' accessibilityState={{selected:isSelected}} testID={`swap-token-${token.id}`} onPress={()=>choose(token)} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',gap:12,marginBottom:4,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:9999,backgroundColor:pressed?fills.well:'transparent',opacity:isSelected?0.5:1})}>
     <TokenIcon token={token}/>
     <View style={{flex:1,minWidth:0}}><Text style={{fontWeight:'600'}}>{token.name}</Text><Text style={{fontSize:14,lineHeight:21,color:colors.muted}}>{token.chain}{isSelected?` · ${t.swapSelected}`:''}</Text></View>
     {balance>0?<View style={{alignItems:'flex-end'}}><Text style={{fontWeight:'600'}}>{formatNumber(balance,locale,{maximumFractionDigits:6})}</Text>{price>0?<Text style={{fontSize:14,lineHeight:21,color:colors.muted}}>{formatNumber(balance*price,locale,{style:'currency',currency:'USD'})}</Text>:null}</View>:null}
    </Pressable>
   </View>;}}/>
 </SwapSubview>;
}
export type SwapSettingsView='settings'|'slippage'|'fees';
export interface SwapSettingsProps {
 view:SwapSettingsView;onViewChange:(view:SwapSettingsView)=>void;onBack:()=>void;
 denomination:SwapDenomination;onDenominationChange:(denomination:SwapDenomination)=>void;
 slippage:number;onSlippageChange?:(slippage:number)=>void;
 fee?:number|null;fees?:readonly SwapFee[];quoteLoading?:boolean;
 /** Host rows shown under the built-in settings, such as language or theme. */
 children?:React.ReactNode;
}
/** The settings views. Slippage and the fee breakdown push from the settings list, and Back returns to it. */
export function SwapSettings({view,onViewChange,onBack,denomination,onDenominationChange,slippage,onSlippageChange,fee,fees,quoteLoading,children}:SwapSettingsProps){
 const {locale,direction}=useHIG();const colors=useColors();const fills=useFills();const t=useMessages();
 const usd=(value:number)=>formatNumber(value,locale,{style:'currency',currency:'USD'});
 const [custom,setCustom]=useState<string|null>(null);
 const title=view==='slippage'?t.swapSlippageTitle:view==='fees'?t.swapFees:t.swapSettings;
 const feeText=quoteLoading?'…':fee!=null?usd(fee):'—';
 const preset=slippagePresets.find(value=>Math.abs(value-slippage)<1e-9);
 const row=(name:string,value:string,target:SwapSettingsView)=><Pressable accessibilityRole='button' accessibilityLabel={`${name}: ${value}`} testID={`swap-setting-${target}`} onPress={()=>onViewChange(target)} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:48,paddingVertical:8,paddingHorizontal:16,borderRadius:9999,backgroundColor:pressed?fills.raised:fills.well})}>
  <Text style={{fontWeight:'600'}}>{name}</Text><View style={{flexDirection:'row',alignItems:'center',gap:6}}><Text style={{color:colors.muted}}>{value}</Text><View style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View></View>
 </Pressable>;
 const feeRow=(name:string,value:string,total?:boolean)=><View key={name} style={{flexDirection:'row',justifyContent:'space-between',gap:12,paddingTop:total?12:0}}><Text style={{color:total?colors.text:colors.muted,fontWeight:total?'600':'400'}}>{name}</Text><Text style={{fontWeight:total?'600':'400'}}>{value}</Text></View>;
 const slippageRow=onSlippageChange?row(t.swapSlippageTitle,formatPercent(slippage),'slippage'):null,feesRow=row(t.swapFees,feeText,'fees');
 return <SwapSubview title={title} onBack={onBack} testID={`swap-view-${view}`}>
  {view==='settings'?<View style={{gap:12}}>
   <SegmentedControl label={t.swapDenomination} options={[{value:'usd',label:t.swapDollars},{value:'token',label:t.swapUnits}]} value={denomination} onValueChange={value=>onDenominationChange(value as SwapDenomination)}/>
   {slippageRow}
   {feesRow}
   {children}
  </View>:null}
  {view==='slippage'&&onSlippageChange?<View style={{gap:12}}>
   <SegmentedControl label={t.swapSlippageTitle} options={slippagePresets.map(value=>({value:String(value),label:formatPercent(value)}))} value={preset===undefined?'':String(preset)} onValueChange={value=>{setCustom(null);onSlippageChange(Number(value));}}/>
   <Field label={t.swapSlippageCustom}><Input keyboardType='decimal-pad' value={custom??String(Number((slippage*100).toFixed(4)))} onChangeText={entered=>{const raw=entered.replace(/[^0-9.]/g,'');setCustom(raw);const percent=Number.parseFloat(raw);if(Number.isFinite(percent)&&percent>=0&&percent<=50)onSlippageChange(percent/100);}}/></Field>
  </View>:null}
  {view==='fees'?<View style={{gap:12}}>{fees?.map(item=>feeRow(item.label,usd(item.usd)))}{feeRow(t.swapFeeTotal,feeText,true)}</View>:null}
 </SwapSubview>;
}
