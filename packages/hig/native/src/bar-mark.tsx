import React,{useContext,useMemo} from 'react';
import {View} from 'react-native';
import {formatNumber} from './number-format.js';
import {useColors,useFills,useTextEnvironment,useNumberLocale,usePresentNumber} from './provider.js';
import {figureReading,type Figure} from './figure.js';
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
 /** Amount shown after the label in the legend: host-formatted text, such as `12.4 GB`, or a live figure. */
 detail?:string|BarMarkFigure;
}
/** A legend amount that can change while the bar is shown: formatted with `options` between `prefix` and `suffix`. `null` reads as unknown. */
export type BarMarkFigure=Figure;
/**
 * Draws a live legend figure. The bar-mark entry imports no animation engine, so without a renderer a figure is drawn
 * formatted, without movement. `TokenActionBlock` supplies one that moves place by place through `NumberFlow`,
 * and a host that installs the animated-number peers can do the same around its own `BarMark`.
 */
export type BarMarkFigureRenderer=(figure:BarMarkFigure,props:{testID?:string})=>React.ReactNode;
export const BarMarkFigureContext=React.createContext<BarMarkFigureRenderer|null>(null);
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
 /** Set false to draw no card: no surface fill, padding or radius. The title row, bar and legend keep their spacing. Default `true`. */
 surface?:boolean;
 testID?:string;
}
/** How strong a bar's fill is drawn, so a wide bar does not outweigh the figures beside it. The edges of a move, the liquidation tick and the legend dots stay solid. Web: `--hig-bar-fill-opacity`. */
export const barFillOpacity=0.5;
/** The order segments take their colour in when an element names neither `tone` nor `color`. */
export const barMarkTones:readonly BarMarkTone[]=['positive','info','warning','negative','muted','faint'];
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** Each element's clamped value and its share of the whole, plus the unfilled remainder in the same unit. */
export function barMarkShares(elements:readonly BarMarkElement[],total?:number):{values:number[];shares:number[];rest:number}{
 const values=elements.map(({value})=>Number.isFinite(value)&&value>0?value:0),sum=values.reduce((a,b)=>a+b,0);
 const whole=Math.max(typeof total==='number'&&Number.isFinite(total)?total:sum,sum);
 return {values,shares:values.map(value=>whole>0?value/whole:0),rest:whole>0?whole-sum:1};
}
const percentOptions:Intl.NumberFormatOptions={style:'percent',maximumFractionDigits:1};
// A component of its own so the track reads the raised fill of whatever it sits on: one step above the card inside the Surface, one step above the page without it.
function Bar({elements,values,rest,colors,small,testID}: {elements:readonly BarMarkElement[];values:readonly number[];rest:number;colors:readonly string[];small:boolean;testID?:string}){
 const track=useFills().raised;
 return <View {...hidden} testID={testID?`${testID}-bar`:undefined} style={{flexDirection:'row',height:small?12:24,borderRadius:small?6:8,overflow:'hidden',gap:2}}>
  {elements.map((element,index)=>values[index]>0?<View key={element.id??index} testID={testID?`${testID}-segment-${element.id??index}`:undefined} style={{flexGrow:values[index],flexShrink:1,flexBasis:0,minWidth:3,backgroundColor:colors[index],opacity:barFillOpacity}}/>:null)}
  {rest>0?<View testID={testID?`${testID}-track`:undefined} style={{flexGrow:rest,flexShrink:1,flexBasis:0,backgroundColor:track}}/>:null}
 </View>;
}
/**
 * One horizontally stacked bar on a card: the title leads and the description trails, the bar splits into a segment per
 * element in proportion to its value, and a legend names each colour. The bar is decorative; each legend item reads its
 * label, detail and share. Layout follows the provider's direction.
 */
export function BarMark({title,description,elements,total,legend=true,size='default',surface=true,testID}:BarMarkProps){
 const {direction}=useTextEnvironment();const locale=useNumberLocale(),palette=useColors(),present=usePresentNumber(),renderFigure=useContext(BarMarkFigureContext);
 const {values,shares,rest}=useMemo(()=>barMarkShares(elements,total),[elements,total]);
 const percentages=useMemo(()=>shares.map(share=>formatNumber(share,locale,percentOptions)),[shares,locale]);
 const {body,summary}=useMemo(()=>{
  const colors=elements.map((element,index)=>element.color??palette[element.tone??barMarkTones[index%barMarkTones.length]]);
  const detailText=(detail:string|BarMarkFigure|undefined)=>detail==null||typeof detail==='string'?detail:figureReading(detail,locale,present(detail.options));
  const reading=(element:BarMarkElement,index:number)=>[element.label,detailText(element.detail),percentages[index]].filter(Boolean).join(', ');
  const detailStyle={color:palette.faint,fontSize:14,lineHeight:21};
  const detail=(element:BarMarkElement,index:number)=>{
   const value=element.detail;if(!value)return null;
   const id=testID?`${testID}-detail-${element.id??index}`:undefined;
   if(typeof value==='string')return <Text style={detailStyle}>{value}</Text>;
   return renderFigure?renderFigure(value,{testID:id}):<Text testID={id} style={detailStyle}>{detailText(value)}</Text>;
  };
  const summary=legend?undefined:elements.map(reading).join(', ');
  const body=<>
   <Bar elements={elements} values={values} rest={rest} colors={colors} small={size==='small'} testID={testID}/>
   {legend?<View style={{flexDirection:'row',flexWrap:'wrap',columnGap:16,rowGap:8}}>
    {elements.map((element,index)=><View key={element.id??index} accessible accessibilityLabel={reading(element,index)} testID={testID?`${testID}-legend-${element.id??index}`:undefined} style={{flexDirection:'row',alignItems:'center',gap:6}}>
     <View style={{width:8,height:8,borderRadius:4,backgroundColor:colors[index]}}/>
     <Text style={{color:palette.muted,fontSize:14,lineHeight:21}}>{element.label}</Text>
     {detail(element,index)}
    </View>)}
   </View>:null}
  </>;
  return {body,summary};
 },[elements,palette,locale,present,percentages,renderFigure,legend,testID,values,rest,size]);
 const group=legend?{}:{accessible:true,accessibilityLabel:elements.length?`${title}, ${summary}`:title};
 const content=<>
  <View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12}}>
   <Text style={{fontSize:16,lineHeight:24,fontWeight:'600',flexShrink:1}}>{title}</Text>
   {description==null||description===false?null:typeof description==='string'||typeof description==='number'?<Text style={{color:palette.muted,fontSize:14,lineHeight:21,flexShrink:1}}>{description}</Text>:description}
  </View>
  {body}
 </>;
 return surface?<Surface testID={testID} style={{gap:12}} {...group}>{content}</Surface>:<View testID={testID} style={{direction,gap:12,minWidth:0}} {...group}>{content}</View>;
}
