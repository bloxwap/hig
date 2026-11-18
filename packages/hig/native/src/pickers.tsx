import {primaryButtonInk} from '@bloxwap/hig/tokens';
import React,{useContext,useEffect,useMemo,useState} from 'react';
import {createPickerSearch} from '@bloxwap/hig/contracts/picker-search';
import {FlatList,Pressable,View,useWindowDimensions,type FlatListProps,type StyleProp,type TextInput,type TextInputProps,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {Field,Input,SearchInput} from './field.js';
import {Filter} from './radio-group.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {SwitchRow} from './switch-row.js';
import {LeaveIcon,LockIcon,ScanIcon,SwapHostContext,TokenIcon,WalletIcon} from './swap-parts.js';
import {addressColor,pickerRows,shortAddress,type SwapChain,type SwapToken,type SwapWallet} from './swap-shared.js';
export type {SwapChain,SwapFigure,SwapToken,SwapWallet} from './swap-shared.js';
/** The list component (and height animation) a sheet hands to the pickers it holds; `listComponent` on a picker block does the same for one block. */
export {SwapHostContext} from './swap-parts.js';
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
 /** `false` leaves out the search field, for a short list. Default `true`. */
 search?:boolean;
 /** Shows a token's balance when it is zero, where by default only a balance above zero is drawn. */
 zeroBalances?:boolean;
 /** A visible label over the search field, which then names it in place of the built-in label. */
 searchLabel?:string;
 /** A ref to the search input, for example to register it with a host bottom sheet's keyboard handling. */
 searchRef?:React.Ref<React.ComponentRef<typeof TextInput>>;
 /** Props for the search input, such as `onFocus`/`onBlur` for a host sheet or `returnKeyType`. The value and its change handler stay HIG's. */
 searchInputProps?:PickerInputProps;
 /** The list component the rows render through, such as a bottom sheet library's `FlatList`, so the list scrolls inside the host's sheet. Defaults to the `SwapHostContext` list, then React Native's `FlatList`. It receives the bounded `style` HIG sets, which the host's component may override. */
 listComponent?:React.ComponentType<FlatListProps<SwapToken>>;
 /** Host props for each token's row, such as `{testID: \`token-${token.id}\`}` in place of the built-in `swap-token-<id>`. HIG keeps the row's role, name, selected state and press. */
 tokenRowProps?:(token:SwapToken)=>PickerRowProps;
}
/** Host props for a picker's input: what a `TextInput` takes, except the value and its change handler. */
export type PickerInputProps=Omit<TextInputProps,'value'|'defaultValue'|'onChangeText'|'onChange'>;
/** Host props for one token row: its `testID` (replacing `swap-token-<id>`), `nativeID` and `accessibilityHint`. */
export interface PickerRowProps {testID?:string;nativeID?:string;accessibilityHint?:string}
/** Chains present in a token list, in first-seen order. */
function chainsOf(tokens:readonly SwapToken[]):SwapChain[]{const seen=new Map<string|number,SwapChain>();for(const token of tokens)if(!seen.has(token.chainId))seen.set(token.chainId,{chainId:token.chainId,name:token.chain,icon:typeof token.chainIcon==='string'?token.chainIcon:undefined});return [...seen.values()];}
/** A row shows a known balance above zero, or a zero one when the host asks for it. */
const showBalance=(token:SwapToken,zero?:boolean)=>token.balance!=null&&Number.isFinite(token.balance)&&(token.balance>0||(!!zero&&token.balance===0));
const minimumTokenRowHeight=64; // 44-point icon, 16 points of padding and a 4-point gap.
const TokenPickerRow=React.memo(function TokenPickerRow({token,isSelected,heading,onSelect,tokenRowProps,zeroBalances}:
 Pick<PickerListProps,'onSelect'|'tokenRowProps'|'zeroBalances'>&{token:SwapToken;isSelected:boolean;heading?:string}){
 const {direction}=useHIG();const colors=useColors();const fills=useFills();const t=useMessages();
 const balance=token.balance??0,price=token.price??0,host=tokenRowProps?.(token);
 return <View>
  {heading!==undefined&&<Text accessibilityRole='header' style={{paddingHorizontal:8,paddingTop:12,paddingBottom:6,fontSize:12,lineHeight:18,fontWeight:'600',letterSpacing:1,textTransform:'uppercase',color:colors.muted}}>{heading}</Text>}
  <Pressable nativeID={host?.nativeID} accessibilityHint={host?.accessibilityHint} accessibilityRole='button' accessibilityState={{selected:isSelected}} testID={host?.testID??`swap-token-${token.id}`} onPress={()=>onSelect(token)} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',gap:12,marginBottom:4,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:9999,backgroundColor:pressed?fills.well:'transparent',opacity:isSelected?0.5:1})}>
   <TokenIcon token={token}/>
   <View style={{flex:1,minWidth:0}}><Text style={{fontWeight:'600'}}>{token.name}</Text><Text style={{fontSize:14,lineHeight:21,color:colors.muted}}>{token.detail??token.chain}{isSelected?` · ${t.swapSelected}`:''}</Text></View>
   {showBalance(token,zeroBalances)?<View style={{alignItems:'flex-end'}}><AnimatedNumberReadout testID={`swap-token-balance-${token.id}`} value={balance} options={{maximumFractionDigits:6}} suffix={token.unitsSuffix} style={{fontWeight:'600',textAlign:'right'}}/>{price>0?<AnimatedNumberReadout testID={`swap-token-value-${token.id}`} value={balance*price} options={{style:'currency',currency:'USD'}} tone='muted' style={{fontSize:14,lineHeight:21,textAlign:'right'}}/>:null}</View>:null}
  </Pressable>
 </View>;
});
const TokenList=React.memo(function TokenList({tokens,chains,chainFilter=true,hotTokenIds,selected=null,onSelect,loading,search=true,zeroBalances,searchLabel,searchRef,searchInputProps,listComponent,tokenRowProps,side,title}:PickerListProps&{side:'from'|'to';title:string}){
 const colors=useColors();const t=useMessages();const window=useWindowDimensions();
 // A sheet passes its backend's list, through the prop or the host context, so drags hand off to the sheet.
 const host=useContext(SwapHostContext).listComponent;const List=listComponent??host??FlatList;
 const [query,setQuery]=useState('');const [chain,pickChain]=useState('');
 const [previousQuery,setPreviousQuery]=useState<string|null>(null);
 const waiting=previousQuery!==null&&tokens.length>50;
 const filterQuery=waiting?previousQuery:query;
 function editQuery(next:string){
  if(next===query)return;
  setPreviousQuery(tokens.length>50&&next.trim()!==''?filterQuery:null);
  setQuery(next);
 }
 useEffect(()=>{
  if(previousQuery===null)return;
  if(!waiting){setPreviousQuery(null);return;}
  const timer=setTimeout(()=>setPreviousQuery(null),150);
  return ()=>clearTimeout(timer);
 },[previousQuery,query,waiting]);
 const needsChains=chainFilter||chain!=='';
 const options=useMemo(()=>needsChains?(chains??chainsOf(tokens)):[],[needsChains,chains,tokens]);
 // The filter speaks in strings; an empty value is every chain.
 const chainId=useMemo(()=>chain===''?null:options.find(item=>String(item.chainId)===chain)?.chainId??null,[chain,options]);
 const searchCatalog=useMemo(()=>createPickerSearch(tokens),[tokens]);
 const {rows,hotCount}=useMemo(()=>searchCatalog(filterQuery,chainId,hotTokenIds),[searchCatalog,hotTokenIds,filterQuery,chainId]);
 const pendingSearch=React.useRef<string|null>(null);
 React.useLayoutEffect(()=>{pendingSearch.current=waiting?query:null;},[waiting,query]);
 const selectVisible=React.useCallback((token:SwapToken)=>{
  const pending=pendingSearch.current;
  if(pending!==null){
   setPreviousQuery(null);
   if(!pickerRows([token],pending,chainId).rows.length)return;
  }
  onSelect(token);
 },[chainId,onSelect]);
 const chainOptions=useMemo(()=>{
  if(!chainFilter||options.length<2)return null;
  return [{value:'',label:t.swapAllChains},...options.map(item=>({value:String(item.chainId),label:item.name,icon:item.icon}))];
 },[chainFilter,options,t.swapAllChains]);
 const chainControl=useMemo(()=>chainOptions&&<Filter label={t.swapChains} options={chainOptions} value={chain} onValueChange={pickChain}/>,
  [chainOptions,t.swapChains,chain]);
 const listHeight=Math.max(240,Math.round(window.height*0.5));
 // A token has a 44-point icon, two text lines (24 and 21), vertical padding and a bottom gap.
 // Use this stride for overscan only. FlatList measures the actual wrapped rows and section headings.
 const rowEstimate=20+Math.max(44,45*(window.fontScale||1));
 const large=rows.length>50;
 const selectedId=selected?.id;
 const busy=loading||waiting;
 const list=useMemo(()=>{
  const empty=<Text accessibilityLiveRegion='polite' testID={`swap-empty-${side}`} style={{paddingVertical:32,textAlign:'center',fontSize:14,lineHeight:21,color:colors.muted}}>{loading?`${t.loading}…`:t.swapNoTokens}</Text>;
  return <List style={{height:listHeight}} data={rows} accessibilityState={{busy}} keyExtractor={token=>token.id} keyboardShouldPersistTaps='handled' accessibilityLabel={title} testID={`swap-list-${side}`} initialNumToRender={large?Math.ceil(listHeight/minimumTokenRowHeight)+4:12} ListEmptyComponent={empty}
   // Reserve the minimum scroll range so a fling can land beyond the measured cells.
   contentContainerStyle={large?{minHeight:rows.length*minimumTokenRowHeight}:undefined}
   windowSize={large?1+8*rowEstimate/listHeight:undefined} maxToRenderPerBatch={large?4:undefined} updateCellsBatchingPeriod={large?16:undefined}
   renderItem={({item,index})=><TokenPickerRow token={item} isSelected={selectedId===item.id}
    heading={hotCount>0&&index===0?t.swapHot:hotCount>0&&index===hotCount?t.swapAllTokens:undefined}
    onSelect={selectVisible} tokenRowProps={tokenRowProps} zeroBalances={zeroBalances}/>}/>;
 },[List,listHeight,large,rowEstimate,rows,busy,title,side,colors.muted,loading,t.loading,t.swapNoTokens,selectedId,hotCount,t.swapHot,t.swapAllTokens,selectVisible,tokenRowProps,zeroBalances]);
 // A visible label names the field through the Field context instead of the built-in name.
 const field=<SearchInput ref={searchRef} accessibilityLabel={searchLabel?undefined:t.swapSearchTokens} placeholder={t.swapSearchTokens} testID={`swap-search-${side}`} autoCapitalize='none' autoCorrect={false} autoComplete='off' spellCheck={false} {...searchInputProps} value={query} onChangeText={editQuery} onSubmitEditing={event=>{setPreviousQuery(null);searchInputProps?.onSubmitEditing?.(event);}}/>;
 return <>
  {search?searchLabel?<Field label={searchLabel}>{field}</Field>:field:null}
  {chainControl}
  {list}

 </>;
});
export interface FromPickerBlockProps extends PickerListProps {
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
export function FromPickerBlock({wallet,onConnect,onDisconnect,generateAddress=false,onGenerateAddressChange,style,...list}:FromPickerBlockProps){
 const colors=useColors();const fills=useFills();const t=useMessages();
 return <View accessibilityLabel={t.swapFrom} testID='from-picker' style={[{gap:16},style]}>
  {wallet?.connected?
   <View testID='picker-wallet' style={{flexDirection:'row',alignItems:'stretch',gap:8}}>
    <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:12,minHeight:48,paddingVertical:8,paddingHorizontal:16,borderRadius:9999,backgroundColor:fills.well}}><View style={{width:28,height:28,borderRadius:14,backgroundColor:addressColor(wallet.address??'')}}/><Text numberOfLines={1} style={{flex:1,fontWeight:'600'}}>{wallet.address?shortAddress(wallet.address):''}</Text><LockIcon color={colors.muted}/></View>
    {onDisconnect?<IconButton intent='secondary' label={t.swapDisconnect} testID='picker-disconnect' onPress={onDisconnect} style={{minWidth:48,minHeight:48}}><LeaveIcon color={colors.text}/></IconButton>:null}
   </View>
   :wallet&&(onConnect||onGenerateAddressChange)?<View testID='picker-connect-row' style={{flexDirection:'row',alignItems:'stretch',gap:8}}>
    {onConnect?<Button testID='picker-connect' onPress={onConnect} style={{flex:1,alignSelf:'auto'}}><View key='icon' accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants'><WalletIcon color={primaryButtonInk(colors)}/></View>{t.swapConnectWallet}</Button>:null}
    {/* One named switch: the label and the drawn track inside the capsule are decoration. */}
    {onGenerateAddressChange?<SwitchRow label={t.swapGenerateAddress} checked={generateAddress} onCheckedChange={onGenerateAddressChange} testID='picker-generate' style={{flex:onConnect?undefined:1,minHeight:44,alignItems:'center',paddingStart:16,paddingEnd:12,borderRadius:9999,backgroundColor:fills.well}}>
     <View style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><Text numberOfLines={1} style={{fontWeight:'500'}}>{t.swapGenerateAddress}</Text><View style={{width:40,height:24,borderRadius:12,padding:3,backgroundColor:generateAddress?colors.action:colors.border,alignItems:generateAddress?'flex-end':'flex-start'}}><View style={{width:18,height:18,borderRadius:9,backgroundColor:generateAddress?colors.onAction:colors.text}}/></View></View>
    </SwitchRow>:null}
   </View>:null}
  <TokenList {...list} side='from' title={t.swapFrom}/>
 </View>;
}
export interface ToPickerBlockProps extends Partial<PickerListProps> {
 /** The destination address field. Omit `onAddressChange` to hide it. */
 address?:string;onAddressChange?:(address:string)=>void;
 /** Shown while the field is empty, for example the connected wallet shortened; defaults to the built-in label. */
 addressPlaceholder?:string;
 /** Shows the scan button. HIG ships no scanner: the host opens its own and writes the result to `address`. */
 onScan?:()=>void;
 /** A visible label over the address field, which then names it in place of the built-in “Recipient”. */
 addressLabel?:string;
 /** A ref to the address input, for example to register it with a host bottom sheet's keyboard handling. */
 addressRef?:React.Ref<React.ComponentRef<typeof TextInput>>;
 /** Props for the address input, such as `onFocus`/`onBlur` for a host sheet, `textContentType` or a mono `style`. The value and its change handler stay HIG's. */
 addressInputProps?:PickerInputProps;
 style?:StyleProp<ViewStyle>;
}
/**
 * Where the assets go. On its own it is a destination address field with a scan button. With `tokens` it adds the
 * searchable token list, with the chain filter or, with `chainFilter={false}`, without it.
 */
