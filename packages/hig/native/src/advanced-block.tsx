import React from 'react';
import {View} from 'react-native';
import {Check} from '@bloxwap/icons/native/check';
import {X} from '@bloxwap/icons/native/x';
import type {AdvancedBlockProps} from '@bloxwap/hig/contracts/advanced-block';
import {ListGroup,ListRow} from './list-group.js';
import {useColors} from './provider.js';
import {ScreenHeader} from './screen-header.js';
import {InlineNotice} from './status.js';
import {shortAddress} from './swap-shared.js';

export type {AdvancedBlockProps,AdvancedTask,AdvancedWallet} from '@bloxwap/hig/contracts/advanced-block';

export function AdvancedBlock(props:AdvancedBlockProps){
 const colors=useColors();
 const {tasks,wallets}=props;
 const completed=tasks.filter(task=>task.complete).length;
 return <View testID={props.testID} style={{gap:20}}>
  <ScreenHeader title={props.title} onBack={props.onBack} headingId={props.headingId}/>
  <ListGroup><ListRow label={props.exchangeLabel} checked={props.unifiedExchange} onCheckedChange={props.onUnifiedExchangeChange} disabled={props.exchangeDisabled}/></ListGroup>
  {tasks.length>0&&<ListGroup title={props.tasksTitle} titleAccessory={`(${completed}/${tasks.length})`}>
   {tasks.map(task=>{
    const Mark=task.complete?Check:X;
    return <ListRow key={task.id} label={task.label} value={task.detail} onSelect={task.onSelect} disabled={task.disabled}
     accessibilityLabel={[task.label,task.detail,task.complete?props.completeLabel:props.incompleteLabel].join(', ')}
     trailing={<Mark size={20} color={task.complete?colors.positive:colors.negative}/>}/>;
   })}
  </ListGroup>}
  <InlineNotice severity="warning" title={props.warningTitle} description={props.warningBody}/>
  <ListGroup title={props.accountTitle}>
   {wallets.map(wallet=><ListRow key={wallet.id} label={wallet.label} value={shortAddress(wallet.address)} onSelect={wallet.onExport} disabled={wallet.disabled}/>)}
   <ListRow label={props.deleteLabel} tone="destructive" onSelect={props.onDeleteAccount}/>
  </ListGroup>
 </View>;
}
