import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import './fonts.css';
import '@bloxwap/hig-tokens/css';
// Page-wide element defaults (box-sizing, focus ring, table, range) are opt-in since #95; import them before the component CSS.
import '@bloxwap/hig-react/css/base';
import '@bloxwap/hig-react/css';
import {HIGProvider} from '@bloxwap/hig-react/provider';
import {Button} from '@bloxwap/hig-react/button';
import {Field,AmountInput,TextArea} from '@bloxwap/hig-react/field';
import {Slider,RadioGroup,Switch} from '@bloxwap/hig-react/selection';
import {Dialog,AlertDialog,Menu} from '@bloxwap/hig-react/overlay';
import {Tabs,Search,Navigation,Accordion} from '@bloxwap/hig-react/navigation';
import {Toast} from '@bloxwap/hig-react/status';
function App(){
 const [amount,setAmount]=useState(''),[submitted,setSubmitted]=useState(0),[open,setOpen]=useState(false),[nested,setNested]=useState(false),[query,setQuery]=useState(''),[rtl,setRTL]=useState(false),[notices,setNotices]=useState(Array.from({length:5},(_,i)=>({id:String(i),message:`Outcome ${i}`,severity:'error' as const}))),[retry,setRetry]=useState(0);
 return <HIGProvider direction={rtl?'rtl':'ltr'}><main style={{maxWidth:700,padding:24,margin:'auto'}}><h1>Software acceptance flows</h1><Switch label='RTL' checked={rtl} onCheckedChange={setRTL}/><form onSubmit={e=>{e.preventDefault();setSubmitted(n=>n+1);}}><Field label='Amount' required description='Raw decimal string; no conversion'><AmountInput value={amount} onChange={e=>setAmount(e.target.value)}/></Field><Field label='Note'><TextArea defaultValue='日本語 العربية עברית'/></Field><Button type='submit'>Submit amount</Button><p role='status'>Submitted {submitted}: {amount}</p></form><Slider label='Adjustment' defaultValue={20} step={5}/><RadioGroup label='Side' defaultValue='buy' options={[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}]}/><Tabs label='Translated tabs' items={[{value:'a',label:'الملخص',content:'Summary'},{value:'b',label:'التفاصيل',content:'Details'},{value:'c',label:'Unavailable tab',disabled:true,content:'Disabled'}]}/><Dialog open={open} onOpenChange={setOpen} title='Outer review' description='Scrollable review details' trigger={<Button>Open outer</Button>}><AlertDialog open={nested} onOpenChange={setNested} title='Nested confirmation' description='Explicit cancel required' trigger={<Button>Open nested</Button>}><Button onClick={()=>setNested(false)}>Accept nested</Button></AlertDialog><Field label='Dialog note'><TextArea/></Field></Dialog><Menu label='Actions' items={[{label:'Unavailable action',disabled:true,onSelect:()=>setRetry(-1)},{label:'Retry action',onSelect:()=>setRetry(n=>n+1)}]}/><Navigation label='Current location' items={[{label:'Acceptance',href:'/acceptance.html',active:true}]}/><Accordion title='Long translated label: Überprüfen Sie die Transaktionsdetails vor der Bestätigung'><p>Persistent details</p></Accordion><Search query={query} onQueryChange={setQuery} results={query?[{id:'result',label:'Search result',onSelect:()=>setQuery('')}]:[]}/><Toast notices={notices.map(n=>({...n,action:n.id==='0'?<Button onClick={()=>setRetry(n=>n+1)}>Retry oldest</Button>:undefined}))} onDismiss={id=>setNotices(n=>n.filter(x=>x.id!==id))}/><p>Retries: {retry}</p><Button busy>Busy control</Button><Button disabled>Disabled control</Button></main></HIGProvider>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
