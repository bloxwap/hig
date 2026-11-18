// Generated from planning/examples.json.
import React,{useState} from 'react';
import {LoginBlock} from '@bloxwap/hig/react/blocks';
import {Button} from '@bloxwap/hig/react/button';
import {GestureSheet} from '@bloxwap/hig/react/gesture-sheet';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,GestureSheet,Button,LoginBlock};
export function Example({name,previewDialog}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [checked,setChecked]=useState(false);
const [value,setValue]=useState('buy');
const [open,setOpen]=useState(Boolean(previewDialog));
const [message,setMessage]=useState('');
function preview(){switch(name){case "LoginBlock":return <C.GestureSheet open={open} onOpenChange={setOpen} trigger={<C.Button>Log in</C.Button>} title="Log in" titleHidden enableDynamicSizing closeButton={null} contentProps={{style:{maxWidth:390,marginInline:'auto'}}}><C.LoginBlock lastUsed={value==='apple'||value==='twitter'||value==='email'||value==='wallet'?value:'google'} analyticsEnabled={checked} onAnalyticsChange={setChecked} onLogin={provider=>{setValue(provider);setMessage('Selected '+(provider==='twitter'?'X':provider==='apple'?'Apple':'Google'));setOpen(false);}} onMoreLogin={provider=>{setValue(provider);setMessage(provider==='email'?'Selected Email':'Selected wallet');setOpen(false);}} onClose={()=>setOpen(false)}/></C.GestureSheet>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
