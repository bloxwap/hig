import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {Animated,BackHandler,Easing,Platform,Pressable,StyleSheet,View,type FlatListProps,type LayoutChangeEvent,type StyleProp,type ViewStyle} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import {Raised,useColors,useControllable,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {Toast,useTransientNotice} from './status.js';
import {VerticalAddress,addressKind} from './data.js';
import {DownIcon,FlipIcon,MenuIcon,ResetIcon,SwapCapsule,SwapKeypad,TokenArt} from './swap-parts.js';
import {SwapPicker,SwapSettings} from './swap-views.js';
import {addressColor,applyAmountKey,formatPercent,shortAddress,swapAction,swapParentView,testAmount,trimNumber,unitsToEntry,type SwapAction,type SwapChain,type SwapDenomination,type SwapFee,type SwapToken,type SwapView,type SwapWallet} from './swap-shared.js';
export {swapAction,swapParentView,type SwapAction,type SwapChain,type SwapDenomination,type SwapFee,type SwapToken,type SwapView,type SwapWallet} from './swap-shared.js';
/** What a host surface lends the panel. A sheet passes its backend's list, so list drags hand off to the sheet, and sizes itself, so the panel does not animate its own height. */
export const SwapHostContext=createContext<{listComponent?:React.ComponentType<FlatListProps<SwapToken>>;animateHeight?:boolean}>({});
/** The receive view: the host's address and its rendered QR code. HIG ships no QR encoder. */
export interface SwapReceive {address:string;qr?:React.ReactNode;/** Host clipboard adapter. When set, the whole view copies the address. */onCopy?:()=>Promise<void>|void}
export interface SwapPanelProps {
 /** Catalog for the To side, and for the From side unless `fromTokens` is given. */
 tokens:readonly SwapToken[];
 /** Assets offered on the From side, typically the connected wallet's holdings. */
 fromTokens?:readonly SwapToken[];fromTokensLoading?:boolean;
 /** Chain filter chips. Derived from the tokens, in first-seen order, when omitted. */
 chains?:readonly SwapChain[];
 /** Token ids for the picker's Hot section, in rank order. */
 hotTokenIds?:readonly string[];
 /** The chosen pair. Controlled when `from` / `to` is set (`null` is an empty side); otherwise the panel keeps it, seeded from the defaults. */
 from?:SwapToken|null;to?:SwapToken|null;defaultFrom?:SwapToken|null;defaultTo?:SwapToken|null;onFromChange?:(token:SwapToken|null)=>void;onToChange?:(token:SwapToken|null)=>void;
 /** From amount in token units. Optional: set it to resync the entry, for example to `'0'` after a submit. */
 amount?:string;
 /** Reports the From amount in token units whenever the entry, denomination or price changes it. */
 onAmountChange?:(units:string)=>void;
 /** To amount in token units from the host's quote. Until it arrives the panel shows a price estimate. */
 received?:number|null;
 /** Total fee in USD from the host's quote, and its breakdown for the settings sheet. */
 fee?:number|null;fees?:readonly SwapFee[];quoteLoading?:boolean;
 /** Slippage tolerance as a fraction (0.005 is 0.5%). Omit `onSlippageChange` to show it read-only. */
 slippage?:number;onSlippageChange?:(slippage:number)=>void;
 /** Default denomination of both amounts. Uncontrolled when omitted. */
 denomination?:SwapDenomination;onDenominationChange?:(denomination:SwapDenomination)=>void;
 wallet?:SwapWallet;onConnect?:()=>void;onDisconnect?:()=>void;
 recipient?:string;onRecipientChange?:(address:string)=>void;onScanRecipient?:()=>void;
 /** Enables the receive view, offered in the From picker before a wallet is connected. */
 receive?:SwapReceive;receiving?:boolean;onReceivingChange?:(receiving:boolean)=>void;
 /** The host validates, quotes and executes. HIG never submits a transaction. */
 onSubmit:(action:SwapAction)=>void;submitting?:boolean;
 /** Called after the panel clears its entry and both tokens (through `onFromChange(null)` / `onToChange(null)`), so the host can drop its quote. */
 onReset?:()=>void;
 /** On native there is no hardware keyboard to rely on, so `auto` shows the keypad; `never` hides it. */
 /** One direction only, top to bottom: the control between the cards becomes a down arrow instead of the flip button, and the pair cannot be exchanged. */
 oneWay?:boolean;
 keypad?:'auto'|'always'|'never';
 /** Web only (⌘F / ⌘K picker shortcuts); accepted and ignored so one example serves both platforms. */
 shortcuts?:boolean;
 /** Web only (page-wide digit capture); accepted and ignored. */
 captureKeyboard?:boolean;
 /** Host rows for the settings view, such as language or theme. */
 settings?:React.ReactNode;
 /** The view on show. Pickers and settings push inside the panel's own bounds; Back pops. Uncontrolled when omitted. */
 view?:SwapView;onViewChange?:(view:SwapView)=>void;
 /** Web only; accepted and ignored. */
 className?:string;
 style?:StyleProp<ViewStyle>;
}
/**
 * Send, swap and bridge in one panel: a From card and a To card joined by a flip control, an amount entered in dollars
 * or token units through the keypad, token pickers, settings, and one action that names itself from the chosen pair.
 * Presentation only. The host owns tokens, balances, prices, the quote, the wallet and the transaction.
 */
export function SwapPanel({tokens,fromTokens,fromTokensLoading,chains,hotTokenIds,from:fromProp,to:toProp,defaultFrom=null,defaultTo=null,onFromChange,onToChange,amount,onAmountChange,received,fee,fees,quoteLoading,slippage=0.005,onSlippageChange,denomination,onDenominationChange,wallet,onConnect,onDisconnect,recipient,onRecipientChange,onScanRecipient,receive,receiving,onReceivingChange,onSubmit,submitting=false,onReset,keypad='auto',oneWay=false,settings,view:viewProp,onViewChange,style}:SwapPanelProps){
 const env=useHIG();const {locale,direction}=env;const colors=useColors();const t=useMessages();
 const [from,setFrom]=useControllable<SwapToken|null>(fromProp,defaultFrom,onFromChange);const [to,setTo]=useControllable<SwapToken|null>(toProp,defaultTo,onToChange);
 const [defaultMode,setDefaultMode]=useControllable<SwapDenomination>(denomination,'usd',onDenominationChange);
 const [isReceiving,setReceiving]=useControllable(receiving,false,onReceivingChange);
 const [entry,setEntry]=useState('0');const [fromMode,setFromMode]=useState(defaultMode);const [toMode,applyToMode]=useState(defaultMode);
 const host=useContext(SwapHostContext);
 const [ownView,keepView]=useState<SwapView>('main');const view=viewProp??ownView;
 const show=(next:SwapView)=>{if(next===view)return;if(viewProp===undefined)keepView(next);onViewChange?.(next);};
 const back=()=>show(swapParentView(view));
 // Android back pops a pushed view before anything behind the panel handles it.
 const pop=useRef(back);pop.current=back;
 useEffect(()=>{if(view==='main')return;const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{pop.current();return true;});return()=>subscription.remove();},[view==='main']);
 const {notice,show:showNotice,dismiss:dismissNotice}=useTransientNotice();
 const fromPrice=from?.price??0,toPrice=to?.price??0,input=Number(entry)||0;
 const units=fromMode==='token'?input:fromPrice>0?input/fromPrice:0,usd=units*fromPrice,unitsText=trimNumber(units);
 const showReceive=isReceiving&&!!receive;
 // Report the amount in token units; resync the entry when the host sets a different amount.
 const reported=useRef(amount??'0');
 useEffect(()=>{if(reported.current!==unitsText){reported.current=unitsText;onAmountChange?.(unitsText);}},[unitsText]);
 useEffect(()=>{if(amount===undefined||Number(amount)===Number(reported.current))return;reported.current=trimNumber(Number(amount)||0);setEntry(unitsToEntry(Number(amount)||0,fromMode,fromPrice));},[amount]);
 const sameAsset=!!from&&!!to&&from.id===to.id;
 const receivedUnits=sameAsset?units:received??(toPrice>0?usd/toPrice:0);
 const receivedUsd=toPrice>0?receivedUnits*toPrice:sameAsset?usd:0;
 const action=swapAction(from,to);
 const insufficient=!!from&&(from.balance??0)>0&&units>(from.balance??0);
 const ready=!!from&&!!to&&units>0&&!insufficient;
 const actionText=showReceive?t.swapSendFromWallet:!from||!to?t.swapChooseToken:units<=0?t.swapEnterAmount:insufficient?t.swapInsufficient(from.symbol):action==='swap'?t.swapActionSwap:action==='bridge'?t.swapActionBridge:t.swapActionSend;
 const pristine=!from&&!to&&input===0;
 // Updater form: several keys can land before the next render, and each must build on the last.
 const latest=useRef(fromMode);latest.current=fromMode;
 const press=(key:string)=>setEntry(current=>applyAmountKey(current,key,latest.current));
 const switchFromMode=(mode:SwapDenomination)=>{if(mode===fromMode)return;setEntry(mode==='usd'?trimNumber(usd,2):trimNumber(units));setFromMode(mode);};
 const changeDenomination=(mode:SwapDenomination)=>{setDefaultMode(mode);switchFromMode(mode);applyToMode(mode);};
 // A new default applies to an untouched entry at once; a typed amount keeps its denomination until reset.
 useEffect(()=>{if(input===0){setFromMode(defaultMode);applyToMode(defaultMode);}},[defaultMode]);
 const reset=()=>{setEntry('0');setFromMode(defaultMode);applyToMode(defaultMode);if(isReceiving)setReceiving(false);setFrom(null);setTo(null);onReset?.();};
 const flip=()=>{if(!from||!to)return;setFrom(to);setTo(from);};
 const submit=()=>{if(submitting)return;if(showReceive){onConnect?.();return;}if(ready)onSubmit(action);};
 // A copied address shows as a transient toast capsule (about 4s, dismissible), announced the way Toast announces any notice.
 const copyAddress=()=>{if(!receive?.onCopy)return;Promise.resolve().then(receive.onCopy).then(()=>showNotice(t.addressCopied)).catch(()=>{/* The host adapter reports its own failure. */});};
 const chainList=useMemo(()=>{if(chains)return chains;const seen=new Map<string|number,SwapChain>();for(const token of tokens)if(!seen.has(token.chainId))seen.set(token.chainId,{chainId:token.chainId,name:token.chain,icon:token.chainIcon});return [...seen.values()];},[chains,tokens]);
 const usdText=(value:number)=>formatNumber(value,locale,{style:'currency',currency:'USD'});
 const fraction=entry.includes('.')?Math.min(entry.length-entry.indexOf('.')-1,fromMode==='usd'?2:8):0;
 const small={fontSize:14,lineHeight:19,color:colors.muted} as const;
 const header=(side:'from'|'to',token:SwapToken)=><>
  <View pointerEvents='none' style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'flex-start',gap:12}}>
   <View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' style={{alignItems:'center'}}>
    {[wallet?.address?<View style={{width:28,height:28,borderRadius:14,backgroundColor:addressColor(wallet.address),borderWidth:2,borderColor:colors.surface}}/>:null,token.chainIcon?<TokenArt uri={token.chainIcon} size={28} ring={colors.surface}/>:null,<TokenArt uri={token.icon} symbol={token.symbol} size={28} ring={colors.surface}/>].filter(Boolean).map((layer,index)=><View key={index} style={{marginTop:index?-14:0}}>{layer}</View>)}
   </View>
   <View style={{flex:1,minWidth:0}}>{wallet?.address?<Text style={small}>{shortAddress(wallet.address)}</Text>:null}<Text style={small}>{token.chain}</Text><Text style={{fontWeight:'600',lineHeight:21}}>{token.name}</Text></View>
  </View>
  {side==='from'?((token.balance??0)>0?<View pointerEvents='box-none' style={{alignItems:'flex-end',gap:8,maxWidth:'60%'}}>
    <View pointerEvents='box-none' style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'flex-end',gap:8}}>
     <SwapCapsule testID='swap-test' onPress={()=>setEntry(unitsToEntry(testAmount(token),fromMode,fromPrice))}><Text style={small}>{t.swapTest}</Text></SwapCapsule>
     <SwapCapsule testID='swap-max' onPress={()=>setEntry(unitsToEntry(token.balance??0,fromMode,fromPrice))}><Text style={small}>{t.swapMax}</Text></SwapCapsule>
    </View>
    <View pointerEvents='none'><Text style={small}>{formatNumber(token.balance,locale,{maximumFractionDigits:6})} {token.symbol}</Text></View>
   </View>:null)
   :<View pointerEvents='box-none' style={{alignItems:'flex-end',gap:8,maxWidth:'60%'}}>
    <SwapCapsule testID='swap-slippage' onPress={()=>show(onSlippageChange?'slippage':'settings')}><Text style={small}>{t.swapSlippage(formatPercent(slippage))}</Text></SwapCapsule>
    <View pointerEvents='none'><Text style={small}>{t.swapFee(quoteLoading?'…':fee!=null?usdText(fee):'—')}</Text></View>
   </View>}
 </>;
 const receiveView=(view:{address:string;qr?:React.ReactNode;onCopy?:()=>Promise<void>|void})=>{
  const body=<>{view.qr?<View style={{width:132,height:132,padding:8,borderRadius:16,backgroundColor:colors.background}}>{view.qr}</View>:null}
   <View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants'><VerticalAddress address={view.address} rowHeight={addressKind(view.address)==='ethereum'?22:16}/></View></>;
  const layout:ViewStyle={flexDirection:'row',alignItems:'center',justifyContent:'space-evenly',gap:12,paddingTop:8,paddingHorizontal:16,paddingBottom:20};
  return view.onCopy?<Pressable accessibilityRole='button' accessibilityLabel={`${t.copyAddress}: ${view.address}`} testID='swap-receive' onPress={copyAddress} style={({pressed})=>[layout,{opacity:pressed?0.8:1}]}>{body}</Pressable>:<View accessible accessibilityLabel={view.address} testID='swap-receive' style={layout}>{body}</View>;
 };
 const card=(side:'from'|'to')=>{
  const token=side==='from'?from:to,label=side==='from'?t.swapFrom:t.swapTo,mode=side==='from'?fromMode:toMode;
  const cardUnits=side==='from'?units:receivedUnits,cardUsd=side==='from'?usd:receivedUsd;
  const shown=side==='from'?input:mode==='token'?receivedUnits:receivedUsd;
  const options={minimumFractionDigits:side==='from'?fraction:0,maximumFractionDigits:mode==='usd'?2:8,useGrouping:false};
  const prefix=mode==='usd'?'$':'',suffix=side==='from'&&entry.endsWith('.')?'.':'';
  return <View testID={`swap-card-${side}`} style={{backgroundColor:colors.surface,borderRadius:24,overflow:'hidden'}}><Raised>
   <View>
    <Pressable accessibilityRole='button' accessibilityLabel={t.swapSelectToken(label)} testID={`swap-slot-${side}`} onPress={()=>show(side)} style={StyleSheet.absoluteFill}/>
    <View pointerEvents='box-none' style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:84,padding:16}}>
     {token?header(side,token):<View pointerEvents='none'><Text accessible={false} style={{fontSize:40,lineHeight:46,fontWeight:'500',letterSpacing:-0.8,color:colors.faint}}>{label}…</Text></View>}
    </View>
   </View>
   {side==='from'&&showReceive&&receive?receiveView(receive):side==='to'&&showReceive?null:<View>
    {/* The slot above is the accessible control for the picker; this larger target is for touch only. */}
    <Pressable accessible={false} importantForAccessibility='no' testID={`swap-area-${side}`} onPress={()=>show(side)} style={StyleSheet.absoluteFill}/>
    <View pointerEvents='box-none' style={{alignItems:'center',gap:8,paddingTop:4,paddingHorizontal:16,paddingBottom:20}}>
     <View pointerEvents='none' accessible accessibilityLabel={t.swapAmount(label)} accessibilityValue={{text:`${prefix}${formatNumber(shown,locale,options)}${suffix}`}} testID={`swap-amount-${side}`}>
      <AnimatedNumberReadout value={shown} prefix={prefix} suffix={suffix} options={options} tone={side==='to'?'muted':'text'} maxFontSizeMultiplier={1.5} style={{fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9,textAlign:'center'}}/>
     </View>
     <SwapCapsule label={t.swapSwitchDenomination} testID={`swap-mode-${side}`} onPress={()=>side==='from'?switchFromMode(fromMode==='usd'?'token':'usd'):applyToMode(toMode==='usd'?'token':'usd')}>
      <Text accessible={false} style={[small,{opacity:0.5}]}>=</Text>
      <Text testID={`swap-conversion-${side}`} style={small}>{mode==='token'?usdText(cardUsd):`${formatNumber(cardUnits,locale,{maximumFractionDigits:8,useGrouping:false})}${token?` ${token.symbol}`:''}`}</Text>
      <FlipIcon color={colors.muted} size={14}/>
     </SwapCapsule>
    </View>
   </View>}
  </Raised></View>;
 };
 const fromCard=card('from'),toCard=card('to');
 const main=<View testID='swap-view-main'>
  {fromCard}
  <View style={{height:8,zIndex:1,alignItems:'center'}}>
   {/* A disc in the page colour breaks the seam between the cards; the control sits on it. */}
   <View style={{position:'absolute',top:-15,width:38,height:38,borderRadius:19,backgroundColor:colors.background,alignItems:'center',justifyContent:'center'}}>
    {oneWay?<View testID='swap-one-way' style={{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.nested}}><DownIcon color={colors.muted}/></View>:<Pressable accessibilityRole='button' accessibilityLabel={t.swapFlip} accessibilityState={{disabled:!from||!to}} disabled={!from||!to} testID='swap-flip' onPress={flip} hitSlop={6} style={({pressed})=>({width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:!from||!to?colors.surface:colors.nested,opacity:pressed?0.85:1})}><FlipIcon color={!from||!to?colors.faint:colors.muted}/></Pressable>}
   </View>
  </View>
  {toCard}
  {!showReceive&&keypad!=='never'?<SwapKeypad onKey={press} label={t.swapKeypad} deleteLabel={t.swapDelete}/>:null}
  <View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:8}}>
   <IconButton intent='secondary' label={t.swapSettings} suppressFeedback testID='swap-settings-button' onPress={()=>show('settings')}><MenuIcon color={colors.text}/></IconButton>
   <Button busy={submitting} disabled={!showReceive&&!ready} testID='swap-action' onPress={submit} style={{flex:1,alignSelf:'auto'}}>{actionText}</Button>
   <IconButton intent='secondary' label={t.swapReset} disabled={pristine||submitting} testID='swap-reset' onPress={reset}><ResetIcon color={colors.text}/></IconButton>
  </View>
  {notice?<View style={{marginTop:8,alignItems:'center'}}><Toast notices={[notice]} onDismiss={dismissNotice}/></View>:null}
 </View>;
 const body=view==='main'?main
  :view==='from'?<SwapPicker side={view} onBack={back} tokens={fromTokens??tokens} loading={fromTokensLoading} chains={chainList} hotTokenIds={hotTokenIds} selected={from} onSelect={setFrom} wallet={wallet} onConnect={onConnect} onDisconnect={onDisconnect} receiving={isReceiving} onReceivingChange={receive?setReceiving:undefined} listComponent={host.listComponent}/>
  :view==='to'?<SwapPicker side={view} onBack={back} tokens={tokens} chains={chainList} hotTokenIds={hotTokenIds} selected={to} onSelect={setTo} wallet={wallet} recipient={recipient} onRecipientChange={onRecipientChange} onScanRecipient={onScanRecipient} listComponent={host.listComponent}/>
  :<SwapSettings view={view} onViewChange={show} onBack={back} denomination={defaultMode} onDenominationChange={changeDenomination} slippage={slippage} onSlippageChange={onSlippageChange} fee={fee} fees={fees} quoteLoading={quoteLoading}>{settings}</SwapSettings>;
 return <View testID='swap-panel' style={[{direction,width:'100%',maxWidth:448,alignSelf:'center'},style]}><SwapStage view={view} animateHeight={host.animateHeight!==false}>{body}</SwapStage></View>;
}
const viewDepth=(view:SwapView)=>view==='main'?0:view==='slippage'||view==='fees'?2:1;
const stageEasing=Easing.bezier(0.22,1,0.36,1);
/** Shows one view at a time. A push slides in from the trailing side and a pop from the leading side while the container height eases to the new view; reduced motion swaps at once. */
function SwapStage({view,animateHeight,children}:React.PropsWithChildren<{view:SwapView;animateHeight:boolean}>){
 const {reducedMotion,direction}=useHIG();
 const shown=useRef(view),travel=useRef(0),slide=useRef(new Animated.Value(1)).current,height=useRef(new Animated.Value(0)).current,measured=useRef<number|null>(null);
 const [sized,setSized]=useState(false);
 if(shown.current!==view)travel.current=(viewDepth(view)>=viewDepth(shown.current)?1:-1)*(direction==='rtl'?-1:1);
 useEffect(()=>{
  if(shown.current===view)return;shown.current=view;
  if(reducedMotion){slide.setValue(1);return;}
  slide.setValue(0);Animated.timing(slide,{toValue:1,duration:260,easing:stageEasing,useNativeDriver:Platform.OS!=='web'}).start();
 },[view,reducedMotion,slide]);
 const sizing=animateHeight&&!reducedMotion;
 const onLayout=(event:LayoutChangeEvent)=>{
  const next=event.nativeEvent.layout.height;if(!sizing||!(next>0))return;
  if(measured.current===null)height.setValue(next);else if(next!==measured.current)Animated.timing(height,{toValue:next,duration:260,easing:stageEasing,useNativeDriver:false}).start();
  measured.current=next;if(!sized)setSized(true);
 };
 const fitted=sizing&&sized;
 return <Animated.View testID='swap-stage' style={fitted?{height,overflow:'hidden'}:undefined}>
  <Animated.View onLayout={onLayout} style={[fitted?{position:'absolute',left:0,right:0,top:0}:null,{opacity:slide,transform:[{translateX:slide.interpolate({inputRange:[0,1],outputRange:[travel.current*48,0]})}]}]}>{children}</Animated.View>
 </Animated.View>;
}
