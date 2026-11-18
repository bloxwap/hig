"use client";
import React,{useEffect,useId,useRef,useState} from 'react';
import {formatNumber} from '@bloxwap/hig/contracts/format';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,usePresentNumber,useHIG,useNumberLocale} from '../provider.js';
import {Button} from '../button.js';
import {SegmentedControl} from '../selection.js';
import {PresetGroup} from '../preset-group.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {ScreenHeader} from './screen-header.js';
import {SwapIcon} from './swap/shared.js';
/** What the target does: close in profit, or cap the loss. */
export type TargetKind='take-profit'|'stop-loss';
/** How the target is expressed: profit or loss in dollars, a price, or a share of the position. */
export type TargetUnit='dollar'|'price'|'percent';
/** The three prices on the bar. */
export type TargetPrice='entry'|'trigger';
/** The words of the block. They are trading terms, so the host supplies them in its own vocabulary and language; only Cancel has a built-in default. */
export interface TargetBlockLabels {
 /** Heading: Take Profit, Stop Loss. */
 title:string;
 /** The confirming action: Set Take Profit. */
 submit:string;
 /** Defaults to the built-in Cancel. */
 cancel?:string;
 entry:string;
 /** The price the order triggers at: If triggered. */
 trigger:string;
 /** Accessible name of the unit control; not drawn. */
 unit:string;
 units:Record<TargetUnit,string>;
 /** The row that opens the host's own entry: Custom. */
 custom:string;
 /** Accessible name of the info button that shows `note`: How this order fills. Without it the note is always shown. */
 info?:string;
 /** Accessible name of the quick choices' group, not drawn: Quick targets. Defaults to `title`. */
 presets?:string;
}
export interface TargetBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 kind:TargetKind;
 labels:TargetBlockLabels;
 /** Title of the price card, the position the target belongs to: `BTC · Long 40×`. */
 position?:string;
 /** Trailing text of the price card, the order the target places: Take-limit, Stop-market. */
 orderType?:string;
 /** One sentence about how the order fills. With `labels.info` it opens in a popover from an info button on the trailing edge of the header; otherwise it is always shown under the headline figure. */
 note?:string;
 entry:number;
 /** Price the order triggers at. Defaults to `value` when the unit is `price`; otherwise unknown until the host supplies it. */
 trigger?:number|null;
 unit:TargetUnit;
 /** Units offered, in order. Defaults to all three; one unit hides the control. `{unit, disabled}` shows a unit that cannot be chosen now, dimmed. */
 units?:readonly (TargetUnit|TargetUnitOption)[];
 onUnitChange?:(unit:TargetUnit)=>void;
 /** The target in the current unit: signed dollars (2, -0.5), a price, or a signed fraction (0.05 reads +5%). `null` reads as unknown and disables the confirming action. */
 value:number|null;
 onValueChange?:(value:number)=>void;
 /** Quick choices in the current unit. The one equal to `value` is shown selected. `{value, disabled}` shows a choice that cannot be taken now, dimmed. */
 presets?:readonly (number|TargetPreset)[];
 /** Shows the Custom row; the host opens its own entry. */
 onCustom?:()=>void;
 /** The value the host's own entry set, in the current unit. The Custom row then shows it on its trailing edge and reads as selected, and no quick choice does. Has no effect without `onCustom`; null keeps the row a toggle that reads as not selected. */
 customValue?:number|null;
 /** Format of prices. Defaults to US dollars. */
 priceOptions?:Intl.NumberFormatOptions;
 /** Set true to draw the prices inside a card: a surface fill, padding and radius. By default the title row, bar and readouts sit directly on the screen. */
 surface?:boolean;
 onSubmit:()=>void;
 /** Defaults to disabled while `value` is unknown. */
 submitDisabled?:boolean;
 busy?:boolean;
 /** Shows Cancel beside the confirming action. */
 onCancel?:()=>void;
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. It takes the place of the info button, and the note is then always shown, unless `headerActionBesideInfo` is set. */
 headerAction?:React.ReactNode;
 /** Set true to keep the info button when `headerAction` is given: the info button comes first and `headerAction` sits on the trailing edge. */
 headerActionBesideInfo?:boolean;
 /** `id` of the heading, so a dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
 /** Pins the header to the top of the nearest scrolling container, transparent at rest and filled with `--hig-sticky-header-background` once content scrolls under it. */
 stickyHeader?:boolean;
}
/** A quick choice that can be shown dimmed. */
export interface TargetPreset {value:number;disabled?:boolean}
/** A unit that can be shown dimmed. */
export interface TargetUnitOption {unit:TargetUnit;disabled?:boolean}
/** The quick choices as `{value, disabled}`, whichever form the host gave. */
export function targetPresets(presets:readonly (number|TargetPreset)[]):TargetPreset[]{return presets.map(preset=>typeof preset==='number'?{value:preset}:preset);}
/** The units as `{unit, disabled}`, whichever form the host gave. */
export function targetUnits(units:readonly (TargetUnit|TargetUnitOption)[]):TargetUnitOption[]{return units.map(unit=>typeof unit==='string'?{unit}:unit);}
const usd={style:'currency',currency:'USD'} as const,allUnits:readonly TargetUnit[]=['dollar','price','percent'];
const known=(value:number|null|undefined):value is number=>value!=null&&Number.isFinite(value);
/**
 * Number format of a target in a unit. Dollars and percents carry their sign. `short` is a preset's value: a whole dollar amount
 * or a whole price drops its fraction digits (`+$10`, `$63,000`), whatever fraction digits `priceOptions` fix, so a preset reads
 * the same on web and native; a price formatted by significant digits keeps `priceOptions`.
 */
