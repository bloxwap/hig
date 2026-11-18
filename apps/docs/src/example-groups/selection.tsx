// Generated from planning/examples.json.
import React,{useState} from 'react';
import {Checkbox,Switch,RadioGroup,SegmentedControl,Filter,PresetGroup,Select,Slider} from '@bloxwap/hig/react/selection';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Checkbox,Switch,RadioGroup,SegmentedControl,Filter,PresetGroup,Select,Slider};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [checked,setChecked]=useState(false);
const [value,setValue]=useState('buy');
const [range,setRange]=useState(25);
const [message,setMessage]=useState('');
const choices=[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}];
const disabled=state==='disabled';
function preview(){switch(name){case "Checkbox":return <C.Checkbox label='Show order details' checked={checked} onCheckedChange={setChecked} disabled={disabled}/>;
case "Switch":return <C.Switch label='Preference preview' checked={checked} onCheckedChange={setChecked} disabled={disabled}/>;
case "RadioGroup":return <C.RadioGroup label='Market direction' options={choices} value={value} onValueChange={setValue} disabled={disabled}/>;
case "SegmentedControl":return state==="hidden-label"?<C.SegmentedControl label='Market direction' hideLabel options={choices} value={value} onValueChange={setValue}/>:<C.SegmentedControl label='Market direction' options={choices} value={value} onValueChange={setValue} disabled={disabled}/>;
case "Filter":return <C.Filter label='Chain' options={[{value:'',label:'All'},{value:'1',label:'Ethereum'},{value:'8453',label:'Base'},{value:'42161',label:'Arbitrum'}]} defaultValue='' disabled={disabled} onValueChange={chain=>setMessage(chain?`Chain ${chain} selected`:'All chains')}/>;
case "PresetGroup":return state==="grid"?<C.PresetGroup label='Leverage' columns={4} options={[{value:1,label:'1x'},{value:2,label:'2x'},{value:3,label:'3x'},{value:5,label:'5x'},{value:10,label:'10x'},{value:20,label:'20x'},{value:40,label:'40x',disabled:true}]} defaultValue={5} onValueChange={leverage=>setMessage(`${leverage}x selected`)}/>:<C.PresetGroup label='Order size' options={[{value:10,label:'$10'},{value:25,label:'$25'},{value:50,label:'$50'},{value:100,label:'$100'}]} defaultValue={25} disabled={disabled} onValueChange={size=>setMessage(`$${size} selected`)}/>;
case "Select":return <C.Select label='Market direction' options={choices} value={value} onValueChange={setValue} disabled={disabled}/>;
case "Slider":return <C.Slider label='Volume preview' value={range} onValueChange={setRange} disabled={disabled}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
