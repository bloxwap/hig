// Generated from planning/examples.json.
import React from 'react';
import {BarPnl} from '@bloxwap/hig/react/bar-pnl';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,BarPnl};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "BarPnl":return state==="loss"?<C.BarPnl title='BTC Long 10×' description='−$250.00' entry={64700} mark={64450} liquidation={63000} labels={{liquidation:'Liquidation',mark:'Mark',entry:'Entry'}}/>:state==="short"?<C.BarPnl title='ETH Short 5×' description='+$84.20' entry={3520} mark={3436} liquidation={4190} labels={{liquidation:'Liquidation',mark:'Mark',entry:'Entry'}}/>:state==="no-liquidation"?<C.BarPnl entry={142.96} mark={149.1} labels={{liquidation:'Liquidation',mark:'Mark',entry:'Entry'}}/>:state==="compact"?<C.BarPnl compact surface={false} entry={64700} mark={64450} liquidation={63000} labels={{liquidation:'Liquidation',mark:'Mark',entry:'Entry'}}/>:<C.BarPnl title='BTC Long 10×' description='+$1,300.00' entry={64700} mark={66000} liquidation={58800} labels={{liquidation:'Liquidation',mark:'Mark',entry:'Entry'}}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
