"use client";
import React,{useState} from 'react';
import {connectionReady,initialStreamSettings,type LiveStreamBlockProps,type StreamConnection,type StreamSection} from '@bloxwap/hig/contracts/live-stream';
export type {LiveStreamBlockProps,LiveStreamSettings,StreamConnection} from '@bloxwap/hig/contracts/live-stream';
import {useControllable} from '../provider.js';
import {Button} from '../button.js';
import {ListGroup,ListRow} from '../list-group.js';
import {Field,Input} from '../field.js';
import {ScreenHeader} from './screen-header.js';
export function LiveStreamBlock(props:LiveStreamBlockProps){
 const [settings,change]=useControllable(props.settings,props.defaultSettings??initialStreamSettings,props.onSettingsChange,null);
 const [section,setSection]=useState<StreamSection|null>(null);
 const [draft,setDraft]=useState<StreamConnection>({endpoint:'',key:''});
 const open=(next:StreamSection)=>{setDraft(settings[next]);setSection(next);};
 const back=()=>{setSection(null);setDraft({endpoint:'',key:''});};
 const save=()=>{
  if(section===null)return;
  change({...settings,[section]:{endpoint:draft.endpoint.trim(),key:draft.key}});
  back();
 };
 const ready=connectionReady('streaming',settings.streaming);
 const canSave=section!==null&&(connectionReady(section,draft)||(!draft.endpoint.trim()&&!draft.key));
 const header=<ScreenHeader title={section?props[section].title:props.title} onBack={section?back:props.onBack}/>;
 return <section className='hig-settings-block'>{header}
  {section?<>
   <Field label={props[section].endpointLabel}><Input inputMode={section==='streaming'?'url':'text'} autoFocus autoComplete='off' autoCapitalize='none' spellCheck={false} value={draft.endpoint} onChange={event=>setDraft({...draft,endpoint:event.target.value})}/></Field>
   <Field label={props[section].keyLabel}><Input type='password' autoComplete='off' autoCapitalize='none' spellCheck={false} value={draft.key} onChange={event=>setDraft({...draft,key:event.target.value})}/></Field>
   <Button fullWidth disabled={!canSave} onClick={save}>{props.saveLabel}</Button>
  </>:<>
   {props.description&&<p className='hig-settings-description'>{props.description}</p>}
   <ListGroup>
    <ListRow label={props.streaming.title} onSelect={()=>open('streaming')}/>
    <ListRow label={props.chat.title} onSelect={()=>open('chat')}/>
   </ListGroup>
   <ListGroup>
    <ListRow label={props.appAudioLabel} checked={settings.appAudio} onCheckedChange={appAudio=>change({...settings,appAudio})}/>
    <ListRow label={props.microphoneLabel} checked={settings.microphone} onCheckedChange={microphone=>change({...settings,microphone})}/>
   </ListGroup>
   <Button fullWidth disabled={!ready} onClick={()=>props.onPlay(settings)}>{props.playLabel}</Button>
  </>}
 </section>;
}
