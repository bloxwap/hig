import React from 'react';
import {View} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useColors,useFills,useHIG} from './provider.js';
import {Surface,Text} from './surface.js';
/** Colour roles a segment can take. They follow the provider's colour space and market colours as those roles do. */
export type BarMarkTone='positive'|'info'|'warning'|'negative'|'muted'|'faint';
export interface BarMarkElement {
 /** Stable key and testID suffix; the index is used when omitted. */
 id?:string;label:string;
 /** Any unit, as long as every element uses the same one. Negative and non-finite values count as 0. */
 value:number;
 /** Defaults to `barMarkTones[index % 6]`. */
 tone?:BarMarkTone;
 /** A host colour for this segment; wins over `tone`. */
 color?:string;
 /** Host-formatted amount shown after the label in the legend, such as `12.4 GB`. */
 detail?:string;
}
export interface BarMarkProps {
 title:string;
 /** Trailing text on the title row, such as `59.2 GB of 64 GB`. A string is drawn muted; an element is rendered as given. */
 description?:React.ReactNode;
 elements:readonly BarMarkElement[];
 /** The whole the bar measures against. When it is larger than the sum of the values the rest is the empty track. */
 total?:number;
 /** `false` hides the legend; the card then reads the elements as one label. */
 legend?:boolean;
 /** `small` draws a 12 unit bar for a secondary breakdown; the default is 24. */
 size?:'default'|'small';
 testID?:string;
}
/** The order segments take their colour in when an element names neither `tone` nor `color`. */
export const barMarkTones:readonly BarMarkTone[]=['positive','info','warning','negative','muted','faint'];
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** Each element's clamped value and its share of the whole, plus the unfilled remainder in the same unit. */
export function barMarkShares(elements:readonly BarMarkElement[],total?:number):{values:number[];shares:number[];rest:number}{
 const values=elements.map(element=>Number.isFinite(element.value)&&element.value>0?element.value:0),sum=values.reduce((a,b)=>a+b,0);
 const whole=Math.max(typeof total==='number'&&Number.isFinite(total)?total:sum,sum);
 return {values,shares:values.map(value=>whole>0?value/whole:0),rest:whole>0?whole-sum:1};
}
// Inside the Surface, so the track takes the fill that sits one step above the card.
function Bar({elements,values,rest,colors,small,testID}: {elements:readonly BarMarkElement[];values:readonly number[];rest:number;colors:readonly string[];small:boolean;testID?:string}){
 const track=useFills().raised;
 return <View {...hidden} testID={testID?`${testID}-bar`:undefined} style={{flexDirection:'row',height:small?12:24,borderRadius:small?6:8,overflow:'hidden',gap:2}}>
  {elements.map((element,index)=>values[index]>0?<View key={element.id??index} testID={testID?`${testID}-segment-${element.id??index}`:undefined} style={{flexGrow:values[index],flexShrink:1,flexBasis:0,minWidth:3,backgroundColor:colors[index]}}/>:null)}
  {rest>0?<View testID={testID?`${testID}-track`:undefined} style={{flexGrow:rest,flexShrink:1,flexBasis:0,backgroundColor:track}}/>:null}
 </View>;
}
/**
 * One horizontally stacked bar on a card: the title leads and the description trails, the bar splits into a segment per
 * element in proportion to its value, and a legend names each colour. The bar is decorative; each legend item reads its
 * label, detail and share. Layout follows the provider's direction.
 */
export function BarMark({title,description,elements,total,legend=true,size='default',testID}:BarMarkProps){
 const {locale}=useHIG();const palette=useColors();
 const {values,shares,rest}=barMarkShares(elements,total);
 const colors=elements.map((element,index)=>element.color??palette[element.tone??barMarkTones[index%barMarkTones.length]]);
 const reading=(element:BarMarkElement,index:number)=>[element.label,element.detail,formatNumber(shares[index],locale,{style:'percent',maximumFractionDigits:1})].filter(Boolean).join(', ');
 return <Surface testID={testID} style={{gap:12}} {...(legend?{}:{accessible:true,accessibilityLabel:[title,...elements.map(reading)].join(', ')})}>
  <View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12}}>
   <Text style={{fontSize:16,lineHeight:24,fontWeight:'600',flexShrink:1}}>{title}</Text>
   {description==null||description===false?null:typeof description==='string'||typeof description==='number'?<Text style={{color:palette.muted,fontSize:14,lineHeight:21,flexShrink:1}}>{description}</Text>:description}
  </View>
  <Bar elements={elements} values={values} rest={rest} colors={colors} small={size==='small'} testID={testID}/>
  {legend?<View style={{flexDirection:'row',flexWrap:'wrap',columnGap:16,rowGap:8}}>
   {elements.map((element,index)=><View key={element.id??index} accessible accessibilityLabel={reading(element,index)} testID={testID?`${testID}-legend-${element.id??index}`:undefined} style={{flexDirection:'row',alignItems:'center',gap:6}}>
    <View style={{width:8,height:8,borderRadius:4,backgroundColor:colors[index]}}/>
    <Text style={{color:palette.muted,fontSize:14,lineHeight:21}}>{element.label}</Text>
    {element.detail?<Text style={{color:palette.faint,fontSize:14,lineHeight:21}}>{element.detail}</Text>:null}
   </View>)}
  </View>:null}
 </Surface>;
}
