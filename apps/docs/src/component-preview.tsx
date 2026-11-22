import React,{lazy,Suspense,useMemo,useState} from 'react';
import {SegmentedControl,Select} from '@bloxwap/hig/react/selection';
import {Tabs} from '@bloxwap/hig/react/navigation';
import {Badge} from '@bloxwap/hig/react/status';
import {ExampleCode,type Entry} from './example-code';
import {StateLinks,stateLabel} from './example-state-links';
import type {PreviewComponent} from './demo';
const ToastAlternatives=lazy(()=>import('./toast-alternatives/gallery'));
const addressChains=['ethereum','solana','bitcoin'].map(value=>({value,label:stateLabel(value)}));
const addressOrientations=['vertical','horizontal'].map(value=>({value,label:stateLabel(value)}));
function AddressLockupControls({state,onChange}:{state:string;onChange:(state:string)=>void}){
 const [chain,orientation]=(state==='default'?'solana-vertical':state).split('-');
 const select=(chain:string,orientation:string)=>onChange(chain==='solana'&&orientation==='vertical'?'default':chain+'-'+orientation);
 return <div className='example-toolbar'>
  <SegmentedControl label='Orientation' options={addressOrientations} value={orientation} onValueChange={value=>select(chain,value)}/>
  <SegmentedControl label='Chain' options={addressChains} value={chain} onValueChange={value=>select(value,orientation)}/>
 </div>;
}
export function ComponentPreview({entry,state,onStateChange,density,Preview}: {entry:Entry;state:string;onStateChange:(state:string)=>void;density:string;Preview:PreviewComponent}) {
 const [platform,setPlatform]=useState('react');
 const [view,setView]=useState('preview');
 const stateOptions=useMemo(()=>entry.states.map(value=>({value,label:stateLabel(value,entry.name)})),[entry.states,entry.name]);
 return <section className='component-demo not-prose' aria-label={`${entry.name} examples`}>
  <div className='example-toolbar'>
   <div className='example-summary'><p className='example-label'>Interactive example</p><div className='support-row'><Badge>React</Badge><Badge>{entry.nativeSupport==='renderer'?'Native renderer':'Native alternative'}</Badge></div></div>
   {entry.name==='AddressLockup'?<AddressLockupControls state={state} onChange={onStateChange}/>:<Select label='Example state' options={stateOptions} value={entry.states.includes(state)?state:'default'} onValueChange={onStateChange}/>}
  </div>
  {entry.name!=='AddressLockup'&&entry.states.length>1&&<StateLinks entry={entry} state={state} onStateChange={onStateChange}/>}
  <div className='example-platforms'><Tabs label='Example platform' value={platform} onValueChange={setPlatform} items={[
   {value:'react',label:'React',content:<div className='example-frame'><Tabs label='Preview or code' value={view} onValueChange={setView} items={[
    {value:'preview',label:'Preview',content:<div className='example-canvas' data-component={entry.name}><Suspense fallback={<p role='status'>Loading preview…</p>}><Preview key={`${entry.name}:${state}`} name={entry.name} state={state}/></Suspense></div>},
    {value:'code',label:'Code',content:platform==='react'&&view==='code'&&<ExampleCode key={entry.name} entry={entry} platform='react' density={density} state={state}/>},
   ]}/></div>},
   {value:'native',label:'React Native',content:<div className='native-example-note'><p>{entry.nativeSupport==='renderer'?'Run this native example in the Expo gallery.':'Use the documented native alternative in the Expo gallery.'} Physical-device review is pending.</p>{platform==='native'&&<ExampleCode key={entry.name} entry={entry} platform='native' density={density} state={state}/>}</div>},
  ]}/></div>
  {entry.name==='Toast'&&<Suspense fallback={<p>Loading alternatives…</p>}><ToastAlternatives/></Suspense>}
  <p className='example-note'>Demo data · Physical-device review pending</p>
 </section>;
}
