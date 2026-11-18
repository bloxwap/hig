import React,{useState} from 'react';
import {Image,Pressable,View,type ScrollViewProps,type ViewStyle} from 'react-native';
import {StickyHeaderLayout} from './sticky-header.js';
import {useColors,useFills,useHIG,useMessages,useNumberLocale,usePresentNumber} from './provider.js';
import {Text} from './surface.js';
import {IconButton} from './button.js';
import {ChevronIcon} from './icons.js';
import {NumberFlow} from './animated-number.js';
import {figureProps,figureReading,type Figure} from './figure.js';
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
/** A number the host supplies as a number so it updates place by place: `{value:66000,options:{style:'currency',currency:'USD'}}`. `null` reads as unknown. */
export type ManagePositionBlockFigure=Figure;
/** The position's artwork: an image URL, a host element, or a function that draws a host element and receives `failed`, to call when that element cannot draw (an SVG that did not load); the row then shows `iconFallback` or the initials. */
export type ManagePositionIcon=AssetArtwork|((failed:()=>void)=>React.ReactNode);
export interface ManagePositionBlockAction {
 id:string;label:string;onSelect:()=>void;disabled?:boolean;
 /** Trailing value of the row, before the chevron: host text or a live figure, such as the price a resting trigger is set at. */
 value?:string|ManagePositionBlockFigure;
 /** Colours `value`. The default is the muted value colour. */
 tone?:'positive'|'negative'|'muted';
}
export interface ManagePositionBlockSummary {
 name:string;
 /** An image URL, a host element, or a function that draws one and reports its failure. An image or element that fails shows `iconFallback`, else the initials. */
 icon?:ManagePositionIcon;
 /** A host element drawn in place of an `icon` that failed to draw. Without it the row shows the initials. */
 iconFallback?:React.ReactNode;
 /** Short ticker for the initials when there is no artwork: BTC. Without it the first letters of the name are shown. */
 symbol?:string;
 /** Host text after the name, drawn as a small Badge, such as a venue. */
 badge?:string;
 /** One line under the row, such as that the profit and loss is stale or estimated. */
 caption?:string;
 /** Makes the whole row a button, for example one that opens the market. Needs `label`. */
 onSelect?:()=>void;
 /** Accessible name of the row when it is a button, read before the figures, which stay in the label: View Bitcoin. The caption is its hint. */
 label?:string;
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
 /** Format of the position's profit and loss, merged over the default: signed US dollars with up to four decimals. */
 pnlOptions?:Intl.NumberFormatOptions;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 /** Sets `nativeID` on the title, so a sheet around the pane can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container, such as a sheet body. */
 stickyHeader?:boolean;
 /** With `stickyHeader`: the header's fill once content is under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. Defaults to React Native's ScrollView. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 testID?:string;
}
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
const pnlUsdDefault:Intl.NumberFormatOptions={style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4};
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
  <NumberFlow motion="slide" value={value} options={options} suffix={suffix} tone='muted' style={type}/>
  {parts[1]?<Text accessible={false} style={words}>{parts[1]}</Text>:null}
 </View>;
}
export function PositionSummaryRow({position,side,labels,pnlOptions,disclosure=false}:{position:ManagePositionBlockSummary;side:'long'|'short';labels:Pick<ManagePositionBlockLabels,'long'|'short'>;pnlOptions?:Intl.NumberFormatOptions;disclosure?:boolean}){
 const colors=useColors(),fills=useFills(),{direction}=useHIG(),locale=useNumberLocale(),present=usePresentNumber();
 const long=side==='long';
 // The artwork that failed to draw (its URL, or the position for a host element); it then shows the fallback or the initials until the artwork changes.
 const [broken,setBroken]=useState<string|null>(null);
 const pnlUsd=pnlOptions?{...pnlUsdDefault,...pnlOptions}:pnlUsdDefault;
 const read=(value:number|null|undefined,options:Intl.NumberFormatOptions)=>known(value)?formatNumberReadout(value,locale,present(options)).text:unknown;
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const {name,icon,iconFallback,symbol,leverage,size,pnl,pnlPercent,badge,caption,onSelect}=position;
 const initials=<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{symbol??name.slice(0,3)}</Text>;
 const key=typeof icon==='string'?icon:`${symbol??''}|${name}`,failed=broken===key,fail=()=>setBroken(key);
 const art=failed?<View testID='manage-position-initials' style={shape}>{iconFallback??initials}</View>
  :typeof icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:icon}} onError={fail} style={shape as object}/>
  :<View style={shape}>{typeof icon==='function'?icon(fail):icon??initials}</View>;
 const gearing=known(leverage)?formatNumberReadout(leverage,locale,units).text+times:null,held=size!==undefined?read(size,units):null;
 const label=[name,long?labels.long:labels.short,gearing,held,pnl!==undefined?read(pnl,pnlUsd):null,pnlPercent!==undefined?read(pnlPercent,pnlShare):null].filter(Boolean).join(', ');
 const meta={fontSize:14,lineHeight:20} as const;
 const title=<Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text,...(badge?{flexShrink:1}:null)}}>{name}</Text>;
 const surface=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:pressed?fills.raised:fills.well,marginTop:disclosure?0:16,...(disclosure?{paddingVertical:16,paddingStart:16,borderRadius:0}:{})});
 const parts=<>
  <View {...hidden}>{art}</View>
  <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
   {badge?<View style={{direction,flexDirection:'row',alignItems:'center',gap:8,minWidth:0}}>{title}<View testID='manage-position-badge' style={{flexShrink:0,borderRadius:9999,paddingHorizontal:8,backgroundColor:fills.raised}}><Text numberOfLines={1} style={{fontSize:12,lineHeight:18,fontWeight:'500',color:colors.muted}}>{badge}</Text></View></View>:title}
   <View style={{direction,flexDirection:'row',alignItems:'center',gap:4}}>
    <Text testID='manage-position-side' style={{...meta,fontWeight:'600',color:long?colors.up:colors.down}}>{long?up:down}</Text>
    {gearing?<Text testID='manage-position-leverage' style={{...meta,fontWeight:'600',color:long?colors.up:colors.down}}>{gearing}</Text>:null}
    {gearing&&held?<Text style={{...meta,color:colors.muted}}>{dot.trim()}</Text>:null}
    {size!==undefined?<NumberFlow motion="slide" value={size} options={units} tone='muted' testID='manage-position-size' style={meta}/>:null}
   </View>
  </View>
  <View {...hidden} style={{alignItems:'flex-end',justifyContent:'center'}}>
   {pnl!==undefined?<NumberFlow motion="slide" value={pnl} options={pnlUsd} tone={known(pnl)&&pnl>0?'up':known(pnl)&&pnl<0?'down':'text'} testID='manage-position-pnl' style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/>:null}
   {pnlPercent!==undefined?<NumberFlow motion="slide" value={pnlPercent} options={pnlShare} tone='muted' testID='manage-position-pnl-percent' style={meta}/>:null}
  </View>
  {disclosure&&onSelect&&<View style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View>}
 </>;
 const note=caption?<Text testID='manage-position-caption' style={{marginTop:8,paddingHorizontal:16,color:colors.muted,fontSize:13,lineHeight:20}}>{caption}</Text>:null;
 if(onSelect){
  // A pressable row is named by the host's label and then what it shows, so the figures are read even with hints off; the caption is its hint.
  return <><Pressable testID='manage-position-row' accessibilityRole='button' accessibilityLabel={position.label?`${position.label}, ${label}`:label} accessibilityHint={caption} onPress={onSelect} style={({pressed})=>surface(pressed)}>{parts}</Pressable>{note}</>;
 }
 return <><View testID='manage-position-row' accessible accessibilityLabel={label} style={surface(false)}>{parts}</View>{note}</>;
}
/** One open position as a screen: margin and notional under the share left before liquidation, then the liquidation, mark and entry prices as a `BarPnl`, what can be done, and the position itself. Both bars are drawn without a card, because nothing in them can be pressed. */
export function ManagePositionBlock({labels,mode,side,entry,mark,liquidation,margin,notional,priceOptions,actions,position,pnlOptions,onBack,headerAction,headingId,stickyHeader,stickyHeaderBackground,scrollComponent,testID}:ManagePositionBlockProps){
 const colors=useColors(),t=useMessages(),{direction}=useHIG(),locale=useNumberLocale(),present=usePresentNumber();
 const read=(value:number|null|undefined,options:Intl.NumberFormatOptions)=>known(value)?formatNumberReadout(value,locale,present(options)).text:unknown;
 const corridor=positionCorridor({side,entry,mark,liquidation});
 const marginBar:BarMarkElement[]=[{id:'margin',label:labels.margin,value:margin,detail:read(margin,usd),tone:'info'},{id:'notional',label:labels.notional,value:known(notional)?Math.max(notional-margin,0):0,detail:read(notional,usd),tone:'positive'}];
 const left=corridor.share===null?null:corridor.share*100;
 const actionValue=(action:ManagePositionBlockAction):{value?:React.ReactNode;valueLabel?:string;valueTone?:ManagePositionBlockAction['tone']}=>{
  const figure=action.value;if(figure==null)return {};
  if(typeof figure==='string')return {value:figure,valueTone:action.tone};
  return {value:<NumberFlow motion="slide" {...figureProps(figure)} tone={action.tone??'muted'} testID={`manage-action-${action.id}-value`} style={{fontSize:16,lineHeight:24}}/>,valueLabel:figureReading(figure,locale,present(figure.options))};
 };
 const header=<View testID='manage-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
  <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='manage-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
  <Text testID='manage-title' nativeID={headingId} accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{labels.title}</Text>
  <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
 </View>;
 const body=<>
  <View style={{gap:20,marginTop:16,paddingHorizontal:4}}>
   <BarMark testID='manage-margin' surface={false} title={mode??labels.margin} elements={marginBar} description={<Sentence testID='manage-to-liquidation' template={labels.toLiquidation} text={left===null?unknown:formatNumberReadout(left,locale,tenth).text+percent} value={left} options={tenth} suffix={percent}/>}/>
   <BarPnl testID='manage-liquidation' surface={false} compact side={side} entry={entry} mark={mark} liquidation={liquidation} labels={{liquidation:labels.liquidation,mark:labels.mark,entry:labels.entry}} priceOptions={priceOptions}/>
  </View>
  {actions.length>0?<View testID='manage-actions' style={{marginTop:16}}>
   <ListGroup>{actions.map(action=><ListRow key={action.id} testID={`manage-action-${action.id}`} label={action.label} disabled={action.disabled} onSelect={action.onSelect} {...actionValue(action)}/>)}</ListGroup>
  </View>:null}
  {position&&<PositionSummaryRow position={position} side={side} labels={labels} pnlOptions={pnlOptions}/>}
 </>;
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID='manage-sticky-header' header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{padding:16}}>
  {header}
  {body}
 </View>;
}
