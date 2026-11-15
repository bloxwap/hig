import React from 'react';
import {Image,View,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {IconButton} from './button.js';
import {ChevronIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
import {BarMark,type BarMarkElement} from './bar-mark.js';
import {BarPnl} from './bar-pnl.js';
import {ListGroup,ListRow} from './list-group.js';
import type {AssetArtwork} from './asset-balance-row.js';
export type {AssetArtwork} from './asset-balance-row.js';
/** Every trading word of the block. HIG's built-in strings hold no trading terms, so the host supplies them, translated. */
export interface ManagePositionBlockLabels {
 title:string;margin:string;
 notional:string;
 liquidation:string;
 /** `99.8% to liquidation`: receives the formatted percent. */
 toLiquidation:(percent:string)=>string;
 mark:string;entry:string;
 /** Accessible words for the direction arrow. */
 long:string;short:string;
}
export interface ManagePositionBlockAction {id:string;label:string;onSelect:()=>void;disabled?:boolean}
export interface ManagePositionBlockSummary {
 name:string;icon?:AssetArtwork;
 /** 40 reads `40×`. */
 leverage?:number;
 /** Size in asset units. */
 size?:number|null;
 /** Profit and loss in dollars. */
 pnl?:number|null;
 /** Profit and loss as a fraction: -0.0025 reads -0.25%. */
 pnlPercent?:number|null;
}
export interface ManagePositionBlockProps {
 labels:ManagePositionBlockLabels;
 /** Margin mode, the title of the first card: Demo, Cross, Isolated. Without it the card is titled with the margin label. */
 mode?:string;
 side:'long'|'short';entry:number;mark?:number|null;liquidation?:number|null;margin:number;notional:number;
 /** Format of the three prices, such as another currency. They are drawn compact: no extra zeros. */
 priceOptions?:Intl.NumberFormatOptions;
 actions:readonly ManagePositionBlockAction[];
 position?:ManagePositionBlockSummary;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 testID?:string;
}
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
const pnlUsd:Intl.NumberFormatOptions={style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4};
const pnlShare:Intl.NumberFormatOptions={style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'};
const units:Intl.NumberFormatOptions={maximumFractionDigits:6};
const tenth:Intl.NumberFormatOptions={maximumFractionDigits:1};
const numberMark='',unknown='—',times='×',dot=' · ',percent='%',up='↑',down='↓';
const avatar=40;
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const known=(value:number|null|undefined):value is number=>value!=null&&Number.isFinite(value);
/** Distance left before liquidation. `total` is the span from entry to liquidation, `buffer` how much of it remains between mark and liquidation (the whole span while in profit), `drawdown` the rest, and `share` the buffer as a fraction of the span. Unknown mark or liquidation, or a liquidation on the wrong side of entry, gives zeros and a `null` share. */
export function positionCorridor({side,entry,mark,liquidation}:{side:'long'|'short';entry:number;mark?:number|null;liquidation?:number|null}):{total:number;buffer:number;drawdown:number;share:number|null}{
 const long=side==='long',span=known(liquidation)?long?entry-liquidation:liquidation-entry:0;
 if(!known(mark)||!known(liquidation)||!Number.isFinite(span)||span<=0)return {total:0,buffer:0,drawdown:0,share:null};
 const traveled=long?entry-mark:mark-entry,buffer=Math.min(span,Math.max(0,span-traveled));
 return {total:span,buffer,drawdown:span-buffer,share:buffer/span};
}
/** A host sentence with one live number in it. The words keep their translated order, the number updates place by place, and the whole sentence is the accessible reading. Without a value the sentence is plain text. */
function Sentence({template,text,value,options,suffix,testID}:{template:(amount:string)=>string;text:string;value:number|null;options?:Intl.NumberFormatOptions;suffix?:string;testID?:string}){
 const colors=useColors(),{direction}=useHIG();const type={fontSize:14,lineHeight:21} as const,words={...type,color:colors.muted};
 const reading=template(text),parts=template(numberMark).split(numberMark);
 if(value===null||parts.length!==2)return <Text testID={testID} style={{...words,flexShrink:1}}>{reading}</Text>;
 return <View accessible accessibilityLabel={reading} testID={testID} style={{direction,flexDirection:'row',alignItems:'center',flexShrink:1}}>
  {parts[0]?<Text accessible={false} style={words}>{parts[0]}</Text>:null}
  <AnimatedNumberReadout value={value} options={options} suffix={suffix} tone='muted' style={type}/>
  {parts[1]?<Text accessible={false} style={words}>{parts[1]}</Text>:null}
 </View>;
}
/** One open position as a screen: margin and notional under the share left before liquidation, then the liquidation, mark and entry prices as a `BarPnl`, what can be done, and the position itself. Both bars are drawn without a card, because nothing in them can be pressed. */
export function ManagePositionBlock({labels,mode,side,entry,mark,liquidation,margin,notional,priceOptions,actions,position,onBack,headerAction,testID}:ManagePositionBlockProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale}=useHIG();
 const read=(value:number|null|undefined,options:Intl.NumberFormatOptions)=>known(value)?formatNumberReadout(value,locale,options).text:unknown;
 const corridor=positionCorridor({side,entry,mark,liquidation}),long=side==='long';
 const marginBar:BarMarkElement[]=[{id:'margin',label:labels.margin,value:margin,detail:read(margin,usd),tone:'info'},{id:'notional',label:labels.notional,value:known(notional)?Math.max(notional-margin,0):0,detail:read(notional,usd),tone:'positive'}];
 const left=corridor.share===null?null:corridor.share*100;
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const row=()=>{
  if(!position)return null;const {name,icon,leverage,size,pnl,pnlPercent}=position;
  const art=typeof icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:icon}} style={shape as object}/>:<View style={shape}>{icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{name.slice(0,3)}</Text>}</View>;
  const gearing=known(leverage)?formatNumberReadout(leverage,locale,units).text+times:null,held=size!==undefined?read(size,units):null;
  const label=[name,long?labels.long:labels.short,gearing,held,pnl!==undefined?read(pnl,pnlUsd):null,pnlPercent!==undefined?read(pnlPercent,pnlShare):null].filter(Boolean).join(', ');
  const meta={fontSize:14,lineHeight:20} as const;
  return <View testID='manage-position-row' accessible accessibilityLabel={label} style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:fills.well,marginTop:16}}>
   <View {...hidden}>{art}</View>
   <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
    <Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{name}</Text>
    <View style={{direction,flexDirection:'row',alignItems:'center',gap:4}}>
     <Text testID='manage-position-side' style={{...meta,fontWeight:'600',color:long?colors.up:colors.down}}>{long?up:down}</Text>
     {gearing?<Text testID='manage-position-leverage' style={{...meta,fontWeight:'600',color:long?colors.up:colors.down}}>{gearing}</Text>:null}
     {gearing&&held?<Text style={{...meta,color:colors.muted}}>{dot.trim()}</Text>:null}
     {size!==undefined?<AnimatedNumberReadout value={size} options={units} tone='muted' testID='manage-position-size' style={meta}/>:null}
    </View>
   </View>
   <View {...hidden} style={{alignItems:'flex-end',justifyContent:'center'}}>
    {pnl!==undefined?<AnimatedNumberReadout value={pnl} options={pnlUsd} tone={known(pnl)&&pnl>0?'up':known(pnl)&&pnl<0?'down':'text'} testID='manage-position-pnl' style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/>:null}
    {pnlPercent!==undefined?<AnimatedNumberReadout value={pnlPercent} options={pnlShare} tone='muted' testID='manage-position-pnl-percent' style={meta}/>:null}
   </View>
  </View>;
 };
 return <View testID={testID} style={{padding:16}}>
  <View testID='manage-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='manage-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID='manage-title' accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{labels.title}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
  </View>
  <View style={{gap:20,marginTop:16,paddingHorizontal:4}}>
   <BarMark testID='manage-margin' surface={false} title={mode??labels.margin} elements={marginBar} description={<Sentence testID='manage-to-liquidation' template={labels.toLiquidation} text={left===null?unknown:formatNumberReadout(left,locale,tenth).text+percent} value={left} options={tenth} suffix={percent}/>}/>
   <BarPnl testID='manage-liquidation' surface={false} compact side={side} entry={entry} mark={mark} liquidation={liquidation} labels={{liquidation:labels.liquidation,mark:labels.mark,entry:labels.entry}} priceOptions={priceOptions}/>
  </View>
  {actions.length>0?<View testID='manage-actions' style={{marginTop:16}}>
   <ListGroup>{actions.map(action=><ListRow key={action.id} testID={`manage-action-${action.id}`} label={action.label} disabled={action.disabled} onSelect={action.onSelect}/>)}</ListGroup>
  </View>:null}
  {row()}
 </View>;
}
