import React from 'react';
import {feedLineOpacity,feedLines,type LiveStreamFeedBlockProps} from '@bloxwap/hig/contracts/live-stream';
export type {LiveStreamFeedBlockProps,LiveStreamChatMessage} from '@bloxwap/hig/contracts/live-stream';
import {View} from 'react-native';
import {withAlpha} from '@bloxwap/hig/tokens';
import {Text} from './surface.js';
import {useColors} from './provider.js';
import {AvatarFrame} from './avatar-frame.js';
import {Badge} from './status.js';
/** Chat lines drawn over other content, such as a chart. It fills the bottom of its parent and takes no touches, so the content under it stays usable. */
export function LiveStreamFeedBlock({label,messages,maxVisible}:LiveStreamFeedBlockProps){
 const colors=useColors();
 const lines=feedLines(messages,maxVisible);
 return <View pointerEvents='none' accessibilityLabel={label} accessibilityLiveRegion='polite' style={{position:'absolute',left:0,right:0,bottom:0,padding:8,gap:4,alignItems:'flex-start'}}>
  {lines.map((message,index)=><View key={message.id} style={{flexDirection:'row',alignItems:'flex-start',gap:12,maxWidth:'100%',paddingVertical:6,paddingLeft:6,paddingRight:12,borderRadius:24,backgroundColor:withAlpha(colors.background,.72),opacity:feedLineOpacity(lines.length-1-index)}}>
   <AvatarFrame name={message.username} source={message.avatarUrl?{uri:message.avatarUrl}:undefined} size={32} decorative/>
   <View style={{flexShrink:1,minWidth:0,gap:2}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
     <Text numberOfLines={1} style={{flexShrink:1,fontWeight:'600'}}>{message.username}</Text>
     <Badge>{message.source}</Badge>
    </View>
    <Text numberOfLines={1}>{message.text}</Text>
   </View>
  </View>)}
 </View>;
}
