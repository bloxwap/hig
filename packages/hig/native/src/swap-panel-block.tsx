import React,{useContext,useEffect,useMemo,useRef,useState} from 'react';
import {Animated,BackHandler,Easing,Platform,Pressable,StyleSheet,View,type LayoutChangeEvent,type StyleProp,type ViewStyle} from 'react-native';
import {formatNumber} from './number-format.js';
import {Raised,useColors,useControllable,useHIG,useMessages,useNumberLocale,usePresentNumber} from './provider.js';
import {Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {figureProps} from './figure.js';
import {Toast,useTransientNotice} from './status.js';
import {VerticalAddress,addressKind} from './data.js';
import {withAlpha} from '@bloxwap/hig/tokens';
import {DownIcon,FlipIcon,MenuIcon,ResetIcon,SmallChevron,SwapCapsule,SwapHostContext,SwapKeypad,SwapNumberText,TokenArt} from './swap-parts.js';
import {ScreenHeader} from './screen-header.js';
import {SwapPicker,SwapSettings} from './swap-views.js';
import {addressColor,applyAmountKey,formatPercent,shortAddress,swapAction,swapParentView,testAmount,trimNumber,unitsToEntry,type SwapAction,type SwapArtwork,type SwapChain,type SwapDenomination,type SwapFee,type SwapFigure,type SwapToken,type SwapView,type SwapWallet} from './swap-shared.js';
export {swapAction,swapParentView,type SwapAction,type SwapArtwork,type SwapChain,type SwapDenomination,type SwapFee,type SwapFigure,type SwapToken,type SwapView,type SwapWallet} from './swap-shared.js';
/** What a host surface lends the panel. A sheet passes its backend's list, so list drags hand off to the sheet, and sizes itself, so the panel does not animate its own height. */
export {SwapHostContext} from './swap-parts.js';
export {SwapAmountCard,SwapPill,type SwapAmountCardProps,type SwapPillProps} from './swap-amount-card.js';
/** A fixed place the assets go, in place of a token the user picks: a wallet, a staking pool, a trading account. Shown as a compact To card with no amount. */
export interface SwapDestination {
 title:string;
 /** One muted line under the title, such as the chain or a rate. */
 subtitle?:string;
 /** An image URL or the host's own element. Without one, `address` draws the wallet's colour disc. */
 icon?:SwapArtwork;
 /** A wallet address; shown shortened under the subtitle. */
 address?:string;
 /** Muted trailing text, such as an arrival time or a rate. */
 detail?:string|SwapFigure;
 /** Makes the card a button with a trailing chevron, for example to change the recipient. */
 onPress?:()=>void;
 /** Still to be chosen: the card shows `title` / `subtitle` as a placeholder and the action stays disabled, asking for a destination. */
 pending?:boolean;
}
/** One label and value row of the details card. */
export interface SwapDetail {label:string;/** Text is shown as given. A number is formatted with `options` between `prefix` and `suffix`, and updates through `AnimatedNumberReadout` when it changes. */value:string|number;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string;/** With a number `value`: host-formatted text drawn and read in place of Intl's, still moving place by place. */formattedValue?:string}
/** The receive view: the host's address and its rendered QR code. HIG ships no QR encoder. */
export interface SwapReceive {address:string;qr?:React.ReactNode;/** Host clipboard adapter. When set, the whole view copies the address. */onCopy?:()=>Promise<void>|void}
export interface SwapPanelBlockProps {
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
 onSubmit:(action:SwapAction)=>void;
 /** The host's submit is in flight: the action shows a spinner and ignores presses, the keypad, Max and Test leave the amount as it is, and the action keeps its ready name (or `submittingLabel`, or a held action's `actionStatus`) even when the host has cleared the amount meanwhile, never “Enter an amount” or the balance check. */
 submitting?:boolean;
 /** What the action says while `submitting`, in place of its ready name: Burning…. Host text. */
 submittingLabel?:string;
 /** Called after the panel clears its entry and both tokens (through `onFromChange(null)` / `onToChange(null)`), so the host can drop its quote. */
 onReset?:()=>void;
 /** On native there is no hardware keyboard to rely on, so `auto` shows the keypad; `never` hides it. */
 /** `false` fixes both amounts to `denomination` (dollars by default): the conversion capsule under each amount and the denomination setting are not shown. For hosts that only have one of the two, for example no token price. */
 denominationSwitch?:boolean;
 /** A fixed destination in place of the To token. The To card becomes compact (no picker, no amount), the panel is one-way, and the action is ready once the From side is. `onSubmit` receives `'send'`. */
 destination?:SwapDestination;
 /** Label and value rows on the bottom card, such as a staked balance or a fee tier. With no To token and no destination they are the bottom card on their own, and the panel behaves as it does for a destination. */
 details?:readonly SwapDetail[];
 /** A line under the cards: a limit, a delay, a warning. `noteTone` tints it. */
 note?:React.ReactNode;noteTone?:'muted'|'warning'|'negative';
 /** Heading above the cards, for a panel that is its own screen or sheet, drawn as the shared `ScreenHeader` (the title centred, 17/24, in a 44dp row) like every other block. `onBack` adds Back on its leading edge. Test IDs `swap-header`, `swap-back` and `swap-title`. */
 title?:string;onBack?:()=>void;
 /** With `title`: `nativeID` of the heading, so a sheet around the panel can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 /** `false` leaves the action button on its own, full width: no settings and no reset button. */
 controls?:boolean;
 /** Decoration before the action text. */
 actionIcon?:React.ReactNode;
 /** Keep a side's token fixed: its card shows the token but does not open the picker. Use with `from` / `to` or their defaults. */
 lockFrom?:boolean;lockTo?:boolean;
 /** Names the action when it is ready, in place of Send, Swap or Bridge: for example Stake, Deposit or Withdraw. The host supplies the translated text. */
 actionLabel?:string;
 /** Holds the action for a reason only the host knows: below a minimum, no quote yet, a closed market. The panel's own checks (a token, an amount, the balance) still apply first. */
 actionDisabled?:boolean;
 /** What the held action says, for example “Below minimum” or, while `submitting`, “Signing…” (a `submittingLabel` wins over it). Without it the action keeps its ready name. */
 actionStatus?:string;
 /** `destructive` for an action that cannot be undone, such as a burn. */
 actionIntent?:'primary'|'destructive';
 /** Refuses a key that would take the amount past the From balance, so the entry never reads more than the user holds. */
 limitToBalance?:boolean;
 /** Host content above the From card, such as a pending transfer. */
 banner?:React.ReactNode;
 /** Host content under the action, such as recent activity. */
 footer?:React.ReactNode;
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
export function SwapPanelBlock({tokens,fromTokens,fromTokensLoading,chains,hotTokenIds,from:fromProp,to:toProp,defaultFrom=null,defaultTo=null,onFromChange,onToChange,amount,onAmountChange,received,fee,fees,quoteLoading,slippage=0.005,onSlippageChange,denomination,onDenominationChange,wallet,onConnect,onDisconnect,recipient,onRecipientChange,onScanRecipient,receive,receiving,onReceivingChange,onSubmit,submitting=false,submittingLabel,onReset,keypad='auto',destination,details,note,noteTone='muted',title,onBack,headingId,controls=true,actionIcon,lockFrom=false,lockTo=false,actionLabel,actionDisabled=false,actionStatus,actionIntent='primary',limitToBalance=false,banner,footer,oneWay:oneWayProp=false,denominationSwitch=true,settings,view:viewProp,onViewChange,style}:SwapPanelBlockProps){
 const env=useHIG();const {direction}=env;const locale=useNumberLocale();const present=usePresentNumber();const colors=useColors();const t=useMessages();
 const [from,setFrom]=useControllable<SwapToken|null>(fromProp,defaultFrom,onFromChange);const [to,setTo]=useControllable<SwapToken|null>(toProp,defaultTo,onToChange);
 const [defaultMode,setDefaultMode]=useControllable<SwapDenomination>(denomination,'usd',onDenominationChange);
 const [isReceiving,setReceiving]=useControllable(receiving,false,onReceivingChange);
 // `amount` seeds the first render too, in the default denomination at the initial From token's price.
 const [entry,setEntry]=useState(()=>amount===undefined?'0':unitsToEntry(Number(amount)||0,defaultMode,from?.price??0));const [fromMode,setFromMode]=useState(defaultMode);const [toMode,applyToMode]=useState(defaultMode);
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
 // A destination or a details card stands in for the To token: one way, and ready from the From side alone.
 const fixed=!!destination||(!!details&&!to);const oneWay=oneWayProp||fixed;
 const eligible=!!from&&(!!to||fixed)&&!destination?.pending&&units>0&&!insufficient;const ready=eligible&&!actionDisabled;
 const readyText=actionLabel??(action==='swap'&&!fixed?t.swapActionSwap:action==='bridge'&&!fixed?t.swapActionBridge:t.swapActionSend);
 // While the host's submit is in flight the amount may already be cleared: the action keeps its name rather than asking for an amount.
 const actionText=showReceive?t.swapSendFromWallet:!from||(!to&&!fixed)?t.swapChooseToken:destination?.pending?t.swapChooseDestination:submitting?submittingLabel??(actionDisabled&&actionStatus?actionStatus:readyText):units<=0?t.swapEnterAmount:insufficient?t.swapInsufficient(from.symbol):actionDisabled&&actionStatus?actionStatus:readyText;
 const pristine=(lockFrom||!from)&&(lockTo||!to)&&input===0;
 // Updater form: several keys can land before the next render, and each must build on the last.
 const latest=useRef(fromMode);latest.current=fromMode;
 // Read at key time: several keys can land in one render.
 const limits=useRef({decimals:from?.decimals,balance:from?.balance??0,price:from?.price??0,cap:limitToBalance});limits.current={decimals:from?.decimals,balance:from?.balance??0,price:from?.price??0,cap:limitToBalance};
 const over=(next:string)=>{const {balance,price,cap}=limits.current;if(!cap||!(balance>0))return false;const value=Number(next)||0;return (latest.current==='token'?value:price>0?value/price:0)>balance;};
 // While the host's submit is in flight the keypad, Max and Test leave the amount as it is.
 const typed:typeof setEntry=next=>{if(!submitting)setEntry(next);};
 const press=(key:string)=>typed(current=>{const next=applyAmountKey(current,key,latest.current,limits.current.decimals);return key!=='back'&&over(next)?current:next;});
 const switchFromMode=(mode:SwapDenomination)=>{if(mode===fromMode)return;setEntry(mode==='usd'?trimNumber(usd,2):trimNumber(units));setFromMode(mode);};
 const changeDenomination=(mode:SwapDenomination)=>{setDefaultMode(mode);switchFromMode(mode);applyToMode(mode);};
 // A new default applies to an untouched entry at once; a typed amount keeps its denomination until reset.
 useEffect(()=>{if(input===0){setFromMode(defaultMode);applyToMode(defaultMode);}},[defaultMode]);
 const reset=()=>{setEntry('0');setFromMode(defaultMode);applyToMode(defaultMode);if(isReceiving)setReceiving(false);if(!lockFrom)setFrom(null);if(!lockTo)setTo(null);onReset?.();};
 const flip=()=>{if(!from||!to)return;setFrom(to);setTo(from);};
 const submit=()=>{if(submitting)return;if(showReceive){onConnect?.();return;}if(ready)onSubmit(fixed?'send':action);};
 // A copied address shows as a transient toast capsule (about 4s, dismissible), announced the way Toast announces any notice.
 const copyAddress=()=>{if(!receive?.onCopy)return;Promise.resolve().then(receive.onCopy).then(()=>showNotice(t.addressCopied)).catch(()=>{/* The host adapter reports its own failure. */});};
 const chainList=useMemo(()=>{if(chains)return chains;const seen=new Map<string|number,SwapChain>();for(const token of tokens)if(!seen.has(token.chainId))seen.set(token.chainId,{chainId:token.chainId,name:token.chain,icon:typeof token.chainIcon==='string'?token.chainIcon:undefined});return [...seen.values()];},[chains,tokens]);
 const usdText=(value:number)=>formatNumber(value,locale,present({style:'currency',currency:'USD'}));
 const fraction=entry.includes('.')?Math.min(entry.length-entry.indexOf('.')-1,fromMode==='usd'?2:8):0;
 const smallType={fontSize:14,lineHeight:19} as const,small={...smallType,color:colors.muted} as const;
 // Live numbers: the fee and slippage sentences keep their translated wording around a number that updates in place.
 const usdOptions={style:'currency',currency:'USD'} as const,feeKnown=!quoteLoading&&fee!=null,feeAmount=quoteLoading?'…':fee!=null?usdText(fee):'—',slippageText=formatPercent(slippage);
 // An account (a token with a `caption`) reads name over caption beside one disc, and offers Max only.
 const account=(side:'from'|'to',token:SwapToken,locked:boolean)=><>
  <View pointerEvents='none' testID={`swap-account-${side}`} style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:12}}>
   <View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants'><TokenArt uri={token.icon} symbol={token.symbol} size={40}/></View>
   <View style={{flex:1,minWidth:0}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Text style={{fontWeight:'600',lineHeight:21,flexShrink:1}}>{token.name}</Text>{locked?null:<View testID={`swap-account-chevron-${side}`}><SmallChevron color={colors.muted}/></View>}</View>
    {typeof token.caption==='object'?<AnimatedNumberReadout testID='swap-caption' {...figureProps(token.caption)} tone='muted' style={smallType}/>:<Text style={small}>{token.caption}</Text>}
   </View>
  </View>
  {side==='from'&&(token.balance??0)>0?<SwapCapsule testID='swap-max' onPress={()=>typed(unitsToEntry(token.balance??0,fromMode,fromPrice))}><Text style={small}>{t.swapMax}</Text></SwapCapsule>:null}
 </>;
 const header=(side:'from'|'to',token:SwapToken)=><>
  <View pointerEvents='none' style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'flex-start',gap:12}}>
   <View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' style={{alignItems:'center'}}>
    {[wallet?.address?<View style={{width:28,height:28,borderRadius:14,backgroundColor:addressColor(wallet.address),borderWidth:2,borderColor:colors.surface}}/>:null,token.chainIcon?<TokenArt uri={token.chainIcon} size={28} ring={colors.surface}/>:null,<TokenArt uri={token.icon} symbol={token.symbol} size={28} ring={colors.surface}/>].filter(Boolean).map((layer,index)=><View key={index} style={{marginTop:index?-14:0}}>{layer}</View>)}
   </View>
   <View style={{flex:1,minWidth:0}}>{wallet?.address?<Text style={small}>{shortAddress(wallet.address)}</Text>:null}<Text style={small}>{token.chain}</Text><Text style={{fontWeight:'600',lineHeight:21}}>{token.name}</Text></View>
  </View>
  {side==='from'?((token.balance??0)>0?<View pointerEvents='box-none' style={{alignItems:'flex-end',gap:8,maxWidth:'60%'}}>
    <View pointerEvents='box-none' style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'flex-end',gap:8}}>
     <SwapCapsule testID='swap-test' onPress={()=>typed(unitsToEntry(testAmount(token),fromMode,fromPrice))}><Text style={small}>{t.swapTest}</Text></SwapCapsule>
     <SwapCapsule testID='swap-max' onPress={()=>typed(unitsToEntry(token.balance??0,fromMode,fromPrice))}><Text style={small}>{t.swapMax}</Text></SwapCapsule>
    </View>
    <View pointerEvents='none'><AnimatedNumberReadout testID='swap-balance' value={token.balance} options={{maximumFractionDigits:6}} suffix={` ${token.symbol}`} tone='muted' style={smallType}/></View>
   </View>:null)
   :<View pointerEvents='box-none' style={{alignItems:'flex-end',gap:8,maxWidth:'60%'}}>
    <SwapCapsule testID='swap-slippage' label={t.swapSlippage(slippageText)} onPress={()=>show(onSlippageChange?'slippage':'settings')}><SwapNumberText template={t.swapSlippage} text={slippageText} value={slippage*100} formattedValue={slippageText.slice(0,-1)} suffix='%'/></SwapCapsule>
    <View pointerEvents='none'><SwapNumberText testID='swap-fee' template={t.swapFee} text={feeAmount} value={feeKnown?fee:null} options={usdOptions}/></View>
   </View>}
 </>;
 const receiveView=(view:{address:string;qr?:React.ReactNode;onCopy?:()=>Promise<void>|void})=>{
  const body=<>{view.qr?<View style={{width:132,height:132,padding:8,borderRadius:16,backgroundColor:colors.background}}>{view.qr}</View>:null}
   <View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants'><VerticalAddress address={view.address} rowHeight={addressKind(view.address)==='ethereum'?22:16}/></View></>;
  const layout:ViewStyle={flexDirection:'row',alignItems:'center',justifyContent:'space-evenly',gap:12,paddingTop:8,paddingHorizontal:16,paddingBottom:20};
  return view.onCopy?<Pressable accessibilityRole='button' accessibilityLabel={`${t.copyAddress}: ${view.address}`} testID='swap-receive' onPress={copyAddress} style={({pressed})=>[layout,{opacity:pressed?0.8:1}]}>{body}</Pressable>:<View accessible accessibilityLabel={view.address} testID='swap-receive' style={layout}>{body}</View>;
 };
 const card=(side:'from'|'to')=>{
  const token=side==='from'?from:to,label=side==='from'?t.swapFrom:t.swapTo,mode=side==='from'?fromMode:toMode,locked=side==='from'?lockFrom:lockTo;
  const cardUnits=side==='from'?units:receivedUnits,cardUsd=side==='from'?usd:receivedUsd;
  const shown=side==='from'?input:mode==='token'?receivedUnits:receivedUsd;
  const options={minimumFractionDigits:side==='from'?fraction:0,maximumFractionDigits:mode==='usd'?2:8,useGrouping:false};
  const prefix=mode==='usd'?'$':'',suffix=side==='from'&&entry.endsWith('.')?'.':'';
  return <View testID={`swap-card-${side}`} style={{backgroundColor:colors.surface,borderRadius:24,overflow:'hidden'}}><Raised>
   <View>
    {/* A locked side shows its token but offers no picker. */}
    {locked?null:<Pressable accessibilityRole='button' accessibilityLabel={t.swapSelectToken(label)} testID={`swap-slot-${side}`} onPress={()=>show(side)} style={StyleSheet.absoluteFill}/>}
    <View pointerEvents='box-none' style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:84,padding:16}}>
     {token?token.caption!==undefined?account(side,token,locked):header(side,token):<View pointerEvents='none'><Text accessible={false} style={{fontSize:40,lineHeight:46,fontWeight:'500',letterSpacing:-0.8,color:colors.faint}}>{label}…</Text></View>}
    </View>
   </View>
   {side==='from'&&showReceive&&receive?receiveView(receive):side==='to'&&showReceive?null:<View>
    {/* The slot above is the accessible control for the picker; this larger target is for touch only. */}
    {locked?null:<Pressable accessible={false} importantForAccessibility='no' testID={`swap-area-${side}`} onPress={()=>show(side)} style={StyleSheet.absoluteFill}/>}
    <View pointerEvents='box-none' style={{alignItems:'center',gap:8,paddingTop:4,paddingHorizontal:16,paddingBottom:20}}>
     <View pointerEvents='none' accessible accessibilityLabel={t.swapAmount(label)} accessibilityValue={{text:`${prefix}${formatNumber(shown,locale,options)}${suffix}`}} testID={`swap-amount-${side}`}>
      <AnimatedNumberReadout value={shown} prefix={prefix} suffix={suffix} options={options} tone={side==='to'?'muted':'text'} maxFontSizeMultiplier={1.5} style={{fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9,textAlign:'center'}}/>
     </View>
     {denominationSwitch&&<SwapCapsule label={t.swapSwitchDenomination} testID={`swap-mode-${side}`} onPress={()=>side==='from'?switchFromMode(fromMode==='usd'?'token':'usd'):applyToMode(toMode==='usd'?'token':'usd')}>
      <Text accessible={false} style={[small,{opacity:0.5}]}>=</Text>
      {mode==='token'?<AnimatedNumberReadout testID={`swap-conversion-${side}`} value={cardUsd} options={usdOptions} tone='muted' style={smallType}/>:<AnimatedNumberReadout testID={`swap-conversion-${side}`} value={cardUnits} options={{maximumFractionDigits:8,useGrouping:false}} suffix={token?` ${token.symbol}`:''} tone='muted' style={smallType}/>}
      <FlipIcon color={colors.muted} size={14}/>
     </SwapCapsule>}
    </View>
   </View>}
  </Raised></View>;
 };
 // The fixed bottom card is one compact row for the destination (artwork, where it goes, a trailing detail and fee), label and value rows, or both.
 const fixedCard=()=>{
  if(!fixed)return null;
  const art=!destination?null:destination.icon?<TokenArt uri={destination.icon} size={40}/>:destination.address?<View style={{width:40,height:40,borderRadius:20,backgroundColor:addressColor(destination.address)}}/>:<View style={{width:40,height:40,borderRadius:20,backgroundColor:colors.nested,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{destination.title.slice(0,2)}</Text></View>;
  const row=destination?<View pointerEvents='none' style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:84,padding:16}}>
   <View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants'>{art}</View>
   <View style={{flex:1,minWidth:0}}><Text testID='swap-destination-title' style={{fontWeight:destination.pending?'500':'600',lineHeight:21}}>{destination.title}</Text>{destination.subtitle?<Text style={small}>{destination.subtitle}</Text>:null}{destination.address?<Text style={small}>{shortAddress(destination.address)}</Text>:null}</View>
   {destination.detail||fee!==undefined||destination.onPress?<View style={{flexDirection:'row',alignItems:'center',gap:8,maxWidth:'60%'}}>
    <View style={{alignItems:'flex-end',gap:8,flexShrink:1}}>{typeof destination.detail==='object'?<AnimatedNumberReadout testID='swap-destination-detail' {...figureProps(destination.detail)} tone='muted' style={{...smallType,textAlign:'right'}}/>:destination.detail?<Text style={[small,{textAlign:'right'}]}>{destination.detail}</Text>:null}{fee!==undefined?<SwapNumberText testID='swap-destination-fee' align='right' template={t.swapFee} text={feeAmount} value={feeKnown?fee:null} options={usdOptions}/>:null}</View>
    {destination.onPress?<View testID='swap-destination-chevron'><SmallChevron color={colors.muted} trailing/></View>:null}
   </View>:null}
  </View>:null;
  const rows=details&&details.length>0?<View testID='swap-details' style={{gap:12,padding:16,paddingTop:destination?0:16}}>{details.map(detail=><View key={detail.label} style={{flexDirection:'row',justifyContent:'space-between',gap:12}}><Text style={{color:colors.muted,lineHeight:21}}>{detail.label}</Text>{typeof detail.value==='number'?<AnimatedNumberReadout value={detail.value} options={detail.options} prefix={detail.prefix} suffix={detail.suffix} formattedValue={detail.formattedValue} animateFormatted={!!detail.formattedValue} style={{lineHeight:21,textAlign:'right'}}/>:<Text style={{lineHeight:21,textAlign:'right',flexShrink:1}}>{detail.value}</Text>}</View>)}</View>:null;
  const shape:ViewStyle={backgroundColor:colors.surface,borderRadius:24,overflow:'hidden'};
  // With a pressable destination the whole card is the button; the rows inside it are read as part of it.
  return destination?.onPress?<Pressable accessibilityRole='button' accessibilityLabel={destination.title} testID='swap-destination' onPress={destination.onPress} style={({pressed})=>[shape,{opacity:pressed?0.85:1}]}><Raised>{row}{rows}</Raised></Pressable>:<View testID='swap-destination' style={shape}><Raised>{row}{rows}</Raised></View>;
 };
 const fromCard=card('from'),toCard=fixedCard()??card('to');
 const tone=noteTone==='warning'?colors.warning:noteTone==='negative'?colors.negative:null;
 const main=<View testID='swap-view-main'>
  {title?<View style={{marginBottom:12}}><ScreenHeader testID='swap' title={title} onBack={onBack} headingId={headingId}/></View>:null}
  {banner?<View testID='swap-banner' style={{marginBottom:8}}>{banner}</View>:null}
  {fromCard}
  <View style={{height:8,zIndex:1,alignItems:'center'}}>
   {/* A disc in the page colour breaks the seam between the cards; the control sits on it. */}
   <View style={{position:'absolute',top:-15,width:38,height:38,borderRadius:19,backgroundColor:colors.background,alignItems:'center',justifyContent:'center'}}>
    {oneWay?<View testID='swap-one-way' style={{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:colors.nested}}><DownIcon color={colors.muted}/></View>:<Pressable accessibilityRole='button' accessibilityLabel={t.swapFlip} accessibilityState={{disabled:!from||!to}} disabled={!from||!to} testID='swap-flip' onPress={flip} hitSlop={6} style={({pressed})=>({width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:!from||!to?colors.surface:colors.nested,opacity:pressed?0.85:1})}><FlipIcon color={!from||!to?colors.faint:colors.muted}/></Pressable>}
   </View>
  </View>
  {toCard}
  {note?<View testID='swap-note' style={tone?{marginTop:8,paddingVertical:12,paddingHorizontal:16,borderRadius:16,backgroundColor:withAlpha(tone,0.1)}:{marginTop:8,paddingHorizontal:4}}><Text style={{fontSize:14,lineHeight:21,color:tone??colors.muted}}>{note}</Text></View>:null}
  {!showReceive&&keypad!=='never'?<SwapKeypad onKey={press} label={t.swapKeypad} deleteLabel={t.swapDelete}/>:null}
  <View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:16}}>
   {controls?<IconButton intent='secondary' label={t.swapSettings} suppressFeedback testID='swap-settings-button' onPress={()=>show('settings')}><MenuIcon color={colors.text}/></IconButton>:null}
   {/* Button lays its children in a row: the decorative icon rides before the label and adds nothing to the name. */}
   <Button intent={actionIntent} busy={submitting} disabled={!showReceive&&!ready} testID='swap-action' onPress={submit} style={{flex:1,alignSelf:'auto'}}>{actionIcon?<View key='icon' testID='swap-action-icon' accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants'>{actionIcon}</View>:null}{actionText}</Button>
   {controls?<IconButton intent='secondary' label={t.swapReset} disabled={pristine||submitting} testID='swap-reset' onPress={reset}><ResetIcon color={colors.text}/></IconButton>:null}
  </View>
  {notice?<View style={{marginTop:8,alignItems:'center'}}><Toast notices={[notice]} onDismiss={dismissNotice}/></View>:null}
  {footer?<View testID='swap-footer' style={{marginTop:16}}>{footer}</View>:null}
 </View>;
 const body=view==='main'?main
  :view==='from'?<SwapPicker side={view} onBack={back} tokens={fromTokens??tokens} loading={fromTokensLoading} chains={chainList} hotTokenIds={hotTokenIds} selected={from} onSelect={setFrom} wallet={wallet} onConnect={onConnect} onDisconnect={onDisconnect} receiving={isReceiving} onReceivingChange={receive?setReceiving:undefined}/>
  :view==='to'?<SwapPicker side={view} onBack={back} tokens={tokens} chains={chainList} hotTokenIds={hotTokenIds} selected={to} onSelect={setTo} wallet={wallet} recipient={recipient} onRecipientChange={onRecipientChange} onScanRecipient={onScanRecipient}/>
  :<SwapSettings view={view} onViewChange={show} onBack={back} denomination={defaultMode} onDenominationChange={denominationSwitch?changeDenomination:undefined} slippage={slippage} onSlippageChange={onSlippageChange} fee={fee} fees={fees} quoteLoading={quoteLoading}>{settings}</SwapSettings>;
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

/** @deprecated Renamed `SwapPanelBlock`. The old name keeps working until the next major release. */
export const SwapPanel=SwapPanelBlock;
/** @deprecated Renamed `SwapPanelBlockProps`. */
export type SwapPanelProps=SwapPanelBlockProps;
