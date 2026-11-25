import React,{useState} from 'react';
import {chatCanConnect,chatCanDisconnect,connectionReady,initialStreamSettings,type LiveStreamBlockProps,type LiveStreamChatService,type StreamConnection,type StreamSection} from '@bloxwap/hig/contracts/live-stream';
export type {LiveStreamBlockProps,LiveStreamChatService,LiveStreamChatStatus,LiveStreamSettings,StreamConnection} from '@bloxwap/hig/contracts/live-stream';
import {View} from 'react-native';
import {Text} from './surface.js';
import {useControllable,useColors} from './provider.js';
import {Button} from './button.js';
import {ListGroup,ListRow} from './list-group.js';
import {Field,Input} from './field.js';
import {Alert} from './status.js';
import {ScreenHeader} from './screen-header.js';
/** The chat section: where the sign-in stands, Connect or Sign out, and the note. */
function ChatService({chat,onDone}:{chat:LiveStreamChatService;onDone:()=>void}){
 const colors=useColors();
 const [pending,setPending]=useState(false);
 const {status,labels}=chat;
 const busy=pending||status==='connecting';
 const connect=()=>{
  if(busy)return;
  setPending(true);
  Promise.resolve().then(()=>chat.onConnect()).then(()=>{setPending(false);onDone();},()=>setPending(false));
 };
 return <>
  <Text accessibilityLiveRegion='polite' style={{color:colors.muted}}>{labels.status(status)}</Text>
  {status==='failed'&&chat.error?<Alert severity='error' title={chat.error}/>:null}
  {chatCanConnect(status)?<Button style={{alignSelf:'stretch'}} busy={busy} onPress={connect}>{labels.connect}</Button>:null}
  {chatCanDisconnect(status)&&chat.onDisconnect?<Button style={{alignSelf:'stretch'}} intent='secondary' onPress={()=>{Promise.resolve().then(chat.onDisconnect).catch(()=>{/* The host's status and error explain. */});}}>{labels.disconnect}</Button>:null}
  <Text style={{color:colors.muted}}>{labels.note}</Text>
 </>;
}
export function LiveStreamBlock(props:LiveStreamBlockProps){
 const [settings,change]=useControllable(props.settings,props.defaultSettings??initialStreamSettings,props.onSettingsChange,null);
 const [section,setSection]=useState<StreamSection|null>(null);
 const [draft,setDraft]=useState<StreamConnection>({endpoint:'',key:''});
 const open=(next:StreamSection)=>{if(next==='streaming')setDraft(settings.streaming);setSection(next);};
 const back=()=>{setSection(null);setDraft({endpoint:'',key:''});};
 const save=()=>{
  change({...settings,streaming:{endpoint:draft.endpoint.trim(),key:draft.key}});
  back();
 };
 const ready=connectionReady(settings.streaming);
 const canSave=connectionReady(draft)||(!draft.endpoint.trim()&&!draft.key);
 const colors=useColors();
 const title=section==='streaming'?props.streaming.title:section==='chat'?props.chat.labels.title:props.title;
 const header=<ScreenHeader title={title} onBack={section?back:props.onBack}/>;
 return <View style={{padding:16,gap:16}}>{header}
  {section==='streaming'?<>
   <Field label={props.streaming.endpointLabel}><Input keyboardType='url' autoCapitalize='none' autoCorrect={false} value={draft.endpoint} onChangeText={endpoint=>setDraft({...draft,endpoint})}/></Field>
   <Field label={props.streaming.keyLabel}><Input secureTextEntry autoComplete="off" autoCapitalize='none' autoCorrect={false} value={draft.key} onChangeText={key=>setDraft({...draft,key})}/></Field>
   <Button style={{alignSelf:'stretch'}} disabled={!canSave} onPress={save}>{props.saveLabel}</Button>
  </>:section==='chat'?<ChatService chat={props.chat} onDone={back}/>:<>
   {props.description&&<Text style={{color:colors.muted}}>{props.description}</Text>}
   <ListGroup>
    <ListRow label={props.streaming.title} onSelect={()=>open('streaming')}/>
    <ListRow label={props.chat.labels.title} value={props.chat.labels.status(props.chat.status)} onSelect={()=>open('chat')}/>
   </ListGroup>
   <ListGroup>
    <ListRow label={props.appAudioLabel} checked={settings.appAudio} onCheckedChange={appAudio=>change({...settings,appAudio})}/>
    <ListRow label={props.microphoneLabel} checked={settings.microphone} onCheckedChange={microphone=>change({...settings,microphone})}/>
    <ListRow label={props.chatFeedLabel} checked={settings.chatFeed} onCheckedChange={chatFeed=>change({...settings,chatFeed})}/>
   </ListGroup>
   <Button style={{alignSelf:'stretch'}} disabled={!ready} onPress={()=>props.onPlay(settings)}>{props.playLabel}</Button>
  </>}
 </View>;
}
