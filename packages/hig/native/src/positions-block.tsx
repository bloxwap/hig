import React,{useState} from 'react';
import {View} from 'react-native';
import {Text} from './surface.js';
import {PositionSummaryRow,type ManagePositionBlockSummary} from './manage-position-block.js';
import {ScreenHeader} from './screen-header.js';
import {ListGroup} from './list-group.js';
import {Button} from './button.js';
import {SegmentedControl} from './radio-group.js';
export interface OpenPosition extends Omit<ManagePositionBlockSummary,'onSelect'> {
 id:string;side:'long'|'short';
}
export interface PositionsBlockProps {
 labels:{title:string;all:string;wins:string;losses:string;long:string;short:string;empty:string;closeAll:(count:number)=>string};
 positions:readonly OpenPosition[];
 onSelect:(position:OpenPosition)=>void;
 /** Acts on every open position, including rows hidden by the filter. */
 onCloseAll:()=>void;
 closing?:boolean;
 pnlOptions?:Intl.NumberFormatOptions;
 onBack?:()=>void;
 headerAction?:React.ReactNode;
 headingId?:string;
}
export function PositionsBlock({labels,positions,onSelect,onCloseAll,closing,pnlOptions,onBack,headerAction,headingId}:PositionsBlockProps){
 const [filter,setFilter]=useState('all');
 const options=[{value:'all',label:labels.all},{value:'wins',label:labels.wins},{value:'losses',label:labels.losses}];
 const visible=positions.filter(p=>filter==='all'||(p.pnl!=null&&Number.isFinite(p.pnl)&&(filter==='wins'?p.pnl>0:p.pnl<0)));
 return <View style={{gap:16}}>
  <ScreenHeader title={labels.title} onBack={onBack} action={headerAction} headingId={headingId}/>
  <SegmentedControl label={labels.title} hideLabel value={filter} onValueChange={setFilter} options={options}/>
  {visible.length>0?<ListGroup>
   {visible.map(position=><PositionSummaryRow key={position.id} position={{...position,onSelect:()=>onSelect(position)}} side={position.side} labels={labels} pnlOptions={pnlOptions} disclosure/>)}
  </ListGroup>:<Text tone='muted'>{labels.empty}</Text>}
  <Button fullWidth intent='secondary' disabled={!positions.length} busy={closing} onPress={onCloseAll}>{labels.closeAll(positions.length)}</Button>
 </View>;
}
