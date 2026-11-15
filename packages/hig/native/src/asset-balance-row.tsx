import React from 'react';
import {Image,Pressable,View,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,usePresentNumber} from './provider.js';
import {Text} from './surface.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
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
 /** Makes the row a button. */
 onSelect?:()=>void;
 testID?:string;
}
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
const units:Intl.NumberFormatOptions={maximumFractionDigits:6};
const avatar=40;
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** One holding as a capsule row: a round avatar, the asset's name over its symbol, and its dollar value over its units. The avatar is padded equally on every side, so the capsule end is concentric with it, and both numbers update place by place. */
export function AssetBalanceRow({name,symbol,icon,value,balance,balanceOptions=units,onSelect,testID}:AssetBalanceRowProps){
 const colors=useColors(),fills=useFills(),{locale}=useHIG(),present=usePresentNumber();
 const hasUnits=balance!==undefined;
 const label=[name,symbol,formatNumberReadout(value,locale,present(usd)).text,hasUnits?formatNumberReadout(balance,locale,balanceOptions).text:null].filter(Boolean).join(', ');
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const art=typeof icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:icon}} style={shape as object}/>:<View style={shape}>{icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{symbol.slice(0,3)}</Text>}</View>;
 const row=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:pressed?fills.raised:fills.well});
 const content=<>
  <View {...hidden}>{art}</View>
  <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}><Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{name}</Text><Text numberOfLines={1} style={{fontSize:14,lineHeight:20,color:colors.muted}}>{symbol}</Text></View>
  <View {...hidden} style={{alignItems:'flex-end',justifyContent:'center'}}>
   <AnimatedNumberReadout value={value} options={usd} testID={testID?`${testID}-value`:undefined} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/>
   {hasUnits?<AnimatedNumberReadout value={balance} options={balanceOptions} tone='muted' testID={testID?`${testID}-balance`:undefined} style={{fontSize:14,lineHeight:20}}/>:null}
  </View>
 </>;
 return onSelect?<Pressable testID={testID} accessibilityRole='button' accessibilityLabel={label} onPress={onSelect} style={({pressed})=>row(pressed)}>{content}</Pressable>:<View testID={testID} accessible accessibilityLabel={label} style={row(false)}>{content}</View>;
}
