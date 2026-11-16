import React from 'react';
import {View} from 'react-native';
import {useColors,useFills,useHIG,useNumberLocale,usePresentNumber} from './provider.js';
import {Surface,Text} from './surface.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
export type BarPnlSide='long'|'short';
export type BarPnlResult='profit'|'loss'|'flat';
export type BarPnlKind='liquidation'|'mark'|'entry';
export interface BarPnlProps {
 /** Price the position was opened at. */
 entry:number;
 /** Current mark price. `null` or omitted reads as unknown and draws no profit or loss. */
 mark?:number|null;
 /** Liquidation price. Omit it, or pass `null`, for a position that cannot be liquidated. */
 liquidation?:number|null;
 /** Direction of the position. Defaults to `long` when the liquidation price is below entry (or unknown) and `short` when it is above. */
 side?:BarPnlSide;
 /** Host text for the three prices, for example `{liquidation:'Liquidation',mark:'Mark',entry:'Entry'}`. HIG ships no trading terms of its own. */
 labels:Record<BarPnlKind,string>;
 /** Heading on the leading edge above the bar, such as `BTC Long 10×`. */
 title?:string;
 /** Trailing text on the title row, such as the profit or loss in dollars. A string is drawn muted; an element is rendered as given. */
 description?:React.ReactNode;
 /** Format of the three prices. Defaults to US dollars. */
 priceOptions?:Intl.NumberFormatOptions;
 /** Shortens the three prices for narrow screens: `$64,700` for `$64,700.00`, `$142.96`, `$0.4821`. Trailing zeros are dropped. Default `false`. */
 compact?:boolean;
 /** Scales the bar to the prices themselves, so the stretch from entry to mark fills it. For a finished trade, where the move is the whole story. Default `false`. */
 fit?:boolean;
 /** Set false to draw no card: no surface fill, padding or radius. The title row, bar and readouts keep their spacing. Default `true`. */
 surface?:boolean;
 testID?:string;
}
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
const finite=(value:number|null|undefined):value is number=>typeof value==='number'&&Number.isFinite(value);
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** Price format for `compact`: no fraction at 1,000 and above, at most two fraction digits from 1, and four significant digits below 1, with trailing zeros dropped. Host `priceOptions` (such as the currency) are kept. */
export function barPnlCompactOptions(value:number|null|undefined,base:Intl.NumberFormatOptions=usd):Intl.NumberFormatOptions{
 const size=finite(value)?Math.abs(value):0;
 return size>0&&size<1?{...base,minimumFractionDigits:undefined,maximumFractionDigits:undefined,maximumSignificantDigits:4}:{...base,minimumFractionDigits:0,maximumFractionDigits:size>=1000?0:2};
}
/**
 * Where each price sits on the bar, as a fraction of its width from the low-price edge, the readouts in price order, and
 * whether the position is in profit. With a liquidation price the bar runs from it to the same distance on the other side
 * of entry, so entry sits in the middle; a mark beyond either end stretches the bar. Without one the bar is centred on entry.
 */
