"use client";
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import * as en from '@bloxwap/hig/contracts/messages';
import {useControllable,useHIG} from '../provider.js';
import {Button,IconButton} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {notify} from '../notify.js';
import {VerticalAddress} from '../data.js';
import {SwapPicker,type SwapWallet} from './swap/picker.js';
import {SwapSettings,type SwapFee} from './swap/settings.js';
import {SwapIcon,SwapKeypad,SwapPill,addressGradient,applyAmountKey,formatPercent,parentView,sanitizeAmount,shortAddress,swapAction,testAmount,trimNumber,unitsToEntry,type SwapAction,type SwapChain,type SwapDenomination,type SwapToken,type SwapView} from './swap/shared.js';
export {swapAction,type SwapAction,type SwapChain,type SwapDenomination,type SwapToken,type SwapView} from './swap/shared.js';
export type {SwapWallet} from './swap/picker.js';
export type {SwapFee} from './swap/settings.js';
export {SwapAmountCard,type SwapAmountCardProps} from './swap/amount-card.js';
export {SwapPill,SwapKeypad} from './swap/shared.js';
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
export function SwapPanel({tokens,fromTokens,fromTokensLoading,chains,hotTokenIds,from:fromProp,to:toProp,defaultFrom=null,defaultTo=null,onFromChange,onToChange,amount,onAmountChange,received,fee,fees,quoteLoading,slippage=0.005,onSlippageChange,denomination,onDenominationChange,wallet,onConnect,onDisconnect,recipient,onRecipientChange,onScanRecipient,receive,receiving,onReceivingChange,onSubmit,submitting=false,onReset,oneWay=false,keypad='auto',shortcuts=true,captureKeyboard=false,view:viewProp,onViewChange,settings,className,style}:SwapPanelProps){
 const {messages,locale}=useHIG();
 const [from,setFrom]=useControllable<SwapToken|null>(fromProp,defaultFrom,onFromChange);const [to,setTo]=useControllable<SwapToken|null>(toProp,defaultTo,onToChange);
 const [defaultMode,setDefaultMode]=useControllable<SwapDenomination>(denomination,'usd',onDenominationChange);
 const [isReceiving,setReceiving]=useControllable(receiving,false,onReceivingChange);
 const [entry,setEntry]=useState('0');const [fromMode,applyFromMode]=useState(defaultMode);const [toMode,applyToMode]=useState(defaultMode);
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
 const ready=!!from&&!!to&&units>0&&!insufficient;
 const actionText=showReceive?(messages.swapSendFromWallet??en.swapSendFromWallet):!from||!to?(messages.swapChooseToken??en.swapChooseToken):units<=0?(messages.swapEnterAmount??en.swapEnterAmount):insufficient?(messages.swapInsufficient??en.swapInsufficient)(from.symbol):(action==='swap'?messages.swapActionSwap??en.swapActionSwap:action==='bridge'?messages.swapActionBridge??en.swapActionBridge:messages.swapActionSend??en.swapActionSend);
 const pristine=!from&&!to&&input===0;
 // Updater form: several keys can land before the next render, and each must build on the last.
 const latest=useRef(fromMode);latest.current=fromMode;const latestView=useRef(view);latestView.current=view;
 const press=(key:string)=>setEntry(current=>applyAmountKey(current,key,latest.current));
 const paste=(text:string)=>{const clean=text.trim().replace(/,/g,'');if(clean===''||!/^[0-9]*\.?[0-9]*$/.test(clean))return false;const next=sanitizeAmount(clean);setEntry(latest.current==='usd'?trimNumber(Number(next)||0,2):next);return true;};
 const switchFromMode=(mode:SwapDenomination)=>{if(mode===fromMode)return;setEntry(mode==='usd'?trimNumber(usd,2):trimNumber(units));applyFromMode(mode);};
 const changeDenomination=(mode:SwapDenomination)=>{setDefaultMode(mode);switchFromMode(mode);applyToMode(mode);};
 // A new default applies to an untouched entry at once; a typed amount keeps its denomination until reset.
 useEffect(()=>{if(input===0){applyFromMode(defaultMode);applyToMode(defaultMode);}},[defaultMode]);
 const reset=()=>{setEntry('0');applyFromMode(defaultMode);applyToMode(defaultMode);if(isReceiving)setReceiving(false);setFrom(null);setTo(null);onReset?.();};
 const flip=()=>{if(!from||!to)return;setFrom(to);setTo(from);};
 const submit=()=>{if(submitting)return;if(showReceive){onConnect?.();return;}if(ready)onSubmit(action);};
 const copyAddress=()=>{if(!receive?.onCopy)return;Promise.resolve().then(receive.onCopy).then(()=>{const text=(messages.addressCopied??en.addressCopied);setCopied(notify(text,{severity:'success',id:'hig-swap-address',dismissName:(messages.dismissNotice??en.dismissNotice)(text,(messages.dismiss??en.dismiss))})?text:'');}).catch(()=>setCopied(''));};
 useEffect(()=>{
  if(!shortcuts&&!captureKeyboard)return;
  const onKeyDown=(event:KeyboardEvent)=>{
   const key=event.key.toLowerCase();
   if(shortcuts&&(event.metaKey||event.ctrlKey)&&!event.altKey&&!event.shiftKey&&(key==='f'||key==='k')){event.preventDefault();show(key==='f'?'from':'to');return;}
   if(!captureKeyboard||event.defaultPrevented||textTarget(event.target)||latestView.current!=='main')return;
   const pressed=amountKey(event);if(pressed){event.preventDefault();press(pressed);}
  };
  const onPaste=(event:ClipboardEvent)=>{if(captureKeyboard&&!event.defaultPrevented&&!textTarget(event.target)&&paste(event.clipboardData?.getData('text')??''))event.preventDefault();};
  window.addEventListener('keydown',onKeyDown);document.addEventListener('paste',onPaste);
  return()=>{window.removeEventListener('keydown',onKeyDown);document.removeEventListener('paste',onPaste);};
 },[shortcuts,captureKeyboard]);
 // Keys typed while focus is inside the cards drive the amount; in a pushed view Escape pops it.
 const inPanel=(event:React.SyntheticEvent)=>view==='main'&&!textTarget(event.target);
 const onKeyDown=(event:React.KeyboardEvent)=>{if(view!=='main'&&event.key==='Escape'){event.preventDefault();event.stopPropagation();back();return;}if(captureKeyboard||!inPanel(event))return;const pressed=amountKey(event);if(pressed){event.preventDefault();press(pressed);}};
 const onPaste=(event:React.ClipboardEvent)=>{if(!captureKeyboard&&inPanel(event)&&paste(event.clipboardData.getData('text')))event.preventDefault();};
 const chainList=useMemo(()=>{if(chains)return chains;const seen=new Map<string|number,SwapChain>();for(const token of tokens)if(!seen.has(token.chainId))seen.set(token.chainId,{chainId:token.chainId,name:token.chain,icon:token.chainIcon});return [...seen.values()];},[chains,tokens]);
 const usdText=(value:number)=>formatNumber(value,locale,{style:'currency',currency:'USD'});
 const fraction=entry.includes('.')?Math.min(entry.length-entry.indexOf('.')-1,fromMode==='usd'?2:8):0;
 const header=(side:'from'|'to',token:SwapToken)=><div className='hig-swap-selected'>
  <span className='hig-swap-stack' aria-hidden='true'>{wallet?.address&&<span className='hig-swap-avatar' style={{background:addressGradient(wallet.address)}}/>}{token.chainIcon&&<img src={token.chainIcon} alt=''/>}{token.icon?<img src={token.icon} alt=''/>:<span className='hig-swap-initials'>{token.symbol.slice(0,3)}</span>}</span>
  <span className='hig-swap-identity'>{wallet?.address&&<span>{shortAddress(wallet.address)}</span>}<span>{token.chain}</span><strong>{token.name}</strong></span>
  {side==='from'?(token.balance??0)>0&&<span className='hig-swap-meta'><span className='hig-swap-pills'><SwapPill onClick={()=>setEntry(unitsToEntry(testAmount(token),fromMode,fromPrice))}><SwapIcon name='flask' size={14}/>{(messages.swapTest??en.swapTest)}</SwapPill><SwapPill onClick={()=>setEntry(unitsToEntry(token.balance??0,fromMode,fromPrice))}>{(messages.swapMax??en.swapMax)}</SwapPill></span><span className='hig-number'>{formatNumber(token.balance,locale,{maximumFractionDigits:6})} {token.symbol}</span></span>
   :<span className='hig-swap-meta'><SwapPill onClick={()=>show(onSlippageChange?'slippage':'settings')}><SwapIcon name='sliders' size={14}/>{(messages.swapSlippage??en.swapSlippage)(formatPercent(slippage))}</SwapPill><span>{(messages.swapFee??en.swapFee)(quoteLoading?'…':fee!=null?usdText(fee):'—')}</span></span>}
 </div>;
 const receiveView=(view:SwapReceive)=>{const content=<>{view.qr&&<span className='hig-swap-qr'>{view.qr}</span>}<VerticalAddress address={view.address}/></>;return view.onCopy?<button type='button' className='hig-swap-receive' aria-label={(messages.copyAddress??en.copyAddress)+': '+view.address} onClick={copyAddress}>{content}</button>:<div className='hig-swap-receive'>{content}</div>;};
 const card=(side:'from'|'to')=>{
  const token=side==='from'?from:to,label=side==='from'?(messages.swapFrom??en.swapFrom):(messages.swapTo??en.swapTo),mode=side==='from'?fromMode:toMode;
  const cardUnits=side==='from'?units:receivedUnits,cardUsd=side==='from'?usd:receivedUsd;
  const shown=side==='from'?input:mode==='token'?receivedUnits:receivedUsd;
  return <div className='hig-swap-card' data-side={side}>
   <div className='hig-swap-slot'>
    <button type='button' className='hig-swap-hit' aria-label={(messages.swapSelectToken??en.swapSelectToken)(label)} onClick={()=>openPicker(side)}/>
    <div className='hig-swap-slot-content'>{token?header(side,token):<><span className='hig-swap-placeholder'>{label}…</span>{shortcuts&&hint&&<kbd className='hig-swap-kbd'>{hint==='mac'?'⌘':messages.swapControlKey??en.swapControlKey} {side==='from'?'F':'K'}</kbd>}</>}</div>
   </div>
   {side==='from'&&showReceive&&receive?receiveView(receive):
    !(side==='to'&&showReceive)&&<div className='hig-swap-amount-area'>
     <button type='button' className='hig-swap-hit' tabIndex={-1} aria-hidden='true' onClick={()=>openPicker(side)}/>
     <div className='hig-swap-amount-content'>
      <div className='hig-swap-amount' data-muted={side==='to'||undefined} {...(side==='from'?{role:'textbox',tabIndex:0,'aria-label':(messages.swapAmount??en.swapAmount)(label)}:{})}>
       <AnimatedNumberReadout value={shown} label={side==='to'?(messages.swapAmount??en.swapAmount)(label):undefined} prefix={mode==='usd'?'$':''} suffix={side==='from'&&entry.endsWith('.')?'.':''} options={{minimumFractionDigits:side==='from'?fraction:0,maximumFractionDigits:mode==='usd'?2:8,useGrouping:false}}/>
      </div>
      <SwapPill aria-label={(messages.swapSwitchDenomination??en.swapSwitchDenomination)} onClick={()=>side==='from'?switchFromMode(fromMode==='usd'?'token':'usd'):applyToMode(toMode==='usd'?'token':'usd')}>
       <span aria-hidden='true' className='hig-swap-equals'>=</span>
       {mode==='token'?<AnimatedNumberReadout value={cardUsd} options={{style:'currency',currency:'USD'}}/>:<AnimatedNumberReadout value={cardUnits} suffix={token?` ${token.symbol}`:''} options={{maximumFractionDigits:8,useGrouping:false}}/>}
       <SwapIcon name='flip' size={14}/>
      </SwapPill>
     </div>
    </div>}
  </div>;
 };
 const fromCard=card('from'),toCard=card('to');
 const body=view==='main'?<>
  {fromCard}
  <div className='hig-swap-flip'>{oneWay?<span aria-hidden='true'><SwapIcon name='down' size={16}/></span>:<button type='button' aria-label={(messages.swapFlip??en.swapFlip)} disabled={!from||!to} onClick={flip}><SwapIcon name='flip' size={16}/></button>}</div>
  {toCard}
  {!showReceive&&(keypad==='always'||(keypad==='auto'&&touch))&&<SwapKeypad onKey={press} label={(messages.swapKeypad??en.swapKeypad)} deleteLabel={(messages.swapDelete??en.swapDelete)}/>}
  <div className='hig-swap-actions'>
   <IconButton className='hig-swap-settings-button' intent='secondary' label={(messages.swapSettings??en.swapSettings)} suppressFeedback onClick={()=>show('settings')}><SwapIcon name='menu'/></IconButton>
   <Button fullWidth busy={submitting} disabled={!showReceive&&!ready} onClick={submit}>{actionText}</Button>
   <IconButton intent='secondary' label={(messages.swapReset??en.swapReset)} disabled={pristine||submitting} onClick={reset}><SwapIcon name='reset'/></IconButton>
  </div>
 </>:view==='from'?<SwapPicker side={view} onBack={back} tokens={fromTokens??tokens} loading={fromTokensLoading} chains={chainList} hotTokenIds={hotTokenIds} selected={from} onSelect={setFrom} wallet={wallet} onConnect={onConnect} onDisconnect={onDisconnect} receiving={isReceiving} onReceivingChange={receive?setReceiving:undefined}/>
 :view==='to'?<SwapPicker side={view} onBack={back} tokens={tokens} chains={chainList} hotTokenIds={hotTokenIds} selected={to} onSelect={setTo} wallet={wallet} recipient={recipient} onRecipientChange={onRecipientChange} onScanRecipient={onScanRecipient}/>
 :<SwapSettings view={view} onViewChange={show} onBack={back} denomination={defaultMode} onDenominationChange={changeDenomination} slippage={slippage} onSlippageChange={onSlippageChange} fee={fee} fees={fees} quoteLoading={quoteLoading}>{settings}</SwapSettings>;
 return <section ref={root} className={`hig-swap-panel${className?` ${className}`:''}`} style={style} data-view={view} data-receiving={showReceive||undefined} onKeyDown={onKeyDown} onPaste={onPaste}>
  <div key={view} className='hig-swap-view' data-direction={direction}>{body}</div>
  <p className='hig-sr-only' role='status'>{copied}</p>
 </section>;
}
