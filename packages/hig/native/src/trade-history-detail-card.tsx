import React from 'react';
import {Image,View,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Surface,Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {ChevronIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
import type {AssetArtwork} from './asset-balance-row.js';
export type {AssetArtwork} from './asset-balance-row.js';
/** The trading words of the block. HIG's built-in strings hold no trading terms, so the host supplies them, translated. */
export interface TradeHistoryDetailLabels {
 title:string;
 /** Caption above the figure: NET PNL. */
 netPnl:string;
 /** `+2.84% on margin`: receives the formatted percent. */
 onMargin:(percent:string)=>string;
 long:string;short:string;
}
/** One label and value row. A number is formatted with `options` between `prefix` and `suffix` and updates place by place; a string is drawn as given. */
export interface TradeHistoryDetail {label:string;value:string|number;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string}
export interface TradeHistoryAction {id:string;label:string;onSelect:()=>void;intent?:'primary'|'secondary';disabled?:boolean;busy?:boolean}
export interface TradeHistoryDetailCardProps {
 labels:TradeHistoryDetailLabels;
 /** Asset name: Amazon. */
 name:string;icon?:AssetArtwork;
 side:'long'|'short';
 /** 20 reads `20×`. */
 leverage?:number;
 /** Net profit and loss in dollars. `null` reads as unknown. */
 pnl:number|null;
 /** Return on margin as a fraction: 0.0284 reads +2.84%. */
 pnlPercent?:number|null;
 details:readonly TradeHistoryDetail[];
 actions?:readonly TradeHistoryAction[];
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 testID?:string;
}
const pnlUsd:Intl.NumberFormatOptions={style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4};
const pnlShare:Intl.NumberFormatOptions={style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'};
const gearing:Intl.NumberFormatOptions={maximumFractionDigits:6};
const numberMark='',unknown='—',times='×',up='↑',down='↓';
const avatar=40;
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const known=(value:number|null|undefined):value is number=>value!=null&&Number.isFinite(value);
type Tone='up'|'down'|'text';
/** A host sentence with one live number in it. The words keep their translated order, the number updates place by place, and the whole sentence is the accessible reading. Without a value the sentence is plain text. */
function Sentence({template,text,value,options,tone,testID}:{template:(amount:string)=>string;text:string;value:number|null;options?:Intl.NumberFormatOptions;tone:Tone;testID?:string}){
 const colors=useColors(),{direction}=useHIG();const type={fontSize:14,lineHeight:21} as const,words={...type,color:colors[tone]};
 const reading=template(text),parts=template(numberMark).split(numberMark);
 if(value===null||parts.length!==2)return <Text testID={testID} style={{...words,textAlign:'center'}}>{reading}</Text>;
 return <View accessible accessibilityLabel={reading} testID={testID} style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'center',flexShrink:1}}>
  {parts[0]?<Text accessible={false} style={words}>{parts[0]}</Text>:null}
  <AnimatedNumberReadout value={value} options={options} tone={tone} style={type}/>
  {parts[1]?<Text accessible={false} style={words}>{parts[1]}</Text>:null}
 </View>;
}
/** The full record of one closed trade: the asset with its side and leverage, the net profit and loss with its return on margin, the host's label and value rows, and the host's actions side by side. */
export function TradeHistoryDetailCard({labels,name,icon,side,leverage,pnl,pnlPercent,details,actions=[],onBack,headerAction,testID}:TradeHistoryDetailCardProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale}=useHIG();
 const long=side==='long',word=long?labels.long:labels.short,tint=long?colors.up:colors.down;
 const tone:Tone=known(pnl)&&pnl>0?'up':known(pnl)&&pnl<0?'down':'text';
 const turns=known(leverage)?formatNumberReadout(leverage,locale,gearing).text+times:null;
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const art=typeof icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:icon}} style={shape as object}/>:<View style={shape}>{icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{name.slice(0,3)}</Text>}</View>;
 const meta={fontSize:14,lineHeight:20} as const;
 return <View testID={testID} style={{padding:16}}>
  <View testID='trade-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='trade-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID='trade-title' accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{labels.title}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
  </View>
  <View testID='trade-asset' accessible accessibilityLabel={[name,word,turns].filter(Boolean).join(', ')} style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:fills.well,marginTop:16}}>
   <View {...hidden}>{art}</View>
   <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
    <Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{name}</Text>
    <View style={{direction,flexDirection:'row',alignItems:'center',gap:4}}>
     <Text testID='trade-side-arrow' style={{...meta,fontWeight:'600',color:tint}}>{long?up:down}</Text>
     <Text testID='trade-side' style={{...meta,fontWeight:'600',color:tint,textTransform:'uppercase'}}>{word}</Text>
     {turns?<Text testID='trade-leverage' style={{...meta,color:colors.muted}}>{turns}</Text>:null}
    </View>
   </View>
  </View>
  <Surface testID='trade-pnl' style={{alignItems:'center',paddingVertical:24,gap:8,marginTop:8}}>
   <Text style={{fontSize:12,lineHeight:18,fontWeight:'600',color:colors.muted,textTransform:'uppercase',letterSpacing:0.5}}>{labels.netPnl}</Text>
   <AnimatedNumberReadout testID='trade-pnl-value' value={pnl} options={pnlUsd} tone={tone} style={{fontSize:40,lineHeight:48,fontWeight:'700'}}/>
   {pnlPercent!==undefined?<Sentence testID='trade-pnl-percent' template={labels.onMargin} text={known(pnlPercent)?formatNumberReadout(pnlPercent,locale,pnlShare).text:unknown} value={known(pnlPercent)?pnlPercent:null} options={pnlShare} tone={tone}/>:null}
  </Surface>
  {details.length>0?<Surface testID='trade-details' style={{gap:12,marginTop:8}}>
   {details.map(detail=><View key={detail.label} testID={`trade-detail-${detail.label}`} style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
    <Text style={{fontSize:16,lineHeight:24,color:colors.muted,flexShrink:1}}>{detail.label}</Text>
    {typeof detail.value==='number'?<AnimatedNumberReadout value={detail.value} options={detail.options} prefix={detail.prefix} suffix={detail.suffix} tone='text' style={{fontSize:16,lineHeight:24}}/>:<Text style={{fontSize:16,lineHeight:24,color:colors.text,flexShrink:1}}>{detail.value}</Text>}
   </View>)}
  </Surface>:null}
  {actions.length>0?<View testID='trade-actions' style={{direction,flexDirection:'row',gap:8,marginTop:16}}>
   {actions.map(action=><View key={action.id} style={{flex:1,minWidth:0}}><Button fullWidth testID={`trade-action-${action.id}`} intent={action.intent??'secondary'} disabled={action.disabled} busy={action.busy} onPress={action.onSelect}>{action.label}</Button></View>)}
  </View>:null}
 </View>;
}
