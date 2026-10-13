import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('planning/examples.json','utf8'));
export function exampleCode(name,platform='react',density='comfortable',state='default'){
 const example=manifest.examples.find(e=>e.name===name);if(!example)throw Error('Unknown example');
 const body=platform==='react'?example.web:example.native;
 // The build generator supplies symbol entry maps, source is authoritative.
 const mapping=JSON.parse(readFileSync('planning/example-symbols.json','utf8'))[platform];
 const needed=new Set([...body.matchAll(/C\.([A-Z]\w+)/g)].map(m=>m[1]));needed.add('HIGProvider');needed.add('Stack');needed.add('Text');
 const grouped={};for(const symbol of needed){const entry=mapping[symbol];if(!entry)throw Error(`Missing ${platform} export ${symbol}`);(grouped[entry]??=[]).push(symbol);}
 const imports=Object.entries(grouped).map(([entry,symbols])=>`import {${symbols.join(',')}} from '@bloxwap/hig-${platform}/${entry}';`).join('\n');
 return `import React,{useState} from 'react';\n${imports}\n${platform==='react'?"import '@bloxwap/hig-tokens/css';\nimport '@bloxwap/hig-react/css';":''}
export default function Example(){
const [checked,setChecked]=useState(false),[value,setValue]=useState('buy'),[range,setRange]=useState(25),[open,setOpen]=useState(false),[amount,setAmount]=useState('0.01'),[message,setMessage]=useState('');
const [notices,setNotices]=useState([{id:'1',message:'Demo copied',severity:'success' as const}]);
const choices=[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}];const rows:{id:string;label:string;value:number}[]=${state==='empty'?'[]':"[{id:'btc',label:'Bitcoin (BTC)',value:67234.56}]"};
const empty=${state==='empty'},busy=${state==='busy'},disabled=${state==='disabled'},error=${state==='error'?JSON.stringify('Data unavailable. Retry when connected.'):'undefined'};
return <HIGProvider density=${JSON.stringify(platform==='native'?'comfortable':density)}><Stack>${body.replaceAll('C.','')}<Text>{message}</Text></Stack></HIGProvider>;
}`;
}
export const examples=manifest.examples;
