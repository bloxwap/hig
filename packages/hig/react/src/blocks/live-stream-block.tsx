"use client";
import React,{useState} from 'react';
import {chatCanDisconnect,chatCanReconnect,chatServiceUrlValid,connectionReady,initialStreamSettings,type LiveStreamBlockProps,type LiveStreamChatService,type StreamConnection,type StreamSection} from '@bloxwap/hig/contracts/live-stream';
export type {LiveStreamBlockProps,LiveStreamChatService,LiveStreamChatStatus,LiveStreamSettings,StreamConnection} from '@bloxwap/hig/contracts/live-stream';
import {useControllable} from '../provider.js';
import {Button} from '../button.js';
import {ListGroup,ListRow} from '../list-group.js';
import {Field,Input} from '../field.js';
import {Alert} from '../status.js';
import {ScreenHeader} from './screen-header.js';
/** The chat section: the authorization service URL, Connect, where the service stands, and the note on trust. */
function ChatService({chat,onDone}:{chat:LiveStreamChatService;onDone:()=>void}){
 const [url,setUrl]=useState(chat.serviceUrl??'');
 const [pending,setPending]=useState(false);
 const {status,labels}=chat;
 const busy=pending||status==='connecting';
 const connect=()=>{
  const value=url.trim();
  if(busy||!chatServiceUrlValid(value))return;
  setPending(true);
  Promise.resolve().then(()=>chat.onConnect(value)).then(()=>{setPending(false);onDone();},()=>setPending(false));
 };
 return <>
  <Field label={labels.serviceLabel}><Input type='url' inputMode='url' autoFocus autoComplete='off' autoCapitalize='none' autoCorrect='off' spellCheck={false} value={url} onChange={event=>setUrl(event.target.value)}/></Field>
  <Button fullWidth busy={busy} disabled={!chatServiceUrlValid(url)} onClick={connect}>{labels.connect}</Button>
  <p className='hig-settings-description' role='status' aria-live='polite'>{labels.status(status)}</p>
  {status==='failed'&&chat.error&&<Alert severity='error' title={chat.error}/>}
  {chatCanReconnect(status)&&chat.onReconnect&&labels.reconnect&&<Button fullWidth intent='secondary' onClick={()=>{Promise.resolve().then(chat.onReconnect).catch(()=>{/* The host's status and error explain. */});}}>{labels.reconnect}</Button>}
  {chatCanDisconnect(status)&&chat.onDisconnect&&<Button fullWidth intent='secondary' onClick={()=>{Promise.resolve().then(chat.onDisconnect).catch(()=>{/* The host's status and error explain. */});}}>{labels.disconnect}</Button>}
  <p className='hig-settings-description'>{labels.note}</p>
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
 const title=section==='streaming'?props.streaming.title:section==='chat'?props.chat.labels.title:props.title;
 const header=<ScreenHeader title={title} onBack={section?back:props.onBack}/>;
 return <section className='hig-settings-block'>{header}
  {section==='streaming'?<>
   <Field label={props.streaming.endpointLabel}><Input inputMode='url' autoFocus autoComplete='off' autoCapitalize='none' spellCheck={false} value={draft.endpoint} onChange={event=>setDraft({...draft,endpoint:event.target.value})}/></Field>
   <Field label={props.streaming.keyLabel}><Input type='password' autoComplete='off' autoCapitalize='none' spellCheck={false} value={draft.key} onChange={event=>setDraft({...draft,key:event.target.value})}/></Field>
   <Button fullWidth disabled={!canSave} onClick={save}>{props.saveLabel}</Button>
  </>:section==='chat'?<ChatService chat={props.chat} onDone={back}/>:<>
   {props.description&&<p className='hig-settings-description'>{props.description}</p>}
   <ListGroup>
    <ListRow label={props.streaming.title} onSelect={()=>open('streaming')}/>
    <ListRow label={props.chat.labels.title} value={props.chat.labels.status(props.chat.status)} onSelect={()=>open('chat')}/>
   </ListGroup>
   <ListGroup>
    <ListRow label={props.appAudioLabel} checked={settings.appAudio} onCheckedChange={appAudio=>change({...settings,appAudio})}/>
    <ListRow label={props.microphoneLabel} checked={settings.microphone} onCheckedChange={microphone=>change({...settings,microphone})}/>
   </ListGroup>
   <Button fullWidth disabled={!ready} onClick={()=>props.onPlay(settings)}>{props.playLabel}</Button>
  </>}
 </section>;
}
