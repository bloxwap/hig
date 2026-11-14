import React from 'react';
import {Image,Pressable,View,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Heading,Text} from './surface.js';
import {IconButton} from './button.js';
import {ChevronIcon} from './icons.js';
import type {SwapToken} from './swap-shared.js';
// Outline symbols drawn from plain views, like ./icons: decorative, so the control that holds them carries the name.
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const,pointerEvents:'none' as const};
const stroke=1.75;
const centre:ViewStyle={alignItems:'center',justifyContent:'center'};
const crossAngles=['45deg','-45deg'];
function Arrow({color,down,height}: {color:string;down?:boolean;height:number}){return <View style={{width:7,height,alignItems:'center',transform:down?[{rotate:'180deg'}]:undefined}}><View style={{position:'absolute',top:1,width:5,height:5,borderLeftWidth:stroke,borderTopWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}]}}/><View style={{width:stroke,height,borderRadius:stroke,backgroundColor:color}}/></View>;}
/** One arrow, top to bottom: a one-way panel. */
export function DownIcon({color,size=16}: {color:string;size?:number}){return <View {...hidden} style={{width:size,height:size,...centre}}><Arrow color={color} down height={size-3}/></View>;}
/** Two opposed arrows: exchange the pair, or switch the denomination. */
export function FlipIcon({color,size=16}: {color:string;size?:number}){return <View {...hidden} style={{width:size,height:size,flexDirection:'row',gap:1,...centre}}><Arrow color={color} down height={size-3}/><Arrow color={color} height={size-3}/></View>;}
export function MenuIcon({color}: {color:string}){return <View {...hidden} style={{width:20,height:20,gap:3.5,...centre}}>{[0,1,2].map(index=><View key={index} style={{width:14,height:stroke,borderRadius:stroke,backgroundColor:color}}/>)}</View>;}
/** An open ring with an arrowhead at its gap. */
export function ResetIcon({color}: {color:string}){return <View {...hidden} style={{width:20,height:20,...centre}}><View style={{width:14,height:14,borderRadius:7,borderWidth:stroke,borderColor:color,borderTopColor:'transparent',transform:[{rotate:'-45deg'}]}}/><View style={{position:'absolute',left:2,top:3,width:5,height:5,borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color}}/></View>;}
/** Keypad delete: a key outline holding an x. */
export function DeleteIcon({color}: {color:string}){return <View {...hidden} style={{width:26,height:18,borderRadius:5,borderWidth:stroke,borderColor:color,...centre}}>{crossAngles.map(angle=><View key={angle} style={{position:'absolute',width:9,height:stroke,borderRadius:stroke,backgroundColor:color,transform:[{rotate:angle}]}}/>)}</View>;}
/** Four viewfinder corners. */
export function ScanIcon({color}: {color:string}){const corner=(style:ViewStyle)=><View style={[{position:'absolute',width:6,height:6,borderColor:color},style]}/>;return <View {...hidden} style={{width:18,height:18}}>{corner({left:0,top:0,borderLeftWidth:stroke,borderTopWidth:stroke,borderTopLeftRadius:3})}{corner({right:0,top:0,borderRightWidth:stroke,borderTopWidth:stroke,borderTopRightRadius:3})}{corner({left:0,bottom:0,borderLeftWidth:stroke,borderBottomWidth:stroke,borderBottomLeftRadius:3})}{corner({right:0,bottom:0,borderRightWidth:stroke,borderBottomWidth:stroke,borderBottomRightRadius:3})}<View style={{position:'absolute',left:0,right:0,top:8,height:stroke,borderRadius:stroke,backgroundColor:color}}/></View>;}
/** A doorway with an arrow leaving it. */
export function LeaveIcon({color}: {color:string}){return <View {...hidden} style={{width:20,height:20,flexDirection:'row',alignItems:'center'}}><View style={{width:8,height:14,borderWidth:stroke,borderRightWidth:0,borderColor:color,borderTopLeftRadius:3,borderBottomLeftRadius:3}}/><View style={{width:9,height:stroke,borderRadius:stroke,backgroundColor:color,marginStart:-2}}/><View style={{width:5,height:5,borderRightWidth:stroke,borderTopWidth:stroke,borderColor:color,marginStart:-5,transform:[{rotate:'45deg'}]}}/></View>;}
/** Circular artwork from a URL, or the symbol's first letters when the host has none. */
export function TokenArt({uri,symbol,size,ring}: {uri?:string;symbol?:string;size:number;ring?:string}){
 const colors=useColors();const shape:ViewStyle={width:size,height:size,borderRadius:size/2,backgroundColor:colors.nested,...(ring?{borderWidth:2,borderColor:ring}:{})};
 return uri?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri}} style={shape as object}/>:<View style={[shape,centre]}>{symbol?<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:size>=40?12:9,lineHeight:size>=40?16:12,fontWeight:'600',color:colors.muted}}>{symbol.slice(0,3)}</Text>:null}</View>;
}
/** Token artwork with its chain badge. */
export function TokenIcon({token,size=44}: {token:SwapToken;size?:number}){const colors=useColors();return <View {...hidden} style={{width:size,height:size}}><TokenArt uri={token.icon} symbol={token.symbol} size={size}/>{token.chainIcon?<View style={{position:'absolute',end:0,bottom:0}}><TokenArt uri={token.chainIcon} size={18} ring={colors.overlay}/></View>:null}</View>;}
/** Small capsule action that sits on a card: Max, Test, the slippage setting and the denomination switch. 32dp tall with a 44dp target. */
export function SwapCapsule({children,onPress,label,testID}: {children:React.ReactNode;onPress:()=>void;label?:string;testID?:string}){
 const fills=useFills();const {direction}=useHIG();
 return <Pressable accessibilityRole='button' accessibilityLabel={label} testID={testID} onPress={onPress} hitSlop={{top:6,bottom:6}} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',gap:6,minHeight:32,paddingVertical:4,paddingHorizontal:12,borderRadius:9999,backgroundColor:pressed?fills.raised:fills.well})}>{children}</Pressable>;
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
export function SmallChevron({color,trailing}: {color:string;trailing?:boolean}){const {direction}=useHIG();return <View {...hidden} style={{width:16,height:16,...centre,transform:trailing?[{rotate:direction==='rtl'?'90deg':'-90deg'}]:undefined}}><View style={{width:7,height:7,borderRightWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{translateY:-1.5},{rotate:'45deg'}]}}/></View>;}
/** A pushed view inside the panel: Back and the view title, then the body. There is no close control; Back pops. */
export function SwapSubview({title,onBack,testID,children}:React.PropsWithChildren<{title:string;onBack:()=>void;testID?:string}>){
 return <View testID={testID} style={{gap:16}}>
  <SwapHeader title={title} onBack={onBack}/>
  {children}
 </View>;
}
