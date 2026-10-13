import React from 'react';
import {FlatList,View} from 'react-native';
import {formatNumber} from '@bloxwap/hig-contracts';
import {useHIG} from './provider.js';
import {Text,Surface} from './surface.js';
export interface NumberProps {value:number|null|undefined;options?:Intl.NumberFormatOptions;stale?:boolean;label?:string}
export function NumberReadout({value,options,stale,label}:NumberProps){const {locale}=useHIG();return <Text accessibilityLabel={label} style={{fontVariant:['tabular-nums']}}>{formatNumber(value,locale,options)}{stale?' (stale)':''}</Text>;}
export function Usd(props:NumberProps){return <NumberReadout {...props} options={{style:'currency',currency:'USD',...props.options}}/>;}
export function Percent(props:NumberProps){if(props.value==null||!Number.isFinite(props.value))return <NumberReadout {...props}/>;return <View style={{flexDirection:'row'}}><NumberReadout {...props}/><Text>%</Text></View>;}
export function Metric({label,value}: {label:string;value:React.ReactNode}){return <Surface><Text>{label}</Text>{value}</Surface>;}
export const Stat=Metric;
export function Row({children}:React.PropsWithChildren){return <View style={{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:12,paddingVertical:12}}>{children}</View>;}
/** Native alternative to dense DOM tables: virtualized labeled rows. */
export function List<T>({items,keyFor,render,empty='No items'}: {items:readonly T[];keyFor:(item:T)=>string;render:(item:T)=>React.ReactNode;empty?:string}){return <FlatList data={items} keyExtractor={keyFor} renderItem={({item})=><View>{render(item)}</View>} ListEmptyComponent={<Text>{empty}</Text>}/>;}
