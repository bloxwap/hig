// Generated from planning/examples.json.
import React,{useState} from 'react';
import {AltimeterChart,OutcomeChart} from '@bloxwap/hig/chart';
import {Button} from '@bloxwap/hig/react/button';
import {Row} from '@bloxwap/hig/react/data';
import {Switch} from '@bloxwap/hig/react/selection';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,AltimeterChart,Switch,Row,Button,OutcomeChart};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [checked,setChecked]=useState(false);
const [range,setRange]=useState(25);
const empty=state==='empty';
function preview(){switch(name){case "AltimeterChart":return state==="targets"?<C.Stack><C.AltimeterChart summary='Sample price with take profit, entry, stop loss and liquidation targets.' price={100+(range-25)/1000} targets={[{id:'tp',price:100.02,label:'Take Profit',color:'#12b981'},{id:'entry',price:100,label:'Entry',color:'#6b9fff'},{id:'sl',price:99.98,label:'Stop Loss',color:'#f97316'},{id:'liq',price:99.96,label:'Liquidation',color:'#ed63b3'}]} degen={checked} height={400}/><C.Switch label='DEGEN crossing effects' checked={checked} onCheckedChange={setChecked}/><C.Row style={{flexWrap:'wrap'}}><C.Button onClick={()=>setRange(r=>Math.max(-35,r-20))}>Price down</C.Button><C.Button onClick={()=>setRange(25)}>Reset price</C.Button><C.Button onClick={()=>setRange(r=>Math.min(85,r+20))}>Price up</C.Button></C.Row></C.Stack>:state==="open-position"?<C.Stack><C.AltimeterChart summary='Sample open long position. Trail color follows the mark relative to break-even. Capsule color includes fees.' price={100+range/1000} position={{side:'long',breakEvenPrice:100,pnl:range-5,capsule:checked?{returnRatio:(range-5)/1000}:'pnl'}} targets={[{id:'basis',price:100,label:'Break even'}]}/><C.Switch label='Show percentage gain' checked={checked} onCheckedChange={setChecked}/><C.Row><C.Button onClick={()=>setRange(r=>r-10)}>Price down</C.Button><C.Button onClick={()=>setRange(r=>r+10)}>Price up</C.Button></C.Row></C.Stack>:<C.AltimeterChart summary='Live Bitcoin price from Hyperliquid. The current price is also shown as text.' price={empty?null:undefined} height={320}/>;
case "OutcomeChart":return <C.OutcomeChart summary='UEFA Champions League winner on Hyperliquid: the live chance of each club, also shown as text.' outcomes={empty?null:undefined} height={360}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
