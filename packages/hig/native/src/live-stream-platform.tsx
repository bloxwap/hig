import React from 'react';
import {chatAvatarSize,platformColors,platformIcons,platformMarks,platformSymbolSize,type LiveStreamChatMessage} from '@bloxwap/hig/contracts/live-stream';
import {View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {Text} from './surface.js';
import {useColors} from './provider.js';
import {AvatarFrame} from './avatar-frame.js';
import {Badge} from './status.js';
const known=(message:LiveStreamChatMessage)=>!!message.platform&&message.platform in platformColors;
/** The sender's photo with the platform's symbol on its bottom trailing corner when the host names the platform. */
export function ChatAvatar({message}:{message:LiveStreamChatMessage}){
 const theme=useColors();
 const colors=known(message)?platformColors[message.platform!]??{fill:theme.text,ink:theme.background}:undefined;
 return <View style={{width:chatAvatarSize,height:chatAvatarSize}}>
  <AvatarFrame name={message.username} source={message.avatarUrl?{uri:message.avatarUrl}:undefined} size={chatAvatarSize} decorative/>
  {colors?<View accessible accessibilityRole='image' accessibilityLabel={message.source} style={{position:'absolute',end:-2,bottom:-2,width:platformSymbolSize,height:platformSymbolSize,borderRadius:platformSymbolSize/2,borderWidth:2,borderColor:theme.background,backgroundColor:colors.fill,alignItems:'center',justifyContent:'center'}}>
   {platformIcons[message.platform!]?<Svg width={10} height={10} viewBox='0 0 24 24'><Path d={platformIcons[message.platform!]} fill={colors.ink}/></Svg>:<Text accessible={false} maxFontSizeMultiplier={1} numberOfLines={1} style={{fontSize:9,lineHeight:12,fontWeight:'700',color:colors.ink}}>{platformMarks[message.platform!]}</Text>}
  </View>:null}
 </View>;
}
/** The source of a chat line as a neutral badge, for a line whose platform has no symbol. */
export function SourceBadge({message}:{message:LiveStreamChatMessage}){
 return known(message)?null:<Badge>{message.source}</Badge>;
}
