"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import * as en from '@bloxwap/hig/contracts/messages';
import type {HIGMessages} from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {BarMark,type BarMarkElement} from '../bar-mark.js';
import {ScreenHeader} from './screen-header.js';
export type {BarMarkElement,BarMarkTone} from '../bar-mark.js';
/** Actions with a built-in, translated label. */
export type TokenActionId='send'|'receive'|'stake'|'unstake';
export interface TokenAction {
 /** `send`, `receive`, `stake` and `unstake` take a built-in label; any other id needs `label`. */
 id:TokenActionId|(string&{});
 label?:string;onSelect:()=>void;disabled?:boolean;
 /** Defaults to `secondary`: the card offers equal choices, so no action is the primary one unless the host says so. */
 intent?:'primary'|'secondary'|'destructive';
}
export interface TokenActionCardProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading, usually the ticker: HYPE. */
 symbol:string;
 /** Title of the assets bar: Hyperliquid. */
 name:string;
 /** Total holding in dollars, on the trailing edge of the assets bar. Defaults to the sum of the asset values; `null` reads as unknown. */
 value?:number|null;
 /** Where the token is held: Staked, Core, Paper. */
 assets:readonly BarMarkElement[];
 /** The chains the token sits on. */
 chains:readonly BarMarkElement[];
 /** Title of the chains bar. Defaults to the built-in “Chains”. */
 chainsTitle?:string;
 actions:readonly TokenAction[];
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
}
const usd={style:'currency',currency:'USD'} as const,held=(value:number)=>Number.isFinite(value)&&value>0;
/** The text of an action: its `label`, the built-in label for a known id, or the id itself. */
export const tokenActionLabel=(action:TokenAction,messages:Partial<HIGMessages>={}):string=>action.label??(action.id==='send'?messages.swapActionSend??en.swapActionSend:action.id==='receive'?messages.receive??en.receive:action.id==='stake'?messages.stake??en.stake:action.id==='unstake'?messages.unstake??en.unstake:action.id);
/** One token and what can be done with it: where it is held, which chains it sits on, and the actions as equal full-width buttons. */
export function TokenActionCard({symbol,name,value,assets,chains,chainsTitle,actions,onBack,headerAction,className,...rest}:TokenActionCardProps){
 const {messages,locale}=useHIG();
 const total=value!==undefined?value:assets.reduce((sum,asset)=>sum+(held(asset.value)?asset.value:0),0);
 return <section {...rest} className={`hig-token-card${className?` ${className}`:''}`}>
  <ScreenHeader title={symbol} onBack={onBack} action={headerAction}/>
  <div className='hig-token-bars'>
   <BarMark title={name} description={<AnimatedNumberReadout value={total} options={usd}/>} elements={assets}/>
   <BarMark title={chainsTitle??messages.swapChains??en.swapChains} description={formatNumber(chains.filter(chain=>held(chain.value)).length,locale)} elements={chains}/>
  </div>
  {actions.length>0&&<div className='hig-token-actions'>{actions.map(action=><Button key={action.id} fullWidth intent={action.intent??'secondary'} disabled={action.disabled} onClick={action.onSelect}>{tokenActionLabel(action,messages)}</Button>)}</div>}
 </section>;
}
