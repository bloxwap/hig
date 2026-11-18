// Generated from planning/examples.json.
import React from 'react';
import {BrandMark} from '@bloxwap/hig/react/brand';
import {QRCode} from '@bloxwap/hig/react/qr-code';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,QRCode,BrandMark};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "QRCode":return state==="arena"?<C.QRCode value='ethereum:0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688@8453' arena={<C.BrandMark size={32}/>} label='Deposit address QR code'/>:state==="dark-on-light"?<C.QRCode value='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688' size={160} color='black' background='white'/>:<C.QRCode value='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688'/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
