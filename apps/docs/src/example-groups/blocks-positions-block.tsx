// Generated from planning/examples.json.
import React,{useState} from 'react';
import {PositionsBlock} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,PositionsBlock};
export function Example({name,state='default',previewDialog}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [open,setOpen]=useState(Boolean(previewDialog));
const [message,setMessage]=useState('');
const empty=state==='empty';
function preview(){switch(name){case "PositionsBlock":return state==="mixed"?<C.PositionsBlock labels={{title:'Positions',all:'All',wins:'Wins',losses:'Losses',long:'Long',short:'Short',empty:'No matching positions',closeAll:n=>'Close All ('+n+')'}} positions={empty||open?[]:[{id:'btc',name:'Bitcoin',symbol:'BTC',icon:<span style={{display:'grid',placeItems:'center',width:40,height:40,borderRadius:20,background:'#f5a623',color:'white',fontSize:25,fontWeight:700}}>₿</span>,side:'long',leverage:40,size:0.0136,pnl:-0.08,pnlPercent:-0.1483},{id:'eth',name:'Ethereum',symbol:'ETH',side:'short',leverage:10,size:1.25,pnl:8.37,pnlPercent:0.2225}]} onBack={()=>setMessage('Back')} onSelect={p=>setMessage(p.name)} onCloseAll={()=>setOpen(true)}/>:<C.PositionsBlock labels={{title:'Positions',all:'All',wins:'Wins',losses:'Losses',long:'Long',short:'Short',empty:'No matching positions',closeAll:n=>'Close All ('+n+')'}} positions={empty||open?[]:[{id:'btc',name:'Bitcoin',symbol:'BTC',icon:<span style={{display:'grid',placeItems:'center',width:40,height:40,borderRadius:20,background:'#f5a623',color:'white',fontSize:25,fontWeight:700}}>₿</span>,side:'long',leverage:40,size:0.0136,pnl:-0.08,pnlPercent:-0.1483}]} onBack={()=>setMessage('Back')} onSelect={p=>setMessage(p.name)} onCloseAll={()=>setOpen(true)}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
