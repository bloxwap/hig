import React from 'react';
import {platformColors,type LiveStreamChatMessage} from '@bloxwap/hig/contracts/live-stream';
import {Text} from './surface.js';
import {useColors} from './provider.js';
import {Badge} from './status.js';
/** The source of a chat line, filled with its platform's brand colour when the host names the platform. */
export function PlatformBadge({message}:{message:LiveStreamChatMessage}){
 const theme=useColors();
 if(!message.platform||!(message.platform in platformColors))return <Badge>{message.source}</Badge>;
 const colors=platformColors[message.platform]??{fill:theme.text,ink:theme.background};
 return <Text numberOfLines={1} style={{alignSelf:'flex-start',flexShrink:0,overflow:'hidden',borderRadius:9999,paddingVertical:2,paddingHorizontal:8,fontSize:11,lineHeight:16,fontWeight:'600',backgroundColor:colors.fill,color:colors.ink}}>{message.source}</Text>;
}
