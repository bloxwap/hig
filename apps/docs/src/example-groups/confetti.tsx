// Generated from planning/examples.json.
import React,{useState} from 'react';
import {Button} from '@bloxwap/hig/react/button';
import {Confetti} from '@bloxwap/hig/react/confetti';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Button,Confetti};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [range,setRange]=useState(25);
function preview(){switch(name){case "Confetti":return <><C.Button onClick={()=>setRange(range+1)}>Celebrate</C.Button><C.Confetti trigger={range-25} options={{particleCount:80,spread:70,origin:{y:0.7}}}/></>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
