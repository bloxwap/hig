// Generated from planning/examples.json.
import React,{useState} from 'react';
import {DepositBlock,ReceiveBlock} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,ReceiveBlock,DepositBlock};
export function Example({name,previewDialog}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [open,setOpen]=useState(Boolean(previewDialog));
const [message,setMessage]=useState('');
function preview(){switch(name){case "DepositBlock":return open?<C.ReceiveBlock mode="both" solanaAddress="4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw" ethereumAddress="0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688" onCopy={(_, address) => navigator.clipboard.writeText(address)} onBack={() => setOpen(false)}/>:<C.DepositBlock description="Choose how you’ll add funds to your Wallet." methods={[{"id":"qr","label":"QR code","description":"Scan or copy your wallet address"},{"id":"apple-pay","label":"Apple Pay","description":"Instant card deposit"},{"id":"cash-app","label":"Cash App","description":"Scan to send Bitcoin"},{"id":"exchange","label":"Exchange","description":"Coinbase, Binance, and more"},{"id":"crypto","label":"Send crypto","description":"From any wallet or exchange"},{"id":"bank","label":"Bank transfer","description":"ACH, SEPA, or Interac"},{"id":"blink","label":"Blink","description":"Card or one-tap stablecoin deposit"}]} onSelect={method=>method.id==='qr'?setOpen(true):setMessage(method.label + ' selected')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
