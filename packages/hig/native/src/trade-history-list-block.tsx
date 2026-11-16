import React from 'react';
import {Image,Pressable,View,type NativeScrollEvent,type NativeSyntheticEvent,type ScrollViewProps,type ViewStyle} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useColors,useFills,useHIG,useNumberLocale,usePresentNumber} from './provider.js';
import {Text} from './surface.js';
import {ChevronIcon} from './icons.js';
import {ScreenHeader} from './screen-header.js';
import {StickyHeaderLayout,stickyHeaderFill,useStickyHeaderScroll} from './sticky-header.js';
import {AnimatedNumberReadout} from './animated-number.js';
import type {AssetArtwork} from './asset-balance-row.js';
/** The words of the block. They are trading terms, so the host supplies them; HIG ships none. */
export interface TradeHistoryListLabels {
 /** Heading of the screen: History. */
 title:string;
 long:string;short:string;
 /** Shown in place of the rows when there are no trades. */
 empty:string;
 /** A second line under `empty`, in the muted colour: Closed trades appear here. */
 emptyDescription?:string;
}
/** One closed trade. */
export interface TradeHistoryItem {
 id:string;
 /** Asset name: Amazon. */
 name:string;
 /** Short ticker for the fallback disc when there is no `icon`: BTC. Without it the disc shows the first letters of the name. */
 symbol?:string;
 /** Round artwork: an image URL or a host element. Without it the row shows `symbol` or the first letters of the name. */
 icon?:AssetArtwork;
 side:'long'|'short';
 /** 20 reads `20×`. */
 leverage?:number;
 /** A short muted qualifier after the leverage, read with it: current. Use it when the leverage was not recorded with the trade. */
 leverageNote?:string;
 /** Net profit and loss in dollars. `null` reads as unknown. */
 pnl:number|null;
 /** Host-formatted age or time of the close, shown under the result: `2d`. */
 time?:string;
 /** Small muted host text before the age, such as the wallet the trade came from: `0x22…22`. */
 tag?:string;
 /** Format of this trade's result, in place of the block's `pnlOptions`, for a host whose decimal ladder depends on the amount. */
 pnlOptions?:Intl.NumberFormatOptions;
}
/**
 * What `renderList` receives, shaped for FlatList so `{...list}` spreads onto it: the trades and helpers that draw them exactly
 * as the block does. With `listChrome` it also carries everything around them, so the list holds the whole screen and a sheet
 * that sizes itself to its content measures the list alone.
 */
