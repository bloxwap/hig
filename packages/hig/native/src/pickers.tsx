import React,{useContext,useMemo,useState} from 'react';
import {FlatList,Pressable,View,useWindowDimensions,type StyleProp,type ViewStyle} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {Input,SearchInput} from './field.js';
import {Filter} from './radio-group.js';
import {SwitchRow} from './switch-row.js';
import {LeaveIcon,LockIcon,ScanIcon,SwapHostContext,TokenIcon,WalletIcon} from './swap-parts.js';
import {addressColor,pickerRows,shortAddress,type SwapChain,type SwapToken,type SwapWallet} from './swap-shared.js';
export type {SwapChain,SwapToken,SwapWallet} from './swap-shared.js';
/** The searchable token list both pickers share. */
export interface PickerListProps {
 /** Tokens offered: a wallet's holdings, a whitelist, or a whole catalog. */
 tokens:readonly SwapToken[];
 /** Chain filter options. Derived from the tokens, in first-seen order, when omitted. */
 chains?:readonly SwapChain[];
 /** `false` leaves out the chain filter, for a list on one chain or one that should not be narrowed by chain. */
 chainFilter?:boolean;
 /** Token ids for a Hot section at the top of the unfiltered list, in rank order. */
 hotTokenIds?:readonly string[];
 selected?:SwapToken|null;onSelect:(token:SwapToken)=>void;
 /** Shows the loading text in place of the empty text while the list is empty. */
 loading?:boolean;
 /** Web only: focuses the search with a hardware pointer. Native never raises the keyboard on mount. */
 autoFocus?:boolean;
}
/** Chains present in a token list, in first-seen order. */
function chainsOf(tokens:readonly SwapToken[]):SwapChain[]{const seen=new Map<string|number,SwapChain>();for(const token of tokens)if(!seen.has(token.chainId))seen.set(token.chainId,{chainId:token.chainId,name:token.chain,icon:token.chainIcon});return [...seen.values()];}
function TokenList({tokens,chains,chainFilter=true,hotTokenIds,selected=null,onSelect,loading,side,title}:PickerListProps&{side:'from'|'to';title:string}){
 const {locale,direction}=useHIG();const colors=useColors();const fills=useFills();const t=useMessages();const window=useWindowDimensions();
 // A sheet passes its backend's list through the host context so drags hand off to the sheet.
 const List=useContext(SwapHostContext).listComponent??FlatList;
 const [query,setQuery]=useState('');const [chain,pickChain]=useState('');
 const options=useMemo(()=>chains??chainsOf(tokens),[chains,tokens]);
 // The filter speaks in strings; an empty value is every chain.
 const chainId=chain===''?null:options.find(item=>String(item.chainId)===chain)?.chainId??null;
 const {rows,hotCount}=useMemo(()=>pickerRows(tokens,query,chainId,hotTokenIds),[tokens,hotTokenIds,query,chainId]);
 const section=(heading:string)=><Text accessibilityRole='header' style={{paddingHorizontal:8,paddingTop:12,paddingBottom:6,fontSize:12,lineHeight:18,fontWeight:'600',letterSpacing:1,textTransform:'uppercase',color:colors.muted}}>{heading}</Text>;
 const chainOptions=useMemo(()=>[{value:'',label:t.swapAllChains},...options.map(item=>({value:String(item.chainId),label:item.name,icon:item.icon}))],[options,t.swapAllChains]);
 const empty=<Text accessibilityLiveRegion='polite' testID={`swap-empty-${side}`} style={{paddingVertical:32,textAlign:'center',fontSize:14,lineHeight:21,color:colors.muted}}>{loading?`${t.loading}…`:t.swapNoTokens}</Text>;
 return <>
  <SearchInput accessibilityLabel={t.swapSearchTokens} placeholder={t.swapSearchTokens} testID={`swap-search-${side}`} value={query} onChangeText={setQuery} autoCapitalize='none' autoCorrect={false} autoComplete='off' spellCheck={false}/>
  {chainFilter&&options.length>1?<Filter label={t.swapChains} options={chainOptions} value={chain} onValueChange={pickChain}/>:null}
  {/* A bounded height so the list scrolls inside its panel or sheet instead of stretching it. */}
  <List style={{height:Math.max(240,Math.round(window.height*0.5))}} data={rows} keyExtractor={token=>token.id} keyboardShouldPersistTaps='handled' accessibilityLabel={title} testID={`swap-list-${side}`} initialNumToRender={12} ListEmptyComponent={empty}
   renderItem={({item:token,index})=>{const isSelected=selected?.id===token.id,balance=token.balance??0,price=token.price??0;return <View>
    {hotCount>0&&index===0?section(t.swapHot):null}{hotCount>0&&index===hotCount?section(t.swapAllTokens):null}
    <Pressable accessibilityRole='button' accessibilityState={{selected:isSelected}} testID={`swap-token-${token.id}`} onPress={()=>onSelect(token)} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',gap:12,marginBottom:4,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:9999,backgroundColor:pressed?fills.well:'transparent',opacity:isSelected?0.5:1})}>
     <TokenIcon token={token}/>
     <View style={{flex:1,minWidth:0}}><Text style={{fontWeight:'600'}}>{token.name}</Text><Text style={{fontSize:14,lineHeight:21,color:colors.muted}}>{token.chain}{isSelected?` · ${t.swapSelected}`:''}</Text></View>
     {balance>0?<View style={{alignItems:'flex-end'}}><Text style={{fontWeight:'600'}}>{formatNumber(balance,locale,{maximumFractionDigits:6})}</Text>{price>0?<Text style={{fontSize:14,lineHeight:21,color:colors.muted}}>{formatNumber(balance*price,locale,{style:'currency',currency:'USD'})}</Text>:null}</View>:null}
    </Pressable>
   </View>;}}/>
 </>;
}
export interface FromPickerProps extends PickerListProps {
 /** The connected wallet. Omit for a list with no wallet row at all. */
 wallet?:SwapWallet;
 /** Shows Connect wallet while no wallet is connected. */
 onConnect?:()=>void;
 /** Shows the disconnect button beside a connected wallet. Omit it where signing out does not belong. */
 onDisconnect?:()=>void;
 /** The Generate address switch, offered while no wallet is connected: the user picks a chain and an asset and the host shows an address to send it to. Omit `onGenerateAddressChange` to hide it. */
 generateAddress?:boolean;onGenerateAddressChange?:(generate:boolean)=>void;
 style?:StyleProp<ViewStyle>;
}
/**
 * Where the assets come from. A connected wallet shows its address, with a disconnect button the host can leave out, above
 * the tokens it holds (or a whitelist). With no wallet it offers Connect wallet and a Generate address switch above the list.
 * The host owns the wallet, the token data and the generated address.
 */
