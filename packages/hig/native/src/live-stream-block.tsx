import React,{useState} from 'react';
import {connectionReady,initialStreamSettings,type LiveStreamBlockProps,type StreamConnection,type StreamSection} from '@bloxwap/hig/contracts/live-stream';
export type {LiveStreamBlockProps,LiveStreamSettings,StreamConnection} from '@bloxwap/hig/contracts/live-stream';
import {View} from 'react-native';
import {Text} from './surface.js';
import {useControllable,useColors} from './provider.js';
import {Button} from './button.js';
import {ListGroup,ListRow} from './list-group.js';
import {Field,Input} from './field.js';
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
 const colors=useColors();
 const header=<ScreenHeader title={section?props[section].title:props.title} onBack={section?back:props.onBack}/>;
 return <View style={{padding:16,gap:16}}>{header}
  {section?<>
   <Field label={props[section].endpointLabel}><Input keyboardType={section==='streaming'?'url':'default'} autoCapitalize='none' autoCorrect={false} value={draft.endpoint} onChangeText={endpoint=>setDraft({...draft,endpoint})}/></Field>
   <Field label={props[section].keyLabel}><Input secureTextEntry autoComplete="off" autoCapitalize='none' autoCorrect={false} value={draft.key} onChangeText={key=>setDraft({...draft,key})}/></Field>
   <Button style={{alignSelf:'stretch'}} disabled={!canSave} onPress={save}>{props.saveLabel}</Button>
  </>:<>
   {props.description&&<Text style={{color:colors.muted}}>{props.description}</Text>}
   <ListGroup>
    <ListRow label={props.streaming.title} onSelect={()=>open('streaming')}/>
    <ListRow label={props.chat.title} onSelect={()=>open('chat')}/>
   </ListGroup>
   <ListGroup>
    <ListRow label={props.appAudioLabel} checked={settings.appAudio} onCheckedChange={appAudio=>change({...settings,appAudio})}/>
    <ListRow label={props.microphoneLabel} checked={settings.microphone} onCheckedChange={microphone=>change({...settings,microphone})}/>
   </ListGroup>
   <Button style={{alignSelf:'stretch'}} disabled={!ready} onPress={()=>props.onPlay(settings)}>{props.playLabel}</Button>
  </>}
 </View>;
}