export interface TradeHistoryListRender {
 trades:readonly TradeHistoryItem[];
 /** Draws one row; the signature matches FlatList's `renderItem`. */
 renderItem:(info:{item:TradeHistoryItem})=>React.ReactElement;
 keyExtractor:(trade:TradeHistoryItem)=>string;
 /** The 8dp gap between rows, for `ItemSeparatorComponent`. */
 ItemSeparatorComponent:React.ComponentType;
 /** With `listChrome`: the header (unless it is pinned with `stickyHeader`) and the `notice`, 16dp above the first row. `null` when there is neither. */
 ListHeaderComponent?:React.ReactElement|null;
 /** With `listChrome`: the `footer`, 16dp under the last row. `null` without one. */
 ListFooterComponent?:React.ReactElement|null;
 /** With `listChrome`: the block's 16dp inset around the rows, header and footer. */
 contentContainerStyle?:ViewStyle;
 /** With `stickyHeader`: reports the list's offset so the pinned header fills once rows scroll under it. */
 onScroll?:(event:NativeSyntheticEvent<NativeScrollEvent>)=>void;
 scrollEventThrottle?:number;
}
export interface TradeHistoryListBlockProps {
 labels:TradeHistoryListLabels;
 /** Closed trades, in the order shown. The host sorts and pages them. */
 trades:readonly TradeHistoryItem[];
 /** Makes each row a button that reports its trade, usually to open its detail, and shows the disclosure chevron. */
 onSelect?:(trade:TradeHistoryItem)=>void;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 /** Format of the result. Defaults to signed US dollars at four significant digits: `+$1.412`, `+$17.90`, `-$0.6878`. The provider's `numberFormat` is merged under it. */
 pnlOptions?:Intl.NumberFormatOptions;
 /** Draws rows of skeletons in place of the trades while the host loads them. */
 loading?:boolean;
 /** Host text that names the skeleton rows for assistive technology: Loading history. Without it they are only marked busy. */
 loadingLabel?:string;
 /** Why the trades could not load, in place of the rows, in the negative colour and announced. */
 error?:string;
 /** Host content under the header, above the rows: a partial-history notice or a mode banner. */
 notice?:React.ReactNode;
 /** Host content under the rows: paging, a spinner for the next page, a note. */
 footer?:React.ReactNode;
 /**
  * Draws the rows through the host's own list, so a long history does not mount every row at once:
  * `renderList={list => <FlatList data={list.trades} {...list} initialNumToRender={10}/>}`. The header, notice and footer stay
  * fixed around the list in the block's inset, and the block fills its parent (`flex: 1`), so place it in a bounded container
  * such as a sheet body, not inside a ScrollView.
  */
 renderList?:(list:TradeHistoryListRender)=>React.ReactNode;
 /**
  * With `renderList`: hands the list the header, notice, footer and inset as well (`ListHeaderComponent`, `ListFooterComponent`,
  * `contentContainerStyle`), so they scroll with the rows, a spread FlatList holds the whole screen and a sheet that sizes itself
  * to its content measures the list alone. The block then adds no padding of its own. Spread the whole object.
  */
 listChrome?:boolean;
 /** Keeps the header pinned while the rows scroll, transparent at rest and filled once rows scroll under it. Without `renderList` the block becomes its own scroll view; with it the header stays above the host's list, which reports its offset through `onScroll`. Place it in a bounded container. */
 stickyHeader?:boolean;
 /** Fill behind the pinned header once rows scroll under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader` without `renderList`, such as a sheet library's own. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 testID?:string;
}
const pnlFormat:Intl.NumberFormatOptions={style:'currency',currency:'USD',signDisplay:'exceptZero',minimumSignificantDigits:4,maximumSignificantDigits:4};
/** How a row reads its side: `Short 20×`, or `Short` without leverage. */
export const tradeHistorySide=(trade:Pick<TradeHistoryItem,'side'|'leverage'>&{leverageNote?:string},labels:Pick<TradeHistoryListLabels,'long'|'short'>,locale?:string):string=>`${trade.side==='long'?labels.long:labels.short}${trade.leverage!=null?` ${formatNumber(trade.leverage,locale)}×`:''}${trade.leverageNote?` ${trade.leverageNote}`:''}`;
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const avatar=40,skeletons=[0,1,2,3],dot='·';
const keyOf=(trade:TradeHistoryItem)=>trade.id;
function Gap(){return <View style={{height:8}}/>;}
/** Points up; a short turns it over. */
function Arrow({color,down}:{color:string;down:boolean}){return <View style={{width:12,height:14,alignItems:'center',transform:down?[{rotate:'180deg'}]:undefined}}><View style={{position:'absolute',top:1,width:7,height:7,borderLeftWidth:1.75,borderTopWidth:1.75,borderColor:color,transform:[{rotate:'45deg'}]}}/><View style={{width:1.75,height:14,borderRadius:1,backgroundColor:color}}/></View>;}
/** A history of closed trades as one screen: a header, then one row per trade with the asset, its side and leverage in the market direction colour, and the net result in the market direction colour over its age. */
export function TradeHistoryListBlock({labels,trades,onSelect,onBack,headerAction,pnlOptions=pnlFormat,loading,loadingLabel,error,notice,footer,renderList,listChrome,stickyHeader,stickyHeaderBackground,scrollComponent,testID}:TradeHistoryListBlockProps){
 const colors=useColors(),fills=useFills(),{direction}=useHIG(),locale=useNumberLocale(),present=usePresentNumber();
 const listScroll=useStickyHeaderScroll();
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const row=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:pressed?fills.raised:fills.well});
 const meta={fontSize:14,lineHeight:20,color:colors.muted} as const;
 const draw=(trade:TradeHistoryItem)=>{
  const side=trade.side==='long'?colors.up:colors.down,result=trade.pnlOptions??pnlOptions;
  const reading=[trade.name,tradeHistorySide(trade,labels,locale),formatNumber(trade.pnl,locale,present(result)),trade.tag,trade.time].filter(Boolean).join(', ');
  const content=<>
   <View {...hidden}>{typeof trade.icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:trade.icon}} style={shape as object}/>:<View style={shape}>{trade.icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{trade.symbol??trade.name.slice(0,3)}</Text>}</View>}</View>
   <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
    <Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{trade.name}</Text>
    <View testID={testID?`${testID}-${trade.id}-side`:undefined} style={{flexDirection:'row',alignItems:'center',gap:4}}><Arrow color={side} down={trade.side==='short'}/>{trade.leverage!=null?<Text style={{fontSize:14,lineHeight:20,fontWeight:'600',color:side}}>{`${formatNumber(trade.leverage,locale)}×`}</Text>:null}{trade.leverageNote?<Text testID={testID?`${testID}-${trade.id}-leverage-note`:undefined} numberOfLines={1} style={{...meta,flexShrink:1}}>{trade.leverageNote}</Text>:null}</View>
   </View>
   <View {...hidden} style={trade.tag?{alignItems:'flex-end',justifyContent:'center',flexShrink:1}:{alignItems:'flex-end',justifyContent:'center'}}>
    <AnimatedNumberReadout value={trade.pnl} options={result} tone={trade.pnl==null||trade.pnl===0?'text':trade.pnl>0?'up':'down'} testID={testID?`${testID}-${trade.id}-pnl`:undefined} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/>
    {trade.tag?<View testID={testID?`${testID}-${trade.id}-meta`:undefined} style={{direction,flexDirection:'row',alignItems:'center',gap:4,flexShrink:1}}><Text numberOfLines={1} style={{...meta,flexShrink:1}}>{trade.tag}</Text>{trade.time?<><Text style={meta}>{dot}</Text><Text style={meta}>{trade.time}</Text></>:null}</View>
     :trade.time?<Text style={meta}>{trade.time}</Text>:null}
   </View>
  </>;
  return onSelect?<Pressable key={trade.id} testID={testID?`${testID}-${trade.id}`:undefined} accessibilityRole='button' accessibilityLabel={reading} onPress={()=>onSelect(trade)} style={({pressed})=>row(pressed)}>{content}<View {...hidden} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View></Pressable>
   :<View key={trade.id} testID={testID?`${testID}-${trade.id}`:undefined} accessible accessibilityLabel={reading} style={row(false)}>{content}</View>;
 };
 // The empty and error lines keep 32 above them and none below: the block's (or the host sheet's) 16 bottom inset is the only space under the text.
 const plain={paddingTop:32,paddingBottom:0,textAlign:'center',fontSize:14,lineHeight:20} as const;
 const body=loading?<View testID={testID?`${testID}-loading`:undefined} accessible={!!loadingLabel} accessibilityLabel={loadingLabel} accessibilityState={{busy:true}} style={{gap:8}}>{skeletons.map(index=><View key={index} style={{minHeight:56,borderRadius:28,backgroundColor:fills.raised}}/>)}</View>
  :error?<Text testID={testID?`${testID}-error`:undefined} accessibilityRole='alert' accessibilityLiveRegion='polite' style={{...plain,color:colors.negative}}>{error}</Text>
  :trades.length===0?(labels.emptyDescription?<View testID={testID?`${testID}-empty`:undefined} accessible accessibilityLabel={`${labels.empty}, ${labels.emptyDescription}`} style={{paddingTop:32,gap:4}}>
   <Text style={{...plain,paddingTop:0,fontWeight:'600',color:colors.text}}>{labels.empty}</Text>
   <Text style={{...plain,paddingTop:0,color:colors.muted}}>{labels.emptyDescription}</Text>
  </View>:<Text testID={testID?`${testID}-empty`:undefined} style={{...plain,color:colors.muted}}>{labels.empty}</Text>)
  :null;
 const header=<ScreenHeader testID={testID} title={labels.title} onBack={onBack} action={headerAction}/>;
 const noticeView=notice!=null&&notice!==false?<View testID={testID?`${testID}-notice`:undefined} style={{gap:8}}>{notice}</View>:null;
 const footerView=footer!=null&&footer!==false?<View testID={testID?`${testID}-footer`:undefined} style={{gap:8}}>{footer}</View>:null;
 let hosted:React.ReactElement|null=null;
 if(!body&&renderList){
  const scroll=stickyHeader?{onScroll:listScroll.onScroll,scrollEventThrottle:listScroll.scrollEventThrottle}:null;
  const base={trades,renderItem:({item}:{item:TradeHistoryItem})=>draw(item),keyExtractor:keyOf,ItemSeparatorComponent:Gap,...scroll};
  // listChrome: the list holds the whole screen, with header and notice above the rows, the footer under them, and the block's inset around both.
  const top=stickyHeader?noticeView:<>{header}{noticeView}</>;
  const list=renderList(listChrome?{...base,
   ListHeaderComponent:stickyHeader&&!noticeView?null:<View style={{direction,gap:16,paddingBottom:16}}>{top}</View>,
   ListFooterComponent:footerView?<View style={{direction,paddingTop:16}}>{footerView}</View>:null,
   contentContainerStyle:{padding:16}}:base);
  hosted=<View testID={testID?`${testID}-rows`:undefined} style={{flex:1}}>{list}</View>;
  const pinned=stickyHeader?<View testID={testID?`${testID}-sticky-header`:undefined} style={[{paddingHorizontal:16,paddingTop:16},stickyHeaderFill(listScroll.scrolled,stickyHeaderBackground??colors.background)]}>{header}</View>:null;
  if(listChrome)return <View testID={testID} style={{direction,flex:1}}>{pinned}{hosted}</View>;
  // Pinned without listChrome: the header fills over the block's own stack, which keeps the notice, the list and the footer as before.
  if(stickyHeader)return <View testID={testID} style={{direction,flex:1}}>{pinned}<View style={{padding:16,gap:16,flex:1}}>{noticeView}{hosted}{footerView}</View></View>;
 }
 const rows=body??hosted??<View testID={testID?`${testID}-rows`:undefined} style={{gap:8}}>{trades.map(draw)}</View>;
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID={testID?`${testID}-sticky-header`:undefined} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{direction,gap:16,paddingTop:16}}>
  {noticeView}
  {rows}
  {footerView}
 </StickyHeaderLayout>;
 return <View testID={testID} style={renderList?{direction,padding:16,gap:16,flex:1}:{direction,padding:16,gap:16}}>
  {header}
  {noticeView}
  {rows}
  {footerView}
 </View>;
}
