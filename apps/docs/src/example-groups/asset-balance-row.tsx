// Generated from planning/examples.json.
import React,{useState} from 'react';
import {AssetBalanceRow} from '@bloxwap/hig/react/asset-balance-row';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,AssetBalanceRow};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [message,setMessage]=useState('');
function preview(){switch(name){case "AssetBalanceRow":return state==="picker"?<C.Stack><C.AssetBalanceRow name='Hyperliquid' symbol='HYPE' value={57.97} balance={1.005} unitsSuffix=' HYPE' tag='Spot' selected onSelect={()=>setMessage('Hyperliquid selected')}/><C.AssetBalanceRow name='Solana' symbol='SOL' value={0} balance={0} unitsSuffix=' SOL' disabled onSelect={()=>setMessage('Solana selected')}/><C.AssetBalanceRow name='Card' symbol='Instant' amounts={false} onSelect={()=>setMessage('Card selected')}/></C.Stack>:state==="value-only"?<C.AssetBalanceRow name='USD Coin' symbol='USDC' value={100.33}/>:state==="units-headline"?<C.AssetBalanceRow name='Bloxwap' symbol='BLOX' value={null} balance={1234.5} headline='units'/>:<C.AssetBalanceRow name='Hyperliquid' symbol='HYPE' value={759} balance={13.2} onSelect={()=>setMessage('Hyperliquid selected')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
