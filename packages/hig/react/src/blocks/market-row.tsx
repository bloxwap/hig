"use client";
import React,{forwardRef} from 'react';
import {Button} from '../button.js';
import {Usd,Percent} from '../data.js';
interface MarketRowContent extends Omit<React.HTMLAttributes<HTMLDivElement>,'children'|'onSelect'> {
 symbol:string;name:string;
 /** Leave out to draw no price column (no dash); `null` reads as unknown. */
 price?:number|null;
 /** Leave out to draw no change column (no dash); `null` reads as unknown. */
 change?:number|null;
 /** Intl display options, including a decimal style when the host omits a currency symbol. */priceOptions?:Intl.NumberFormatOptions;
 /** Percent-point display precision/sign; forwarded to Percent. */changeOptions?:Intl.NumberFormatOptions;
 /** Optional host-rendered market icon, favourite indicator/control and formatted volume. */icon?:React.ReactNode;favorite?:React.ReactNode;volume?:React.ReactNode;
 /** A muted second line under the name, such as the maximum leverage. In action mode it is part of the button's name. */
 detail?:React.ReactNode;
 /** Host content on the trailing edge, after the figures, such as a held position's result. Not interactive inside an action row's layout unless it has its own name. */
 trailing?:React.ReactNode;
 /** The market in use: a check on the trailing edge and `aria-current` on the row's control (the row itself in presentation mode). */
 selected?:boolean;
 /** Dims the row; in action mode the name button is disabled. */
 disabled?:boolean;
 /** The row under a host's keyboard cursor, highlighted with the well fill. */
 active?:boolean;
}
export type MarketRowProps=MarketRowContent&({/** Default: HIG owns the name button and its accepted activation. */mode?:'action';onSelect:()=>void;identity?:never}|{/** Host owns selection/keyboard semantics, for example a cmdk option. HIG adds no action or tab stop. */mode:'presentation';onSelect?:never;/** Host market identity, such as symbol/name with its existing compact layout. */identity?:React.ReactNode});
const check=<svg className='hig-market-check' aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='m4.5 10.5 3.5 3.5 7.5-8'/></svg>;
/** A market as one row: its name (a button, or the host's identity in presentation mode), price and change. Other attributes, pointer handlers and the ref reach the row's root. */
export const MarketRow=forwardRef<HTMLDivElement,MarketRowProps>(function MarketRow({symbol,name,price,change,onSelect,priceOptions,changeOptions,mode='action',identity,icon,favorite,volume,detail,trailing,selected,disabled,active,className,style,...rest},ref){
 // The name sits in its own span so an action row can truncate it on one line instead of wrapping.
 const title=detail===undefined?<span className='hig-market-label'>{name} ({symbol})</span>:<span className='hig-market-text'><span className='hig-market-label'>{name} ({symbol})</span><span className='hig-market-detail'>{detail}</span></span>;
 const current=selected?'true' as const:undefined;
 const content=<>{favorite!==undefined&&<span className='hig-market-favorite'>{favorite}</span>}{icon!==undefined&&<span className='hig-market-icon'>{icon}</span>}{mode==='presentation'?<span className='hig-market-name'>{identity===undefined?title:identity}</span>:<Button intent='ghost' onClick={onSelect} disabled={disabled} aria-current={current}>{title}</Button>}</>;
 const hasTrailing=trailing!==undefined&&trailing!==null&&trailing!==false;
 // The default three or four columns keep their grid; any other set of cells flows into as many columns as it has.
 const flow=price===undefined||change===undefined||hasTrailing||!!selected||undefined;
 // Presentation mode places each figure in its own grid column. An action row groups them so that, when the row is too narrow for
 // everything, whole figures drop from the end (volume, then change, then price) instead of the name collapsing or cells overlapping.
 const figures=price===undefined&&change===undefined&&volume===undefined?null:<>
  {price!==undefined&&<span className='hig-market-price'><Usd value={price} options={priceOptions}/></span>}
  {change!==undefined&&<span className='hig-market-change'><Percent value={change} options={changeOptions}/></span>}
  {volume!==undefined&&<span className='hig-market-volume'>{volume}</span>}
 </>;
 return <div ref={ref} {...rest} className={`hig-row hig-market-row${className?` ${className}`:''}`} style={style} data-mode={mode} data-has-volume={volume!==undefined||undefined} data-flow={flow} data-selected={selected||undefined} data-active={active||undefined} data-disabled={disabled||undefined} aria-current={mode==='presentation'?current:undefined} aria-disabled={mode==='presentation'&&disabled?true:undefined}>
  <div className='hig-market-identity'>{content}</div>
  {mode==='action'&&figures!==null?<span className='hig-market-figures'>{figures}</span>:figures}
  {hasTrailing&&<span className='hig-market-trailing'>{trailing}</span>}
  {selected&&check}
 </div>;
});
