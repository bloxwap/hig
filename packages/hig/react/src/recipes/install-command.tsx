"use client";
import React,{useState} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {Surface} from '../surface.js';
import {toast} from '../toast.js';
/** Copy result is raised as a Sonner toast (mount `Toaster` from `@bloxwap/hig/react/toast`); a visually hidden status keeps the result announced when no toaster is mounted. */
export function InstallCommand({command,onCopy}: {command:string;onCopy:()=>Promise<void>|void}){const {messages}=useHIG();const [status,setStatus]=useState('');
 const report=(text:string,severity:'success'|'error')=>{setStatus(text);toast(text,{severity,id:'hig-install-command',dismissName:(messages.dismissNotice??en.dismissNotice)(text,messages.dismiss??en.dismiss)});};
 return <Surface><pre className='hig-code' tabIndex={0}><code>{command}</code></pre><Button intent='secondary' onClick={()=>{Promise.resolve().then(onCopy).then(()=>report(messages.copied??en.copied,'success')).catch(()=>report(messages.copyFailed??en.copyFailed,'error'));}}>{messages.copyInstallCommand??en.copyInstallCommand}</Button><p role='status' className='hig-sr-only'>{status}</p></Surface>;}
