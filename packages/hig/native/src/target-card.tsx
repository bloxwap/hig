import React from 'react';
import {Pressable,View} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import {withAlpha} from '@bloxwap/hig/tokens';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Surface,Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {SegmentedControl} from './radio-group.js';
import {ChevronIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
/** What the target does: close in profit, or cap the loss. */
export type TargetKind='take-profit'|'stop-loss';
/** How the target is expressed: profit or loss in dollars, a price, or a share of the position. */
export type TargetUnit='dollar'|'price'|'percent';
/** The three prices on the bar. */
export type TargetPrice='entry'|'mark'|'trigger';
/** Every trading word of the block. HIG's built-in strings hold no trading terms, so the host supplies them, translated; only Cancel has a built-in default. */
export interface TargetCardLabels {
 /** Heading: Take Profit, Stop Loss. */
 title:string;
 /** The confirming action: Set Take Profit. */
 submit:string;
 /** Defaults to the built-in Cancel. */
 cancel?:string;
 entry:string;mark:string;
 /** The price the order triggers at: If triggered. */
 trigger:string;
 /** Name of the unit control. */
 unit:string;
 units:Record<TargetUnit,string>;
 /** The row that opens the host's own entry: Custom. */
 custom:string;
}
export interface TargetCardProps {
 kind:TargetKind;
 labels:TargetCardLabels;
 /** Title of the price card, the position the target belongs to: `BTC · Long 40×`. */
 position?:string;
 /** Trailing text of the price card, the order the target places: Take-limit, Stop-market. */
 orderType?:string;
 /** One sentence under the price card about how the order fills. */
 note?:string;
 entry:number;mark?:number|null;
 /** Price the order triggers at. Defaults to `value` when the unit is `price`; otherwise unknown until the host supplies it. */
 trigger?:number|null;
 unit:TargetUnit;
 /** Units offered, in order. Defaults to all three; one unit hides the control. */
 units?:readonly TargetUnit[];
 onUnitChange?:(unit:TargetUnit)=>void;
 /** The target in the current unit: signed dollars (2, -0.5), a price, or a signed fraction (0.05 reads +5%). `null` reads as unknown and disables the confirming action. */
 value:number|null;
 onValueChange?:(value:number)=>void;
 /** Quick choices in the current unit. The one equal to `value` is shown selected. */
 presets?:readonly number[];
 /** Shows the Custom row; the host opens its own entry. */
 onCustom?:()=>void;
 /** Format of prices. Defaults to US dollars. */
 priceOptions?:Intl.NumberFormatOptions;
 onSubmit:()=>void;
 /** Defaults to disabled while `value` is unknown. */
 submitDisabled?:boolean;
 busy?:boolean;
 /** Shows Cancel beside the confirming action. */
 onCancel?:()=>void;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 testID?:string;
}
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
const allUnits:readonly TargetUnit[]=['dollar','price','percent'];
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const known=(value:number|null|undefined):value is number=>value!=null&&Number.isFinite(value);
/** Number format of a target in a unit. Dollars and percents carry their sign; `short` drops the cents of a whole dollar amount, for a preset. */
export function targetFormat(unit:TargetUnit,priceOptions:Intl.NumberFormatOptions=usd,short?:number):Intl.NumberFormatOptions{
 if(unit==='price')return priceOptions;
 if(unit==='percent')return {style:'percent',maximumFractionDigits:2,signDisplay:'exceptZero'};
 return {...usd,signDisplay:'exceptZero',...(short!==undefined&&Number.isInteger(short)?{maximumFractionDigits:0}:null)};
}
/**
 * Where each known price sits on the bar, as a fraction of its width from the low-price edge, the prices in price order, and
 * the stretch (`from` to `to`) the price still has to travel: from the mark, or from entry while the mark is unknown, to the trigger.
 * Without a trigger there is no stretch.
 */
export function targetLayout({entry,mark,trigger}:{entry:number;mark?:number|null;trigger?:number|null}):{positions:Partial<Record<TargetPrice,number>>;order:TargetPrice[];from:number;to:number}{
 const values:Partial<Record<TargetPrice,number>>={};
 if(known(entry))values.entry=entry;if(known(mark))values.mark=mark;if(known(trigger))values.trigger=trigger;
 const kinds=Object.keys(values) as TargetPrice[],prices=kinds.map(kind=>values[kind]!);
 if(!kinds.length)return {positions:{},order:[],from:0.5,to:0.5};
 const low=Math.min(...prices),span=Math.max(...prices)-low;
 const positions:Partial<Record<TargetPrice,number>>={};for(const kind of kinds)positions[kind]=span>0?(values[kind]!-low)/span:0.5;
 const rank:Record<TargetPrice,number>={entry:0,mark:1,trigger:2};
 const order=[...kinds].sort((a,b)=>values[a]!-values[b]!||rank[a]-rank[b]);
 const start=positions.mark??positions.entry,end=positions.trigger;
 return start===undefined||end===undefined?{positions,order,from:0.5,to:0.5}:{positions,order,from:Math.min(start,end),to:Math.max(start,end)};
}
/** A take profit or a stop loss on one position as a screen: the target as the headline figure, a price card whose bar shows how far the price is from the trigger, the unit, the host's quick choices, and the confirming action. The bar is decorative; each price reads its label and value. */
export function TargetCard({kind,labels,position,orderType,note,entry,mark,trigger,unit,units=allUnits,onUnitChange,value,onValueChange,presets=[],onCustom,priceOptions=usd,onSubmit,submitDisabled,busy,onCancel,onBack,headerAction,testID}:TargetCardProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale}=useHIG();
 const target=trigger!==undefined?trigger:unit==='price'?value:null;
 const {positions,order,from,to}=targetLayout({entry,mark,trigger:target});
 const prices:Record<TargetPrice,number|null|undefined>={entry,mark,trigger:target};
 const stop=kind==='stop-loss',tone=stop?colors.negative:colors.positive,intent=stop?'destructive' as const:'primary' as const;
 const triggerLeads=(positions.trigger??0)<(positions.mark??positions.entry??0);
 // The entry price is a tick of its own only while the mark is the near end of the stretch.
 const tick=positions.mark!==undefined&&positions.trigger!==undefined?positions.entry:undefined;
 const align=(index:number)=>order.length>1&&index===order.length-1?'flex-end' as const:order.length===3&&index===1?'center' as const:'flex-start' as const;
 const part=(grow:number)=>({flexGrow:grow,flexShrink:1,flexBasis:0,backgroundColor:fills.raised});
 return <View testID={testID} style={{padding:16}}>
  <View testID='target-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='target-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID='target-title' accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{labels.title}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
  </View>
  <View style={{alignItems:'center',marginTop:16}}><AnimatedNumberReadout testID='target-amount' value={value} options={targetFormat(unit,priceOptions)} style={{fontSize:40,lineHeight:48,fontWeight:'700'}}/></View>
  <Surface testID='target-prices' style={{gap:12,marginTop:16}}>
   {position||orderType?<View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12}}>
    {position?<Text testID='target-position' accessibilityRole='header' style={{fontSize:16,lineHeight:24,fontWeight:'600',flexShrink:1}}>{position}</Text>:<View/>}
    {orderType?<Text testID='target-order-type' style={{color:colors.muted,fontSize:14,lineHeight:21,flexShrink:1}}>{orderType}</Text>:null}
   </View>:null}
   <View {...hidden} testID='target-bar' style={{flexDirection:'row',height:24,borderRadius:8,overflow:'hidden'}}>
    <View style={part(from)}/>
    {to>from?<View testID='target-move' style={{flexGrow:to-from,flexShrink:1,flexBasis:0,minWidth:6,backgroundColor:withAlpha(tone,0.24),borderStartWidth:3,borderEndWidth:3,borderStartColor:triggerLeads?tone:colors.text,borderEndColor:triggerLeads?colors.text:tone}}/>:null}
    <View style={part(1-to)}/>
    {tick===undefined?null:<View testID='target-entry-tick' style={{position:'absolute',top:0,bottom:0,width:3,start:`${tick*100}%`,marginStart:tick<=0?0:tick>=1?-3:-1.5,backgroundColor:colors.muted}}/>}
   </View>
   <View style={{flexDirection:'row',justifyContent:'space-between',gap:12}}>
    {order.map((price,index)=><View key={price} accessible accessibilityLabel={`${labels[price]}, ${formatNumberReadout(prices[price],locale,priceOptions).text}`} testID={`target-${price}`} style={{alignItems:align(index),flexShrink:1,minWidth:0}}>
     <View {...hidden}><AnimatedNumberReadout value={prices[price]} options={priceOptions} tone={price==='trigger'?(stop?'negative':'positive'):'text'} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/></View>
     <Text {...hidden} numberOfLines={1} style={{color:colors.muted,fontSize:12,lineHeight:16}}>{labels[price]}</Text>
    </View>)}
   </View>
  </Surface>
  {note?<Text testID='target-note' style={{color:colors.muted,fontSize:14,lineHeight:21,marginTop:16}}>{note}</Text>:null}
  {units.length>1?<View testID='target-units' style={{marginTop:16}}><SegmentedControl label={labels.unit} options={units.map(option=>({value:option,label:labels.units[option]}))} value={unit} onValueChange={next=>onUnitChange?.(next as TargetUnit)}/></View>:null}
  {onCustom?<Pressable testID='target-custom' accessibilityRole='button' onPress={onCustom} style={({pressed})=>({flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:48,paddingHorizontal:16,borderRadius:9999,backgroundColor:pressed?fills.raised:fills.well,marginTop:16})}>
   <Text numberOfLines={1} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{labels.custom}</Text>
   <View {...hidden} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View>
  </Pressable>:null}
  {presets.length>0?<View testID='target-presets' style={{direction,flexDirection:'row',gap:8,marginTop:16}}>
   {presets.map(preset=><Button key={preset} testID={`target-preset-${preset}`} intent={preset===value?intent:'secondary'} accessibilityState={{selected:preset===value}} onPress={()=>onValueChange?.(preset)} style={{flex:1,alignSelf:'auto',paddingHorizontal:8}}>{formatNumber(preset,locale,targetFormat(unit,priceOptions,preset))}</Button>)}
  </View>:null}
  <View testID='target-actions' style={{direction,flexDirection:'row',gap:8,marginTop:16}}>
   {onCancel?<Button testID='target-cancel' intent='secondary' onPress={onCancel} style={{flex:1,alignSelf:'auto'}}>{labels.cancel??t.cancel}</Button>:null}
   <Button testID='target-submit' intent={intent} disabled={submitDisabled??value===null} busy={busy} onPress={onSubmit} style={{flex:1,alignSelf:'auto'}}>{labels.submit}</Button>
  </View>
 </View>;
}
