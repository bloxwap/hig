import React from 'react';
import {Pressable,View,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG} from './provider.js';
import {Text} from './surface.js';
import {ChevronIcon} from './icons.js';
export interface ListGroupProps {
 /** Heading above the group, such as “Settings”. Omit it for an untitled group. */
 title?:string;
 /** `ListRow` elements. */
 children?:React.ReactNode;
 testID?:string;
}
/** A grouped list for menus and settings: an optional heading over rows that share one rounded container. */
export function ListGroup({title,children,testID}:ListGroupProps){
 const colors=useColors(),{direction}=useHIG();
 return <View testID={testID} style={{direction,gap:8,minWidth:0}}>
  {title?<Text accessibilityRole='header' testID={testID?`${testID}-title`:undefined} style={{paddingHorizontal:4,color:colors.muted,fontSize:14,lineHeight:20,fontWeight:'500'}}>{title}</Text>:null}
  <View testID={testID?`${testID}-rows`:undefined} style={{gap:2,borderRadius:20,overflow:'hidden'}}>{children}</View>
 </View>;
}
export interface ListRowProps {
 label:string;
 /** Artwork before the label, such as an icon. Decorative: the label names the row. */
 leading?:React.ReactNode;
 /** Short text on the trailing edge, such as `Off`, `English` or a balance. A string is drawn muted and read with the label. */
 value?:React.ReactNode;
 /** How a `value` that is not text is read with the label on a pressable row, such as a live figure's formatted amount. */
 valueLabel?:string;
 /** Anything richer on the trailing edge: icons, a Badge, or a control such as a Switch. */
 trailing?:React.ReactNode;
 /** Makes the whole row a button, usually one that opens another view, and shows the disclosure chevron. */
 onSelect?:()=>void;
 /** Dims the row and blocks `onSelect`. */
 disabled?:boolean;
 testID?:string;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** One row of a ListGroup: the label leads; a value, icons, a badge or a control trail. With `onSelect` the whole row is one button and shows a disclosure chevron; without it the row is static, so a control in `trailing` is its only target. */
export function ListRow({label,leading,value,valueLabel,trailing,onSelect,disabled,testID}:ListRowProps){
 const colors=useColors(),fills=useFills(),{direction}=useHIG();
 const row=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'flex-start',gap:12,minHeight:56,paddingVertical:8,paddingHorizontal:20,backgroundColor:pressed?fills.raised:fills.well,opacity:disabled?0.5:1});
 const text=typeof value==='string'||typeof value==='number';
 const reading=[label,text?String(value):valueLabel??null].filter(Boolean).join(', ');
 // Everything aligns to the first line of the label, so a trailing switch stays at the top when the label wraps.
 const first:ViewStyle={minHeight:40,justifyContent:'center'};
 const lead=leading==null?null:<View {...hidden} style={first}>{leading}</View>;
 const name=<Text {...(onSelect?hidden:{})} style={{flex:1,flexShrink:1,minWidth:0,paddingVertical:8,fontSize:16,lineHeight:24,color:colors.text}}>{label}</Text>;
 const amount=value==null||value===false?null:text?<Text {...(onSelect?hidden:{})} numberOfLines={1} style={{flexShrink:1,maxWidth:'50%',paddingVertical:8,fontSize:16,lineHeight:24,color:colors.muted,textAlign:'right'}}>{value}</Text>:<View style={first}>{value}</View>;
 const extra=trailing==null?null:<View pointerEvents={onSelect?'none':'auto'} {...(onSelect?hidden:{})} style={{flexDirection:'row',alignItems:'center',gap:8,minHeight:40}}>{trailing}</View>;
 if(!onSelect)return <View testID={testID} style={row(false)}>{lead}{name}{amount}{extra}</View>;
 return <Pressable testID={testID} accessibilityRole='button' accessibilityLabel={reading} accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onSelect} style={({pressed})=>row(pressed)}>
  {lead}{name}{amount}{extra}
  <View {...hidden} style={first}><View testID={testID?`${testID}-chevron`:undefined} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View></View>
 </Pressable>;
}
