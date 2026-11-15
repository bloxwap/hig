import React from 'react';
import {Image,Pressable,View,type ViewStyle} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useColors,useFills,useHIG,useMessages,usePresentNumber} from './provider.js';
import {Text} from './surface.js';
import {IconButton} from './button.js';
import {ChevronIcon} from './icons.js';
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
}
/** What `renderList` receives: the trades and FlatList-shaped helpers that draw them exactly as the block does. */
export interface TradeHistoryListRender {
 trades:readonly TradeHistoryItem[];
 /** Draws one row; the signature matches FlatList's `renderItem`. */
 renderItem:(info:{item:TradeHistoryItem})=>React.ReactElement;
 keyExtractor:(trade:TradeHistoryItem)=>string;
 /** The 8dp gap between rows, for `ItemSeparatorComponent`. */
 ItemSeparatorComponent:React.ComponentType;
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
  * `renderList={list => <FlatList data={list.trades} {...list} initialNumToRender={10}/>}`. The block then fills its parent
  * (`flex: 1`), so place it in a bounded container such as a sheet body, not inside a ScrollView.
  */
 renderList?:(list:TradeHistoryListRender)=>React.ReactNode;
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
export function TradeHistoryListBlock({labels,trades,onSelect,onBack,headerAction,pnlOptions=pnlFormat,loading,loadingLabel,error,notice,footer,renderList,testID}:TradeHistoryListBlockProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale}=useHIG(),present=usePresentNumber();
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const row=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:pressed?fills.raised:fills.well});
 const meta={fontSize:14,lineHeight:20,color:colors.muted} as const;
 const draw=(trade:TradeHistoryItem)=>{
  const side=trade.side==='long'?colors.up:colors.down;
  const reading=[trade.name,tradeHistorySide(trade,labels,locale),formatNumber(trade.pnl,locale,present(pnlOptions)),trade.tag,trade.time].filter(Boolean).join(', ');
  const content=<>
   <View {...hidden}>{typeof trade.icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:trade.icon}} style={shape as object}/>:<View style={shape}>{trade.icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{trade.symbol??trade.name.slice(0,3)}</Text>}</View>}</View>
   <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
    <Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{trade.name}</Text>
    <View testID={testID?`${testID}-${trade.id}-side`:undefined} style={{flexDirection:'row',alignItems:'center',gap:4}}><Arrow color={side} down={trade.side==='short'}/>{trade.leverage!=null?<Text style={{fontSize:14,lineHeight:20,fontWeight:'600',color:side}}>{`${formatNumber(trade.leverage,locale)}×`}</Text>:null}{trade.leverageNote?<Text testID={testID?`${testID}-${trade.id}-leverage-note`:undefined} numberOfLines={1} style={{...meta,flexShrink:1}}>{trade.leverageNote}</Text>:null}</View>
   </View>
   <View {...hidden} style={trade.tag?{alignItems:'flex-end',justifyContent:'center',flexShrink:1}:{alignItems:'flex-end',justifyContent:'center'}}>
    <AnimatedNumberReadout value={trade.pnl} options={pnlOptions} tone={trade.pnl==null||trade.pnl===0?'text':trade.pnl>0?'up':'down'} testID={testID?`${testID}-${trade.id}-pnl`:undefined} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/>
    {trade.tag?<View testID={testID?`${testID}-${trade.id}-meta`:undefined} style={{direction,flexDirection:'row',alignItems:'center',gap:4,flexShrink:1}}><Text numberOfLines={1} style={{...meta,flexShrink:1}}>{trade.tag}</Text>{trade.time?<><Text style={meta}>{dot}</Text><Text style={meta}>{trade.time}</Text></>:null}</View>
     :trade.time?<Text style={meta}>{trade.time}</Text>:null}
   </View>
  </>;
  return onSelect?<Pressable key={trade.id} testID={testID?`${testID}-${trade.id}`:undefined} accessibilityRole='button' accessibilityLabel={reading} onPress={()=>onSelect(trade)} style={({pressed})=>row(pressed)}>{content}<View {...hidden} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View></Pressable>
   :<View key={trade.id} testID={testID?`${testID}-${trade.id}`:undefined} accessible accessibilityLabel={reading} style={row(false)}>{content}</View>;
 };
 const plain={paddingVertical:32,textAlign:'center',fontSize:14,lineHeight:20} as const;
 const body=loading?<View testID={testID?`${testID}-loading`:undefined} accessible={!!loadingLabel} accessibilityLabel={loadingLabel} accessibilityState={{busy:true}} style={{gap:8}}>{skeletons.map(index=><View key={index} style={{minHeight:56,borderRadius:28,backgroundColor:fills.raised}}/>)}</View>
  :error?<Text testID={testID?`${testID}-error`:undefined} accessibilityRole='alert' accessibilityLiveRegion='polite' style={{...plain,color:colors.negative}}>{error}</Text>
  :trades.length===0?(labels.emptyDescription?<View testID={testID?`${testID}-empty`:undefined} accessible accessibilityLabel={`${labels.empty}, ${labels.emptyDescription}`} style={{paddingVertical:32,gap:4}}>
   <Text style={{...plain,paddingVertical:0,fontWeight:'600',color:colors.text}}>{labels.empty}</Text>
   <Text style={{...plain,paddingVertical:0,color:colors.muted}}>{labels.emptyDescription}</Text>
  </View>:<Text testID={testID?`${testID}-empty`:undefined} style={{...plain,color:colors.muted}}>{labels.empty}</Text>)
  :renderList?<View testID={testID?`${testID}-rows`:undefined} style={{flex:1}}>{renderList({trades,renderItem:({item})=>draw(item),keyExtractor:keyOf,ItemSeparatorComponent:Gap})}</View>
  :<View testID={testID?`${testID}-rows`:undefined} style={{gap:8}}>{trades.map(draw)}</View>;
 return <View testID={testID} style={renderList?{direction,padding:16,gap:16,flex:1}:{direction,padding:16,gap:16}}>
  <View style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID={testID?`${testID}-back`:undefined} onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID={testID?`${testID}-title`:undefined} accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{labels.title}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
  </View>
  {notice!=null&&notice!==false?<View testID={testID?`${testID}-notice`:undefined} style={{gap:8}}>{notice}</View>:null}
  {body}
  {footer!=null&&footer!==false?<View testID={testID?`${testID}-footer`:undefined} style={{gap:8}}>{footer}</View>:null}
 </View>;
}
