import React,{useRef} from 'react';
import {chatFollowSlack,type LiveStreamChatBlockProps,type LiveStreamChatMessage} from '@bloxwap/hig/contracts/live-stream';
export type {LiveStreamChatBlockProps,LiveStreamChatMessage} from '@bloxwap/hig/contracts/live-stream';
import {FlatList,View} from 'react-native';
import {Text} from './surface.js';
import {useColors,useMessages} from './provider.js';
import {IconButton} from './button.js';
import {CloseIcon} from './icons.js';
import {AvatarFrame} from './avatar-frame.js';
import {Badge} from './status.js';
import {ScreenHeader} from './screen-header.js';
function ChatLine({message}:{message:LiveStreamChatMessage}){
 return <View style={{flexDirection:'row',gap:12,alignItems:'flex-start'}}>
  <AvatarFrame name={message.username} source={message.avatarUrl?{uri:message.avatarUrl}:undefined} size={32} decorative/>
  <View style={{flex:1,minWidth:0,gap:2}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
    <Text numberOfLines={1} style={{flexShrink:1,fontWeight:'600'}}>{message.username}</Text>
    <Badge>{message.source}</Badge>
   </View>
   <Text>{message.text}</Text>
  </View>
 </View>;
}
const renderLine=({item}:{item:LiveStreamChatMessage})=><ChatLine message={item}/>;
const lineKey=(message:LiveStreamChatMessage)=>message.id;
const Gap=()=><View style={{height:12}}/>;
export function LiveStreamChatBlock({title,messages,emptyLabel,onClose,headingId}:LiveStreamChatBlockProps){
 const colors=useColors(),t=useMessages();
 const list=useRef<FlatList<LiveStreamChatMessage>>(null),following=useRef(true);
 return <View style={{padding:16,gap:16,flexShrink:1}}>
  <ScreenHeader title={title} headingId={headingId} action={onClose&&<IconButton intent='ghost' label={t.close} onPress={onClose}><CloseIcon color={colors.text}/></IconButton>}/>
  <FlatList ref={list} data={messages} keyExtractor={lineKey} renderItem={renderLine} ItemSeparatorComponent={Gap}
   accessibilityLabel={title} accessibilityLiveRegion='polite' scrollEventThrottle={64}
   ListEmptyComponent={<Text style={{color:colors.muted}}>{emptyLabel}</Text>}
   onScroll={({nativeEvent:{contentSize,contentOffset,layoutMeasurement}})=>{following.current=contentSize.height-contentOffset.y-layoutMeasurement.height<=chatFollowSlack;}}
   // A new line keeps the newest in view unless the reader scrolled back to read earlier ones.
   onContentSizeChange={()=>{if(following.current)list.current?.scrollToEnd({animated:false});}}/>
 </View>;
}
