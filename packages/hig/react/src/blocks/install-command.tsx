"use client";
import React,{useState} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {Surface} from '../surface.js';
import {notify} from '../notify.js';
/** With a mounted `Toaster` (`@bloxwap/hig/react/toast`) the copy result is raised as a toast; without one it shows inline. Either way it is announced. This entry does not load Sonner. */
export function InstallCommand({command,onCopy}: {command:string;onCopy:()=>Promise<void>|void}){const {messages}=useHIG();const [status,setStatus]=useState({text:'',toasted:false});
 const report=(text:string,severity:'success'|'error')=>setStatus({text,toasted:notify(text,{severity,id:'hig-install-command',dismissName:(messages.dismissNotice??en.dismissNotice)(text,messages.dismiss??en.dismiss)})});
 return <Surface><pre className='hig-code' tabIndex={0}><code>{command}</code></pre><Button intent='secondary' onClick={()=>{Promise.resolve().then(onCopy).then(()=>report(messages.copied??en.copied,'success')).catch(()=>report(messages.copyFailed??en.copyFailed,'error'));}}>{messages.copyInstallCommand??en.copyInstallCommand}</Button><p role='status' className={status.toasted?'hig-sr-only':undefined}>{status.text}</p></Surface>;}
