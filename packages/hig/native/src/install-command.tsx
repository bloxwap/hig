import React from 'react';
import {Platform} from 'react-native';
import * as en from '@bloxwap/hig/contracts/messages';
import {useMessageOverrides,useMonoFontFamily} from './provider.js';
import {Button} from './button.js';
import {Surface,Text} from './surface.js';
import {Toast,useTransientNotice} from './status.js';
/** Code and commands stay monospace and left-to-right inside RTL roots. */
function useCodeStyle(){const font=useMonoFontFamily();return {fontFamily:font??Platform.select({ios:'Menlo',default:'monospace'}),writingDirection:'ltr' as const,textAlign:'left' as const};}
/** A copy outcome shows as a transient toast capsule (about 4s, dismissible) and is announced the way Toast announces any notice. */
export function InstallCommand({command,onCopy}: {command:string;onCopy:()=>Promise<void>|void}){const messages=useMessageOverrides();const {notice,show,dismiss}=useTransientNotice();const code=useCodeStyle();
 return <Surface style={{gap:12}}><Text selectable style={code}>{command}</Text><Button intent='secondary' onPress={()=>{Promise.resolve().then(onCopy).then(()=>show(messages.copied??en.copied,'success')).catch(()=>show(messages.copyFailed??en.copyFailed,'error'));}}>{messages.copyInstallCommand??en.copyInstallCommand}</Button>{notice&&<Toast notices={[notice]} onDismiss={dismiss}/>}</Surface>;}
