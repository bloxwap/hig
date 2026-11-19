// Generated from planning/examples.json.
import React,{useState} from 'react';
import {NumberFlow,NumberFlowGroup} from '@bloxwap/hig/react/animated-number';
import {Slider} from '@bloxwap/hig/react/selection';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,NumberFlowGroup,NumberFlow,Slider};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [range,setRange]=useState(25);
const empty=state==='empty';
const error=state==='error'?'Data unavailable. Retry when connected.':undefined;
function preview(){switch(name){case "NumberFlow":return state==="countdown"?<><C.NumberFlowGroup><C.NumberFlow label="Minutes left" value={Math.floor((100-range)*9/60)} trend={-1} suffix="m "/><C.NumberFlow label="Seconds left" value={((100-range)*9)%60} trend={-1} digits={{1:{max:5}}} options={{minimumIntegerDigits:2}} suffix="s"/></C.NumberFlowGroup><C.Slider label="Time elapsed" value={range} onValueChange={setRange}/></>:state==="continuous"?<><C.NumberFlow label="Points" value={range*125} trend={1} continuous spinTiming={{duration:600,easing:'standard'}}/><C.Slider label="Points" value={range} onValueChange={setRange}/></>:state==="slide"?<><C.NumberFlow motion="slide" label="Sample price" value={range}/><C.Slider label="Sample price" value={range} onValueChange={setRange}/></>:<><C.NumberFlow label="Mark price" value={empty?null:960+range} stale={!!error} options={{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}}/><C.Slider label="Mark price" value={range} onValueChange={setRange}/></>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
