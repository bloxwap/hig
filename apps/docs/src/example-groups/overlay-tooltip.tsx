// Generated from planning/examples.json.
import React,{useState} from 'react';
import {Button} from '@bloxwap/hig/react/button';
import {Tooltip} from '@bloxwap/hig/react/overlay';
import {Toast} from '@bloxwap/hig/react/status';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Tooltip,Button,Toast};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [notices,setNotices]=useState([{id:'1',message:'Demo copied',severity:'success' as const}]);
function preview(){switch(name){case "Tooltip":return <><C.Tooltip content='Copy the install command'><C.Button intent='secondary' onClick={()=>setNotices([{id:'copy',message:'Copied',severity:'success'}])}>Copy</C.Button></C.Tooltip><C.Toast notices={notices.filter(n=>n.id==='copy')} onDismiss={()=>setNotices([])}/></>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
