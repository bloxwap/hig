import React from 'react';
import {View,Platform,UIManager,requireNativeComponent,type AccessibilityActionEvent,type ViewProps} from 'react-native';
import SliderBackend from '@react-native-community/slider';
import {nativeSrgb as colors} from '@bloxwap/hig-tokens';
import {useControllable} from './provider.js';
import {Text} from './surface.js';
// RN maps accessibilityActions names to fixed or synthetic Android ids and drops action arguments, so a plain View
// cannot offer ACTION_SET_PROGRESS. The package's autolinked HIGAdjustableView (android/) adds it and reports
// {actionName:'setProgress',value}; without native linking (Expo Go, web, tests) the wrapper stays a plain View.
const AndroidAdjustable=Platform.OS==='android'&&UIManager.hasViewManagerConfig?.('HIGAdjustableView')?requireNativeComponent<ViewProps>('HIGAdjustableView'):null;
export function Slider({label,value,defaultValue=0,min=0,max=100,step=1,disabled,onValueChange}: {label:string;value?:number;defaultValue?:number;min?:number;max?:number;step?:number;disabled?:boolean;onValueChange?:(v:number)=>void}){const [current,set]=useControllable(value,defaultValue,onValueChange);
 // A plain 48dp adjustable View owns label/value/increment/decrement on iOS and Android and hides the backend:
 // @react-native-community/slider 5 drops onAccessibilityAction and its iOS Fabric view ignores accessibilityIncrement
 // (iOS Simulator AX actions 2004/2005 left the value unchanged), and its Android SeekBar node measured 18dp
 // (emulator UiAutomation audit). Steps are 5% of the range, matching Android's native SeekBar increment.
 const accessibilityStep=Math.max(step,Math.round((max-min)/20/step)*step);
 const semantics={accessibilityRole:'adjustable' as const,accessibilityState:{disabled:!!disabled},accessibilityLabel:label,accessibilityValue:{min,max,now:current}};
 const clamp=(next:number)=>Math.min(max,Math.max(min,next));
 const adjust=(event:AccessibilityActionEvent&{nativeEvent:{value?:number}})=>{if(disabled)return;const {actionName,value:requested}=event.nativeEvent;if(actionName==='setProgress'){if(typeof requested==='number'&&Number.isFinite(requested))set(clamp(min+Math.round((requested-min)/step)*step));return;}const direction=actionName==='increment'?1:actionName==='decrement'?-1:0;if(direction)set(clamp(current+direction*accessibilityStep));};
 const webProps=Platform.OS==='web'?{'aria-valuemin':min,'aria-valuemax':max,'aria-valuenow':current,'aria-disabled':!!disabled,tabIndex:disabled?(-1 as const):(0 as const),onKeyDown:(e:React.KeyboardEvent)=>{if(disabled)return;const next=e.key==='Home'?min:e.key==='End'?max:e.key==='ArrowRight'||e.key==='ArrowUp'?current+step:e.key==='ArrowLeft'||e.key==='ArrowDown'?current-step:e.key==='PageUp'?current+step*10:e.key==='PageDown'?current-step*10:undefined;if(next!==undefined){e.preventDefault();set(Math.min(max,Math.max(min,next)));}}}:{};const wrap=Platform.OS!=='web';const Adjustable=AndroidAdjustable??View;const backend=<SliderBackend {...webProps} {...(wrap?{accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const}:semantics)} minimumValue={min} maximumValue={max} step={step} value={current} disabled={disabled} onValueChange={next=>{if(!disabled)set(next);}} minimumTrackTintColor={colors.action} style={{minHeight:48}}/>;return <View><Text>{label}: {current}</Text>{wrap?<Adjustable accessible {...semantics} accessibilityActions={[{name:'increment'},{name:'decrement'}]} onAccessibilityAction={adjust} style={{minHeight:48,justifyContent:'center'}}>{backend}</Adjustable>:backend}</View>;}

