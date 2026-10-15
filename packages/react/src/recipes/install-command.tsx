"use client";
import React,{useState} from 'react';
import {Button} from '../button.js';
import {Surface} from '../surface.js';
export function InstallCommand({command,onCopy}: {command:string;onCopy:()=>Promise<void>|void}){const [status,setStatus]=useState('');return <Surface><pre tabIndex={0}><code>{command}</code></pre><Button intent='secondary' onClick={()=>{Promise.resolve().then(onCopy).then(()=>setStatus('Copied')).catch(()=>setStatus('Copy failed. Select the command and copy manually.'));}}>Copy install command</Button><p role='status'>{status}</p></Surface>;}
