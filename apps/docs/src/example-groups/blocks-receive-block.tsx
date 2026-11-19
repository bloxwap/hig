// Generated from planning/examples.json.
import React from 'react';
import {ReceiveBlock} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,ReceiveBlock};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "ReceiveBlock":return state==="ethereum"?<C.ReceiveBlock mode="ethereum" ethereumAddress="0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688" onCopy={(_, address) => navigator.clipboard.writeText(address)}/>:state==="solana"?<C.ReceiveBlock mode="solana" solanaAddress="4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw" onCopy={(_, address) => navigator.clipboard.writeText(address)}/>:<C.ReceiveBlock mode="both" solanaAddress="4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw" ethereumAddress="0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688" onCopy={(_, address) => navigator.clipboard.writeText(address)}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
