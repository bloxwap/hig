"use client";
import React,{useEffect,useMemo,useRef,useState} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useControllable,useHIG} from '../provider.js';
import {Button,IconButton} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {notify} from '../notify.js';
import {VerticalAddress} from '../data.js';
import {SwapPicker,type SwapWallet} from './swap/picker.js';
import {SwapSettings,type SwapFee} from './swap/settings.js';
import {SwapIcon,SwapKeypad,SwapNumber,SwapPill,percentNumber,swapArt,swapFigure,usdNumber,type SwapFigure,addressGradient,applyAmountKey,chainsOf,parentView,sanitizeAmount,shortAddress,swapAction,testAmount,trimNumber,unitsToEntry,type SwapAction,type SwapArtwork,type SwapChain,type SwapDenomination,type SwapToken,type SwapView} from './swap/shared.js';
export {swapAction,type SwapAction,type SwapArtwork,type SwapChain,type SwapDenomination,type SwapToken,type SwapView} from './swap/shared.js';
export type {SwapWallet} from './swap/picker.js';
export type {SwapFee} from './swap/settings.js';
export {SwapAmountCard,type SwapAmountCardProps} from './swap/amount-card.js';
export {SwapPill,SwapKeypad,SwapNumber,type SwapFigure} from './swap/shared.js';
/** A fixed place the assets go, in place of a token the user picks: a wallet, a staking pool, a trading account. Shown as a compact To card with no amount. */
export interface SwapDestination {
 title:string;
 /** One muted line above the title, such as the chain or a rate. */
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
/** One label and value row. A number `value` is formatted with `options` (plus `prefix` and `suffix`) and updates place by place; pass numbers for anything that can change while the card is shown. A string is drawn as given. */
export interface SwapDetail {label:string;value:string|number;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string}
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
 onSubmit:(action:SwapAction)=>void;submitting?:boolean;
 /** Called after the panel clears its entry and both tokens (through `onFromChange(null)` / `onToChange(null)`), so the host can drop its quote. */
 onReset?:()=>void;
 /** `false` fixes both amounts to `denomination` (dollars by default): the conversion capsule under each amount and the denomination setting are not shown. For hosts that only have one of the two, for example no token price. */
 denominationSwitch?:boolean;
 /** A fixed destination in place of the To token. The To card becomes compact (no picker, no amount), the panel is one-way, and the action is ready once the From side is. `onSubmit` receives `'send'`. */
 destination?:SwapDestination;
 /** Label and value rows on the bottom card, such as a staked balance or a fee tier. With no To token and no destination they are the bottom card on their own, and the panel behaves as it does for a destination. */
 details?:readonly SwapDetail[];
 /** A line under the cards: a limit, a delay, a warning. `noteTone` tints it. */
 note?:React.ReactNode;noteTone?:'muted'|'warning'|'negative';
 /** Heading above the cards, for a panel that is its own screen or sheet (“Withdraw from Papertrade”). `onBack` adds a Back control beside it. */
 title?:string;onBack?:()=>void;
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
 /** What the held action says, for example “Below minimum”. Without it the action keeps its ready name. */
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
 /** `auto` shows the keypad for a coarse pointer (touch), where there is no hardware keyboard. */
 keypad?:'auto'|'always'|'never';
 /** ⌘F / Ctrl+F opens the From picker and ⌘K / Ctrl+K the To picker while the panel is mounted. */
 shortcuts?:boolean;
 /** Digits typed anywhere on the page (outside a text field) drive the amount, not only inside the panel. */
 captureKeyboard?:boolean;
 /** The view on show. The panel pushes its token pickers and settings as views inside its own bounds; `main` is the cards. Uncontrolled when omitted. */
 view?:SwapView;onViewChange?:(view:SwapView)=>void;
 /** Host rows for the settings view, such as language or theme. */
 settings?:React.ReactNode;
 className?:string;style?:React.CSSProperties;
}
const textTarget=(target:EventTarget|null)=>{const element=target as HTMLElement|null;return !!element&&(/^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName)||element.isContentEditable);};
const amountKey=(event:{key:string;metaKey:boolean;ctrlKey:boolean;altKey:boolean})=>event.metaKey||event.ctrlKey||event.altKey?null:/^[0-9.]$/.test(event.key)?event.key:event.key==='Backspace'?'back':null;
/**
 * Send, swap and bridge in one panel: a From card and a To card joined by a flip control, an amount entered in dollars
 * or token units, token pickers, settings, and one action that names itself from the chosen pair.
 * Presentation only. The host owns tokens, balances, prices, the quote, the wallet and the transaction.
 */
