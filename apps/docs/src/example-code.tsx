'use client';
import {lazy,memo,Suspense,useEffect,useState,type ComponentProps} from 'react';

import {basePath} from '../site-config.mjs';

export interface Entry {name:string;route:string;family:string;nativeSupport:string;states:string[]}
const GalleryExample=lazy(()=>import('./examples').then(m=>({default:m.Example})));
const ButtonExample=lazy(()=>import('./example-groups/button').then(m=>({default:m.Example})));
export const Example=memo(function Example(props:ComponentProps<typeof GalleryExample>){
 // The playground starts with Button. Its preview can load without the full gallery registry.
 return (props.name==='Button'||props.name==='IconButton'||props.name==='Link')?<ButtonExample {...props}/>:<GalleryExample {...props}/>;
});

export type ExampleSource = Record<'react'|'native', Record<string,string>>;
const sourceRequests = new Map<string, Promise<ExampleSource>>();
function loadSource(name:string) {
 let request = sourceRequests.get(name);
 if (!request) {
  request = fetch(`${basePath}/examples/${encodeURIComponent(name)}.json`).then(response => {
   if (!response.ok) throw new Error('Example code unavailable');
   return response.json() as Promise<ExampleSource>;
  }).catch(error => {
   sourceRequests.delete(name);
   throw error;
  });
  sourceRequests.set(name, request);
 }
 return request;
}
type SourcePanel=typeof import('./example-code-panel').ExampleCode;
const CodePanel=lazy(()=>import('./example-code-panel').then(module=>({default:module.Code})));
export function ExampleCode(props:Omit<ComponentProps<SourcePanel>,'source'>){
 const name=props.entry.name;
 const [result,setResult]=useState<{name:string;panel:{Renderer:SourcePanel;source:ExampleSource}|null}|null>(null);
 useEffect(()=>{
  let active=true;
  Promise.all([import('./example-code-panel'),loadSource(name)]).then(
   ([module,source])=>{if(active)setResult({name,panel:{Renderer:module.ExampleCode,source}});},
   ()=>{if(active)setResult({name,panel:null});},
  );
  return ()=>{active=false;};
 },[name]);
 if(result?.name!==name)return <p role='status'>Loading example code…</p>;
 if(!result.panel)return <p role='status'>Example code unavailable.</p>;
 const {Renderer,source}=result.panel;
 return <Renderer {...props} source={source}/>;
}
export function Code(props:ComponentProps<typeof CodePanel>){
 return <Suspense fallback={<p role='status'>Loading example code…</p>}><CodePanel {...props}/></Suspense>;
}
