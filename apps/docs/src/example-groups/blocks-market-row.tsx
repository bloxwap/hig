// Generated from planning/examples.json.
import React,{useState} from 'react';
import {Avatar} from '@bloxwap/hig/react/avatar';
import {MarketRow} from '@bloxwap/hig/react/blocks';
import {Badge} from '@bloxwap/hig/react/status';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,MarketRow,Avatar,Badge};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [message,setMessage]=useState('');
const empty=state==='empty';
function preview(){switch(name){case "MarketRow":return state==="one-line"?<C.Stack><C.MarketRow symbol='HYPESTRAT' name='Hyperliquid Strategies Holdings' detail='Up to 10× leverage on the perpetual' icon={<C.Avatar name='HS'/>} trailing={<C.Badge>-$1,204.88</C.Badge>} onSelect={()=>setMessage('Hyperliquid Strategies selected')}/><C.MarketRow symbol='BTC' name='Bitcoin' detail='40×' icon={<C.Avatar name='BTC'/>} trailing={<C.Badge>+$12.40</C.Badge>} onSelect={()=>setMessage('Bitcoin selected')}/><C.MarketRow symbol='ETH' name='Ether' detail='25× · Perp' icon={<C.Avatar name='ETH'/>} price={3521.12} change={-1.23} trailing={<C.Badge>-$48.10</C.Badge>} selected onSelect={()=>setMessage('Ether selected')}/></C.Stack>:state==="picker"?<C.Stack><C.MarketRow symbol='BTC' name='Bitcoin' detail='40×' icon={<C.Avatar name='BTC'/>} trailing={<C.Badge>+$12.40</C.Badge>} selected onSelect={()=>setMessage('Bitcoin selected')}/><C.MarketRow symbol='ETH' name='Ether' detail='25×' icon={<C.Avatar name='ETH'/>} active onSelect={()=>setMessage('Ether selected')}/><C.MarketRow symbol='SOL' name='Solana' detail='20×' icon={<C.Avatar name='SOL'/>} disabled onSelect={()=>setMessage('Solana selected')}/></C.Stack>:<C.MarketRow symbol='BTC' name='Bitcoin' price={empty?null:67234.56} change={2.5} onSelect={()=>setMessage('Bitcoin selected')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
