// Generated from planning/examples.json.
import React from 'react';
import {BarMark} from '@bloxwap/hig/react/bar-mark';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,BarMark};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "BarMark":return state==="remaining"?<C.BarMark title='Margin' description='$7,400 of $10,000 used' total={10000} elements={[{label:'Positions',value:5200,tone:'info'},{label:'Open orders',value:1400,tone:'warning'},{label:'Fees',value:800,tone:'negative'}]}/>:state==="no-legend"?<C.BarMark title='Allocation' description='3 assets' legend={false} elements={[{label:'Bitcoin',value:50},{label:'Ether',value:30},{label:'Solana',value:20}]}/>:state==="live-detail"?<C.BarMark title='Hyperliquid' surface={false} elements={[{label:'Staked',value:320,detail:{value:320,options:{style:'currency',currency:'USD'}}},{label:'Core',value:239,detail:{value:239,options:{style:'currency',currency:'USD'}}}]}/>:<C.BarMark title='Portfolio' description='$12,480.00' elements={[{label:'Bitcoin',value:6200,detail:'$6,200'},{label:'Ether',value:3400,detail:'$3,400'},{label:'Solana',value:1630,detail:'$1,630'},{label:'USD Coin',value:1250,detail:'$1,250'}]}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
