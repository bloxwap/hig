import React from 'react';
import {Table,type Column,type TableRowProps} from '../packages/react/src/data.js';
import {MarketRow,type MarketRowProps} from '../packages/react/src/recipes/market-row.js';

interface Position {id:string;value:number}
const columns:readonly Column<Position>[]=[{key:'value',label:'Value',align:'end',render:row=>row.value}];
const highlights:TableRowProps={'data-market':'BTC',className:'current-market','aria-current':'true'};
export const proDataTypecheck=<>
 <Table caption='Positions' rows={[{id:'BTC',value:1}]} keyFor={row=>row.id} columns={columns} rowProps={()=>highlights} captionHidden stickyHeader loading state={<p>Refreshing</p>}/>
 <MarketRow symbol='BTC' name='Bitcoin' price={1} change={1} onSelect={()=>{}}/>
 <MarketRow mode='presentation' symbol='BTC' name='Bitcoin' price={1} change={1} priceOptions={{style:'decimal',maximumFractionDigits:8}} changeOptions={{minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'always'}} identity={<><strong>BTC</strong> Bitcoin</>} icon={<span/>} favorite={<span/>} volume='1.2M'/>
</>;
// @ts-expect-error Preserve native table-row semantics.
const rowRole:TableRowProps={role:'button'};
// @ts-expect-error Cells are rendered by columns, not by rowProps.
const rowChildren:TableRowProps={children:'Override'};
// @ts-expect-error HTML cannot replace HIG's cells.
const rowHTML:TableRowProps={dangerouslySetInnerHTML:{__html:'Override'}};
// @ts-expect-error Alignment is logical so it follows RTL layouts.
const physicalAlignment:Column<Position>={key:'value',label:'Value',align:'right',render:row=>row.value};
// @ts-expect-error An action row needs a selection callback.
const missingAction:MarketRowProps={symbol:'BTC',name:'Bitcoin',price:1,change:1};
// @ts-expect-error Presentation mode delegates selection to the host.
const duplicateAction:MarketRowProps={mode:'presentation',symbol:'BTC',name:'Bitcoin',price:1,change:1,onSelect:()=>{}};
// @ts-expect-error Action mode keeps its named HIG button.
const actionIdentity:MarketRowProps={symbol:'BTC',name:'Bitcoin',price:1,change:1,onSelect:()=>{},identity:<span>BTC</span>};
void [actionIdentity,rowRole,rowChildren,rowHTML,physicalAlignment,missingAction,duplicateAction];
