import React from 'react';
import {platformColors,type LiveStreamChatMessage} from '@bloxwap/hig/contracts/live-stream';
import {Badge} from '../status.js';
/** The source of a chat line, filled with its platform's brand colour when the host names the platform. */
export function PlatformBadge({message}:{message:LiveStreamChatMessage}){
 if(!message.platform||!(message.platform in platformColors))return <Badge>{message.source}</Badge>;
 const colors=platformColors[message.platform];
 return <span className='hig-badge hig-live-platform' data-platform={message.platform} style={colors?{background:colors.fill,color:colors.ink}:undefined}>{message.source}</span>;
}
