import React from 'react';
import {FlatList,View} from 'react-native';
import {formatNumber} from '@bloxwap/hig-contracts';
import {useHIG} from './provider.js';
import {Text,Surface} from './surface.js';
import {Button} from './button.js';
export interface NumberProps {value:number|null|undefined;options?:Intl.NumberFormatOptions;stale?:boolean;label?:string}
export function NumberReadout({value,options,stale,label}:NumberProps){const {locale}=useHIG();const reading=formatNumber(value,locale,options);return <Text accessibilityLabel={label?`${label}: ${reading}${stale?' (stale)':''}`:undefined} style={{fontVariant:['tabular-nums']}}>{reading}{stale?' (stale)':''}</Text>;}
export function Usd(props:NumberProps){return <NumberReadout {...props} options={{style:'currency',currency:'USD',...props.options}}/>;}
export function Percent(props:NumberProps){return <NumberReadout {...props} value={props.value==null?props.value:props.value/100} options={{maximumFractionDigits:Math.max(3,props.options?.minimumFractionDigits??0),...props.options,style:'percent'}}/>;}
export function Metric({label,value}: {label:string;value:React.ReactNode}){return <Surface><Text>{label}</Text>{value}</Surface>;}
export const Stat=Metric;
export function Row({children}:React.PropsWithChildren){return <View style={{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:12,paddingVertical:12}}>{children}</View>;}
/** Native alternative to dense DOM tables: virtualized labeled rows. */
export interface ListProps<T> {items:readonly T[];keyFor:(item:T)=>string;render:(item:T)=>React.ReactNode;empty?:string;label?:string;loading?:boolean;error?:string;onRetry?:()=>void;onLoadMore?:()=>void}
export function List<T>({items,keyFor,render,empty='No items',label,loading=false,error,onRetry,onLoadMore}:ListProps<T>){return <FlatList data={items} accessibilityLabel={label} accessibilityState={{busy:loading}} keyExtractor={keyFor} renderItem={({item})=><View>{render(item)}</View>}
 ListEmptyComponent={!loading&&!error?<Text>{empty}</Text>:null}
 ListFooterComponent={<View>{loading&&<Text accessibilityLiveRegion='polite'>Loading items</Text>}{error&&<View><Text accessibilityRole='alert'>{error}</Text>{onRetry&&<Button disabled={loading} onPress={onRetry}>Retry</Button>}</View>}{onLoadMore&&<Button disabled={loading} onPress={onLoadMore}>Load more</Button>}</View>}/>;}
