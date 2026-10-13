"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig-contracts';
import {useHIG} from './provider.js';
export interface NumberProps {value:number|null|undefined;options?:Intl.NumberFormatOptions;stale?:boolean;label?:string}
export function NumberReadout({value,options,stale,label}:NumberProps){const {locale}=useHIG();return <span className='hig-number' aria-label={label}>{formatNumber(value,locale,options)}{stale&&<span> (stale)</span>}</span>;}
export function Usd(props:NumberProps){return <NumberReadout {...props} options={{style:'currency',currency:'USD',...props.options}}/>;}
/** Input is percent points: 5 means 5%, not 500%. */
export function Percent(props:NumberProps){if(props.value==null||!Number.isFinite(props.value))return <NumberReadout {...props}/>;return <span><NumberReadout {...props}/>%</span>;}
export function Metric({label,value}: {label:string;value:React.ReactNode}){return <dl className='hig-surface'><dt>{label}</dt><dd>{value}</dd></dl>;}
export const Stat=Metric;
export function List<T>({items,keyFor,render,empty='No items'}: {items:readonly T[];keyFor:(item:T)=>string;render:(item:T)=>React.ReactNode;empty?:string}){return items.length?<ul className='hig-list'>{items.map(item=><li key={keyFor(item)}>{render(item)}</li>)}</ul>:<p>{empty}</p>;}
export function Row(props:React.HTMLAttributes<HTMLDivElement>){return <div {...props} className='hig-row'/>;}
export interface Column<T> {key:string;label:string;render:(row:T)=>React.ReactNode;sort?:'ascending'|'descending';onSort?:()=>void}
export function Table<T>({caption,rows,columns,keyFor}: {caption:string;rows:readonly T[];columns:readonly Column<T>[];keyFor:(row:T)=>string}){return <div className='hig-table-scroll' tabIndex={0} role='region' aria-label={caption}><table><caption>{caption}</caption><thead><tr>{columns.map(c=><th key={c.key} scope='col' aria-sort={c.sort}>{c.onSort?<button type='button' onClick={c.onSort}>{c.label}</button>:c.label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={keyFor(row)}>{columns.map(c=><td key={c.key}>{c.render(row)}</td>)}</tr>)}</tbody></table>{!rows.length&&<p>No rows</p>}</div>;}
