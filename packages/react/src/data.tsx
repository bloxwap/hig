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
export interface Column<T> {key:string;label:string;render:(row:T)=>React.ReactNode;sort?:'ascending'|'descending';onSort?:()=>void}
export function Table<T>({caption,rows,columns,keyFor}: {caption:string;rows:readonly T[];columns:readonly Column<T>[];keyFor:(row:T)=>string}){const {messages}=useHIG();return <div className='hig-table-scroll' tabIndex={0} role='region' aria-label={caption}><table><caption>{caption}</caption><thead><tr>{columns.map(c=><th key={c.key} scope='col' aria-sort={c.sort}>{c.onSort?<button type='button' onClick={c.onSort}>{c.label}</button>:c.label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={keyFor(row)}>{columns.map(c=><td key={c.key}>{c.render(row)}</td>)}</tr>)}</tbody></table>{!rows.length&&<p>{messages.noRows??en.noRows}</p>}</div>;}
