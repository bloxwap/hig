import React,{lazy,Suspense,useState} from 'react';
import {Tabs} from '@bloxwap/hig/react/navigation';
import type {PreviewComponent} from './demo';
import type {Entry} from './example-code';
import {stateLabel} from './example-state-links';
const LazyModalPreview=lazy(()=>import('./modal-preview'));
function ModalPreview(props:React.ComponentProps<typeof LazyModalPreview>){return <LazyModalPreview {...props}/>;}
const NativeLoginPreview=lazy(()=>import('./native-login-preview'));
export function LoginPlatformPreview({Preview}:{Preview:PreviewComponent}){
 const [platform,setPlatform]=useState('web');
 return <section className='block-demo not-prose'><Tabs label='LoginBlock platform' value={platform} onValueChange={setPlatform}
  items={[{value:'web',label:'Web'},{value:'native',label:'React Native'}].map(item=>({...item,
   content:platform===item.value?<div className='example-frame block-canvas'><div className='example-canvas block-card' data-component='LoginBlock'>
    <Suspense fallback={<p role='status'>Loading preview…</p>}>{item.value==='web'?<Preview name="LoginBlock"/>:<NativeLoginPreview/>}</Suspense>
   </div></div>:null,
  }))}/></section>;
}
export function ModalBlockPreview({entry,state,onStateChange,Preview}:{Preview:PreviewComponent;entry:Entry;state:string;onStateChange:(state:string)=>void}){
  const selected=entry.states.includes(state)?state:'default';
  return <section className='block-demo not-prose'><Tabs label='App modals' value={selected} onValueChange={onStateChange} items={entry.states.map(value=>({
   value,label:value==='default'?'Welcome':stateLabel(value.replaceAll('-',' ')),
   content:value===selected?<div className='example-frame block-canvas modal-canvas'><Suspense fallback={<p role='status'>Loading preview…</p>}><Preview key={value} name={entry.name} state={value} previewDialog={ModalPreview}/></Suspense></div>:null,
  }))}/></section>;
 }
