import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {feedEnterDuration,feedFadeDuration,feedFrame,type LiveStreamChatMessage,type LiveStreamFeedBlockProps} from '@bloxwap/hig/contracts/live-stream';
export type {LiveStreamFeedBlockProps,LiveStreamChatMessage,LiveStreamPlatform} from '@bloxwap/hig/contracts/live-stream';
export {platformColors,platformIcons,platformMarks} from '@bloxwap/hig/contracts/live-stream';
import {Animated,Easing,Platform,View} from 'react-native';
import {withAlpha} from '@bloxwap/hig/tokens';
import {Text} from './surface.js';
import {useColors,useReducedMotion} from './provider.js';
import {ChatAvatar,SourceBadge} from './live-stream-platform.js';
const lineGap=4,easing=Easing.bezier(.22,1,.36,1),useNativeDriver=Platform.OS!=='web';
/** One feed line. It fades in from nothing, and to each new opacity as newer lines push it up or its time runs out. */
function FeedRow({message,opacity,reduced,onHeight}:{message:LiveStreamChatMessage;opacity:number;reduced:boolean;onHeight:(height:number)=>void}){
 const colors=useColors();
 const shown=useRef(new Animated.Value(reduced?opacity:0)).current;
 useEffect(()=>{
  if(reduced){shown.setValue(opacity);return;}
  const animation=Animated.timing(shown,{toValue:opacity,duration:opacity===0?feedFadeDuration:feedEnterDuration,easing,useNativeDriver,isInteraction:false});
  animation.start();
  return ()=>animation.stop();
 },[opacity,reduced,shown]);
 const hidden=opacity===0;
 return <Animated.View onLayout={event=>onHeight(event.nativeEvent.layout.height)} accessibilityElementsHidden={hidden} importantForAccessibility={hidden?'no-hide-descendants':'auto'}
  style={{opacity:shown,flexDirection:'row',alignItems:'flex-start',gap:12,maxWidth:'100%',paddingVertical:6,paddingLeft:6,paddingRight:12,borderRadius:26,backgroundColor:withAlpha(colors.background,.72)}}>
  <ChatAvatar message={message}/>
  <View style={{flexShrink:1,minWidth:0,gap:2}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
    <Text numberOfLines={1} style={{flexShrink:1,fontWeight:'600'}}>{message.username}</Text>
    <SourceBadge message={message}/>
   </View>
   <Text numberOfLines={1}>{message.text}</Text>
  </View>
 </Animated.View>;
}
/**
 * Chat lines drawn over other content, such as a chart. A new line rises from under the bottom edge and pushes the others up;
 * lines fade from the newest at full strength to nothing at the top, and each fades out once it has been up for `lineDuration`.
 * It fills the bottom of its parent and takes no touches, so the content under it stays usable.
 */
export function LiveStreamFeedBlock({label,messages,maxVisible,lineDuration}:LiveStreamFeedBlockProps){
 const reduced=useReducedMotion();
 const seen=useRef(new Map<string,number>()),shown=useRef<Set<string>|null>(null);
 // Every line is one row of text, so the last measured height stands for the line about to enter.
 const rowHeight=useRef(52),rise=useRef(new Animated.Value(0)).current;
 const [,tick]=useState(0);
 const {lines,next}=feedFrame(messages,seen.current,Date.now(),maxVisible,lineDuration);
 // Wake when the next line is due to fade or to go.
 useEffect(()=>{
  if(next===undefined)return;
  const timer=setTimeout(()=>tick(count=>count+1),Math.max(0,next-Date.now()));
  return ()=>clearTimeout(timer);
 });
 const ids=lines.map(line=>line.message.id).join('\n');
 // New lines land at the bottom: start the list lower by their height, so they rise from under the edge and push the rest up.
 useLayoutEffect(()=>{
  const before=shown.current,now=ids?ids.split('\n'):[];
  shown.current=new Set(now);
  if(!before||reduced)return;
  const entering=now.filter(id=>!before.has(id)).length;
  if(!entering)return;
  rise.setValue(entering*(rowHeight.current+lineGap));
  const animation=Animated.timing(rise,{toValue:0,duration:feedEnterDuration,easing,useNativeDriver,isInteraction:false});
  animation.start();
  return ()=>animation.stop();
 },[ids,reduced,rise]);
 const measure=(height:number)=>{if(height>0)rowHeight.current=height;};
 return <View pointerEvents='none' accessibilityLabel={label} accessibilityLiveRegion='polite' style={{position:'absolute',left:0,right:0,bottom:0,padding:8,overflow:'hidden'}}>
  <Animated.View style={{gap:lineGap,alignItems:'flex-start',transform:[{translateY:rise}]}}>
   {lines.map(({message,opacity})=><FeedRow key={message.id} message={message} opacity={opacity} reduced={reduced} onHeight={measure}/>)}
  </Animated.View>
 </View>;
}
