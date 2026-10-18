import React from 'react';
import {FlatList,View,StyleSheet,type StyleProp,type TextStyle} from 'react-native';
import {formatNumber} from '@bloxwap/hig-contracts';
import * as en from '@bloxwap/hig-contracts/messages';
import {useColors,useHIG} from './provider.js';
import {Text,Surface} from './surface.js';
import {Button} from './button.js';
export type NumberTone='text'|'positive'|'negative'|'muted';
/** Typography only: semantic tone owns colour and numeric glyphs remain tabular. */
export type NumberReadoutStyle=Pick<TextStyle,'fontFamily'|'fontSize'|'fontWeight'|'lineHeight'|'letterSpacing'|'textAlign'>;
const numberTypographyKeys=new Set(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign']);
export interface NumberProps {value:number|null|undefined;options?:Intl.NumberFormatOptions;stale?:boolean;label?:string;/** Explicit semantic meaning; sign alone never chooses the tone. */tone?:NumberTone;/** Text typography, including an explicitly registered mono face. Does not style the animated wrapper. */style?:StyleProp<NumberReadoutStyle>;testID?:string;/** Font-scale cap for dense readouts, e.g. 2 for 200% at AX5. */maxFontSizeMultiplier?:number}
export function NumberReadout({value,options,stale,label,tone='text',style,testID,maxFontSizeMultiplier}:NumberProps){
 const {locale,messages}=useHIG();const colors=useColors();const reading=formatNumber(value,locale,options);const suffix=stale?` ${messages.stale??en.stale}`:'';
 // Keep the same boundary for untyped hosts and registered/array styles: no raw colour, glyph or layout overrides.
 const typography=Object.fromEntries(Object.entries(StyleSheet.flatten(style)??{}).filter(([key])=>numberTypographyKeys.has(key)));
 const color=colors[tone==='positive'||tone==='negative'||tone==='muted'?tone:'text'];
 return <Text accessibilityLabel={label?`${label}: ${reading}${suffix}`:undefined} testID={testID} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[typography,{color,fontVariant:['tabular-nums']}]}>{reading}{suffix}</Text>;
}
export function Usd(props:NumberProps){return <NumberReadout {...props} options={{style:'currency',currency:'USD',...props.options}}/>;}
export function Percent(props:NumberProps){return <NumberReadout {...props} value={props.value==null?props.value:props.value/100} options={{maximumFractionDigits:Math.max(3,props.options?.minimumFractionDigits??0),...props.options,style:'percent'}}/>;}
export function Metric({label,value}: {label:string;value:React.ReactNode}){return <Surface><Text>{label}</Text>{value}</Surface>;}
export const Stat=Metric;
export function Row({children}:React.PropsWithChildren){return <View style={{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:12,paddingVertical:12}}>{children}</View>;}
/** Native alternative to dense DOM tables: virtualized labeled rows. */
export interface ListProps<T> {items:readonly T[];keyFor:(item:T)=>string;render:(item:T)=>React.ReactNode;empty?:string;label?:string;loading?:boolean;error?:string;onRetry?:()=>void;onLoadMore?:()=>void}
export function List<T>({items,keyFor,render,empty,label,loading=false,error,onRetry,onLoadMore}:ListProps<T>){const {messages}=useHIG();return <FlatList data={items} accessibilityLabel={label} accessibilityState={{busy:loading}} keyExtractor={keyFor} renderItem={({item})=><View>{render(item)}</View>}
 ListEmptyComponent={!loading&&!error?<Text>{empty??messages.noItems??en.noItems}</Text>:null}
 ListFooterComponent={<View>{loading&&<Text accessibilityLiveRegion='polite'>{messages.loadingItems??en.loadingItems}</Text>}{error&&<View><Text accessibilityRole='alert'>{error}</Text>{onRetry&&<Button disabled={loading} onPress={onRetry}>{messages.retry??en.retry}</Button>}</View>}{onLoadMore&&<Button disabled={loading} onPress={onLoadMore}>{messages.loadMore??en.loadMore}</Button>}</View>}/>;}
