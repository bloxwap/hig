// Generated from planning/examples.json.
import React,{useState} from 'react';
import {Tabs,Accordion,Breadcrumb,Navigation,Pagination,Search} from '@bloxwap/hig/react/navigation';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Tabs,Accordion,Breadcrumb,Navigation,Pagination,Search};
export function Example({name,state='default',previewDialog}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [range,setRange]=useState(25);
const [open,setOpen]=useState(Boolean(previewDialog));
const [amount,setAmount]=useState('0.01');
const [message,setMessage]=useState('');
const empty=state==='empty';
const error=state==='error'?'Data unavailable. Retry when connected.':undefined;
function preview(){switch(name){case "Tabs":return <C.Tabs label='Example modes' items={[{value:'preview',label:'Preview',content:<C.Text>Visible preview</C.Text>},{value:'code',label:'Code',content:<C.Text>Copyable code</C.Text>}]}/>;
case "Accordion":return <C.Accordion title='Advanced options' open={open} onOpenChange={setOpen}><C.Text>Host-owned advanced settings.</C.Text></C.Accordion>;
case "Breadcrumb":return <C.Breadcrumb items={[{label:'Guidelines',href:'https://github.com/bloxwap/hig'},{label:'Components'}]}/>;
case "Navigation":return <C.Stack><C.Navigation label='Sample navigation' items={[{label:'Overview',href:'#overview',active:true},{label:'Activity',href:'#activity'}]}/><h3 id='overview'>Overview</h3><C.Text>Sample portfolio balance.</C.Text><h3 id='activity'>Activity</h3><C.Text>Recent sample transactions.</C.Text></C.Stack>;
case "Pagination":return <C.Pagination page={range} total={100} onPageChange={setRange}/>;
case "Search":return <C.Search query={amount} onQueryChange={setAmount} results={empty?[]:[{id:'btc',label:'Bitcoin (BTC)',onSelect:()=>setMessage('Bitcoin selected')}]} error={error}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
