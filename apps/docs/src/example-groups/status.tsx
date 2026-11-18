// Generated from planning/examples.json.
import React,{useState} from 'react';
import {Button} from '@bloxwap/hig/react/button';
import {Badge,Alert,Callout,Toast,Progress,Spinner,Skeleton,EmptyState,StatusIndicator,InlineNotice} from '@bloxwap/hig/react/status';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Badge,Alert,Button,InlineNotice,Callout,Toast,Progress,Spinner,Skeleton,EmptyState,StatusIndicator};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [message,setMessage]=useState('');
const [notices,setNotices]=useState([{id:'1',message:'Demo copied',severity:'success' as const}]);
const busy=state==='busy';
const error=state==='error'?'Data unavailable. Retry when connected.':undefined;
function preview(){switch(name){case "Badge":return <C.Badge>Demo data</C.Badge>;
case "Alert":return <C.Alert title={error?'Data unavailable':'Sample status'} severity={error?'error':'info'} action={<C.Button intent='secondary' onClick={()=>setMessage('Retry requested')}>Retry</C.Button>}><C.Text>{error??'Essential state stays visible with feedback off.'}</C.Text></C.Alert>;
case "InlineNotice":return state==="success"?<C.InlineNotice severity='success' title='Transfer complete' description='Your funds are available.'/>:state==="warning"?<C.InlineNotice severity='warning' title='Transfer delayed' description='Allow an extra business day.'/>:state==="error"?<C.InlineNotice severity='error' title='Transfer failed' description='Check the account details before trying again.'/>:<C.InlineNotice severity='info' title='Transfer timing' description='Bank transfers usually arrive within three business days.'/>;
case "Callout":return <C.Callout severity='tip' announce={false} title={<>Display-only <code>value</code> strings</>}><C.Text>Keep raw financial strings in host business logic.</C.Text></C.Callout>;
case "Toast":return <C.Toast notices={notices} onDismiss={id=>setNotices(notices.filter(n=>n.id!==id))}/>;
case "Progress":return <C.Progress label='Loading markets' value={busy?undefined:40}/>;
case "Spinner":return <C.Spinner label='Fetching prices'/>;
case "Skeleton":return <C.Skeleton label='Loading balance'/>;
case "EmptyState":return <C.EmptyState title='No open positions' description='Positions supplied by the host appear here.' action={<C.Button intent='secondary' onClick={()=>setMessage('Refresh requested')}>Refresh</C.Button>}/>;
case "StatusIndicator":return <C.StatusIndicator label='Market data' state={error?'offline':'stale'}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