export function targetFormat(unit:TargetUnit,priceOptions:Intl.NumberFormatOptions=usd,short?:number):Intl.NumberFormatOptions{
 const whole=short!==undefined&&Number.isInteger(short);
 if(unit==='price')return whole&&priceOptions.minimumSignificantDigits===undefined&&priceOptions.maximumSignificantDigits===undefined?{...priceOptions,minimumFractionDigits:0,maximumFractionDigits:0}:priceOptions;
 if(unit==='percent')return {style:'percent',maximumFractionDigits:2,signDisplay:'exceptZero'};
 return {...usd,signDisplay:'exceptZero',...(whole?{maximumFractionDigits:0}:null)};
}
/**
 * Where each known price sits on the bar, as a fraction of its width from the low-price edge, the prices in price order, and
 * the stretch (`from` to `to`) between them: the whole bar, from entry to the trigger.
 * Without a trigger there is no stretch.
 */
export function targetLayout({entry,trigger}:{entry:number;trigger?:number|null}):{positions:Partial<Record<TargetPrice,number>>;order:TargetPrice[];from:number;to:number}{
 const values:Partial<Record<TargetPrice,number>>={};
 if(known(entry))values.entry=entry;if(known(trigger))values.trigger=trigger;
 const kinds=Object.keys(values) as TargetPrice[],prices=kinds.map(kind=>values[kind]!);
 if(!kinds.length)return {positions:{},order:[],from:0.5,to:0.5};
 const low=Math.min(...prices),span=Math.max(...prices)-low;
 const positions:Partial<Record<TargetPrice,number>>={};for(const kind of kinds)positions[kind]=span>0?(values[kind]!-low)/span:0.5;
 const rank:Record<TargetPrice,number>={entry:0,trigger:1};
 const order=[...kinds].sort((a,b)=>values[a]!-values[b]!||rank[a]-rank[b]);
 const start=positions.entry,end=positions.trigger;
 return start===undefined||end===undefined?{positions,order,from:0.5,to:0.5}:{positions,order,from:Math.min(start,end),to:Math.max(start,end)};
}
/** Set a take profit or a stop loss on one position: the target as the headline figure, a price card whose bar shows how far the price is from the trigger, the unit, the host's quick choices, and the confirming action. */
export function TargetBlock({kind,labels,position,orderType,note,entry,trigger,unit,units=allUnits,onUnitChange,value,onValueChange,presets=[],onCustom,customValue,priceOptions=usd,surface=false,onSubmit,submitDisabled,busy,onCancel,onBack,headerAction,headerActionBesideInfo,headingId,stickyHeader,className,...rest}:TargetBlockProps){
 const {messages}=useHIG();const locale=useNumberLocale();const present=usePresentNumber();const id=useId(),noteId=useId();const [open,setOpen]=useState(false);const anchor=useRef<HTMLSpanElement>(null);
 // The popover closes on a press outside it, on Escape, and when focus leaves it.
 useEffect(()=>{if(!open)return;const outside=(event:Event)=>{if(!anchor.current?.contains(event.target as Node))setOpen(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[open]);
 const info=note&&labels.info&&(!headerAction||headerActionBesideInfo)?labels.info:undefined;
 const custom=onCustom&&known(customValue)?customValue:null;
 const infoButton=info&&<span ref={anchor} className='hig-target-info' onKeyDown={event=>{if(event.key==='Escape'&&open){event.stopPropagation();setOpen(false);}}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}><button type='button' className='hig-swap-back' aria-label={info} aria-expanded={open} aria-controls={open?noteId:undefined} onClick={()=>setOpen(!open)}><SwapIcon name='info'/><PressDecoration kind='back'/></button>{open&&<span id={noteId} role='status' className='hig-popover hig-target-popover'>{note}</span>}</span>;
 const target=trigger!==undefined?trigger:unit==='price'?value:null;
 const {positions,order,from,to}=targetLayout({entry,trigger:target});
 const prices:Record<TargetPrice,number|null|undefined>={entry,trigger:target};
 const intent=kind==='stop-loss'?'destructive':'primary';
 return <section {...rest} className={`hig-target-block${className?` ${className}`:''}`} data-kind={kind}>
  <ScreenHeader title={labels.title} onBack={onBack} headingId={headingId} stickyHeader={stickyHeader} action={info?headerAction?<span className='hig-target-header-actions'>{infoButton}{headerAction}</span>:infoButton:headerAction}/>
  <p className='hig-target-amount'><AnimatedNumberReadout value={value} options={targetFormat(unit,priceOptions)}/></p>
  {note&&!info&&<p className='hig-target-note'>{note}</p>}
  <section className={surface?'hig-surface hig-target-prices':'hig-target-prices'} data-surface={surface?undefined:'false'} aria-labelledby={position?id:undefined}>
   {(position||orderType)&&<div className='hig-bar-mark-header'>{position&&<strong id={id} className='hig-bar-mark-title'>{position}</strong>}{orderType&&<span className='hig-bar-mark-description'>{orderType}</span>}</div>}
   <div className='hig-target-bar' aria-hidden='true'>
    <span className='hig-target-rest' style={{flexGrow:from}}/>
    {to>from&&<span className='hig-target-move' data-lead={(positions.trigger??0)<(positions.entry??0)?'trigger':'start'} style={{flexGrow:to-from}}/>}
    <span className='hig-target-rest' style={{flexGrow:1-to}}/>
   </div>
   <dl className='hig-bar-pnl-readouts'>{order.map(price=><div key={price} data-price={price}><dt>{labels[price]}</dt><dd><AnimatedNumberReadout value={prices[price]} options={priceOptions}/></dd></div>)}</dl>
  </section>
  {units.length>1&&<SegmentedControl label={labels.unit} options={targetUnits(units).map(option=>({value:option.unit,label:labels.units[option.unit],disabled:option.disabled}))} value={unit} onValueChange={next=>onUnitChange?.(next as TargetUnit)}/>}
  {onCustom&&(custom===null?<button type='button' className='hig-swap-setting' aria-pressed={customValue!==undefined?false:undefined} onClick={onCustom}><span>{labels.custom}</span><SwapIcon name='chevron' size={16}/><PressDecoration kind='row'/></button>:<button type='button' className='hig-swap-setting' aria-pressed='true' onClick={onCustom}><span>{labels.custom}</span><span className='hig-swap-setting-value'>{formatNumber(custom,locale,present(targetFormat(unit,priceOptions)))}<SwapIcon name='chevron' size={16}/></span><PressDecoration kind='row'/></button>)}
  {presets.length>0&&<PresetGroup className='hig-target-presets' label={labels.presets??labels.title} selectedIntent={intent} options={targetPresets(presets).map(({value:preset,disabled})=>({value:preset,disabled,label:formatNumber(preset,locale,present(targetFormat(unit,priceOptions,preset)))}))} value={custom===null?value:null} onValueChange={next=>onValueChange?.(next)}/>}
  <div className='hig-target-actions'>
   {onCancel&&<Button fullWidth intent='secondary' onClick={onCancel}>{labels.cancel??messages.cancel??en.cancel}</Button>}
   <Button fullWidth intent={intent} disabled={!!submitDisabled||!known(value)||(unit==='price'&&value<=0)} busy={busy} onClick={onSubmit}>{labels.submit}</Button>
  </div>
 </section>;
}