export function FromPicker({wallet,onConnect,onDisconnect,generateAddress=false,onGenerateAddressChange,style,...list}:FromPickerProps){
 const colors=useColors();const fills=useFills();const t=useMessages();
 return <View accessibilityLabel={t.swapFrom} testID='from-picker' style={[{gap:16},style]}>
  {wallet?.connected?
   <View testID='picker-wallet' style={{flexDirection:'row',alignItems:'stretch',gap:8}}>
    <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:12,minHeight:48,paddingVertical:8,paddingHorizontal:16,borderRadius:9999,backgroundColor:fills.well}}><View style={{width:28,height:28,borderRadius:14,backgroundColor:addressColor(wallet.address??'')}}/><Text numberOfLines={1} style={{flex:1,fontWeight:'600'}}>{wallet.address?shortAddress(wallet.address):''}</Text><LockIcon color={colors.muted}/></View>
    {onDisconnect?<IconButton intent='secondary' label={t.swapDisconnect} testID='picker-disconnect' onPress={onDisconnect} style={{minWidth:48,minHeight:48}}><LeaveIcon color={colors.text}/></IconButton>:null}
   </View>
   :wallet&&(onConnect||onGenerateAddressChange)?<View testID='picker-connect-row' style={{flexDirection:'row',alignItems:'stretch',gap:8}}>
    {onConnect?<Button testID='picker-connect' onPress={onConnect} style={{flex:1,alignSelf:'auto'}}><View key='icon' accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants'><WalletIcon color={colors.onAction}/></View>{t.swapConnectWallet}</Button>:null}
    {/* One named switch: the label and the drawn track inside the capsule are decoration. */}
    {onGenerateAddressChange?<SwitchRow label={t.swapGenerateAddress} checked={generateAddress} onCheckedChange={onGenerateAddressChange} testID='picker-generate' style={{flex:onConnect?undefined:1,minHeight:44,alignItems:'center',paddingStart:16,paddingEnd:12,borderRadius:9999,backgroundColor:fills.well}}>
     <View style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><Text numberOfLines={1} style={{fontWeight:'500'}}>{t.swapGenerateAddress}</Text><View style={{width:40,height:24,borderRadius:12,padding:3,backgroundColor:generateAddress?colors.action:colors.border,alignItems:generateAddress?'flex-end':'flex-start'}}><View style={{width:18,height:18,borderRadius:9,backgroundColor:generateAddress?colors.onAction:colors.text}}/></View></View>
    </SwitchRow>:null}
   </View>:null}
  <TokenList {...list} side='from' title={t.swapFrom}/>
 </View>;
}
export interface ToPickerProps extends Partial<PickerListProps> {
 /** The destination address field. Omit `onAddressChange` to hide it. */
 address?:string;onAddressChange?:(address:string)=>void;
 /** Shown while the field is empty, for example the connected wallet shortened; defaults to the built-in label. */
 addressPlaceholder?:string;
 /** Shows the scan button. HIG ships no scanner: the host opens its own and writes the result to `address`. */
 onScan?:()=>void;
 style?:StyleProp<ViewStyle>;
}
/**
 * Where the assets go. On its own it is a destination address field with a scan button. With `tokens` it adds the
 * searchable token list, with the chain filter or, with `chainFilter={false}`, without it.
 */
export function ToPicker({address,onAddressChange,addressPlaceholder,onScan,style,tokens,onSelect,...list}:ToPickerProps){
 const colors=useColors();const t=useMessages();
 return <View accessibilityLabel={t.swapTo} testID='to-picker' style={[{gap:16},style]}>
  {onAddressChange?<View testID='picker-address-row' style={{flexDirection:'row',alignItems:'center',gap:8}}>
   <View style={{flex:1}}><Input accessibilityLabel={t.swapRecipient} placeholder={addressPlaceholder??t.swapRecipient} testID='picker-address' value={address??''} onChangeText={onAddressChange} autoCapitalize='none' autoCorrect={false} autoComplete='off' spellCheck={false}/></View>
   {onScan?<IconButton intent='secondary' label={t.swapScan} testID='picker-scan' onPress={onScan} style={{minWidth:48,minHeight:48}}><ScanIcon color={colors.text}/></IconButton>:null}
  </View>:null}
  {tokens&&onSelect?<TokenList {...list} tokens={tokens} onSelect={onSelect} side='to' title={t.swapTo}/>:null}
 </View>;
}
