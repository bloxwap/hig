import React from 'react';
import {Image,View,type ScrollViewProps,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useNumberLocale} from './provider.js';
import {Text} from './surface.js';
import {BarPnl} from './bar-pnl.js';
import {Button} from './button.js';
import {ScreenHeader} from './screen-header.js';
import {StickyHeaderLayout} from './sticky-header.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
import type {AssetArtwork} from './asset-balance-row.js';
export type {AssetArtwork} from './asset-balance-row.js';
/** The trading words of the block. HIG's built-in strings hold no trading terms, so the host supplies them, translated. */
export interface TradeHistoryDetailLabels {
 title:string;
 /** Names the figure for assistive technology: Net PnL. It is not drawn; the signed figure and the line under it carry the meaning on screen. */
 netPnl:string;
 /** Names of the two prices under the bar. Needed with `entry` and `exit`. */
 entry?:string;exit?:string;
 /** `+2.84% on margin`: receives the formatted percent. */
 onMargin:(percent:string)=>string;
 long:string;short:string;
}
/** One label and value row. A number is formatted with `options` between `prefix` and `suffix` and updates place by place; a string is drawn as given. */
export interface TradeHistoryDetail {label:string;value:string|number;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string;
 /** With a number `value`: host-formatted text drawn and read in place of Intl's, still moving place by place. */
 formattedValue?:string}
