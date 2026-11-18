import React from 'react';
import {StyleSheet,View} from 'react-native';
import Svg,{Defs,LinearGradient,Rect,Stop} from 'react-native-svg';

export const GestureSheetHeaderContext=React.createContext<'default'|'custom'|false>(false);
export function useBlockHorizontalInset(){
 return React.useContext(GestureSheetHeaderContext)?0:8;
}
export const sheetHandlePadding={paddingTop:28,paddingBottom:0};
export function sheetGripStyle(accent:string){
 return {width:100,height:6,borderRadius:3,backgroundColor:accent,
  boxShadow:[{offsetX:0,offsetY:0,blurRadius:12,color:accent}]};
}

/** The fade behind a pinned sheet header: the surface colour, clearing at the lower edge so content scrolls out under it. */
export function SheetHeaderScrim({backdrop}:{backdrop:string}){
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
  <Svg width="100%" height="100%" viewBox="0 0 390 96" preserveAspectRatio="none">
   <Defs>
    <LinearGradient id="sheetScrim" x1="0%" y1="0%" x2="0%" y2="100%">
     <Stop offset={0} stopColor={backdrop} stopOpacity={0.96}/>
     <Stop offset={0.84} stopColor={backdrop} stopOpacity={0.92}/>
     <Stop offset={1} stopColor={backdrop} stopOpacity={0}/>
    </LinearGradient>
   </Defs>
   <Rect width={390} height={96} fill="url(#sheetScrim)"/>
  </Svg>
 </View>;
}
