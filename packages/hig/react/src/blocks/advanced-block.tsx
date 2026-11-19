"use client";
import React from 'react';
import {Check} from '@bloxwap/icons/react/check';
import {X} from '@bloxwap/icons/react/x';
import type {AdvancedBlockProps} from '@bloxwap/hig/contracts/advanced-block';
import {ListGroup,ListRow} from '../list-group.js';
import {InlineNotice} from '../status.js';
import {ScreenHeader} from './screen-header.js';
import {shortAddress} from './swap/shared.js';

export type {AdvancedBlockProps,AdvancedTask,AdvancedWallet} from '@bloxwap/hig/contracts/advanced-block';

export function AdvancedBlock(props:AdvancedBlockProps){
 const {tasks,wallets}=props;
 const completed=tasks.filter(task=>task.complete).length;
 return <section className="hig-advanced-block" data-testid={props.testID}>
  <ScreenHeader title={props.title} onBack={props.onBack} headingId={props.headingId}/>
  <ListGroup><ListRow label={props.exchangeLabel} checked={props.unifiedExchange} onCheckedChange={props.onUnifiedExchangeChange} disabled={props.exchangeDisabled}/></ListGroup>
  {tasks.length>0&&<ListGroup title={props.tasksTitle} titleAccessory={`(${completed}/${tasks.length})`}>
   {tasks.map(task=>{
    const Mark=task.complete?Check:X;
    return <ListRow key={task.id} label={task.label} value={task.detail} onSelect={task.onSelect} disabled={task.disabled}
     aria-label={[task.label,task.detail,task.complete?props.completeLabel:props.incompleteLabel].join(', ')}
     trailing={<Mark size={20} aria-hidden="true" className="hig-advanced-task-mark" data-complete={task.complete}/>}/>;
   })}
  </ListGroup>}
  <InlineNotice severity="warning" title={props.warningTitle} description={props.warningBody}/>
  <ListGroup title={props.accountTitle}>
   {wallets.map(wallet=><ListRow key={wallet.id} label={wallet.label} value={shortAddress(wallet.address)} onSelect={wallet.onExport} disabled={wallet.disabled}/>)}
   <ListRow label={props.deleteLabel} tone="destructive" onSelect={props.onDeleteAccount}/>
  </ListGroup>
 </section>;
}
