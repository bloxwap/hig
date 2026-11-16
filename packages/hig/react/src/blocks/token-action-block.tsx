"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import * as en from '@bloxwap/hig/contracts/messages';
import type {HIGMessages} from '@bloxwap/hig/contracts/messages';
import {useHIG,useNumberLocale} from '../provider.js';
import {Button} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {BarMark,type BarMarkElement} from '../bar-mark.js';
import {ScreenHeader} from './screen-header.js';
export type {BarMarkElement,BarMarkFigure,BarMarkTone} from '../bar-mark.js';
/** Actions with a built-in, translated label. */
export type TokenActionId='send'|'receive'|'stake'|'unstake';
export interface TokenAction {
 /** `send`, `receive`, `stake` and `unstake` take a built-in label; any other id needs `label`. */
 id:TokenActionId|(string&{});
 label?:string;onSelect:()=>void;disabled?:boolean;
 /** Defaults to `secondary`: the card offers equal choices, so no action is the primary one unless the host says so. */
 intent?:'primary'|'secondary'|'destructive';
}
export interface TokenActionBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading, usually the ticker: HYPE. */
 symbol:string;
 /** Title of the assets bar: Hyperliquid. Needed only with `assets`; the symbol stands in without it. */
 name?:string;
 /** Total holding in dollars, on the trailing edge of the assets bar. Defaults to the sum of the asset values; `null` reads as unknown. */
 value?:number|null;
 /** The holding in token units, for a token with no dollar value: with `value` left out or `null` it is drawn in place of the dollar total. */
 units?:number|null;
 /** Host text after the units, such as ` BLOX`. */
 unitsSuffix?:string;
 /** Format of the units. Defaults to at most six fraction digits. */
 unitsOptions?:Intl.NumberFormatOptions;
 /** Where the token is held: Staked, Core, Paper. Leave it out to draw no assets bar. */
 assets?:readonly BarMarkElement[];
 /** The chains the token sits on. Leave it out to draw no chains bar. */
 chains?:readonly BarMarkElement[];
 /** Title of the chains bar. Defaults to the built-in “Chains”. */
 chainsTitle?:string;
 actions:readonly TokenAction[];
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
 /** A line under the actions, for example why some are missing. `noteTone` tints it as in `SwapPanelBlock`. */
 note?:React.ReactNode;noteTone?:'muted'|'warning'|'negative';
}
const usd={style:'currency',currency:'USD'} as const,unitsFormat={maximumFractionDigits:6} as const,held=(value:number)=>Number.isFinite(value)&&value>0;
/** The text of an action: its `label`, the built-in label for a known id, or the id itself. */
export const tokenActionLabel=(action:TokenAction,messages:Partial<HIGMessages>={}):string=>action.label??(action.id==='send'?messages.swapActionSend??en.swapActionSend:action.id==='receive'?messages.receive??en.receive:action.id==='stake'?messages.stake??en.stake:action.id==='unstake'?messages.unstake??en.unstake:action.id);
/** One token and what can be done with it: where it is held, which chains it sits on, and the actions as equal full-width buttons. */
export function TokenActionBlock({symbol,name,value,units,unitsSuffix,unitsOptions=unitsFormat,assets,chains,chainsTitle,actions,onBack,headerAction,note,noteTone='muted',className,...rest}:TokenActionBlockProps){
 const {messages}=useHIG();const locale=useNumberLocale();
 const total=value!==undefined?value:(assets??[]).reduce((sum,asset)=>sum+(held(asset.value)?asset.value:0),0);
 // With no dollar value the units are the headline, as an AccountBlock row headlines them.
 const headline=units!==undefined&&value==null?<AnimatedNumberReadout key='units' value={units} options={unitsOptions} suffix={unitsSuffix}/>:<AnimatedNumberReadout key='value' value={total} options={usd}/>;
 return <section {...rest} className={`hig-token-card${className?` ${className}`:''}`}>
  <ScreenHeader title={symbol} onBack={onBack} action={headerAction}/>
  {(assets||chains)&&<div className='hig-token-bars'>
   {assets&&<BarMark surface={false} title={name??symbol} description={headline} elements={assets}/>}
   {chains&&<BarMark surface={false} title={chainsTitle??messages.swapChains??en.swapChains} description={formatNumber(chains.filter(chain=>held(chain.value)).length,locale)} elements={chains}/>}
  </div>}
  {actions.length>0&&<div className='hig-token-actions'>{actions.map(action=><Button key={action.id} fullWidth intent={action.intent??'secondary'} disabled={action.disabled} onClick={action.onSelect}>{tokenActionLabel(action,messages)}</Button>)}</div>}
  {note!=null&&note!==false&&<p className='hig-swap-note hig-token-note' data-tone={noteTone} role='note'>{note}</p>}
 </section>;
}
