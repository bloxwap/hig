"use client";
import React,{useState} from 'react';
import {Button} from '../button.js';
import {Surface} from '../surface.js';
import {useMessages} from '../provider.js';
import * as en from '@bloxwap/hig-contracts/messages';
export function InstallCommand({command,onCopy}: {command:string;onCopy:()=>Promise<void>|void}){const [status,setStatus]=useState<''|'copied'|'copyFailed'>('');const messages=useMessages();return <Surface><pre tabIndex={0}><code>{command}</code></pre><Button intent='secondary' onClick={()=>{Promise.resolve().then(onCopy).then(()=>setStatus('copied')).catch(()=>setStatus('copyFailed'));}}>{(messages.copyInstallCommand??en.copyInstallCommand)}</Button><p role='status'>{status&&(messages[status]??en[status])}</p></Surface>;}
