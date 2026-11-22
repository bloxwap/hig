"use client";
import { ChevronUp } from '@bloxwap/icons/react/chevron-up';
import { ChevronDown } from '@bloxwap/icons/react/chevron-down';
import { ChevronsUpDown } from '@bloxwap/icons/react/chevrons-up-down';
import {assertUniqueKeys} from '@bloxwap/hig/contracts/invariants';
import React from 'react';
import {RowWindow} from './row-window.js';
import {formatNumber} from '@bloxwap/hig/contracts/format';
import {presentNumberFormat} from '@bloxwap/hig/contracts/environment';
import * as en from '@bloxwap/hig/contracts/messages';
import {useMessageOverrides,useReadoutFormat} from './provider.js';
export interface NumberProps {value:number|null|undefined;options?:Intl.NumberFormatOptions;stale?:boolean;label?:string;prefix?:string;suffix?:string}
export const NumberReadout=React.memo(function NumberReadout({value,options,stale,label,prefix='',suffix=''}:NumberProps){const {locale,numberFormat,staleLabel}=useReadoutFormat(options?.style==='currency');const known=value!=null&&Number.isFinite(value),formatted=formatNumber(value,locale,presentNumberFormat(options,numberFormat)),reading=known?`${prefix}${formatted}${suffix}`:formatted;return <span className='hig-number' aria-label={label?`${label}: ${reading}${stale?` ${staleLabel??en.stale}`:''}`:undefined}>{reading}{stale&&<span> {staleLabel??en.stale}</span>}</span>;});
export const Usd=React.memo(function Usd(props:NumberProps){return <NumberReadout {...props} options={{style:'currency',currency:'USD',...props.options}}/>;});
/** Input is percent points: 5 means 5%, not 500%. */
export const Percent=React.memo(function Percent(props:NumberProps){return <NumberReadout {...props} value={props.value==null?props.value:props.value/100} options={{maximumFractionDigits:Math.max(3,props.options?.minimumFractionDigits??0),...props.options,style:'percent'}}/>;});
import {addressKind,addressGrid,type AddressKind,type AddressOrientation} from '@bloxwap/hig/contracts/address';
export {addressKind,type AddressKind,type AddressOrientation} from '@bloxwap/hig/contracts/address';
/** Fixed-width rows: 6 characters for Ethereum-style addresses (42 characters make 7 rows), 4 for Solana (44 make 11). */
export function addressRows(address:string,kind:AddressKind):string[]{
 return addressGrid(address,kind,'vertical').map(row=>row.leading+row.middle+row.trailing);
}
export interface AddressProps {address:string;kind?:AddressKind;orientation?:AddressOrientation;rowHeight?:number;className?:string}
export function AddressLockup({address,kind=addressKind(address),orientation='vertical',rowHeight,className}:AddressProps){
 const rows=addressGrid(address,kind,orientation);
 return <span className={`hig-${orientation}-address${className?` ${className}`:''}`} dir='ltr' translate='no' data-kind={kind} style={rowHeight?{'--hig-address-row':`${rowHeight}px`} as React.CSSProperties:undefined}>
  <span className='hig-sr-only'>{address}</span>
  <span aria-hidden='true'>{rows.map((row,index)=><span key={index}>{row.leading&&<span data-anchor>{row.leading}</span>}{row.middle}{row.trailing&&<span data-anchor>{row.trailing}</span>}</span>)}</span>
 </span>;
}
export {AddressLockup as Address};
export function VerticalAddress(props:Omit<AddressProps,'orientation'>){return <AddressLockup {...props} orientation='vertical'/>;}
export function HorizontalAddress(props:Omit<AddressProps,'orientation'>){return <AddressLockup {...props} orientation='horizontal'/>;}
export function Metric({label,value}: {label:string;value:React.ReactNode}){return <dl className='hig-surface'><dt>{label}</dt><dd>{value}</dd></dl>;}
export const Stat=Metric;
export interface ListProps<T> {items:readonly T[];keyFor:(item:T)=>string;render:(item:T)=>React.ReactNode;empty?:string;label?:string;loading?:boolean;error?:string;onRetry?:()=>void;onLoadMore?:()=>void}
function ListCell<T>({item,render}:{item:T;render:(item:T)=>React.ReactNode}){
 return <>{render(item)}</>;
}
const MemoizedListCell=React.memo(ListCell) as typeof ListCell;
type ListStatusProps=Pick<ListProps<unknown>,'empty'|'loading'|'error'|'onRetry'|'onLoadMore'>&{isEmpty:boolean};
function ListStatus({isEmpty,empty,loading,error,onRetry,onLoadMore}:ListStatusProps){
 const messages=useMessageOverrides();
 return <>
 {isEmpty&&!loading&&!error?<p className='hig-list-message'>{empty??messages.noItems??en.noItems}</p>:null}
 {loading&&<p className='hig-list-message' role='status'>{messages.loadingItems??en.loadingItems}</p>}{error&&<div className='hig-list-error' role='alert'><p className='hig-list-message'>{error}</p>{onRetry&&<button className='hig-button' data-intent='secondary' type='button' disabled={loading} onClick={onRetry}>{messages.retry??en.retry}</button>}</div>}
 {onLoadMore&&<button className='hig-button' data-intent='secondary' type='button' disabled={loading} onClick={onLoadMore}>{messages.loadMore??en.loadMore}</button>}
 </>;
}
export function List<T>({items,keyFor,render,empty,label,loading=false,error,onRetry,onLoadMore}:ListProps<T>){
 const rows=React.useMemo(()=>{
  const rows=items.map(item=>({key:keyFor(item),item}));
  assertUniqueKeys(rows,row=>row.key,'List');
  return rows;
 },[items,keyFor]);
 const list=React.useMemo(()=>(
  <RowWindow items={rows} itemKey="key" enabled={rows.length>50} rowHeight={44} tabThrough
   className="hig-list" label={label}
   renderRow={row=><li key={row.key}><MemoizedListCell item={row.item} render={render}/></li>}/>
 ),[rows,label,render]);
 return <div className='hig-data-list' aria-busy={loading}>
 {items.length?list:null}
 {(!items.length||loading||error||onLoadMore)&&<ListStatus isEmpty={!items.length} empty={empty} loading={loading} error={error} onRetry={onRetry} onLoadMore={onLoadMore}/>}
 </div>;}
