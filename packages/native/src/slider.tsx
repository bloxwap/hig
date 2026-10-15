import React from 'react';
import {View,Platform,type AccessibilityActionEvent} from 'react-native';
import SliderBackend from '@react-native-community/slider';
import {nativeSrgb as colors} from '@bloxwap/hig-tokens';
import {useControllable} from './provider.js';
import {Text} from './surface.js';
export function Slider({label,value,defaultValue=0,min=0,max=100,step=1,disabled,onValueChange}: {label:string;value?:number;defaultValue?:number;min?:number;max?:number;step?:number;disabled?:boolean;onValueChange?:(v:number)=>void}){const [current,set]=useControllable(value,defaultValue,onValueChange);
 // @react-native-community/slider 5 renames onAccessibilityAction and its iOS Fabric view never handles
 // accessibilityIncrement/Decrement, so VoiceOver swipes were ignored (iOS Simulator AX actions 2004/2005).
 // On iOS a plain adjustable View owns the semantics and hides the backend; Android keeps the SeekBar's native actions.
 const accessibilityStep=Math.max(step,Math.round((max-min)/20/step)*step);
 const semantics={accessibilityRole:'adjustable' as const,accessibilityState:{disabled:!!disabled},accessibilityLabel:label,accessibilityValue:{min,max,now:current}};
 const adjust=(event:AccessibilityActionEvent)=>{if(disabled)return;const direction=event.nativeEvent.actionName==='increment'?1:event.nativeEvent.actionName==='decrement'?-1:0;if(direction)set(Math.min(max,Math.max(min,current+direction*accessibilityStep)));};
 const webProps=Platform.OS==='web'?{'aria-valuemin':min,'aria-valuemax':max,'aria-valuenow':current,'aria-disabled':!!disabled,tabIndex:disabled?(-1 as const):(0 as const),onKeyDown:(e:React.KeyboardEvent)=>{if(disabled)return;const next=e.key==='Home'?min:e.key==='End'?max:e.key==='ArrowRight'||e.key==='ArrowUp'?current+step:e.key==='ArrowLeft'||e.key==='ArrowDown'?current-step:e.key==='PageUp'?current+step*10:e.key==='PageDown'?current-step*10:undefined;if(next!==undefined){e.preventDefault();set(Math.min(max,Math.max(min,next)));}}}:{};const ios=Platform.OS==='ios';const backend=<SliderBackend {...webProps} {...(ios?{accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const}:semantics)} minimumValue={min} maximumValue={max} step={step} value={current} disabled={disabled} onValueChange={next=>{if(!disabled)set(next);}} minimumTrackTintColor={colors.action} style={{minHeight:48}}/>;return <View><Text>{label}: {current}</Text>{ios?<View accessible {...semantics} accessibilityActions={[{name:'increment'},{name:'decrement'}]} onAccessibilityAction={adjust}>{backend}</View>:backend}</View>;}

