import {assertUniqueKeys} from '@bloxwap/hig/contracts';
import React from 'react';
import {FlatList,Platform,View,StyleSheet,type StyleProp,type TextStyle} from 'react-native';
import {formatNumberReadout} from './animated-number-model.js';
import {presentNumberFormat} from '@bloxwap/hig/contracts';
import * as en from '@bloxwap/hig/contracts/messages';
import {useColors,useHIG,useNumberLocale} from './provider.js';
import {Text,Surface,Separator} from './surface.js';
import {Button} from './button.js';
/** `up`/`down` are market direction (rising/long/gain, falling/short/loss) and follow `HIGProvider marketColors`; `positive`/`negative` stay success/error. */
export type NumberTone='text'|'positive'|'negative'|'warning'|'muted'|'faint'|'up'|'down';
/** Typography only: semantic tone owns colour and numeric glyphs remain tabular. */
export type NumberReadoutStyle=Pick<TextStyle,'fontFamily'|'fontSize'|'fontWeight'|'lineHeight'|'letterSpacing'|'textAlign'|'textDecorationLine'|'textDecorationColor'|'textDecorationStyle'>;
const numberTypographyKeys=new Set(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign','textDecorationLine','textDecorationColor','textDecorationStyle']);
export interface NumberProps {value:number|null|undefined;options?:Intl.NumberFormatOptions;/** Host-owned display text for a finite value. Empty text falls back to locale formatting; never parse this text for submission. */formattedValue?:string;stale?:boolean;label?:string;/** Explicit semantic meaning; sign alone never chooses the tone. */tone?:NumberTone;/** Text typography, including an explicitly registered mono face. Does not style the animated wrapper. */style?:StyleProp<NumberReadoutStyle>;testID?:string;/** Font-scale cap for dense readouts, e.g. 2 for 200% at AX5. */maxFontSizeMultiplier?:number;/** Display-only affixes, omitted for unknown values. */prefix?:string;suffix?:string}
export function NumberReadout({value,options,formattedValue,stale,label,tone='text',style,testID,maxFontSizeMultiplier,prefix,suffix}:NumberProps){
 const {messages,numberFormat}=useHIG();const locale=useNumberLocale();const colors=useColors();const reading=formatNumberReadout(value,locale,presentNumberFormat(options,numberFormat),formattedValue,prefix,suffix).text;const staleSuffix=stale?` ${messages.stale??en.stale}`:'';
 // Keep the same boundary for untyped hosts and registered/array styles: no raw colour, glyph or layout overrides.
 const typography=Object.fromEntries(Object.entries(StyleSheet.flatten(style)??{}).filter(([key])=>numberTypographyKeys.has(key)));
 if(typography.fontSize!==undefined && typography.lineHeight===undefined) typography.lineHeight=undefined;
 const color=colors[tone==='positive'||tone==='negative'||tone==='warning'||tone==='muted'||tone==='faint'||tone==='up'||tone==='down'?tone:'text'];
 return <Text accessibilityLabel={label?`${label}: ${reading}${staleSuffix}`:undefined} testID={testID} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[typography,{color,fontVariant:['tabular-nums']}]}>{reading}{staleSuffix}</Text>;
}
export function Usd(props:NumberProps){return <NumberReadout {...props} options={{style:'currency',currency:'USD',...props.options}}/>;}
export function Percent(props:NumberProps){return <NumberReadout {...props} value={props.value==null?props.value:props.value/100} options={{maximumFractionDigits:Math.max(3,props.options?.minimumFractionDigits??0),...props.options,style:'percent'}}/>;}
export function Metric({label,value}: {label:string;value:React.ReactNode}){return <Surface><Text>{label}</Text>{value}</Surface>;}
export const Stat=Metric;
export function Row({children}:React.PropsWithChildren){return <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,paddingVertical:12}}>{children}</View>;}
/** Native alternative to dense DOM tables: virtualized labeled rows. */
export interface ListProps<T> {items:readonly T[];keyFor:(item:T)=>string;render:(item:T)=>React.ReactNode;empty?:string;label?:string;loading?:boolean;error?:string;onRetry?:()=>void;onLoadMore?:()=>void}
export function List<T>({items,keyFor,render,empty,label,loading=false,error,onRetry,onLoadMore}:ListProps<T>){assertUniqueKeys(items,keyFor,'List');const {messages}=useHIG();return <FlatList data={items} accessibilityLabel={label} accessibilityState={{busy:loading}} keyExtractor={keyFor} renderItem={({item})=><View>{render(item)}</View>} ItemSeparatorComponent={Separator}
 ListEmptyComponent={!loading&&!error?<Text>{empty??messages.noItems??en.noItems}</Text>:null}
 ListFooterComponent={<View style={{gap:12,paddingTop:loading||error||onLoadMore?12:0}}>{loading&&<Text accessibilityLiveRegion='polite'>{messages.loadingItems??en.loadingItems}</Text>}{error&&<View style={{gap:12}}><Text accessibilityRole='alert'>{error}</Text>{onRetry&&<Button disabled={loading} onPress={onRetry}>{messages.retry??en.retry}</Button>}</View>}{onLoadMore&&<Button disabled={loading} onPress={onLoadMore}>{messages.loadMore??en.loadMore}</Button>}</View>}/>;}
export type AddressKind='ethereum'|'solana';
/** `0x…` is Ethereum-style (EVM); anything else lays out as Solana (base58). */
export function addressKind(address:string):AddressKind{return address.startsWith('0x')?'ethereum':'solana';}
/** The address in fixed-width rows: 6 characters for Ethereum (42 characters make 7 rows), 4 for Solana (44 make 11). `anchor` marks the leading row and the trailing 4 characters, the ones people compare. */
export function addressRows(address:string,kind:AddressKind=addressKind(address)):{character:string;anchor:boolean}[][]{
 const size=kind==='ethereum'?6:4,tail=address.length-4,rows:{character:string;anchor:boolean}[][]=[];
 for(let index=0;index<address.length;index+=size)rows.push(Array.from(address.slice(index,index+size)).map((character,offset)=>({character,anchor:index+offset<size||index+offset>=tail})));
 return rows;
}
export interface VerticalAddressProps {address:string;kind?:AddressKind;/** Row height in dp; the font size follows it. */rowHeight?:number;testID?:string}
/** A wallet address as a monospace column: the anchor characters in `text` at weight 600, the middle in `muted`. One selectable text element named by the whole address, always left to right. */
export function VerticalAddress({address,kind,rowHeight=22,testID}:VerticalAddressProps){
 const env=useHIG();const colors=useColors();const mono=env.monoFontFamily??Platform.select({ios:'Menlo',default:'monospace'});const rows=addressRows(address,kind);
 // HIG Text sets its own body size, so each character carries the row's type size instead of inheriting it.
 const type={fontFamily:mono,fontSize:Math.round(rowHeight/1.1*10)/10,lineHeight:rowHeight,letterSpacing:1};
 return <Text selectable accessibilityLabel={address} testID={testID} maxFontSizeMultiplier={1.2} style={{...type,fontVariant:['tabular-nums'],writingDirection:'ltr',textAlign:'left'}}>{rows.map((row,index)=><React.Fragment key={index}>{index>0?'\n':null}{row.map((cell,offset)=><Text key={offset} maxFontSizeMultiplier={1.2} style={{...type,color:cell.anchor?colors.text:colors.muted,fontWeight:cell.anchor?'600':'500'}}>{cell.character}</Text>)}</React.Fragment>)}</Text>;
}
