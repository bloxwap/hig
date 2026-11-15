import React from 'react';
import {View} from 'react-native';
import {useColors,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {IconButton} from './button.js';
import {ChevronIcon} from './icons.js';
export {ChevronIcon} from './icons.js';
export interface ScreenHeaderProps {
 /** The heading, centred. Host text. */
 title:string;
 /** Shows Back on the leading edge. */
 onBack?:()=>void;
 /** A control on the trailing edge, usually an `IconButton`. */
 action?:React.ReactNode;
 /** Prefix of the test IDs: `<testID>-header`, `<testID>-back` and `<testID>-title`. Omitted, the header sets none. */
 testID?:string;
}
/** The header of a block that is its own screen: Back on the leading edge, the title centred, an optional control on the trailing edge. Every block draws it; import it from `@bloxwap/hig/native/screen-header` for a host pane that has no block. */
export function ScreenHeader({title,onBack,action,testID}:ScreenHeaderProps){
 const colors=useColors(),t=useMessages(),{direction}=useHIG();
 const id=(part:string)=>testID===undefined?undefined:`${testID}-${part}`;
 return <View testID={id('header')} style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
  <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID={id('back')} onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
  <Text testID={id('title')} accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{title}</Text>
  <View style={{minWidth:44,alignItems:'flex-end'}}>{action}</View>
 </View>;
}
