"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig-contracts';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from './provider.js';
export interface NumberProps {value:number|null|undefined;options?:Intl.NumberFormatOptions;stale?:boolean;label?:string}
export function NumberReadout({value,options,stale,label}:NumberProps){const {locale,messages}=useHIG();const reading=formatNumber(value,locale,options);return <span className='hig-number' aria-label={label?`${label}: ${reading}${stale?` ${messages.stale??en.stale}`:''}`:undefined}>{reading}{stale&&<span> {messages.stale??en.stale}</span>}</span>;}
export function Usd(props:NumberProps){return <NumberReadout {...props} options={{style:'currency',currency:'USD',...props.options}}/>;}
/** Input is percent points: 5 means 5%, not 500%. */
export function Percent(props:NumberProps){return <NumberReadout {...props} value={props.value==null?props.value:props.value/100} options={{maximumFractionDigits:Math.max(3,props.options?.minimumFractionDigits??0),...props.options,style:'percent'}}/>;}
export function Metric({label,value}: {label:string;value:React.ReactNode}){return <dl className='hig-surface'><dt>{label}</dt><dd>{value}</dd></dl>;}
export const Stat=Metric;
export interface ListProps<T> {items:readonly T[];keyFor:(item:T)=>string;render:(item:T)=>React.ReactNode;empty?:string;label?:string;loading?:boolean;error?:string;onRetry?:()=>void;onLoadMore?:()=>void}
export function List<T>({items,keyFor,render,empty,label,loading=false,error,onRetry,onLoadMore}:ListProps<T>){const {messages}=useHIG();return <div aria-busy={loading}>
 {items.length?<ul className='hig-list' aria-label={label}>{items.map(item=><li key={keyFor(item)}>{render(item)}</li>)}</ul>:!loading&&!error?<p>{empty??messages.noItems??en.noItems}</p>:null}
 {loading&&<p role='status'>{messages.loadingItems??en.loadingItems}</p>}{error&&<div role='alert'><p>{error}</p>{onRetry&&<button type='button' disabled={loading} onClick={onRetry}>{messages.retry??en.retry}</button>}</div>}
 {onLoadMore&&<button type='button' disabled={loading} onClick={onLoadMore}>{messages.loadMore??en.loadMore}</button>}
 </div>;}
export function Row(props:React.HTMLAttributes<HTMLDivElement>){return <div {...props} className='hig-row'/>;}
export interface Column<T> {key:string;label:string;render:(row:T)=>React.ReactNode;/** Logical alignment applies to both header and data cells. */align?:'start'|'center'|'end';sort?:'ascending'|'descending';onSort?:()=>void}
/** Keep native table-row semantics and HIG's cells while forwarding host highlights, data/ARIA attributes and event handlers. */
export type TableRowProps=Omit<React.HTMLAttributes<HTMLTableRowElement>,'children'|'dangerouslySetInnerHTML'|'role'>&{[name:`data-${string}`]:string|number|boolean|undefined};
export interface TableProps<T> {
 caption:string;rows:readonly T[];columns:readonly Column<T>[];keyFor:(row:T)=>string;
 rowProps?:(row:T,index:number)=>TableRowProps;
 /** Host classes/style belong to the focusable scroll region; tableClassName styles the table itself. */
 className?:string;style?:React.CSSProperties;tableClassName?:string;
 /** Keep the accessible caption when a visible section heading already names this table. */
 captionHidden?:boolean;
 /** Set a bounded scroll-region height through style/className for vertical sticky scrolling. */
 stickyHeader?:boolean;
 /** Retains existing rows and suppresses an empty message while loading. */
 loading?:boolean;
 /** Content of one full-width state cell, such as an empty explanation, skeleton, or error/retry UI. Supply content, not tr/td elements. null hides the default state. */
 state?:React.ReactNode;
}
function tableRowAttributes(props:TableRowProps|undefined){const attributes:React.HTMLAttributes<HTMLTableRowElement>={...props};delete attributes.children;delete attributes.dangerouslySetInnerHTML;delete attributes.role;return attributes;}
export function Table<T>({caption,rows,columns,keyFor,rowProps,className,style,tableClassName,captionHidden=false,stickyHeader=false,loading=false,state}:TableProps<T>){
 const {messages}=useHIG();const status=state!==undefined?state:loading?<span role='status'>{messages.loading??en.loading}</span>:!rows.length?messages.noRows??en.noRows:null;
 return <div className={`hig-table-scroll${className?` ${className}`:''}`} style={style} tabIndex={0} role='region' aria-label={caption} aria-busy={loading||undefined}><table className={`hig-table${tableClassName?` ${tableClassName}`:''}`} data-sticky-header={stickyHeader||undefined}><caption className={captionHidden?'hig-sr-only':undefined}>{caption}</caption><thead><tr>{columns.map(c=><th key={c.key} scope='col' aria-sort={c.sort} style={c.align?{textAlign:c.align}:undefined}>{c.onSort?<button type='button' className='hig-table-sort' onClick={c.onSort}>{c.label}</button>:c.label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr {...tableRowAttributes(rowProps?.(row,index))} key={keyFor(row)}>{columns.map(c=><td key={c.key} style={c.align?{textAlign:c.align}:undefined}>{c.render(row)}</td>)}</tr>)}{status!==null&&status!==false&&<tr className='hig-table-state'><td colSpan={Math.max(1,columns.length)}>{status}</td></tr>}</tbody></table></div>;
}
