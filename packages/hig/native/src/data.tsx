import {memoizedRenderer} from './flat-list-options.js';
import {assertUniqueKeys} from '@bloxwap/hig/contracts/invariants';
import React from 'react';
import {Dimensions,FlatList,Platform,View,StyleSheet,type FlatListProps,type LayoutChangeEvent,type StyleProp,type TextStyle,type ViewStyle} from 'react-native';
import {formatNumberReadout} from './animated-number-model.js';
import {presentNumberFormat} from '@bloxwap/hig/contracts/environment';
import * as en from '@bloxwap/hig/contracts/messages';
import {useColors,useMessageOverrides,useMonoFontFamily,useReadoutFormat} from './provider.js';
import {Text,Surface,Separator} from './surface.js';
import {Button} from './button.js';
/** `up`/`down` are market direction (rising/long/gain, falling/short/loss) and follow `HIGProvider marketColors`; `positive`/`negative` stay success/error. */
/** `action` is the brand action colour, for a figure that stands for the live mark (the chart's price pill). */
export type NumberTone='text'|'positive'|'negative'|'warning'|'muted'|'faint'|'up'|'down'|'action';
/** Typography only: semantic tone owns colour and numeric glyphs remain tabular. */
export type NumberReadoutStyle=Pick<TextStyle,'fontFamily'|'fontSize'|'fontWeight'|'lineHeight'|'letterSpacing'|'textAlign'|'textDecorationLine'|'textDecorationColor'|'textDecorationStyle'>;
const numberTypographyKeys=new Set(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign','textDecorationLine','textDecorationColor','textDecorationStyle']);
const tabularStyle:TextStyle={fontVariant:['tabular-nums']};
export interface NumberProps {value:number|null|undefined;options?:Intl.NumberFormatOptions;/** Host-owned display text for a finite value. Empty text falls back to locale formatting; never parse this text for submission. */formattedValue?:string;stale?:boolean;label?:string;/** Explicit semantic meaning; sign alone never chooses the tone. */tone?:NumberTone;/** Text typography, including an explicitly registered mono face. Does not style the animated wrapper. */style?:StyleProp<NumberReadoutStyle>;testID?:string;/** Font-scale cap for dense readouts, e.g. 2 for 200% at AX5. */maxFontSizeMultiplier?:number;/** Display-only affixes, omitted for unknown values. */prefix?:string;suffix?:string}
export const NumberReadout=React.memo(function NumberReadout({value,options,formattedValue,stale,label,tone='text',style,testID,maxFontSizeMultiplier,prefix,suffix}:NumberProps){
 const {locale,numberFormat,staleLabel}=useReadoutFormat(options?.style==='currency');const colors=useColors();const reading=formatNumberReadout(value,locale,presentNumberFormat(options,numberFormat),formattedValue,prefix,suffix).text;const staleSuffix=stale?` ${staleLabel??en.stale}`:'';
 const color=colors[tone==='positive'||tone==='negative'||tone==='warning'||tone==='muted'||tone==='faint'||tone==='up'||tone==='down'||tone==='action'?tone:'text'];
 const textStyle=React.useMemo(()=>{
  const base=color===colors.text?tabularStyle:{...tabularStyle,color};
  if(!style)return base;
  // Host typography can override inherited metrics, while the tone and numeric glyphs stay semantic.
  const typography=Object.fromEntries(Object.entries(StyleSheet.flatten(style)??{}).filter(([key])=>numberTypographyKeys.has(key))) as TextStyle;
  if(typography.fontSize!==undefined && typography.lineHeight===undefined)typography.lineHeight=undefined;
  return [typography,base];
 },[style,color,colors.text]);
 const display=reading+staleSuffix;
 return <Text accessibilityLabel={label?`${label}: ${display}`:undefined} testID={testID} maxFontSizeMultiplier={maxFontSizeMultiplier} style={textStyle}>{display}</Text>;
});
export function Usd(props:NumberProps){return <MemoizedUsd {...props}/>;}
const MemoizedUsd=React.memo(function Usd(props:NumberProps){return <NumberReadout {...props} options={{style:'currency',currency:'USD',...props.options}}/>;});
export function Percent(props:NumberProps){return <MemoizedPercent {...props}/>;}
const MemoizedPercent=React.memo(function Percent(props:NumberProps){return <NumberReadout {...props} value={props.value==null?props.value:props.value/100} options={{maximumFractionDigits:Math.max(3,props.options?.minimumFractionDigits??0),...props.options,style:'percent'}}/>;});
export function Metric({label,value}: {label:string;value:React.ReactNode}){return <Surface><Text>{label}</Text>{value}</Surface>;}
export const Stat=Metric;
export function Row({children}:React.PropsWithChildren){return <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,paddingVertical:12}}>{children}</View>;}
/** Native alternative to dense DOM tables: virtualized labeled rows. */
export interface ListProps<T> {
 /** Exact FlatList offsets in dp, including separators and leading padding. Omit for measured rows. */
 getItemLayout?:FlatListProps<T>['getItemLayout'];
 contentContainerStyle?:StyleProp<ViewStyle>;items:readonly T[];keyFor:(item:T)=>string;render:(item:T)=>React.ReactNode;empty?:string;label?:string;loading?:boolean;error?:string;onRetry?:()=>void;onLoadMore?:()=>void}
