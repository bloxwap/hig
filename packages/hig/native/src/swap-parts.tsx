import { ArrowDown } from '@bloxwap/icons/native/arrow-down';
import { ArrowUpDown } from '@bloxwap/icons/native/arrow-up-down';
import { ChevronDown } from '@bloxwap/icons/native/chevron-down';
import { Delete } from '@bloxwap/icons/native/delete';
import { Lock } from '@bloxwap/icons/native/lock';
import { LogOut } from '@bloxwap/icons/native/log-out';
import { Menu } from '@bloxwap/icons/native/menu';
import { RotateCcw } from '@bloxwap/icons/native/rotate-ccw';
import { ScanLine } from '@bloxwap/icons/native/scan-line';
import { Wallet } from '@bloxwap/icons/native/wallet';
import React,{createContext} from 'react';
import {Image,Pressable,View,type FlatListProps,type Insets,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Heading,Text} from './surface.js';
import {IconButton} from './button.js';
import {ChevronIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import type {SwapArtwork,SwapToken} from './swap-shared.js';
/** What a host surface supplies to the swap views: a sheet passes its backend's list so drags hand off to the sheet, and turns off the panel's own height animation. */
export const SwapHostContext=createContext<{listComponent?:React.ComponentType<FlatListProps<SwapToken>>;animateHeight?:boolean}>({});
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const,pointerEvents:'none' as const};
const centre:ViewStyle={alignItems:'center',justifyContent:'center'};
export function DownIcon({color,size=16}: {color:string;size?:number}){return <ArrowDown size={size} color={color}/>;}
export function FlipIcon({color,size=16}: {color:string;size?:number}){return <ArrowUpDown size={size} color={color}/>;}
export function MenuIcon({color}: {color:string}){return <Menu size={20} color={color}/>;}
export function ResetIcon({color}: {color:string}){return <RotateCcw size={20} color={color}/>;}
export function DeleteIcon({color}: {color:string}){return <Delete size={24} color={color}/>;}
export function ScanIcon({color}: {color:string}){return <ScanLine size={18} color={color}/>;}
export function WalletIcon({color}: {color:string}){return <Wallet size={20} color={color}/>;}
export function LockIcon({color}: {color:string}){return <Lock size={16} color={color}/>;}
export function LeaveIcon({color}: {color:string}){return <LogOut size={20} color={color}/>;}
/** Circular artwork from a URL or the host's own element, or the symbol's first letters when the host has none. */
export function TokenArt({uri,symbol,size,ring}: {uri?:SwapArtwork;symbol?:string;size:number;ring?:string}){
 const colors=useColors();const shape:ViewStyle={width:size,height:size,borderRadius:size/2,backgroundColor:colors.nested,...(ring?{borderWidth:2,borderColor:ring}:{})};
 if(uri&&typeof uri!=='string')return <View style={[shape,centre,{overflow:'hidden'}]}>{uri}</View>;
 return uri?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri}} style={shape as object}/>:<View style={[shape,centre]}>{symbol?<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:size>=40?12:9,lineHeight:size>=40?16:12,fontWeight:'600',color:colors.muted}}>{symbol.slice(0,3)}</Text>:null}</View>;
}
/** Token artwork with its chain badge. */
export function TokenIcon({token,size=44}: {token:SwapToken;size?:number}){const colors=useColors();return <View {...hidden} style={{width:size,height:size}}><TokenArt uri={token.icon} symbol={token.symbol} size={size}/>{token.chainIcon?<View style={{position:'absolute',end:0,bottom:0}}><TokenArt uri={token.chainIcon} size={18} ring={colors.overlay}/></View>:null}</View>;}
/** Small capsule action that sits on a card: Max, Test, the slippage setting and the denomination switch. 32dp tall with a 44dp target. */
export function SwapCapsule({children,onPress,label,testID,disabled=false,hitSlop={top:6,bottom:6},ref}: {children:React.ReactNode;onPress:()=>void;label?:string;testID?:string;disabled?:boolean;/** Defaults to a 44dp target, as on the swap card. */hitSlop?:Insets;/** Reaches the capsule, for example to move accessibility focus back to it. */ref?:React.Ref<View>}){
 const fills=useFills();const {direction}=useHIG();
 return <Pressable disabled={disabled} accessibilityState={{disabled}} ref={ref} accessibilityRole='button' accessibilityLabel={label} testID={testID} onPress={onPress} hitSlop={hitSlop} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',gap:6,minHeight:32,paddingVertical:4,paddingHorizontal:12,borderRadius:9999,backgroundColor:pressed?fills.raised:fills.well})}>{children}</Pressable>;
}
const keys=['1','2','3','4','5','6','7','8','9','.','0','back'];
/** Numeric keypad: a 3 by 4 grid of 56dp keys. Emits `0`–`9`, `.` or `back`. */
export function SwapKeypad({onKey,label,deleteLabel}: {onKey:(key:string)=>void;label:string;deleteLabel:string}){
 const colors=useColors();
 // Always left to right: a keypad keeps its telephone layout in RTL locales.
 return <View accessibilityLabel={label} testID='swap-keypad' style={{direction:'ltr',flexDirection:'row',flexWrap:'wrap',paddingTop:8}}>{keys.map(key=><Pressable key={key} accessibilityRole='keyboardkey' accessibilityLabel={key==='back'?deleteLabel:key} testID={`swap-key-${key}`} onPress={()=>onKey(key)} style={({pressed})=>({width:'33.333%',height:56,borderRadius:16,backgroundColor:pressed?colors.nested:'transparent',...centre})}>{key==='back'?<DeleteIcon color={colors.text}/>:<Text accessible={false} style={{fontSize:24,lineHeight:30,fontWeight:'600'}}>{key}</Text>}</Pressable>)}</View>;
}
/** A view's heading: the title, with Back before it when the view can be left. Shared by the pushed views and a titled main view. */
export function SwapHeader({title,onBack}: {title:string;onBack?:()=>void}){
 const colors=useColors();const t=useMessages();const {direction}=useHIG();
 return <View testID='swap-header' style={{flexDirection:'row',alignItems:'center',gap:4,minHeight:44,paddingStart:onBack?0:4}}>
  {onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='swap-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}
  <Heading style={{fontWeight:'700',flexShrink:1}}>{title}</Heading>
 </View>;
}
/** A small chevron: down marks a side that can be changed, trailing marks a card that opens something. Mirrors in RTL. */
export function SmallChevron({color,trailing}: {color:string;trailing?:boolean}){const {direction}=useHIG();return <ChevronDown size={16} color={color} style={{transform:trailing?[{rotate:direction==='rtl'?'90deg':'-90deg'}]:undefined}}/>;}
/** A pushed view inside the panel: Back and the view title, then the body. There is no close control; Back pops. */
export function SwapSubview({title,onBack,testID,children}:React.PropsWithChildren<{title:string;onBack:()=>void;testID?:string}>){
 return <View testID={testID} style={{gap:16}}>
  <SwapHeader title={title} onBack={onBack}/>
  {children}
 </View>;
}
// A private-use character stands in for the number while a localized sentence is split around it.
const numberMark='';
/** A localized sentence with one live number, such as the fee line. The sentence keeps its translated word order; the number inside it updates through `AnimatedNumberReadout`. `text` is the number as the sentence reads it, and is the whole accessible reading. Without a `value` (loading or unknown) the sentence is plain text around `text`. */
export function SwapNumberText({template,text,value,options,formattedValue,suffix,align,testID}: {template:(amount:string)=>string;text:string;value?:number|null;options?:Intl.NumberFormatOptions;formattedValue?:string;suffix?:string;align?:'right';testID?:string}){
 const colors=useColors();const {direction}=useHIG();const type={fontSize:14,lineHeight:19} as const,small={...type,color:colors.muted,textAlign:align};
 const reading=template(text),parts=template(numberMark).split(numberMark);
 if(value==null||!Number.isFinite(value)||parts.length!==2)return <Text testID={testID} style={small}>{reading}</Text>;
 return <View accessible accessibilityLabel={reading} testID={testID} style={{direction,flexDirection:'row',alignItems:'center',justifyContent:align==='right'?'flex-end':'flex-start'}}>
  {parts[0]?<Text accessible={false} style={small}>{parts[0]}</Text>:null}
  <AnimatedNumberReadout value={value} options={options} formattedValue={formattedValue} suffix={suffix} tone='muted' style={type}/>
  {parts[1]?<Text accessible={false} style={small}>{parts[1]}</Text>:null}
 </View>;
}
