'use client';
import {lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {basePath} from '../../lib/site';

import type {ToastInstance} from './inventory-rows';
const InventoryRows=lazy(()=>import('./inventory-rows'));

export function ToastInventory(){
 const region=useRef<HTMLElement>(null);
 const [active,setActive]=useState(false),[instances,setInstances]=useState<ToastInstance[]|null>(null),[failed,setFailed]=useState(false);
 const [query,setQuery]=useState(''),[search,setSearch]=useState(''),[platform,setPlatform]=useState('All');
 useEffect(()=>{
  if(active||!region.current)return;
  if(typeof IntersectionObserver==='undefined'){setActive(true);return;}
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))setActive(true);},{rootMargin:'400px'});
  observer.observe(region.current);
  return ()=>observer.disconnect();
 },[active]);
 useEffect(()=>{
  if(!active)return;
  const abort=new AbortController();
  fetch(`${basePath}/toast-alternatives/instances.json`,{signal:abort.signal}).then(response=>{
   if(!response.ok)throw new Error('Inventory unavailable');
   return response.json() as Promise<ToastInstance[]>;
  }).then(rows=>{if(!abort.signal.aborted)setInstances(rows);}).catch(()=>{if(!abort.signal.aborted)setFailed(true);});
  return ()=>abort.abort();
 },[active]);
 useEffect(()=>{
  const timer=setTimeout(()=>setSearch(query.toLowerCase()),180);
  return ()=>clearTimeout(timer);
 },[query]);
 const matching=useMemo(()=>{
  if(!instances)return [];
  if(platform==='All'&&!search)return instances;
  return instances.filter(row=>(platform==='All'||row.platform===platform)&&(!search||`${row.file} ${row.api} ${row.code}`.toLowerCase().includes(search)));
 },[instances,platform,search]);
 return <section ref={region} aria-label="Isolated toast calls" onFocusCapture={()=>setActive(true)}>
  <h3>Isolated toast calls{instances&&` (${instances.length})`}</h3>
  {failed?<p role="alert">Source inventory could not load. Reload this page to retry.</p>:active&&!instances?<p role="status">Loading source inventory…</p>:null}
  <p>Search titles, translation keys, source paths, and payloads. Each entry retains its original arguments, including specialized trade, signup, tournament, countdown, and update presentations.</p>
  <label>Platform <select style={{minHeight:44}} value={platform} onChange={event=>setPlatform(event.target.value)}>{['All','App','Mobile'].map(value=><option key={value}>{value}</option>)}</select></label>{' '}
  <label>Search <input style={{minHeight:44}} type="search" value={query} onChange={event=>setQuery(event.target.value)}/></label>
  {instances&&<p>{matching.length} matching calls</p>}
  {active&&<Suspense fallback={instances?<p role="status">Loading source inventory…</p>:null}><InventoryRows rows={matching}/></Suspense>}
 </section>;
}