function ListCell<T>({item,render}:{item:T;render:(item:T)=>React.ReactNode}){
 return <View>{render(item)}</View>;
}
const MemoizedListCell=React.memo(ListCell) as typeof ListCell;
function EmptyList({empty}:{empty?:string}){
 const messages=useMessageOverrides();
 return <Text>{empty??messages.noItems??en.noItems}</Text>;
}
type ListFooterProps=Pick<ListProps<unknown>,'loading'|'error'|'onRetry'|'onLoadMore'>;
function ListFooter({loading,error,onRetry,onLoadMore}:ListFooterProps){
 const messages=useMessageOverrides();
 return <View style={{gap:12,paddingTop:12}}>{loading&&<Text accessibilityLiveRegion='polite'>{messages.loadingItems??en.loadingItems}</Text>}{error&&<View style={{gap:12}}><Text accessibilityRole='alert'>{error}</Text>{onRetry&&<Button disabled={loading} onPress={onRetry}>{messages.retry??en.retry}</Button>}</View>}{onLoadMore&&<Button disabled={loading} onPress={onLoadMore}>{messages.loadMore??en.loadMore}</Button>}</View>;
}
function NativeList<T>({contentContainerStyle,getItemLayout,items,keyFor,render,empty,label,loading=false,error,onRetry,onLoadMore}:ListProps<T>){
 const data=React.useMemo(()=>{
  assertUniqueKeys(items,keyFor,'List');
  return items;
 },[items,keyFor]);
 const [viewport,setViewport]=React.useState(0);

 const measureViewport=React.useCallback((event:LayoutChangeEvent)=>{
  setViewport(event.nativeEvent.layout.height);
 },[]);
 // Without exact offsets, FlatList limits the scrollable tail to measured cells.
 // A four-row window then stops a fling before its offscreen destination exists.
 const rowStride=React.useMemo(()=>items.length>50&&getItemLayout
  ?getItemLayout(items,1).offset-getItemLayout(items,0).offset:0,[items,getItemLayout]);
 const compact=Number.isFinite(rowStride)&&rowStride>0;
 const renderItem=React.useCallback(({item}:{item:T})=><MemoizedListCell item={item} render={render}/>,[render]);
 const windowSize=compact?1+8*rowStride/Math.max(1,viewport||Dimensions.get('window').height):undefined;
 const accessibilityState=React.useMemo(()=>({busy:loading}),[loading]);
 const emptyComponent=React.useMemo(()=>!loading&&!error?<EmptyList empty={empty}/>:null,[loading,error,empty]);
 const footer=React.useMemo(()=>loading||error||onLoadMore?<ListFooter loading={loading} error={error} onRetry={onRetry} onLoadMore={onLoadMore}/>:null,[loading,error,onRetry,onLoadMore]);
 return <FlatList {...memoizedRenderer} contentContainerStyle={contentContainerStyle} data={data} accessibilityLabel={label} accessibilityState={accessibilityState} keyExtractor={keyFor} renderItem={renderItem} ItemSeparatorComponent={Separator}
 getItemLayout={getItemLayout} onLayout={compact?measureViewport:undefined} windowSize={windowSize} maxToRenderPerBatch={compact?4:undefined} updateCellsBatchingPeriod={compact?16:undefined}
 ListEmptyComponent={emptyComponent}
 ListFooterComponent={footer}/>;}
const MemoizedNativeList=React.memo(NativeList) as typeof NativeList;
export function List<T>(props:ListProps<T>){return <MemoizedNativeList {...props}/>;}

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
 const colors=useColors();const mono=useMonoFontFamily()??Platform.select({ios:'Menlo',default:'monospace'});const runs=React.useMemo(()=>{
  const runs:{text:string;anchor:boolean}[]=[];
  for(const row of addressRows(address,kind)){
   const previous=runs.at(-1);
   if(previous)previous.text+='\n';
   for(const cell of row){
    const last=runs.at(-1);
    if(last?.anchor===cell.anchor)last.text+=cell.character;
    else runs.push({text:cell.character,anchor:cell.anchor});
   }
  }
  return runs;
 },[address,kind]);
 // HIG Text sets its own body size, so each styled run carries the row's type size instead of inheriting it.
 const type={fontFamily:mono,fontSize:Math.round(rowHeight/1.1*10)/10,lineHeight:rowHeight,letterSpacing:1};
 return <Text selectable accessibilityLabel={address} testID={testID} maxFontSizeMultiplier={1.2} style={{...type,fontVariant:['tabular-nums'],writingDirection:'ltr',textAlign:'left'}}>{runs.map((run,index)=><Text key={index} maxFontSizeMultiplier={1.2} style={{...type,color:run.anchor?colors.text:colors.muted,fontWeight:run.anchor?'600':'500'}}>{run.text}</Text>)}</Text>;
}
