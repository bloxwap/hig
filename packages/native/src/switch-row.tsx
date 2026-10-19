import React from 'react';
import {Platform,Pressable,View,type PressableProps} from 'react-native';
import {useControllable,useHIG} from './provider.js';
import type {CheckedProps} from './selection-types.js';
/** One named switch around a host's noninteractive label, description and track. */
export interface SwitchRowProps extends CheckedProps,Omit<PressableProps,'children'|'onPress'|'disabled'|'role'|'accessibilityRole'|'accessibilityLabel'|'accessibilityLabelledBy'|'aria-label'|'aria-labelledby'|'aria-checked'|'aria-disabled'> {
 /** Custom anatomy is decorative. `label` names the switch and `accessibilityHint` describes it. */children:React.ReactNode;
}
export function SwitchRow({label,checked,defaultChecked=false,disabled,onCheckedChange,children,style,accessibilityState,...props}:SwitchRowProps){
 const env=useHIG(),[current,set]=useControllable(checked,defaultChecked,onCheckedChange);
 const toggle=()=>{if(!disabled)set(!current);};
 // RN Web handles Enter on a switch; its PressResponder reserves Space for buttons.
 const webKeys=Platform.OS==='web'?{onKeyDown:(event:React.KeyboardEvent<HTMLElement>)=>{
  if(event.key===' '){event.preventDefault();event.stopPropagation();if(!event.repeat)toggle();}
 }}:{};
 return <Pressable {...props} {...webKeys} accessible accessibilityRole='switch' accessibilityLabel={label} accessibilityState={{...accessibilityState,checked:current,disabled:!!disabled}} aria-checked={current} aria-busy={accessibilityState?.busy} disabled={disabled} onPress={toggle} style={state=>[{direction:env.direction,minHeight:48,flexDirection:'row'},typeof style==='function'?style(state):style]}>
  <View pointerEvents='none' accessibilityElementsHidden importantForAccessibility='no-hide-descendants' aria-hidden style={{flex:1}}>{children}</View>
 </Pressable>;
}
