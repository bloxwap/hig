import { Check } from '@bloxwap/icons/native/check';
import React,{useState} from 'react';
import {Image,Pressable,View,type ViewStyle} from 'react-native';
import {useColors,useFills,useNumberLocale,usePresentNumber} from './provider.js';
import {Text} from './surface.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
import {plainText} from './text-content.js';
/** Asset artwork: an image URL, or the host's own element. */
export type AssetArtwork=string|React.ReactElement;
export interface AssetBalanceRowProps {
 name:string;symbol:string;
 /** Without artwork the avatar shows the first three letters of the symbol. */
 icon?:AssetArtwork;
 /** Dollar value of the holding. */
 value?:number|null;
 /** Holding in token units; omit to show the value alone. */
 balance?:number|null;
 /** Format of the units line; default `{maximumFractionDigits:6}`. */
 balanceOptions?:Intl.NumberFormatOptions;
 /** Host text after the units figure, such as ` HYPE`. Drawn and read only when the units are known. */
 unitsSuffix?:string;
 /** `units` puts the units on the headline line in place of the value and draws no second line, for a holding with no dollar value. Default `value`. */
 headline?:'value'|'units';
 /** `false` draws no figures at all, for a row that is just an item to pick, such as a method or a chain. Default `true`. */
 amounts?:boolean;
 /** Short muted host text under the figures, such as the ledger a holding sits in. Read after them. */
 tag?:string;
 /** Host content on the trailing edge, after the figures. Inside a pressable row it must not be interactive. The row reads it as one label, last: its text, or `trailingLabel`. */
 trailing?:React.ReactNode;
 /** What the row reads for `trailing`, in place of its text, for an icon or a figure whose text is not what should be heard. */
 trailingLabel?:string;
 /** `trailing` holds a control, such as a Copy or Remove button: it stays its own accessibility element and touch target beside the row, out of the row's reading and outside the row's press (`<testID>-trailing`). The rest of the row is then one element (with `onSelect`, the button `<testID>-main`) read as before without the trailing text. */
 trailingInteractive?:boolean;
 /** Marks the row in use: a check on the trailing edge and `accessibilityState.selected`. */
 selected?:boolean;
 /** Dims the row, ignores presses and reads as unavailable. */
 disabled?:boolean;
 /** Makes the row a button. */
 onSelect?:()=>void;
 testID?:string;
}
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
const units:Intl.NumberFormatOptions={maximumFractionDigits:6};
const avatar=40;
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** One holding as a capsule row: a round avatar, the asset's name over its symbol, and its dollar value over its units. The avatar is padded equally on every side, so the capsule end is concentric with it, and both numbers update place by place. */
export function AssetBalanceRow({name,symbol,icon,value,balance,balanceOptions=units,unitsSuffix,headline='value',amounts=true,tag,trailing,trailingLabel,trailingInteractive,selected,disabled,onSelect,testID}:AssetBalanceRowProps){
 const colors=useColors(),fills=useFills(),locale=useNumberLocale(),present=usePresentNumber();
 const [held,setHeld]=useState(false);
 const split=!!trailingInteractive&&trailing!=null&&trailing!==false;
 const unitsFirst=headline==='units',hasUnits=amounts&&!unitsFirst&&balance!==undefined;
 const unitsText=()=>formatNumberReadout(balance,locale,balanceOptions,undefined,undefined,unitsSuffix).text;
 const headlineText=amounts?unitsFirst?unitsText():formatNumberReadout(value,locale,present(usd)).text:null;
 const label=[name,symbol,headlineText,hasUnits?unitsText():null,tag||null,split?null:trailingLabel??(trailing!=null&&trailing!==false?plainText(trailing):null)].filter(Boolean).join(', ');
 const state=selected||disabled?{...(selected?{selected:true}:{}),...(disabled?{disabled:true}:{})}:undefined;
 const strong=disabled?colors.muted:colors.text;
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const art=typeof icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:icon}} style={shape as object}/>:<View style={shape}>{icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{symbol.slice(0,3)}</Text>}</View>;
 const row=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:pressed&&!disabled?colors.nested:colors.surface});
 const content=<>
  <View {...hidden} style={disabled?{opacity:0.5}:undefined}>{art}</View>
  <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}><Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:strong}}>{name}</Text><Text numberOfLines={1} style={{fontSize:14,lineHeight:20,color:colors.muted}}>{symbol}</Text></View>
  {amounts||tag?<View {...hidden} style={{alignItems:'flex-end',justifyContent:'center'}}>
   {amounts?unitsFirst?<AnimatedNumberReadout value={balance} options={balanceOptions} suffix={unitsSuffix} tone={disabled?'muted':undefined} testID={testID?`${testID}-balance`:undefined} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/>:<AnimatedNumberReadout value={value} options={usd} tone={disabled?'muted':undefined} testID={testID?`${testID}-value`:undefined} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/>:null}
   {hasUnits?<AnimatedNumberReadout value={balance} options={balanceOptions} suffix={unitsSuffix} tone='muted' testID={testID?`${testID}-balance`:undefined} style={{fontSize:14,lineHeight:20}}/>:null}
   {tag?<Text testID={testID?`${testID}-tag`:undefined} numberOfLines={1} style={{fontSize:12,lineHeight:18,color:colors.muted}}>{tag}</Text>:null}
  </View>:null}
  {trailing!=null&&trailing!==false&&!split?<View {...hidden} testID={testID?`${testID}-trailing`:undefined} style={{flexDirection:'row',alignItems:'center',gap:8}}>{trailing}</View>:null}
 </>;
 const check=selected?<Check size={20} color={strong} testID={testID?`${testID}-check`:undefined}/>:null;
 if(split){
  // The control leaves the row's element: the rest is one element (or button), the control its own target beside it.
  const main:ViewStyle={flex:1,minWidth:0,flexDirection:'row',alignItems:'center',gap:12,alignSelf:'stretch'};
  return <View testID={testID} style={row(held)}>
   {onSelect?<Pressable testID={testID?`${testID}-main`:undefined} accessibilityRole='button' accessibilityLabel={label} accessibilityState={state} disabled={disabled} onPress={onSelect} onPressIn={()=>setHeld(true)} onPressOut={()=>setHeld(false)} style={main}>{content}</Pressable>
    :<View testID={testID?`${testID}-main`:undefined} accessible accessibilityLabel={label} accessibilityState={state} style={main}>{content}</View>}
   <View testID={testID?`${testID}-trailing`:undefined} style={{flexDirection:'row',alignItems:'center',gap:8}}>{trailing}</View>
   {check}
  </View>;
 }
 return onSelect?<Pressable testID={testID} accessibilityRole='button' accessibilityLabel={label} accessibilityState={state} disabled={disabled} onPress={onSelect} style={({pressed})=>row(pressed)}>{content}{check}</Pressable>:<View testID={testID} accessible accessibilityLabel={label} accessibilityState={state} style={row(false)}>{content}{check}</View>;
}
