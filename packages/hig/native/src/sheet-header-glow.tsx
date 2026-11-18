import React from 'react';
import {StyleSheet,View} from 'react-native';
import Svg,{Defs,LinearGradient,RadialGradient,Rect,Stop} from 'react-native-svg';
import {useColors} from './provider.js';

export const GestureSheetHeaderContext=React.createContext<'default'|'custom'|false>(false);
export function useBlockHorizontalInset(){
 return React.useContext(GestureSheetHeaderContext)==='default'?0:8;
}
export const sheetHandlePadding={paddingTop:28,paddingBottom:0};
export function sheetGripStyle(accent:string){
 return {width:100,height:6,borderRadius:3,backgroundColor:accent,
  boxShadow:[{offsetX:0,offsetY:0,blurRadius:12,color:accent}]};
}

/** A stationary highlight behind the sheet controls, fading into the surface on every edge. */
export function SheetHeaderGlow({height,backdrop}:{height?:number;backdrop?:string}){
 const colors=useColors();
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
  style={[StyleSheet.absoluteFill,height===undefined?undefined:{height,bottom:undefined}]}>
  <Svg width="100%" height="100%" viewBox="0 0 390 96" preserveAspectRatio="none">
   <Defs>
    {backdrop?<LinearGradient id="sheetScrim" x1="0%" y1="0%" x2="0%" y2="100%">
     <Stop offset={0} stopColor={backdrop} stopOpacity={0.96}/>
     <Stop offset={0.84} stopColor={backdrop} stopOpacity={0.92}/>
     <Stop offset={1} stopColor={backdrop} stopOpacity={0}/>
    </LinearGradient>:null}
    <RadialGradient id="sheetHighlight" gradientUnits="userSpaceOnUse" cx={80} cy={68} rx={100} ry={32}>
     <Stop offset={0} stopColor={colors.text} stopOpacity={0.09}/><Stop offset={1} stopColor={colors.text} stopOpacity={0}/>
    </RadialGradient>
   </Defs>
   {backdrop?<Rect width={390} height={96} fill="url(#sheetScrim)"/>:null}
   <Rect width={390} height={96} fill="url(#sheetHighlight)"/>
  </Svg>
 </View>;
}
