import React,{useEffect,useRef} from 'react';
import {Animated} from 'react-native';
import {NumberReadout,type NumberProps} from './data.js';
import {useHIG} from './provider.js';
/** Optional native-driver opacity motion; the accessible numeric reading is always final. */
export function AnimatedNumberReadout({duration=180,...props}:NumberProps & {duration?:number}){
 const {reducedMotion}=useHIG();const opacity=useRef(new Animated.Value(1)).current;const previous=useRef({value:props.value,changedAt:-Infinity});
 useEffect(()=>{opacity.stopAnimation();opacity.setValue(1);if(Object.is(previous.current.value,props.value))return;const old=previous.current.value,now=Date.now(),elapsed=now-previous.current.changedAt;previous.current={value:props.value,changedAt:now};
  if(reducedMotion||elapsed<250||!Number.isFinite(old)||!Number.isFinite(props.value)||!Number.isFinite(duration)||duration<=0)return;
  opacity.setValue(.6);const animation=Animated.timing(opacity,{toValue:1,duration:Math.min(duration,600),useNativeDriver:true});animation.start();return()=>{animation.stop();opacity.setValue(1);};
 },[props.value,reducedMotion,duration,opacity]);
 return <Animated.View style={{opacity}}><NumberReadout {...props}/></Animated.View>;
}
