'use client';
import React,{useState} from 'react';
import {Button} from '@bloxwap/hig/react/button';
import type {FeedbackPreferences} from '@bloxwap/hig/feedback';
import {configurationCode} from './configuration-code.mjs';
import type {Entry,ExampleSource} from './example-code';
export function ExampleCode({platform,density,state,preferences,source}:{
 entry:Entry;platform:'react'|'native';density:string;state:string;preferences?:FeedbackPreferences;source:ExampleSource;
}){
 const snippet=(source[platform][state]??source[platform].default).replace('density="comfortable"',`density="${platform==='native'?'comfortable':density}"`);
 return <Code code={preferences?configurationCode(snippet,platform,preferences):snippet}/>;
}
export function Code({code}: {code:string}){const [status,setStatus]=useState('');return <div className='code-window'><div className='code-toolbar'><span>TypeScript · candidate imports</span><Button intent='ghost' onClick={()=>{navigator.clipboard.writeText(code).then(()=>setStatus('Copied')).catch(()=>setStatus('Copy failed. Select code and copy manually.'));}}>Copy code</Button></div><pre tabIndex={0}><code>{code}</code></pre><p role='status' className='copy-status'>{status}</p></div>;}
