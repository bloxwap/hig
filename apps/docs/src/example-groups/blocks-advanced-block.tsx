// Generated from planning/examples.json.
import React,{useState} from 'react';
import {AdvancedBlock} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,AdvancedBlock};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [checked,setChecked]=useState(false);
const [message,setMessage]=useState('');
function preview(){switch(name){case "AdvancedBlock":return <C.AdvancedBlock title="Advanced" exchangeLabel="Unified Exchange" unifiedExchange={checked} onUnifiedExchangeChange={setChecked} tasksTitle="Tasks" completeLabel="Complete" incompleteLabel="Incomplete" tasks={[{id:"referral",label:"Referral",detail:"4% off"},{id:"agent",label:"Agent wallet",detail:"0-sig trading"},{id:"builder",label:"Builder fee",detail:"Support us"}].map(task=>({...task,complete:state==="completed",onSelect:()=>setMessage(task.label+" selected")}))} warningTitle="Sensitive — never share" warningBody="These export your wallets’ private keys. Anyone who sees them controls your funds forever. Never share them with anyone, for any reason." accountTitle="Account" wallets={[{id:"solana",label:"Export Solana",address:"72ze…9Gij",onExport:()=>setMessage("Solana export requested")},{id:"ethereum",label:"Export Ethereum",address:"5459…6263",onExport:()=>setMessage("Ethereum export requested")}]} deleteLabel="Delete account" onDeleteAccount={()=>setMessage("Account deletion requested")} onBack={()=>setMessage("Back selected")}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
