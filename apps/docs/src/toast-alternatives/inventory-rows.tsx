'use client';
import {List} from '@bloxwap/hig/react/data';
import {useCallback,useState} from 'react';

export type ToastInstance={platform:string;file:string;line:number;api:string;code:string};
const keyFor=(row:ToastInstance)=>`${row.file}:${row.line}:${row.code}`;

function InventoryRow({row,expanded}:{row:ToastInstance;expanded:WeakSet<ToastInstance>}){
 const [open,setOpen]=useState(()=>expanded.has(row));
 return <details open={open} onToggle={event=>{
  const next=event.currentTarget.open;
  if(next)expanded.add(row);
  else expanded.delete(row);
  setOpen(next);
 }}>
  <summary style={{minHeight:44,overflowWrap:'anywhere'}}>{row.platform} · {row.file}:{row.line} · {row.api}</summary>
  {open&&<pre style={{overflowX:'auto',maxHeight:400}}><code>{row.code}</code></pre>}
 </details>;
}

export default function InventoryRows({rows}:{rows:ToastInstance[]}){
 const [expanded]=useState(()=>new WeakSet<ToastInstance>());
 const render=useCallback((row:ToastInstance)=><InventoryRow row={row} expanded={expanded}/>,[expanded]);
 return rows.length?<List label="Matching toast calls" items={rows} keyFor={keyFor} render={render}/>:null;
}
