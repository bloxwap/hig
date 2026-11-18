// Generated from planning/examples.json.
import React from 'react';
import {NumberReadout,Usd,Percent,Metric,Stat,List,Row,VerticalAddress,Table} from '@bloxwap/hig/react/data';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,NumberReadout,Usd,Percent,Metric,Stat,List,Row,Table,VerticalAddress};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const rows=state==='empty'?[]:[{id:'btc',label:'Bitcoin (BTC)',value:67234.56}];
const empty=state==='empty';
const error=state==='error'?'Data unavailable. Retry when connected.':undefined;
function preview(){switch(name){case "NumberReadout":return <C.NumberReadout value={empty?null:67234.56} stale={!!error} options={{maximumFractionDigits:2}}/>;
case "Usd":return <C.Usd value={empty?null:1250.45} stale={!!error}/>;
case "Percent":return <C.Percent value={empty?null:2.5}/>;
case "Metric":return <C.Metric label='Sample equity' value={<C.Usd value={1250.45}/>}/>;
case "Stat":return <C.Stat label='Sample daily change' value={<C.Percent value={2.5}/>}/>;
case "List":return <C.List items={rows} keyFor={r=>r.id} render={r=><C.Row><C.Text>{r.label}</C.Text><C.NumberReadout value={r.value}/></C.Row>}/>;
case "Row":return <C.Row><C.Text>Bitcoin (BTC)</C.Text><C.Usd value={67234.56}/></C.Row>;
case "Table":return <C.Table caption='Sample positions' rows={rows} keyFor={r=>r.id} columns={[{key:'asset',label:'Asset',render:r=>r.label},{key:'price',label:'Price',render:r=><C.Usd value={r.value}/>} ]}/>;
case "VerticalAddress":return <C.VerticalAddress address='6uRAouaynVhU87V9iMaWy616295tf2ZnZQv2YxAcPnhQ'/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
