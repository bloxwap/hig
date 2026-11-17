import React,{useState} from 'react';
import {Pressable,View,type ScrollViewProps} from 'react-native';
import {formatNumber} from './number-format.js';
import {useColors,useFills,useHIG,useMessages,useNumberLocale,usePresentNumber} from './provider.js';
import {StickyHeaderLayout} from './sticky-header.js';
import {Surface,Text} from './surface.js';
import {barFillOpacity} from './bar-mark.js';
import {Button,IconButton} from './button.js';
import {SegmentedControl} from './radio-group.js';
import {PresetGroup} from './preset-group.js';
import {ChevronIcon,SeverityIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
/** What the target does: close in profit, or cap the loss. */
export type TargetKind='take-profit'|'stop-loss';
/** How the target is expressed: profit or loss in dollars, a price, or a share of the position. */
export type TargetUnit='dollar'|'price'|'percent';
/** The three prices on the bar. */
export type TargetPrice='entry'|'trigger';
/** Every trading word of the block. HIG's built-in strings hold no trading terms, so the host supplies them, translated; only Cancel has a built-in default. */
export interface TargetBlockLabels {
 /** Heading: Take Profit, Stop Loss. */
 title:string;
 /** The confirming action: Set Take Profit. */
 submit:string;
 /** Defaults to the built-in Cancel. */
 cancel?:string;
 entry:string;
 /** The price the order triggers at: If triggered. */
 trigger:string;
 /** Name of the unit control. */
 unit:string;
 units:Record<TargetUnit,string>;
 /** The row that opens the host's own entry: Custom. */
 custom:string;
 /** Accessible name of the info button that shows `note`: How this order fills. Without it the note is always shown. */
 info?:string;
 /** Accessible name of the quick choices, not drawn: Quick targets. Defaults to `title`. */
 presets?:string;
}
export interface TargetBlockProps {
 kind:TargetKind;
 labels:TargetBlockLabels;
 /** Title of the price card, the position the target belongs to: `BTC · Long 40×`. */
 position?:string;
 /** Trailing text of the price card, the order the target places: Take-limit, Stop-market. */
 orderType?:string;
 /** One sentence about how the order fills. With `labels.info` it opens in a popover from an info button on the trailing edge of the header; otherwise it is always shown under the headline figure. */
 note?:string;
 entry:number;
 /** Price the order triggers at. Defaults to `value` when the unit is `price`; otherwise unknown until the host supplies it. */
 trigger?:number|null;
 unit:TargetUnit;
 /** Units offered, in order. Defaults to all three; one unit hides the control. `{unit, disabled}` shows a unit that cannot be chosen now, dimmed. */
 units?:readonly (TargetUnit|TargetUnitOption)[];
 onUnitChange?:(unit:TargetUnit)=>void;
 /** The target in the current unit: signed dollars (2, -0.5), a price, or a signed fraction (0.05 reads +5%). `null` reads as unknown and disables the confirming action. */
 value:number|null;
 onValueChange?:(value:number)=>void;
 /** Quick choices in the current unit. The one equal to `value` is shown selected. `{value, disabled}` shows a choice that cannot be taken now, dimmed. */
 presets?:readonly (number|TargetPreset)[];
 /** Shows the Custom row; the host opens its own entry. */
 onCustom?:()=>void;
 /** The value the host's own entry set, in the current unit. The Custom row then shows it on its trailing edge and reads as selected, and no quick choice does. Has no effect without `onCustom`; null keeps the row a toggle that reads as not selected. */
 customValue?:number|null;
 /** Format of prices. Defaults to US dollars. */
 priceOptions?:Intl.NumberFormatOptions;
 /** Set true to draw the prices inside a card: a surface fill, padding and radius. By default the title row, bar and readouts sit directly on the screen. */
 surface?:boolean;
 onSubmit:()=>void;
 /** Defaults to disabled while `value` is unknown. */
 submitDisabled?:boolean;
 busy?:boolean;
 /** Shows Cancel beside the confirming action. */
 onCancel?:()=>void;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. It takes the place of the info button, and the note is then always shown, unless `headerActionBesideInfo` is set. */
 headerAction?:React.ReactNode;
 /** Set true to keep the info button when `headerAction` is given: the info button comes first and `headerAction` sits on the trailing edge. */
 headerActionBesideInfo?:boolean;
 /** Sets `nativeID` on the title, so a sheet around the pane can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container. */
 stickyHeader?:boolean;
 /** Fill behind the pinned header once content scrolls under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 testID?:string;
}
/** A quick choice that can be shown dimmed. */
export interface TargetPreset {value:number;disabled?:boolean}
/** A unit that can be shown dimmed. */
export interface TargetUnitOption {unit:TargetUnit;disabled?:boolean}
/** The quick choices as `{value, disabled}`, whichever form the host gave. */
export function targetPresets(presets:readonly (number|TargetPreset)[]):TargetPreset[]{return presets.map(preset=>typeof preset==='number'?{value:preset}:preset);}
/** The units as `{unit, disabled}`, whichever form the host gave. */
export function targetUnits(units:readonly (TargetUnit|TargetUnitOption)[]):TargetUnitOption[]{return units.map(unit=>typeof unit==='string'?{unit}:unit);}
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
const allUnits:readonly TargetUnit[]=['dollar','price','percent'];
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const known=(value:number|null|undefined):value is number=>value!=null&&Number.isFinite(value);
/**
 * Number format of a target in a unit. Dollars and percents carry their sign. `short` is a preset's value: a whole dollar amount
 * or a whole price drops its fraction digits (`+$10`, `$63,000`), whatever fraction digits `priceOptions` fix, so a preset reads
 * the same on web and native; a price formatted by significant digits keeps `priceOptions`.
 */
export function targetFormat(unit:TargetUnit,priceOptions:Intl.NumberFormatOptions=usd,short?:number):Intl.NumberFormatOptions{
 const whole=short!==undefined&&Number.isInteger(short);
 if(unit==='price')return whole&&priceOptions.minimumSignificantDigits===undefined&&priceOptions.maximumSignificantDigits===undefined?{...priceOptions,minimumFractionDigits:0,maximumFractionDigits:0}:priceOptions;
 if(unit==='percent')return {style:'percent',maximumFractionDigits:2,signDisplay:'exceptZero'};
 return {...usd,signDisplay:'exceptZero',...(whole?{maximumFractionDigits:0}:null)};
}
/**
 * Where each known price sits on the bar, as a fraction of its width from the low-price edge, the prices in price order, and
 * the stretch (`from` to `to`) between them: the whole bar, from entry to the trigger.
 * Without a trigger there is no stretch.
 */
export function targetLayout({entry,trigger}:{entry:number;trigger?:number|null}):{positions:Partial<Record<TargetPrice,number>>;order:TargetPrice[];from:number;to:number}{
 const values:Partial<Record<TargetPrice,number>>={};
 if(known(entry))values.entry=entry;if(known(trigger))values.trigger=trigger;
 const kinds=Object.keys(values) as TargetPrice[],prices=kinds.map(kind=>values[kind]!);
 if(!kinds.length)return {positions:{},order:[],from:0.5,to:0.5};
 const low=Math.min(...prices),span=Math.max(...prices)-low;
 const positions:Partial<Record<TargetPrice,number>>={};for(const kind of kinds)positions[kind]=span>0?(values[kind]!-low)/span:0.5;
 const rank:Record<TargetPrice,number>={entry:0,trigger:1};
 const order=[...kinds].sort((a,b)=>values[a]!-values[b]!||rank[a]-rank[b]);
 const start=positions.entry,end=positions.trigger;
 return start===undefined||end===undefined?{positions,order,from:0.5,to:0.5}:{positions,order,from:Math.min(start,end),to:Math.max(start,end)};
}
/** A take profit or a stop loss on one position as a screen: the target as the headline figure, a price card whose bar shows how far the price is from the trigger, the unit, the host's quick choices, and the confirming action. The bar is decorative; each price reads its label and value. */
export function TargetBlock({kind,labels,position,orderType,note,entry,trigger,unit,units=allUnits,onUnitChange,value,onValueChange,presets=[],onCustom,customValue,priceOptions=usd,surface=false,onSubmit,submitDisabled,busy,onCancel,onBack,headerAction,headerActionBesideInfo,headingId,stickyHeader,stickyHeaderBackground,scrollComponent,testID}:TargetBlockProps){const PriceCard=surface?Surface:View;
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction}=useHIG(),locale=useNumberLocale(),present=usePresentNumber();const [open,setOpen]=useState(false);
 const info=note&&labels.info&&(!headerAction||headerActionBesideInfo)?labels.info:undefined;
 // With the info button beside a host control, both header sides widen together so the title stays centred.
 const pair=!!info&&headerAction!=null,side=pair?92:44;
 const custom=onCustom&&known(customValue)?customValue:null,customText=custom===null?null:formatNumber(custom,locale,present(targetFormat(unit,priceOptions)));
 const target=trigger!==undefined?trigger:unit==='price'?value:null;
 const {positions,order,from,to}=targetLayout({entry,trigger:target});
 const prices:Record<TargetPrice,number|null|undefined>={entry,trigger:target};
 const stop=kind==='stop-loss',tone=stop?colors.negative:colors.positive,intent=stop?'destructive' as const:'primary' as const,onFill=stop?colors.background:colors.onAction;
 const triggerLeads=(positions.trigger??0)<(positions.entry??0);
 const align=(index:number)=>order.length>1&&index===order.length-1?'flex-end' as const:order.length===3&&index===1?'center' as const:'flex-start' as const;
 const part=(grow:number)=>({flexGrow:grow,flexShrink:1,flexBasis:0,backgroundColor:fills.raised});
 const sticky=!!stickyHeader;
 const header=<View testID='target-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:side,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='target-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID='target-title' nativeID={headingId} accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{labels.title}</Text>
   <View style={{minWidth:side,alignItems:'flex-end'}}>{info?(()=>{const button=<IconButton intent='ghost' label={info} suppressFeedback testID='target-info' accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)}><SeverityIcon kind='info' color={colors.text}/></IconButton>;return pair?<View testID='target-header-actions' style={{direction,flexDirection:'row',alignItems:'center',gap:4}}>{button}{headerAction}</View>:button;})():headerAction}</View>
  </View>;
 const body=<>
  <View style={{alignItems:'center',marginTop:16}}><AnimatedNumberReadout testID='target-amount' value={value} options={targetFormat(unit,priceOptions)} style={{fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9,textAlign:'center'}}/></View>
  {note&&!info?<Text testID='target-note' style={{color:colors.muted,fontSize:14,lineHeight:21,textAlign:'center',marginTop:16}}>{note}</Text>:null}
  <PriceCard testID='target-prices' style={{gap:12,marginTop:16,minWidth:0}}>
   {position||orderType?<View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12}}>
    {position?<Text testID='target-position' accessibilityRole='header' style={{fontSize:16,lineHeight:24,fontWeight:'600',flexShrink:1}}>{position}</Text>:<View/>}
    {orderType?<Text testID='target-order-type' style={{color:colors.muted,fontSize:14,lineHeight:21,flexShrink:1}}>{orderType}</Text>:null}
   </View>:null}
   <View {...hidden} testID='target-bar' style={{flexDirection:'row',height:24,borderRadius:8,overflow:'hidden'}}>
    <View style={part(from)}/>
    {to>from?<View testID='target-move' style={{flexGrow:to-from,flexShrink:1,flexBasis:0,minWidth:6,borderStartWidth:3,borderEndWidth:3,borderStartColor:triggerLeads?tone:colors.text,borderEndColor:triggerLeads?colors.text:tone}}><View testID='target-fill' style={{flex:1,backgroundColor:tone,opacity:barFillOpacity}}/></View>:null}
    <View style={part(1-to)}/>
   </View>
   <View style={{flexDirection:'row',justifyContent:'space-between',gap:12}}>
    {order.map((price,index)=><View key={price} accessible accessibilityLabel={`${labels[price]}, ${formatNumberReadout(prices[price],locale,present(priceOptions)).text}`} testID={`target-${price}`} style={{alignItems:align(index),flexShrink:1,minWidth:0}}>
     <View {...hidden}><AnimatedNumberReadout value={prices[price]} options={priceOptions} tone={price==='trigger'?(stop?'negative':'positive'):'text'} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/></View>
     <Text {...hidden} numberOfLines={1} style={{color:colors.muted,fontSize:12,lineHeight:16}}>{labels[price]}</Text>
    </View>)}
   </View>
  </PriceCard>
  {units.length>1?<View testID='target-units' style={{marginTop:16}}><SegmentedControl label={labels.unit} options={targetUnits(units).map(option=>({value:option.unit,label:labels.units[option.unit],disabled:option.disabled}))} value={unit} onValueChange={next=>onUnitChange?.(next as TargetUnit)}/></View>:null}
  {onCustom&&customText===null?<Pressable testID='target-custom' accessibilityRole='button' accessibilityState={customValue!==undefined?{selected:false}:undefined} onPress={onCustom} style={({pressed})=>({flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:48,paddingHorizontal:16,borderRadius:9999,backgroundColor:pressed?fills.raised:fills.well,marginTop:16})}>
   <Text numberOfLines={1} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{labels.custom}</Text>
   <View {...hidden} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View>
  </Pressable>:null}
  {onCustom&&customText!==null?<Pressable testID='target-custom' accessibilityRole='button' accessibilityLabel={`${labels.custom}, ${customText}`} accessibilityState={{selected:true}} onPress={onCustom} style={({pressed})=>({flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:48,paddingHorizontal:16,borderRadius:9999,backgroundColor:stop?colors.negative:colors.action,opacity:pressed?0.9:1,marginTop:16})}>
   <Text {...hidden} numberOfLines={1} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'600',color:onFill}}>{labels.custom}</Text>
   <View {...hidden} style={{direction,flexDirection:'row',alignItems:'center',gap:6,flexShrink:1}}>
    <Text testID='target-custom-value' numberOfLines={1} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'500',color:onFill}}>{customText}</Text>
    <View style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={onFill}/></View>
   </View>
  </Pressable>:null}
  {presets.length>0?<PresetGroup testID='target-presets' label={labels.presets??labels.title} selectedIntent={intent} options={targetPresets(presets).map(({value:preset,disabled})=>({value:preset,disabled,testID:`target-preset-${preset}`,label:formatNumber(preset,locale,present(targetFormat(unit,priceOptions,preset)))}))} value={custom===null?value:null} onValueChange={next=>onValueChange?.(next)} style={{marginTop:16}}/>:null}
  {info&&open?<Pressable testID='target-popover-dismiss' {...hidden} onPress={()=>setOpen(false)} style={{position:'absolute',top:0,bottom:0,left:0,right:0,zIndex:1}}/>:null}
  {info&&open?<View testID='target-popover' accessibilityLiveRegion='polite' style={{position:'absolute',top:sticky?4:64,...(direction==='rtl'?{left:16}:{right:16}),maxWidth:280,zIndex:2,padding:12,borderRadius:14,backgroundColor:colors.nested}}><Text testID='target-note' style={{color:colors.text,fontSize:14,lineHeight:21}}>{note}</Text></View>:null}
  <View testID='target-actions' style={{direction,flexDirection:'row',gap:8,marginTop:16}}>
   {onCancel?<Button testID='target-cancel' intent='secondary' onPress={onCancel} style={{flex:1,alignSelf:'auto'}}>{labels.cancel??t.cancel}</Button>:null}
   <Button testID='target-submit' intent={intent} disabled={!!submitDisabled||!known(value)||(unit==='price'&&value<=0)} busy={busy} onPress={onSubmit} style={{flex:1,alignSelf:'auto'}}>{labels.submit}</Button>
  </View>
 </>;
 if(sticky)return <StickyHeaderLayout testID={testID} headerTestID='target-sticky-header' header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{padding:16}}>
  {header}
  {body}
 </View>;
}