export function SwapPanelBlock({tokens,fromTokens,fromTokensLoading,chains,hotTokenIds,from:fromProp,to:toProp,defaultFrom=null,defaultTo=null,onFromChange,onToChange,amount,onAmountChange,received,fee,fees,quoteLoading,slippage=0.005,onSlippageChange,denomination,onDenominationChange,wallet,onConnect,onDisconnect,recipient,onRecipientChange,onScanRecipient,receive,receiving,onReceivingChange,onSubmit,submitting=false,onReset,destination,details,note,noteTone='muted',title,onBack,controls=true,actionIcon,lockFrom=false,lockTo=false,actionLabel,actionDisabled=false,actionStatus,actionIntent='primary',limitToBalance=false,banner,footer,oneWay:oneWayProp=false,denominationSwitch=true,keypad='auto',shortcuts=true,captureKeyboard=false,view:viewProp,onViewChange,settings,className,style}:SwapPanelBlockProps){
 const {messages}=useHIG();
 const [from,setFrom]=useControllable<SwapToken|null>(fromProp,defaultFrom,onFromChange);const [to,setTo]=useControllable<SwapToken|null>(toProp,defaultTo,onToChange);
 const [defaultMode,setDefaultMode]=useControllable<SwapDenomination>(denomination,'usd',onDenominationChange);
 const [isReceiving,setReceiving]=useControllable(receiving,false,onReceivingChange);
 // A mounted `amount` seeds the entry, in the default denomination at the initial From token's price.
 const [entry,setEntry]=useState(()=>amount===undefined?'0':unitsToEntry(Number(amount)||0,defaultMode,from?.price??0));const [fromMode,applyFromMode]=useState(defaultMode);const [toMode,applyToMode]=useState(defaultMode);
 const [view,show]=useControllable<SwapView>(viewProp,'main',onViewChange);const root=useRef<HTMLElement>(null);const previous=useRef<SwapView>('main');
 const openPicker=(side:'from'|'to')=>show(side);const back=()=>show(parentView(view));
 // A push slides in from the trailing edge and a pop from the leading edge. Popping to the cards returns focus to the control that pushed.
 const direction=view==='main'||(view==='settings'&&previous.current!=='main')?'pop':'push';
 useEffect(()=>{const from=previous.current;previous.current=view;if(view!=='main'||from==='main')return;root.current?.querySelector<HTMLElement>(from==='from'||from==='to'?`[data-side='${from}'] .hig-swap-hit`:'.hig-swap-settings-button')?.focus();},[view]);
 const [touch,setTouch]=useState(false);const [hint,showHint]=useState<'mac'|'pc'|null>(null);const [copied,setCopied]=useState('');
 useEffect(()=>{
  const coarse=window.matchMedia?.('(pointer: coarse)');const update=()=>setTouch(!!coarse?.matches);update();coarse?.addEventListener('change',update);
  if(window.matchMedia?.('(hover: hover) and (pointer: fine)').matches)showHint(/Mac|iPhone|iPad/.test(navigator.platform)?'mac':'pc');
  return()=>coarse?.removeEventListener('change',update);
 },[]);
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
 const actionText=showReceive?(messages.swapSendFromWallet??en.swapSendFromWallet):!from||(!to&&!fixed)?(messages.swapChooseToken??en.swapChooseToken):destination?.pending?(messages.swapChooseDestination??en.swapChooseDestination):units<=0?(messages.swapEnterAmount??en.swapEnterAmount):insufficient?(messages.swapInsufficient??en.swapInsufficient)(from.symbol):actionDisabled&&actionStatus?actionStatus:actionLabel??(action==='swap'&&!fixed?messages.swapActionSwap??en.swapActionSwap:action==='bridge'&&!fixed?messages.swapActionBridge??en.swapActionBridge:messages.swapActionSend??en.swapActionSend);
 const pristine=(lockFrom||!from)&&(lockTo||!to)&&input===0;
 // Updater form: several keys can land before the next render, and each must build on the last.
 const latest=useRef(fromMode);latest.current=fromMode;const latestView=useRef(view);latestView.current=view;
 // Read at key time: several keys can land in one render.
 const limits=useRef({decimals:from?.decimals,balance:from?.balance??0,price:fromPrice,cap:limitToBalance});limits.current={decimals:from?.decimals,balance:from?.balance??0,price:fromPrice,cap:limitToBalance};
 const over=(next:string)=>{const {balance,price,cap}=limits.current;if(!cap||!(balance>0))return false;const value=Number(next)||0;return (latest.current==='token'?value:price>0?value/price:0)>balance;};
 const press=(key:string)=>setEntry(current=>{const next=applyAmountKey(current,key,latest.current,limits.current.decimals);return key!=='back'&&over(next)?current:next;});
 const paste=(text:string)=>{const clean=text.trim().replace(/,/g,'');if(clean===''||!/^[0-9]*\.?[0-9]*$/.test(clean))return false;const next=sanitizeAmount(clean);setEntry(latest.current==='usd'?trimNumber(Number(next)||0,2):next);return true;};
 const switchFromMode=(mode:SwapDenomination)=>{if(mode===fromMode)return;setEntry(mode==='usd'?trimNumber(usd,2):trimNumber(units));applyFromMode(mode);};
 const changeDenomination=(mode:SwapDenomination)=>{setDefaultMode(mode);switchFromMode(mode);applyToMode(mode);};
 // A new default applies to an untouched entry at once; a typed amount keeps its denomination until reset.
 useEffect(()=>{if(input===0){applyFromMode(defaultMode);applyToMode(defaultMode);}},[defaultMode]);
 const reset=()=>{setEntry('0');applyFromMode(defaultMode);applyToMode(defaultMode);if(isReceiving)setReceiving(false);if(!lockFrom)setFrom(null);if(!lockTo)setTo(null);onReset?.();};
 const flip=()=>{if(!from||!to)return;setFrom(to);setTo(from);};
 const submit=()=>{if(submitting)return;if(showReceive){onConnect?.();return;}if(ready)onSubmit(fixed?'send':action);};
 const copyAddress=()=>{if(!receive?.onCopy)return;Promise.resolve().then(receive.onCopy).then(()=>{const text=(messages.addressCopied??en.addressCopied);setCopied(notify(text,{severity:'success',id:'hig-swap-address',dismissName:(messages.dismissNotice??en.dismissNotice)(text,(messages.dismiss??en.dismiss))})?text:'');}).catch(()=>setCopied(''));};
 useEffect(()=>{
  if(!shortcuts&&!captureKeyboard)return;
  const onKeyDown=(event:KeyboardEvent)=>{
   const key=event.key.toLowerCase();
   if(shortcuts&&(event.metaKey||event.ctrlKey)&&!event.altKey&&!event.shiftKey&&(key==='f'||key==='k')){const side=key==='f'?'from':'to';if(side==='from'?lockFrom:lockTo||fixed)return;event.preventDefault();show(side);return;}
   if(!captureKeyboard||event.defaultPrevented||textTarget(event.target)||latestView.current!=='main')return;
   const pressed=amountKey(event);if(pressed){event.preventDefault();press(pressed);}
  };
  const onPaste=(event:ClipboardEvent)=>{if(captureKeyboard&&!event.defaultPrevented&&!textTarget(event.target)&&paste(event.clipboardData?.getData('text')??''))event.preventDefault();};
  window.addEventListener('keydown',onKeyDown);document.addEventListener('paste',onPaste);
  return()=>{window.removeEventListener('keydown',onKeyDown);document.removeEventListener('paste',onPaste);};
 },[shortcuts,captureKeyboard,lockFrom,lockTo,fixed]);
 // Keys typed while focus is inside the cards drive the amount; in a pushed view Escape pops it.
 const inPanel=(event:React.SyntheticEvent)=>view==='main'&&!textTarget(event.target);
 const onKeyDown=(event:React.KeyboardEvent)=>{if(view!=='main'&&event.key==='Escape'){event.preventDefault();event.stopPropagation();back();return;}if(captureKeyboard||!inPanel(event))return;const pressed=amountKey(event);if(pressed){event.preventDefault();press(pressed);}};
 const onPaste=(event:React.ClipboardEvent)=>{if(!captureKeyboard&&inPanel(event)&&paste(event.clipboardData.getData('text')))event.preventDefault();};
 const chainList=useMemo(()=>chains??chainsOf(tokens),[chains,tokens]);
 // The fee keeps its sentence; only a known amount moves. Loading and unknown are plain placeholders.
 const feeLine=quoteLoading||fee==null?(messages.swapFee??en.swapFee)(quoteLoading?'…':'—'):<SwapNumber template={messages.swapFee??en.swapFee} {...usdNumber(fee)}/>;
 const fraction=entry.includes('.')?Math.min(entry.length-entry.indexOf('.')-1,fromMode==='usd'?2:8):0;
 // An account (a token with a `caption`) reads name over caption beside one disc, and offers Max only.
 const account=(side:'from'|'to',token:SwapToken,locked:boolean)=><div className='hig-swap-selected' data-account='true'>
  <span className='hig-swap-stack' aria-hidden='true'>{token.icon?swapArt(token.icon):<span className='hig-swap-initials'>{token.symbol.slice(0,3)}</span>}</span>
  <span className='hig-swap-identity'><strong>{token.name}{!locked&&<SwapIcon name='expand' size={16}/>}</strong><span>{swapFigure(token.caption??'')}</span></span>
  {side==='from'&&(token.balance??0)>0&&<span className='hig-swap-meta'><SwapPill onClick={()=>setEntry(unitsToEntry(token.balance??0,fromMode,fromPrice))}>{(messages.swapMax??en.swapMax)}</SwapPill></span>}
 </div>;
 const header=(side:'from'|'to',token:SwapToken)=><div className='hig-swap-selected'>
  <span className='hig-swap-stack' aria-hidden='true'>{wallet?.address&&<span className='hig-swap-avatar' style={{background:addressGradient(wallet.address)}}/>}{token.chainIcon&&swapArt(token.chainIcon)}{token.icon?swapArt(token.icon):<span className='hig-swap-initials'>{token.symbol.slice(0,3)}</span>}</span>
  <span className='hig-swap-identity'>{wallet?.address&&<span>{shortAddress(wallet.address)}</span>}<span>{token.chain}</span><strong>{token.name}</strong></span>
  {side==='from'?(token.balance??0)>0&&<span className='hig-swap-meta'><span className='hig-swap-pills'><SwapPill onClick={()=>setEntry(unitsToEntry(testAmount(token),fromMode,fromPrice))}><SwapIcon name='flask' size={14}/>{(messages.swapTest??en.swapTest)}</SwapPill><SwapPill onClick={()=>setEntry(unitsToEntry(token.balance??0,fromMode,fromPrice))}>{(messages.swapMax??en.swapMax)}</SwapPill></span><SwapNumber value={token.balance} suffix={' '+token.symbol} options={{maximumFractionDigits:6}}/></span>
   :<span className='hig-swap-meta'><SwapPill onClick={()=>show(onSlippageChange?'slippage':'settings')}><SwapIcon name='sliders' size={14}/><SwapNumber template={messages.swapSlippage??en.swapSlippage} {...percentNumber(slippage)}/></SwapPill><span>{feeLine}</span></span>}
 </div>;
 const receiveView=(view:SwapReceive)=>{const content=<>{view.qr&&<span className='hig-swap-qr'>{view.qr}</span>}<VerticalAddress address={view.address}/></>;return view.onCopy?<button type='button' className='hig-swap-receive' aria-label={(messages.copyAddress??en.copyAddress)+': '+view.address} onClick={copyAddress}>{content}</button>:<div className='hig-swap-receive'>{content}</div>;};
 const card=(side:'from'|'to')=>{
  const token=side==='from'?from:to,label=side==='from'?(messages.swapFrom??en.swapFrom):(messages.swapTo??en.swapTo),mode=side==='from'?fromMode:toMode,locked=side==='from'?lockFrom:lockTo;
  const cardUnits=side==='from'?units:receivedUnits,cardUsd=side==='from'?usd:receivedUsd;
  const shown=side==='from'?input:mode==='token'?receivedUnits:receivedUsd;
  return <div className='hig-swap-card' data-side={side} data-locked={locked||undefined}>
   <div className='hig-swap-slot'>
    {!locked&&<button type='button' className='hig-swap-hit' aria-label={(messages.swapSelectToken??en.swapSelectToken)(label)} onClick={()=>openPicker(side)}/>}
    <div className='hig-swap-slot-content'>{token?token.caption!==undefined?account(side,token,locked):header(side,token):<><span className='hig-swap-placeholder'>{label}…</span>{shortcuts&&hint&&!locked&&<kbd className='hig-swap-kbd'>{hint==='mac'?'⌘':messages.swapControlKey??en.swapControlKey} {side==='from'?'F':'K'}</kbd>}</>}</div>
   </div>
   {side==='from'&&showReceive&&receive?receiveView(receive):
    !(side==='to'&&showReceive)&&<div className='hig-swap-amount-area'>
     {!locked&&<button type='button' className='hig-swap-hit' tabIndex={-1} aria-hidden='true' onClick={()=>openPicker(side)}/>}
     <div className='hig-swap-amount-content'>
      <div className='hig-swap-amount' data-muted={side==='to'||undefined} {...(side==='from'?{role:'textbox',tabIndex:0,'aria-label':(messages.swapAmount??en.swapAmount)(label)}:{})}>
       <AnimatedNumberReadout value={shown} label={side==='to'?(messages.swapAmount??en.swapAmount)(label):undefined} prefix={mode==='usd'?'$':''} suffix={side==='from'&&entry.endsWith('.')?'.':''} options={{minimumFractionDigits:side==='from'?fraction:0,maximumFractionDigits:mode==='usd'?2:8,useGrouping:false}}/>
      </div>
      {denominationSwitch&&<SwapPill aria-label={(messages.swapSwitchDenomination??en.swapSwitchDenomination)} onClick={()=>side==='from'?switchFromMode(fromMode==='usd'?'token':'usd'):applyToMode(toMode==='usd'?'token':'usd')}>
       <span aria-hidden='true' className='hig-swap-equals'>=</span>
       {mode==='token'?<AnimatedNumberReadout value={cardUsd} options={{style:'currency',currency:'USD'}}/>:<AnimatedNumberReadout value={cardUnits} suffix={token?` ${token.symbol}`:''} options={{maximumFractionDigits:8,useGrouping:false}}/>}
       <SwapIcon name='flip' size={14}/>
      </SwapPill>}
     </div>
    </div>}
  </div>;
 };
 // The fixed bottom card is one compact row for the destination (artwork, where it goes, a trailing detail and fee), label and value rows, or both.
 const fixedCard=fixed&&<div className='hig-swap-card' data-side='to' data-compact='true' data-pending={destination?.pending||undefined}>
  {destination&&<div className='hig-swap-slot'>
   {destination.onPress&&<button type='button' className='hig-swap-hit' aria-label={destination.title} onClick={destination.onPress}/>}
   <div className='hig-swap-slot-content'><div className='hig-swap-selected'>
    <span className='hig-swap-stack' aria-hidden='true'>{destination.icon?swapArt(destination.icon):destination.address?<span className='hig-swap-avatar' style={{background:addressGradient(destination.address)}}/>:<span className='hig-swap-initials'>{destination.title.slice(0,2)}</span>}</span>
    <span className='hig-swap-identity'><strong>{destination.title}</strong>{destination.subtitle&&<span>{destination.subtitle}</span>}{destination.address&&<span>{shortAddress(destination.address)}</span>}</span>
    {(destination.detail||fee!==undefined||destination.onPress)&&<span className='hig-swap-meta' data-row={destination.onPress?'true':undefined}><span>{destination.detail&&<span>{swapFigure(destination.detail)}</span>}{fee!==undefined&&<span>{feeLine}</span>}</span>{destination.onPress&&<SwapIcon name='chevron' size={16}/>}</span>}
   </div></div>
  </div>}
  {details&&details.length>0&&<dl className='hig-swap-details'>{details.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{typeof row.value==='number'?<SwapNumber value={row.value} options={row.options} prefix={row.prefix} suffix={row.suffix}/>:row.value}</dd></div>)}</dl>}
 </div>;
 const fromCard=card('from'),toCard=fixedCard||card('to');
 const body=view==='main'?<>
  {title&&<div className='hig-swap-view-header' data-plain={onBack?undefined:'true'}>{onBack&&<button type='button' className='hig-swap-back' aria-label={messages.back??en.back} onClick={onBack}><SwapIcon name='back'/><PressDecoration kind='back'/></button>}<h2 className='hig-swap-view-title'>{title}</h2></div>}
  {banner}
  {fromCard}
  <div className='hig-swap-flip'>{oneWay?<span aria-hidden='true'><SwapIcon name='down' size={16}/></span>:<button type='button' aria-label={(messages.swapFlip??en.swapFlip)} disabled={!from||!to} onClick={flip}><SwapIcon name='flip' size={16}/></button>}</div>
  {toCard}
  {!showReceive&&(keypad==='always'||(keypad==='auto'&&touch))&&<SwapKeypad onKey={press} label={(messages.swapKeypad??en.swapKeypad)} deleteLabel={(messages.swapDelete??en.swapDelete)}/>}
  {note&&<p className='hig-swap-note' data-tone={noteTone} role='note'>{note}</p>}
  <div className='hig-swap-actions'>
   {controls&&<IconButton className='hig-swap-settings-button' intent='secondary' label={(messages.swapSettings??en.swapSettings)} suppressFeedback onClick={()=>show('settings')}><SwapIcon name='menu'/></IconButton>}
   <Button fullWidth intent={actionIntent} busy={submitting} disabled={!showReceive&&!ready} onClick={submit}>{actionIcon}{actionText}</Button>
   {controls&&<IconButton intent='secondary' label={(messages.swapReset??en.swapReset)} disabled={pristine||submitting} onClick={reset}><SwapIcon name='reset'/></IconButton>}
  </div>
  {footer}
 </>:view==='from'?<SwapPicker side={view} onBack={back} tokens={fromTokens??tokens} loading={fromTokensLoading} chains={chainList} hotTokenIds={hotTokenIds} selected={from} onSelect={setFrom} wallet={wallet} onConnect={onConnect} onDisconnect={onDisconnect} receiving={isReceiving} onReceivingChange={receive?setReceiving:undefined}/>
 :view==='to'?<SwapPicker side={view} onBack={back} tokens={tokens} chains={chainList} hotTokenIds={hotTokenIds} selected={to} onSelect={setTo} wallet={wallet} recipient={recipient} onRecipientChange={onRecipientChange} onScanRecipient={onScanRecipient}/>
 :<SwapSettings view={view} onViewChange={show} onBack={back} denomination={defaultMode} onDenominationChange={denominationSwitch?changeDenomination:undefined} slippage={slippage} onSlippageChange={onSlippageChange} fee={fee} fees={fees} quoteLoading={quoteLoading}>{settings}</SwapSettings>;
 return <section ref={root} className={`hig-swap-panel${className?` ${className}`:''}`} style={style} data-view={view} data-receiving={showReceive||undefined} onKeyDown={onKeyDown} onPaste={onPaste}>
  <div key={view} className='hig-swap-view' data-direction={direction}>{body}</div>
  <p className='hig-sr-only' role='status'>{copied}</p>
 </section>;
}

/** @deprecated Renamed `SwapPanelBlock`. The old name and the `blocks/swap-panel` and `recipes/swap-panel` import paths keep working until the next major release. */
export const SwapPanel=SwapPanelBlock;
/** @deprecated Renamed `SwapPanelBlockProps`. */
export type SwapPanelProps=SwapPanelBlockProps;
