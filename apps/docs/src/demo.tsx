'use client';
import React,{useEffect,useState,Suspense} from 'react';

import {HIGProvider} from '@bloxwap/hig/react/provider';
import {DemoFeedback,useDemoFeedback} from './demo-feedback';
import {Example,type Entry} from './example-code';
import {PreviewToaster,toastExamples} from './toast-examples';
export interface DemoProps {route:string; catalogEntry?:Entry; title?:string}
export type PreviewComponent=React.ComponentType<React.ComponentProps<typeof Example>>;
type PreviewProps=DemoProps&{Preview?:PreviewComponent;Flow?:React.ComponentType;Renderer?:typeof import('./component-preview').ComponentPreview};
function App({route,catalogEntry,title,Preview=Example,Flow,Renderer}:PreviewProps){
 const {motion,sink}=useDemoFeedback();
 const [density,setDensity]=useState<'compact'|'comfortable'>('comfortable');
 const [pageState,setPageState]=useState('default');
 useEffect(()=>{
  const parameters=new URLSearchParams(location.search);
  const linked=parameters.get('state');
  setDensity(parameters.get('preset')==='pro'?'compact':'comfortable');
  setPageState(linked&&catalogEntry?.states.includes(linked)?linked:'default');
  document.title=`${title??catalogEntry?.name??'Component catalog'} · Bloxwap HIG 0.1.0`;
 },[route,catalogEntry,title]);
 const showExample=(next:string)=>{setPageState(next);history.replaceState(null,'',next==='default'?location.pathname:`${location.pathname}?state=${next}`);};
 const preview=Flow?<Flow/>:catalogEntry&&Renderer&&<Renderer entry={catalogEntry} state={pageState} onStateChange={showExample} density={density} Preview={Preview}/>;
 return <HIGProvider density={density} feedback={sink} reducedMotion={!motion?true:undefined}>
  {preview}
  {catalogEntry&&toastExamples.has(catalogEntry.name)&&<Suspense fallback={null}><PreviewToaster state={catalogEntry?.name==='Toaster'?pageState:'default'}/></Suspense>}
 </HIGProvider>;
}
export function Demo(props:PreviewProps){return <DemoFeedback><App {...props}/></DemoFeedback>;}