export function Row({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div {...props} className={`hig-row${className?` ${className}`:''}`}/>;}
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
function TableDataRow<T>({row,index,columns,rowProps,windowed}:{
 row:T;index:number;windowed?:boolean;columns:readonly Column<T>[];rowProps?:TableProps<T>['rowProps'];
}){
 const cells=React.useMemo(()=>columns.map(column=><td key={column.key} style={column.align?{textAlign:column.align}:undefined}>{column.render(row)}</td>),[columns,row]);
 return <tr {...tableRowAttributes(rowProps?.(row,index))} {...(windowed?{'data-hig-window-index':index,'aria-rowindex':index+2}:{})}>
  {cells}
 </tr>;
}
const MemoizedTableDataRow=React.memo(TableDataRow) as typeof TableDataRow;
function DefaultTableStatus({loading}:{loading:boolean}){
 const messages=useMessageOverrides();
 return loading?<span role='status'>{messages.loading??en.loading}</span>:<>{messages.noRows??en.noRows}</>;
}
export function Table<T>({caption,rows,columns,keyFor,rowProps,className,style,tableClassName,captionHidden=false,stickyHeader=false,loading=false,state}:TableProps<T>){
 const status=state!==undefined?state:loading||!rows.length?<DefaultTableStatus loading={loading}/>:null;
 const windowed=rows.length>50;
 const hasStatus=status!==null&&status!==false;
 const keyedRows=React.useMemo(()=>{
  const items=rows.map(row=>({key:keyFor(row),row}));
  assertUniqueKeys(items,item=>item.key,'Table');
  return items;
 },[rows,keyFor]);
 const body=React.useMemo(()=>{
  assertUniqueKeys(columns,column=>column.key,'Table columns');
  const renderRow=(item:typeof keyedRows[number],index:number)=><MemoizedTableDataRow key={'row:'+item.key} row={item.row} index={index} columns={columns} rowProps={rowProps} windowed={windowed}/>;
  return windowed?<RowWindow as="tbody" columnCount={Math.max(1,columns.length)} items={keyedRows} itemKey="key" rowHeight={44} tabThrough renderRow={renderRow}/>:keyedRows.map(renderRow);
 },[keyedRows,columns,rowProps,windowed]);
 const statusRow=hasStatus?<tr aria-rowindex={windowed?rows.length+2:undefined} className='hig-table-state'><td colSpan={Math.max(1,columns.length)}>{status}</td></tr>:null;
 return <div className={`hig-table-scroll${className?` ${className}`:''}`} style={style} tabIndex={0} role='region' aria-label={caption} aria-busy={loading||undefined}><table aria-rowcount={windowed?1+rows.length+Number(hasStatus):undefined} className={`hig-table${tableClassName?` ${tableClassName}`:''}`} data-sticky-header={stickyHeader||undefined}><caption className={captionHidden?'hig-sr-only':undefined}>{caption}</caption><thead><tr aria-rowindex={windowed?1:undefined}>{columns.map(c=><th key={c.key} scope='col' aria-sort={c.sort} style={c.align?{textAlign:c.align}:undefined}>{c.onSort?<button type='button' className='hig-table-sort' onClick={c.onSort}>{c.label}{(c.sort==='ascending'?<ChevronUp size={14} className='hig-table-sort-icon'/>:c.sort==='descending'?<ChevronDown size={14} className='hig-table-sort-icon'/>:<ChevronsUpDown size={14} className='hig-table-sort-icon'/> )}</button>:c.label}</th>)}</tr></thead>{windowed?<>{body}{hasStatus&&<tbody>{statusRow}</tbody>}</>:<tbody>{body}{statusRow}</tbody>}</table></div>;
}
