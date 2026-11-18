// Generated from planning/examples.json.
import React,{useState} from 'react';
import {Button} from '@bloxwap/hig/react/button';
import {Dialog,Sheet,AlertDialog} from '@bloxwap/hig/react/overlay';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Dialog,Button,AlertDialog,Sheet};
export function Example({name,previewDialog}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=previewDialog?{...components,Dialog:previewDialog}:components;const [open,setOpen]=useState(Boolean(previewDialog));
const [message,setMessage]=useState('');
function preview(){switch(name){case "Dialog":return <C.Dialog open={open} onOpenChange={setOpen} title='Review order' description='Verify host-provided amount and terms.' trigger={<C.Button>Open review</C.Button>}><C.Text>0.01 BTC · Demo only</C.Text></C.Dialog>;
case "AlertDialog":return <C.AlertDialog open={open} onOpenChange={setOpen} title='Confirm cancellation' description='The host defines the actual consequence.' trigger={<C.Button intent='destructive'>Review cancellation</C.Button>}><C.Button intent='destructive' onClick={()=>{setMessage('Demo cancellation accepted');setOpen(false);}}>Confirm cancellation</C.Button></C.AlertDialog>;
case "Sheet":return <C.Sheet open={open} onOpenChange={setOpen} title='Order details' description='Scrollable, explicit close action.' trigger={<C.Button>Open details</C.Button>}><C.Text>Terms supplied by host.</C.Text></C.Sheet>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