export interface TradeHistoryAction {id:string;label:string;onSelect:()=>void;intent?:'primary'|'secondary';disabled?:boolean;busy?:boolean}
export interface TradeHistoryDetailBlockProps {
 labels:TradeHistoryDetailLabels;
 /** Asset name: Amazon. */
 name:string;icon?:AssetArtwork;
 /** Short ticker for the fallback disc when there is no `icon`: BTC. Without it the disc shows the first letters of the name. */
 symbol?:string;
 side:'long'|'short';
 /** 20 reads `20×`. */
 leverage?:number;
 /** A short muted qualifier after the leverage, read with it: current. */
 leverageNote?:string;
 /** Net profit and loss in dollars. `null` reads as unknown. */
 pnl:number|null;
 /** Format of the headline result. Defaults to signed US dollars with up to four decimals. The provider's `numberFormat` is merged under it. */
 pnlOptions?:Intl.NumberFormatOptions;
 /** Return on margin as a fraction: 0.0284 reads +2.84%. */
 pnlPercent?:number|null;
 /** Format of the return on margin. Defaults to a signed percent with two decimals. */
 percentOptions?:Intl.NumberFormatOptions;
 /** One muted sentence under the details, such as that part of the record is missing. */
 note?:string;
 /** Short host text in a badge beside the title: Demo. */
 badge?:string;
 /** Ref to a View around the summary (the asset line, the headline figure and the return), for a host that captures it as an image. Without it the summary has no wrapper. */
 summaryRef?:React.Ref<View>;
 /** Entry and exit prices. With both, one bar runs from entry to exit in the result colour, with the two prices under it, in place of two rows. */
 entry?:number;exit?:number;
 /** Format of the two prices. Defaults to US dollars. */
 priceOptions?:Intl.NumberFormatOptions;
 details:readonly TradeHistoryDetail[];
 actions?:readonly TradeHistoryAction[];
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 /** Fills the View drawn with `summaryRef`, so an image captured from it is not transparent: `true` for the background role, or a colour such as the sheet's `useColors().overlay`. */
 summaryBackground?:boolean|string;
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container. */
 stickyHeader?:boolean;
 /** Fill behind the pinned header once content scrolls under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 testID?:string;
}
const pnlUsd:Intl.NumberFormatOptions={style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4};
const pnlShare:Intl.NumberFormatOptions={style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'};
const gearing:Intl.NumberFormatOptions={maximumFractionDigits:6};
const numberMark='',unknown='—',times='×',up='↑',down='↓';
const avatar=24,empty='';
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
/** The full record of one closed trade, drawn on the screen without cards because none of it is pressable: the asset with its side and leverage on one line, the net profit and loss with its return on margin, a bar from the entry price to the exit price, the host's other figures as a compact grid, and the host's actions side by side. */
export function TradeHistoryDetailBlock({labels,name,icon,symbol,side,leverage,leverageNote,pnl,pnlOptions=pnlUsd,pnlPercent,percentOptions=pnlShare,entry,exit,priceOptions,details,note,badge,summaryRef,summaryBackground,actions=[],onBack,headerAction,stickyHeader,stickyHeaderBackground,scrollComponent,testID}:TradeHistoryDetailBlockProps){
 const colors=useColors(),fills=useFills(),{direction}=useHIG(),locale=useNumberLocale();
 const long=side==='long',word=long?labels.long:labels.short,tint=long?colors.up:colors.down;
 const tone:Tone=known(pnl)&&pnl>0?'up':known(pnl)&&pnl<0?'down':'text';
 const turns=known(leverage)?formatNumberReadout(leverage,locale,gearing).text+times:null;
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const art=typeof icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:icon}} style={shape as object}/>:<View style={shape}>{icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:9,lineHeight:12,fontWeight:'600',color:colors.muted}}>{symbol??name.slice(0,3)}</Text>}</View>;
 const meta={fontSize:14,lineHeight:20} as const;
 // The summary gets a wrapper only when the host asks for a ref to capture it, so the default tree is unchanged.
 const fill=summaryBackground===true?colors.background:typeof summaryBackground==='string'&&summaryBackground?summaryBackground:undefined;
 const wrap=(summary:React.ReactElement)=>summaryRef?<View ref={summaryRef} collapsable={false} testID='trade-summary' style={fill?{backgroundColor:fill}:undefined}>{summary}</View>:summary;
 // Three figures to a line: a small label over its value.
 const rows=details.map(detail=><View key={detail.label} testID={`trade-detail-${detail.label}`} style={{width:'50%',paddingEnd:8,gap:2}}>
  <Text numberOfLines={1} style={{fontSize:12,lineHeight:16,color:colors.muted}}>{detail.label}</Text>
  {typeof detail.value==='number'?<AnimatedNumberReadout value={detail.value} options={detail.options} prefix={detail.prefix} suffix={detail.suffix} formattedValue={detail.formattedValue} animateFormatted={!!detail.formattedValue} tone='text' style={{fontSize:15,lineHeight:22,fontWeight:'600'}}/>:<Text style={{fontSize:15,lineHeight:22,fontWeight:'600',color:colors.text}}>{detail.value}</Text>}
 </View>);
 const header=<ScreenHeader testID='trade' title={labels.title} badge={badge} onBack={onBack} action={headerAction}/>;
 const body=<>
  {wrap(<><View testID='trade-asset' accessible accessibilityLabel={[name,word,turns,leverageNote].filter(Boolean).join(', ')} style={{direction,flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:8,marginTop:16}}>
   <View {...hidden}>{art}</View>
   <Text {...hidden} numberOfLines={1} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{name}</Text>
   <View {...hidden}>
    <View style={{direction,flexDirection:'row',alignItems:'center',gap:4}}>
     <Text testID='trade-side-arrow' style={{...meta,fontWeight:'600',color:tint}}>{long?up:down}</Text>
     <Text testID='trade-side' style={{...meta,fontWeight:'600',color:tint,textTransform:'uppercase'}}>{word}</Text>
     {turns?<Text testID='trade-leverage' style={{...meta,color:colors.muted}}>{turns}</Text>:null}
     {leverageNote?<Text testID='trade-leverage-note' style={{...meta,color:colors.muted}}>{leverageNote}</Text>:null}
    </View>
   </View>
  </View>
  <View testID='trade-pnl' style={{alignItems:'center',gap:4,marginTop:8}}>
   <AnimatedNumberReadout testID='trade-pnl-value' label={labels.netPnl} value={pnl} options={pnlOptions} tone={tone} style={{fontSize:40,lineHeight:48,fontWeight:'700'}}/>
   {pnlPercent!==undefined?<Sentence testID='trade-pnl-percent' template={labels.onMargin} text={known(pnlPercent)?formatNumberReadout(pnlPercent,locale,percentOptions).text:unknown} value={known(pnlPercent)?pnlPercent:null} options={percentOptions} tone={tone}/>:null}
  </View></>)}
  {known(entry)&&known(exit)?<View style={{marginTop:20,paddingHorizontal:4}}><BarPnl testID='trade-bar' surface={false} fit side={side} entry={entry} mark={exit} labels={{entry:labels.entry??empty,mark:labels.exit??empty,liquidation:empty}} priceOptions={priceOptions}/></View>:null}
  {details.length>0?<View testID='trade-details' style={{direction,flexDirection:'row',flexWrap:'wrap',rowGap:16,marginTop:20,paddingHorizontal:4}}>
   {rows}
  </View>:null}
  {note?<Text testID='trade-note' style={{marginTop:16,paddingHorizontal:4,fontSize:14,lineHeight:21,color:colors.muted}}>{note}</Text>:null}
  {actions.length>0?<View testID='trade-actions' style={{direction,flexDirection:'row',gap:8,marginTop:16}}>
   {actions.map(action=><View key={action.id} style={{flex:1,minWidth:0}}><Button fullWidth testID={`trade-action-${action.id}`} intent={action.intent??'secondary'} disabled={action.disabled} busy={action.busy} onPress={action.onSelect}>{action.label}</Button></View>)}
  </View>:null}
 </>;
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID='trade-sticky-header' header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{padding:16}}>
  {header}
  {body}
 </View>;
}
