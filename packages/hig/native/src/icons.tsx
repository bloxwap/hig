import React from 'react';
import {View,type ViewStyle} from 'react-native';
/** Outline icons drawn from plain views, so status, field and navigation entries need no SVG peer. All are decorative: the control or text beside them carries the meaning. */
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const,pointerEvents:'none' as const};
const stroke=1.75;
const centre:ViewStyle={alignItems:'center',justifyContent:'center'};
function Bar({length,color,angle}: {length:number;color:string;angle:string}){return <View style={{position:'absolute',width:length,height:stroke,borderRadius:stroke,backgroundColor:color,transform:[{rotate:angle}]}}/>;}
export function SearchIcon({color}: {color:string}){return <View {...hidden} style={{width:18,height:18}}><View style={{width:13,height:13,borderRadius:7,borderWidth:stroke,borderColor:color}}/><View style={{position:'absolute',right:1,bottom:3,width:6,height:stroke,borderRadius:stroke,backgroundColor:color,transform:[{rotate:'45deg'}]}}/></View>;}
/** Points down; the caller rotates it. */
export function ChevronIcon({color}: {color:string}){return <View {...hidden} style={{width:20,height:20,...centre}}><View style={{width:9,height:9,borderRightWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{translateY:-2},{rotate:'45deg'}]}}/></View>;}
export function CloseIcon({color}: {color:string}){return <View {...hidden} style={{width:20,height:20,...centre}}><Bar length={14} color={color} angle='45deg'/><Bar length={14} color={color} angle='-45deg'/></View>;}
export type SeverityIconKind='info'|'success'|'warning'|'error';
/** Shape as well as colour tells the severities apart: warning is a diamond, the others a circle with their own mark. */
export function SeverityIcon({kind,color}: {kind:SeverityIconKind;color:string}){
 const mark=kind==='success'?<View style={{width:9,height:5,borderLeftWidth:stroke,borderBottomWidth:stroke,borderColor:color,transform:[{translateY:-1},{rotate:'-45deg'}]}}/>
  :kind==='error'?<><Bar length={9} color={color} angle='45deg'/><Bar length={9} color={color} angle='-45deg'/></>
  :<View style={{alignItems:'center',gap:1.5,flexDirection:kind==='warning'?'column-reverse':'column'}}><View style={{width:2,height:2,borderRadius:1,backgroundColor:color}}/><View style={{width:2,height:6,borderRadius:1,backgroundColor:color}}/></View>;
 return <View {...hidden} style={{width:20,height:20,...centre}}>{kind==='warning'?<View style={{position:'absolute',width:15,height:15,borderRadius:4,borderWidth:stroke,borderColor:color,transform:[{rotate:'45deg'}]}}/>:<View style={{position:'absolute',width:20,height:20,borderRadius:10,borderWidth:stroke,borderColor:color}}/>}{mark}</View>;
}
/** Neutral mark for an empty state: an empty tray. */
export function EmptyIcon({color}: {color:string}){return <View {...hidden} style={{width:48,height:48,...centre}}><View style={{width:40,height:30,borderRadius:10,borderWidth:2,borderColor:color,justifyContent:'flex-end',alignItems:'center',paddingBottom:7}}><View style={{width:16,height:2,borderRadius:1,backgroundColor:color}}/></View></View>;}
