import React from 'react';
import {Pressable,View} from 'react-native';
import {Text} from './surface.js';
import type {Choice} from './selection-types.js';

export const RadioOption=React.memo(function RadioOption({option,checked,blocked,muted,locale,onSelect}:{
 option:Choice;checked:boolean;blocked:boolean;muted:string;locale:string;onSelect:(value:string)=>void;
}){
 const activate=()=>{if(!blocked)onSelect(option.value);};
 return <Pressable accessible accessibilityRole='radio' aria-checked={checked} aria-disabled={blocked} accessibilityLabel={option.label} accessibilityHint={option.description} accessibilityLanguage={option.lang} accessibilityState={{checked:checked,disabled:blocked}} accessibilityActions={[{name:'activate'}]} disabled={blocked} onPress={activate} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')activate();}} style={{minHeight:48,minWidth:44,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:12,opacity:blocked?0.5:1}}><Text accessible={false}>{checked?'●':'○'}</Text><View style={{flex:1}}><Text accessible={false} accessibilityLanguage={option.lang}>{option.label}</Text>{option.description!==undefined&&<Text accessible={false} accessibilityLanguage={locale} style={{color:muted,fontSize:14,lineHeight:20}}>{option.description}</Text>}</View></Pressable>;
});
