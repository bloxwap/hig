import React from 'react';
import {View,Platform,type AccessibilityActionEvent} from 'react-native';
import SliderBackend from '@react-native-community/slider';
import {nativeSrgb as colors} from '@bloxwap/hig-tokens';
import {useControllable} from './provider.js';
import {Text} from './surface.js';
export function Slider({label,value,defaultValue=0,min=0,max=100,step=1,disabled,onValueChange}: {label:string;value?:number;defaultValue?:number;min?:number;max?:number;step?:number;disabled?:boolean;onValueChange?:(v:number)=>void}){const [current,set]=useControllable(value,defaultValue,onValueChange);
 // A plain 48dp adjustable View owns label/value/increment/decrement on iOS and Android and hides the backend:
 // @react-native-community/slider 5 drops onAccessibilityAction and its iOS Fabric view ignores accessibilityIncrement
 // (iOS Simulator AX actions 2004/2005 left the value unchanged), and its Android SeekBar node measured 18dp
 // (emulator UiAutomation audit). Steps are 5% of the range, matching Android's native SeekBar increment.
 const accessibilityStep=Math.max(step,Math.round((max-min)/20/step)*step);
 const semantics={accessibilityRole:'adjustable' as const,accessibilityState:{disabled:!!disabled},accessibilityLabel:label,accessibilityValue:{min,max,now:current}};
 const adjust=(event:AccessibilityActionEvent)=>{if(disabled)return;const direction=event.nativeEvent.actionName==='increment'?1:event.nativeEvent.actionName==='decrement'?-1:0;if(direction)set(Math.min(max,Math.max(min,current+direction*accessibilityStep)));};
 const webProps=Platform.OS==='web'?{'aria-valuemin':min,'aria-valuemax':max,'aria-valuenow':current,'aria-disabled':!!disabled,tabIndex:disabled?(-1 as const):(0 as const),onKeyDown:(e:React.KeyboardEvent)=>{if(disabled)return;const next=e.key==='Home'?min:e.key==='End'?max:e.key==='ArrowRight'||e.key==='ArrowUp'?current+step:e.key==='ArrowLeft'||e.key==='ArrowDown'?current-step:e.key==='PageUp'?current+step*10:e.key==='PageDown'?current-step*10:undefined;if(next!==undefined){e.preventDefault();set(Math.min(max,Math.max(min,next)));}}}:{};const wrap=Platform.OS!=='web';const backend=<SliderBackend {...webProps} {...(wrap?{accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const}:semantics)} minimumValue={min} maximumValue={max} step={step} value={current} disabled={disabled} onValueChange={next=>{if(!disabled)set(next);}} minimumTrackTintColor={colors.action} style={{minHeight:48}}/>;return <View><Text>{label}: {current}</Text>{wrap?<View accessible {...semantics} accessibilityActions={[{name:'increment'},{name:'decrement'}]} onAccessibilityAction={adjust} style={{minHeight:48,justifyContent:'center'}}>{backend}</View>:backend}</View>;}

