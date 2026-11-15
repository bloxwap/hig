import React from 'react';
import {View} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {IconButton} from './button.js';
import {ChevronIcon,CloseIcon} from './icons.js';
import {SwitchRow} from './switch-row.js';
import {ListGroup,ListRow} from './list-group.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
/** A number the host supplies as a number so it updates place by place: `{value:0.53,options:{style:'currency',currency:'USD'}}`. `null` reads as unknown. */
export interface PositionBlockFigure {value:number|null;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string}
/** One line of the summary: Notional, Fee, Liquidation. `value` is host text (`2% of profit`) or a live figure. `tone` colours the value; the default is the text colour. */
export interface PositionBlockDetail {id?:string;label:string;value:string|PositionBlockFigure;tone?:'positive'|'negative'|'muted'}
/** One setting of the position: Size, Leverage, Stop Loss. With `onSelect` the row opens the host's own view and shows a chevron. */
export interface PositionBlockRow {id:string;label:string;value?:string;onSelect?:()=>void;disabled?:boolean}
/** The paper trading switch. The host supplies its name, because HIG ships no trading terms. */
export interface PositionBlockFlag {label:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean}
export interface PositionBlockProps {
 /** Heading: Position. */
 title:string;
 /** The summary under the header, in order. */
 details:readonly PositionBlockDetail[];
 /** One sentence under the summary, such as the minimum margin. */
 note?:string;
 /** Shows the paper trading switch as a row of its own above the settings. */
 paperTrade?:PositionBlockFlag;
 /** The settings, as groups of rows. Each group is one rounded container. */
 groups:readonly (readonly PositionBlockRow[])[];
 /** Shows Close on the trailing edge of the header. */
 onClose?:()=>void;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header in place of Close. */
 headerAction?:React.ReactNode;
 testID?:string;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** The position being opened or edited as a screen: a summary of what it costs and where it ends, an optional paper trading switch, and its settings as grouped rows that open the host's own views. */
export function PositionBlock({title,details,note,paperTrade,groups,onClose,onBack,headerAction,testID}:PositionBlockProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale}=useHIG();
 const figure={fontSize:16,lineHeight:24,fontWeight:'500'} as const;
 const shown=groups.filter(group=>group.length>0);
 return <View testID={testID} style={{padding:16}}>
  <View testID='position-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='position-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID='position-title' accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{title}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction??(onClose?<IconButton intent='ghost' label={t.close} suppressFeedback testID='position-close' onPress={onClose}><CloseIcon color={colors.text}/></IconButton>:null)}</View>
  </View>
  {details.length>0?<View testID='position-details' style={{gap:12,marginTop:16,paddingHorizontal:20}}>
   {details.map((detail,index)=>{
    const live=typeof detail.value==='string'?null:detail.value,reading=live?formatNumberReadout(live.value,locale,live.options,undefined,live.prefix,live.suffix).text:detail.value as string;
    return <View key={detail.id??index} testID={`position-detail-${detail.id??index}`} accessible accessibilityLabel={`${detail.label}, ${reading}`} style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
     <Text {...hidden} style={{flexShrink:1,fontSize:16,lineHeight:24,color:colors.muted}}>{detail.label}</Text>
     <View {...hidden} style={{flexShrink:1}}>{live?<AnimatedNumberReadout {...live} tone={detail.tone??'text'} style={figure}/>:<Text style={{...figure,color:detail.tone?colors[detail.tone]:colors.text,textAlign:'right'}}>{reading}</Text>}</View>
    </View>;
   })}
  </View>:null}
  {note?<Text testID='position-note' style={{color:colors.muted,fontSize:13,lineHeight:20,marginTop:8,paddingHorizontal:20}}>{note}</Text>:null}
  {paperTrade||shown.length>0?<View testID='position-groups' style={{gap:24,marginTop:16}}>
   {paperTrade?<SwitchRow testID='position-paper-trade' label={paperTrade.label} checked={paperTrade.checked} disabled={paperTrade.disabled} onCheckedChange={paperTrade.onCheckedChange} style={{minHeight:56,paddingVertical:8,paddingHorizontal:20,borderRadius:20,backgroundColor:fills.well,opacity:paperTrade.disabled?0.5:1}}>
    <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:12}}>
     <Text style={{flex:1,flexShrink:1,minWidth:0,fontSize:16,lineHeight:24,color:colors.text}}>{paperTrade.label}</Text>
     <View testID='position-paper-trade-track' style={{width:40,height:24,borderRadius:12,padding:3,backgroundColor:paperTrade.checked?colors.action:fills.raised,alignItems:paperTrade.checked?'flex-end':'flex-start'}}><View style={{width:18,height:18,borderRadius:9,backgroundColor:paperTrade.checked?colors.onAction:colors.text}}/></View>
    </View>
   </SwitchRow>:null}
   {shown.map((group,index)=><ListGroup key={index} testID={`position-group-${index}`}>{group.map(row=><ListRow key={row.id} testID={`position-row-${row.id}`} label={row.label} value={row.value} onSelect={row.onSelect} disabled={row.disabled}/>)}</ListGroup>)}
  </View>:null}
 </View>;
}
