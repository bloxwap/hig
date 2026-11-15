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
}
/** One closed trade. */
export interface TradeHistoryItem {
 id:string;
 /** Asset name: Amazon. */
 name:string;
 /** Round artwork: an image URL or a host element. Without it the row shows the first letters of the name. */
 icon?:AssetArtwork;
 side:'long'|'short';
 /** 20 reads `20×`. */
 leverage?:number;
 /** Net profit and loss in dollars. `null` reads as unknown. */
 pnl:number|null;
 /** Host-formatted age or time of the close, shown under the result: `2d`. */
 time?:string;
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
 /** Format of the result. Defaults to signed US dollars at four significant digits: `+$1.412`, `+$17.90`, `-$0.6878`. */
 pnlOptions?:Intl.NumberFormatOptions;
 testID?:string;
}
const pnlFormat:Intl.NumberFormatOptions={style:'currency',currency:'USD',signDisplay:'exceptZero',minimumSignificantDigits:4,maximumSignificantDigits:4};
/** How a row reads its side: `Short 20×`, or `Short` without leverage. */
export const tradeHistorySide=(trade:Pick<TradeHistoryItem,'side'|'leverage'>,labels:Pick<TradeHistoryListLabels,'long'|'short'>,locale?:string):string=>`${trade.side==='long'?labels.long:labels.short}${trade.leverage!=null?` ${formatNumber(trade.leverage,locale)}×`:''}`;
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const avatar=40;
/** Points up; a short turns it over. */
function Arrow({color,down}:{color:string;down:boolean}){return <View style={{width:12,height:14,alignItems:'center',transform:down?[{rotate:'180deg'}]:undefined}}><View style={{position:'absolute',top:1,width:7,height:7,borderLeftWidth:1.75,borderTopWidth:1.75,borderColor:color,transform:[{rotate:'45deg'}]}}/><View style={{width:1.75,height:14,borderRadius:1,backgroundColor:color}}/></View>;}
/** A history of closed trades as one screen: a header, then one row per trade with the asset, its side and leverage in the direction colour, and the net result in the result colour over its age. */
export function TradeHistoryListBlock({labels,trades,onSelect,onBack,headerAction,pnlOptions=pnlFormat,testID}:TradeHistoryListBlockProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale}=useHIG(),present=usePresentNumber();
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const row=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:pressed?fills.raised:fills.well});
 return <View testID={testID} style={{direction,padding:16,gap:16}}>
  <View style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID={testID?`${testID}-back`:undefined} onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID={testID?`${testID}-title`:undefined} accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{labels.title}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
  </View>
  {trades.length===0?<Text testID={testID?`${testID}-empty`:undefined} style={{paddingVertical:32,textAlign:'center',fontSize:14,lineHeight:20,color:colors.muted}}>{labels.empty}</Text>:
  <View testID={testID?`${testID}-rows`:undefined} style={{gap:8}}>
   {trades.map(trade=>{
    const side=colors[trade.side==='long'?'positive':'negative'];
    const reading=[trade.name,tradeHistorySide(trade,labels,locale),formatNumber(trade.pnl,locale,present(pnlOptions)),trade.time].filter(Boolean).join(', ');
    const content=<>
     <View {...hidden}>{typeof trade.icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:trade.icon}} style={shape as object}/>:<View style={shape}>{trade.icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{trade.name.slice(0,3)}</Text>}</View>}</View>
     <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
      <Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{trade.name}</Text>
      <View testID={testID?`${testID}-${trade.id}-side`:undefined} style={{flexDirection:'row',alignItems:'center',gap:4}}><Arrow color={side} down={trade.side==='short'}/>{trade.leverage!=null?<Text style={{fontSize:14,lineHeight:20,fontWeight:'600',color:side}}>{`${formatNumber(trade.leverage,locale)}×`}</Text>:null}</View>
     </View>
     <View {...hidden} style={{alignItems:'flex-end',justifyContent:'center'}}>
      <AnimatedNumberReadout value={trade.pnl} options={pnlOptions} tone={trade.pnl==null||trade.pnl===0?'text':trade.pnl>0?'positive':'negative'} testID={testID?`${testID}-${trade.id}-pnl`:undefined} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/>
      {trade.time?<Text style={{fontSize:14,lineHeight:20,color:colors.muted}}>{trade.time}</Text>:null}
     </View>
    </>;
    return onSelect?<Pressable key={trade.id} testID={testID?`${testID}-${trade.id}`:undefined} accessibilityRole='button' accessibilityLabel={reading} onPress={()=>onSelect(trade)} style={({pressed})=>row(pressed)}>{content}<View {...hidden} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View></Pressable>
     :<View key={trade.id} testID={testID?`${testID}-${trade.id}`:undefined} accessible accessibilityLabel={reading} style={row(false)}>{content}</View>;
   })}
  </View>}
 </View>;
}
