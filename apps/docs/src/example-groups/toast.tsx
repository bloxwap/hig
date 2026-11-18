// Generated from planning/examples.json.
import React from 'react';
import {Button} from '@bloxwap/hig/react/button';
import {Text,Stack} from '@bloxwap/hig/react/surface';
import {toast,dismissToast} from '@bloxwap/hig/react/toast';
const components={Stack,Text,Button,toast,dismissToast};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "Toaster":return <><C.Button onClick={()=>C.toast.success('Demo copied')}>Show a notice</C.Button><C.Button intent='secondary' onClick={()=>C.toast.error('Transfer failed',{id:'transfer',description:'Check your balance and retry.',duration:Infinity,action:<C.Button intent='ghost' onClick={()=>C.dismissToast('transfer')}>Retry</C.Button>})}>Show a failure that stays</C.Button><C.Button intent='secondary' onClick={()=>C.dismissToast()}>Dismiss all</C.Button></>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
