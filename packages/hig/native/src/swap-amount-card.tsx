import React from 'react';
import {Pressable,StyleSheet,View,type PressableProps,type StyleProp,type ViewStyle} from 'react-native';
import {formatNumber} from './number-format.js';
import {Raised,useColors,useFills,useHIG,useNumberLocale} from './provider.js';
import {Text} from './surface.js';
import {NumberFlow} from './animated-number.js';
import {TokenArt} from './swap-parts.js';
import type {SwapArtwork} from './swap-shared.js';
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const smallType={fontSize:14,lineHeight:19} as const;
/** Test ID parts. */
const contextPart='context',metaPart='meta';
export interface SwapPillProps extends Omit<PressableProps,'children'|'style'|'accessibilityRole'|'accessibilityState'> {
 /** The pill's text, drawn small and muted, such as Max; or host nodes drawn as given, such as a live figure. */
 children:React.ReactNode;
 /** Called on a press. */
 onPress?:()=>void;
 /** Dims the pill, ignores presses and reads as unavailable. */
 disabled?:boolean;
}
/** A small capsule action on a swap card, as the web `SwapPill`: Max, Test, a converted value. 32dp tall with a 44dp target; text is drawn small and muted, and other children as given. Other Pressable props, such as `accessibilityLabel`, `testID` or `android_disableSound`, reach it. */
export function SwapPill({children,onPress,disabled,hitSlop,...props}:SwapPillProps){
 const colors=useColors(),fills=useFills(),{direction}=useHIG();
 const text=typeof children==='string'||typeof children==='number';
 return <Pressable {...props} accessibilityRole='button' accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onPress} hitSlop={hitSlop??{top:6,bottom:6}} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',gap:6,minHeight:32,paddingVertical:4,paddingHorizontal:12,borderRadius:9999,backgroundColor:pressed&&!disabled?fills.raised:fills.well,opacity:disabled?0.5:1})}>
  {text?<Text style={{...smallType,color:colors.muted}}>{children}</Text>:children}
 </Pressable>;
}
export interface SwapAmountCardProps {
 /** Asset name, drawn in the slot. */
 name:string;
 /** Asset symbol; its first letters stand in when there is no `icon`. */
 symbol:string;
 /** Asset artwork: an image URL, or an element the host draws. */
 icon?:SwapArtwork;
 /** Chain or venue artwork, stacked above the asset. */
 chainIcon?:string;
 /** Line above the name: the chain, venue or account the amount comes from. A string is drawn small and muted. */
 context?:React.ReactNode;
 /** Capsule actions on the trailing edge, such as Max. Use `SwapPill`. They stay their own targets. */
 actions?:React.ReactNode;
 /** Supporting line under the actions, such as the available balance. A string is drawn small and muted; a node, such as a live figure, as given. */
 meta?:React.ReactNode;
 /** The entered amount. */
 value:number;
 /** Accessible name of the amount: From amount. */
 amountLabel:string;
 /** Text before the amount, such as a currency sign. */
 prefix?:string;
 /** Text after the amount, such as a percent sign. */
 suffix?:string;
 /** Decimal places typed so far, so `1.50` keeps its zero. */
 fractionDigits?:number;
 /** Set while the entry ends with a decimal point that has no digits after it yet. */
 trailingDot?:boolean;
 /** Most decimal places the amount can show. Defaults to 8. */
 maximumFractionDigits?:number;
 /** Capsule under the amount, such as the converted value. Use `SwapPill`. */
 conversion?:React.ReactNode;
 /** Makes the slot a button that chooses the asset. Requires `selectLabel`. */
 onSelect?:()=>void;
 /** Accessible name of the slot's button: Select token, From. */
 selectLabel?:string;
 style?:StyleProp<ViewStyle>;
 /** Prefix of the test IDs: `<testID>` (the card), `-slot`, `-select`, `-name`, `-context`, `-actions`, `-meta`, `-amount` and `-conversion`. Defaults to `swap-amount-card`. */
 testID?:string;
}
/**
 * The swap panel's From card on its own, as the web `SwapAmountCard`: the asset with its actions and balance in the slot, the entered amount
 * under it. The host owns the entry, the keypad and what the amount means.
 */
export function SwapAmountCard({name,symbol,icon,chainIcon,context,actions,meta,value,amountLabel,prefix='',suffix='',fractionDigits=0,trailingDot=false,maximumFractionDigits=8,conversion,onSelect,selectLabel,style,testID='swap-amount-card'}:SwapAmountCardProps){
 const colors=useColors(),{direction}=useHIG(),locale=useNumberLocale();
 const id=(part:string)=>`${testID}-${part}`;
 const small={...smallType,color:colors.muted};
 const options={minimumFractionDigits:Math.min(fractionDigits,maximumFractionDigits),maximumFractionDigits,useGrouping:false};
 const after=(trailingDot?'.':'')+suffix;
 const line=(node:React.ReactNode,part:string)=>typeof node==='string'||typeof node==='number'?<Text testID={id(part)} style={small}>{node}</Text>:<View testID={id(part)}>{node}</View>;
 const shown=(node:React.ReactNode)=>node!=null&&node!==false;
 return <View testID={testID} style={[{direction,backgroundColor:colors.surface,borderRadius:24,overflow:'hidden'},style]}><Raised>
  <View testID={id('slot')}>
   {onSelect?<Pressable testID={id('select')} accessibilityRole='button' accessibilityLabel={selectLabel} onPress={onSelect} style={StyleSheet.absoluteFill}/>:null}
   <View pointerEvents='box-none' style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:84,padding:16}}>
    <View pointerEvents='none' style={{flex:1,minWidth:0,flexDirection:'row',alignItems:'flex-start',gap:12}}>
     <View {...hidden} style={{alignItems:'center'}}>
      {chainIcon?<TokenArt uri={chainIcon} size={28} ring={colors.surface}/>:null}
      <View style={{marginTop:chainIcon?-14:0}}><TokenArt uri={icon} symbol={symbol} size={28} ring={colors.surface}/></View>
     </View>
     <View style={{flex:1,minWidth:0}}>
      {shown(context)?line(context,contextPart):null}
      <Text testID={id('name')} style={{fontWeight:'600',lineHeight:21}}>{name}</Text>
     </View>
    </View>
    {shown(actions)||shown(meta)?<View pointerEvents='box-none' style={{alignItems:'flex-end',gap:8,maxWidth:'60%'}}>
     {shown(actions)?<View testID={id('actions')} pointerEvents='box-none' style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'flex-end',gap:8}}>{actions}</View>:null}
     {shown(meta)?line(meta,metaPart):null}
    </View>:null}
   </View>
  </View>
  <View pointerEvents='box-none' style={{alignItems:'center',gap:8,paddingTop:4,paddingHorizontal:16,paddingBottom:20}}>
   <View accessible accessibilityLabel={amountLabel} accessibilityValue={{text:`${prefix}${formatNumber(value,locale,options)}${after}`}} testID={id('amount')}>
    <NumberFlow motion="slide" value={value} prefix={prefix} suffix={after} options={options} maxFontSizeMultiplier={1.5} style={{fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9,textAlign:'center'}}/>
   </View>
   {shown(conversion)?<View testID={id('conversion')}>{conversion}</View>:null}
  </View>
 </Raised></View>;
}