export function ToPickerBlock({address,onAddressChange,addressPlaceholder,onScan,addressLabel,addressRef,addressInputProps,style,tokens,onSelect,...list}:ToPickerBlockProps){
 const colors=useColors();const t=useMessages();
 const row=onAddressChange?<View testID='picker-address-row' style={{flexDirection:'row',alignItems:'center',gap:8}}>
   <View style={{flex:1}}><Input ref={addressRef} accessibilityLabel={addressLabel?undefined:t.swapRecipient} placeholder={addressPlaceholder??t.swapRecipient} testID='picker-address' autoCapitalize='none' autoCorrect={false} autoComplete='off' spellCheck={false} {...addressInputProps} value={address??''} onChangeText={onAddressChange}/></View>
   {onScan?<IconButton intent='secondary' label={t.swapScan} testID='picker-scan' onPress={onScan} style={{minWidth:48,minHeight:48}}><ScanIcon color={colors.text}/></IconButton>:null}
  </View>:null;
 return <View accessibilityLabel={t.swapTo} testID='to-picker' style={[{gap:16},style]}>
  {row&&addressLabel?<Field label={addressLabel}>{row}</Field>:row}
  {tokens&&onSelect?<TokenList {...list} tokens={tokens} onSelect={onSelect} side='to' title={t.swapTo}/>:null}
 </View>;
}