export function barPnlLayout({entry,mark,liquidation,side,fit}:{entry:number;mark?:number|null;liquidation?:number|null;side?:BarPnlSide;fit?:boolean}):{side:BarPnlSide;result:BarPnlResult;positions:Partial<Record<BarPnlKind,number>>;order:BarPnlKind[]}{
 const liq=finite(liquidation)?liquidation:null;
 const direction=side??(liq!==null&&liq>entry?'short':'long');
 const result:BarPnlResult=!finite(entry)||!finite(mark)||mark===entry?'flat':(mark>entry)===(direction==='long')?'profit':'loss';
 if(!finite(entry))return {side:direction,result,positions:{},order:[]};
 const price=finite(mark)?mark:entry;
 const reach=liq!==null?Math.abs(entry-liq):Math.max(Math.abs(price-entry)*2,Math.abs(entry)*0.01,Number.MIN_VALUE);
 // `fit` scales the bar to the prices themselves, so the stretch from entry to mark fills it.
 const points=liq!==null?[entry,price,liq]:[entry,price];
 const low=fit?Math.min(...points):Math.min(entry-reach,price),high=fit?Math.max(...points):Math.max(entry+reach,price),span=high-low;
 const at=(value:number)=>span>0?Math.min(1,Math.max(0,(value-low)/span)):0.5;
 const positions:Partial<Record<BarPnlKind,number>>={entry:at(entry),mark:at(price)};
 if(liq!==null)positions.liquidation=at(liq);
 // Ties keep liquidation outermost and put mark on the side it would move to next.
 const rank:Record<BarPnlKind,number>={liquidation:direction==='long'?0:2,entry:1,mark:direction==='long'?(result==='loss'?0.5:1.5):(result==='loss'?1.5:0.5)};
 const values:Record<BarPnlKind,number>={liquidation:liq??0,entry,mark:price};
 const order=(Object.keys(positions) as BarPnlKind[]).sort((a,b)=>values[a]-values[b]||rank[a]-rank[b]);
 return {side:direction,result,positions,order};
}
/** A position's profit or loss as one bar: the stretch between entry and mark is filled solid in the result colour, a tick marks each price, and the liquidation, mark and entry prices read under the bar in price order, so mark and entry trade places as the position moves. The bar is decorative; each readout reads its label and price. */
export function BarPnl({entry,mark,liquidation,side,labels,title,description,priceOptions=usd,compact=false,fit=false,surface=true,testID}:BarPnlProps){
 const colors=useColors(),{direction}=useHIG(),locale=useNumberLocale(),present=usePresentNumber();
 const {result,positions,order}=barPnlLayout({entry,mark,liquidation,side,fit});
 // The result follows the market direction roles (HIGProvider marketColors), which default to buy and sell.
 const tone=result==='profit'?colors.up:result==='loss'?colors.down:colors.muted;
 const from=Math.min(positions.entry??0.5,positions.mark??0.5),to=Math.max(positions.entry??0.5,positions.mark??0.5);
 const markLeads=(positions.mark??0)<(positions.entry??0);
 const values:Record<BarPnlKind,number|null|undefined>={liquidation,mark,entry};
 const format=(kind:BarPnlKind)=>compact?barPnlCompactOptions(values[kind],priceOptions):priceOptions;
 const align=(index:number)=>order.length>1&&index===order.length-1?'flex-end' as const:order.length===3&&index===1?'center' as const:'flex-start' as const;
 const content=<>
  {title||description!=null?<View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12}}>
   {title?<Text accessibilityRole='header' style={{fontSize:16,lineHeight:24,fontWeight:'600',flexShrink:1}}>{title}</Text>:<View/>}
   {description==null||description===false?null:typeof description==='string'||typeof description==='number'?<Text style={{color:colors.muted,fontSize:14,lineHeight:21,flexShrink:1}}>{description}</Text>:description}
  </View>:null}
  <Bar from={from} to={to} markLeads={markLeads} tone={tone} liquidation={positions.liquidation} testID={testID}/>
  <View style={{flexDirection:'row',justifyContent:'space-between',gap:12}}>
   {order.map((kind,index)=><View key={kind} accessible accessibilityLabel={`${labels[kind]}, ${formatNumberReadout(values[kind],locale,present(format(kind))).text}`} testID={testID?`${testID}-${kind}`:undefined} style={{alignItems:align(index),flexShrink:1,minWidth:0}}>
    <View {...hidden}><AnimatedNumberReadout value={values[kind]} options={format(kind)} tone={kind==='liquidation'?'negative':kind==='mark'&&result!=='flat'?(result==='profit'?'up':'down'):'text'} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/></View>
    <Text {...hidden} numberOfLines={1} style={{color:colors.muted,fontSize:12,lineHeight:16}}>{labels[kind]}</Text>
   </View>)}
  </View>
 </>;
 return surface?<Surface testID={testID} style={{gap:12}}>{content}</Surface>:<View testID={testID} style={{direction,gap:12,minWidth:0}}>{content}</View>;
}
// Inside the Surface, so the track takes the fill that sits one step above the card.
function Bar({from,to,markLeads,tone,liquidation,testID}:{from:number;to:number;markLeads:boolean;tone:string;liquidation?:number;testID?:string}){
 const colors=useColors(),track=useFills().raised;
 const part=(grow:number)=>({flexGrow:grow,flexShrink:1,flexBasis:0,backgroundColor:track});
 return <View {...hidden} testID={testID?`${testID}-bar`:undefined} style={{flexDirection:'row',height:24,borderRadius:8,overflow:'hidden'}}>
  <View style={part(from)}/>
  <View testID={testID?`${testID}-move`:undefined} style={{flexGrow:to-from,flexShrink:1,flexBasis:0,minWidth:6,backgroundColor:tone,borderStartWidth:3,borderEndWidth:3,borderStartColor:markLeads?tone:colors.text,borderEndColor:markLeads?colors.text:tone}}/>
  <View style={part(1-to)}/>
  {liquidation===undefined?null:<View testID={testID?`${testID}-liquidation-tick`:undefined} style={{position:'absolute',top:0,bottom:0,width:3,start:`${liquidation*100}%`,marginStart:liquidation<=0?0:liquidation>=1?-3:-1.5,backgroundColor:colors.negative}}/>}
 </View>;
}
