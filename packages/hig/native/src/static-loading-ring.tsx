import React from 'react';
import {View,type ColorValue} from 'react-native';

/** A stationary alternative to the small native activity indicator. */
export function StaticLoadingRing({color,trackColor='transparent',testID}:{color:ColorValue;trackColor?:ColorValue;testID?:string}){
 return <View testID={testID} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
  style={{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:trackColor,borderTopColor:color,borderRightColor:color}}/>;
}
