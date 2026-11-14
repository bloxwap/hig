"use client";
import React,{useEffect,useRef,useState} from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../../provider.js';
import {Field,Input} from '../../field.js';
import {SegmentedControl} from '../../selection.js';
import {SwapIcon,SwapViewHeader,formatPercent,type SwapDenomination} from './shared.js';
export interface SwapFee {label:string;usd:number}
export const slippagePresets=[0.001,0.005,0.01] as const;
export type SwapSettingsView='settings'|'slippage'|'fees';
export interface SwapSettingsProps {
 view:SwapSettingsView;onViewChange:(view:SwapSettingsView)=>void;/** Pops to the settings list from a sub-setting, or out of settings from the list. */onBack:()=>void;
 denomination:SwapDenomination;onDenominationChange:(denomination:SwapDenomination)=>void;
 slippage:number;onSlippageChange?:(slippage:number)=>void;
 fee?:number|null;fees?:readonly SwapFee[];quoteLoading?:boolean;
 /** Host rows shown under the built-in settings, such as language or theme. */
 children?:React.ReactNode;
}
/** The panel's settings as pushed views: the list, then slippage and the fee breakdown one level deeper. */
export function SwapSettings({view,onViewChange,onBack,denomination,onDenominationChange,slippage,onSlippageChange,fee,fees,quoteLoading,children}:SwapSettingsProps){
 const {messages,locale}=useHIG();const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();},[view]);
 const usd=(value:number)=>formatNumber(value,locale,{style:'currency',currency:'USD'});
 const [custom,setCustom]=useState<string|null>(null);
 const title=view==='slippage'?(messages.swapSlippageTitle??en.swapSlippageTitle):view==='fees'?(messages.swapFees??en.swapFees):(messages.swapSettings??en.swapSettings);
 const feeText=quoteLoading?'…':fee!=null?usd(fee):'—';
 const preset=slippagePresets.find(value=>Math.abs(value-slippage)<1e-9);
 const row=(label:string,value:string,target:SwapSettingsView)=><button type='button' className='hig-swap-setting' onClick={()=>onViewChange(target)}><span>{label}</span><span className='hig-swap-setting-value'>{value}<SwapIcon name='chevron' size={16}/></span></button>;
 const slippageRow=row(messages.swapSlippageTitle??en.swapSlippageTitle,formatPercent(slippage),'slippage'),feesRow=row(messages.swapFees??en.swapFees,feeText,'fees');
 return <div className='hig-swap-settings-view' role='group' aria-label={title}>
  <SwapViewHeader title={title} titleRef={heading} backLabel={messages.back??en.back} onBack={onBack}/>
  {view==='settings'&&<div className='hig-swap-settings'>
   <SegmentedControl label={(messages.swapDenomination??en.swapDenomination)} options={[{value:'usd',label:(messages.swapDollars??en.swapDollars)},{value:'token',label:(messages.swapUnits??en.swapUnits)}]} value={denomination} onValueChange={value=>onDenominationChange(value as SwapDenomination)}/>
   {onSlippageChange&&slippageRow}
   {feesRow}
   {children}
  </div>}
  {view==='slippage'&&onSlippageChange&&<div className='hig-swap-settings hig-swap-presets'>
   <SegmentedControl label={(messages.swapSlippageTitle??en.swapSlippageTitle)} options={slippagePresets.map(value=>({value:String(value),label:formatPercent(value)}))} value={preset===undefined?'':String(preset)} onValueChange={value=>{setCustom(null);onSlippageChange(Number(value));}}/>
   <Field label={(messages.swapSlippageCustom??en.swapSlippageCustom)}><Input inputMode='decimal' value={custom??String(Number((slippage*100).toFixed(4)))} onChange={event=>{const raw=event.target.value.replace(/[^0-9.]/g,'');setCustom(raw);const percent=Number.parseFloat(raw);if(Number.isFinite(percent)&&percent>=0&&percent<=50)onSlippageChange(percent/100);}}/></Field>
  </div>}
  {view==='fees'&&<dl className='hig-swap-fees'>
   {fees?.map(item=><div key={item.label}><dt>{item.label}</dt><dd className='hig-number'>{usd(item.usd)}</dd></div>)}
   <div className='hig-swap-fees-total'><dt>{(messages.swapFeeTotal??en.swapFeeTotal)}</dt><dd className='hig-number'>{feeText}</dd></div>
  </dl>}
 </div>;
}
