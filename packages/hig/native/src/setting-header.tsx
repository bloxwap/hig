import React from 'react';
import {View} from 'react-native';
import {useColors,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {IconButton} from './button.js';
import {ChevronIcon} from './icons.js';
/** The header of a block that is its own screen: Back on the leading edge, the title centred, an optional control on the trailing edge. */
export function SettingHeader({title,onBack,action,testID}:{title:string;onBack?:()=>void;action?:React.ReactNode;testID:string}){
 const colors=useColors(),t=useMessages(),{direction}=useHIG();
 return <View testID={`${testID}-header`} style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
  <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID={`${testID}-back`} onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
  <Text testID={`${testID}-title`} accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{title}</Text>
  <View style={{minWidth:44,alignItems:'flex-end'}}>{action}</View>
 </View>;
}
