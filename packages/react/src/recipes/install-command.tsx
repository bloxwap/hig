"use client";
import React,{useState} from 'react';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {Surface} from '../surface.js';
export function InstallCommand({command,onCopy}: {command:string;onCopy:()=>Promise<void>|void}){const {messages}=useHIG();const [status,setStatus]=useState('');return <Surface><pre tabIndex={0}><code>{command}</code></pre><Button intent='secondary' onClick={()=>{Promise.resolve().then(onCopy).then(()=>setStatus(messages.copied??en.copied)).catch(()=>setStatus(messages.copyFailed??en.copyFailed));}}>{messages.copyInstallCommand??en.copyInstallCommand}</Button><p role='status'>{status}</p></Surface>;}
