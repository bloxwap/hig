// @vitest-environment jsdom
import React,{memo,useState} from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,render} from '@testing-library/react';
import {HIGProvider,useHIG,usePresentNumber,useReadoutFormat} from '../packages/hig/react/src/provider';
import {ListRow} from "../packages/hig/react/src/list-group";
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('HIGProvider context value',()=>{
 it('updates only currency subscribers when currency display changes',()=>{
  const reads={plain:0,currency:0};
  function Reader({currency}:{currency:boolean}){
   reads[currency?'currency':'plain']++;
   const {locale,staleLabel}=useReadoutFormat(currency);
   return <span>{locale}/{staleLabel}</span>;
  }
  const readers=Array.from({length:40},(_,i)=><Reader key={i} currency={i%2===0}/>);
  const host=(currencyDisplay:'symbol'|'code',locale='en-US',stale='Stale')=>
   <HIGProvider numberFormat={{currencyDisplay,locale}} messages={{stale}}>{readers}</HIGProvider>;
  const view=render(host('symbol'));
  reads.plain=reads.currency=0;
  for(let i=0;i<5;i++)view.rerender(host(i%2?'symbol':'code'));
  expect(reads).toEqual({plain:0,currency:100});
  view.rerender(host('code','fr-FR'));
  view.rerender(host('code','fr-FR','Périmé'));
  expect(view.getAllByText('fr-FR/Périmé')).toHaveLength(40);
  expect(reads).toEqual({plain:40,currency:140});
 });
 it('keeps numeric consumers idle for newly allocated equivalent options',()=>{
  let reads=0;
  function Reader(){
   reads++;
   const {locale}=useReadoutFormat();
   const format=usePresentNumber()({style:'currency'} as Intl.NumberFormatOptions);
   return <span>{[locale,format.currencyDisplay,format.useGrouping].join('/')}</span>;
  }
  const readers=Array.from({length:40},(_,i)=><Reader key={i}/>);
  const host=(locale:string,currencyDisplay:'symbol'|'code',useGrouping:boolean)=>
   <HIGProvider numberFormat={{locale,currencyDisplay,useGrouping}}>{readers}</HIGProvider>;
  const view=render(host('en-US','symbol',false));
  reads=0;
  for(let i=0;i<5;i++)view.rerender(host('en-US','symbol',false));
  expect(reads).toBe(0);
  view.rerender(host('fr-FR','symbol',false));
  view.rerender(host('fr-FR','code',false));
  view.rerender(host('fr-FR','code',true));
  expect(reads).toBe(120);
  expect(view.getAllByText('fr-FR/code/true')).toHaveLength(40);
 });
 it('keeps readers idle when a nested translation repeats the inherited value',()=>{
  const inherited={close:'Fermer'};
  let reads=0;
  function Reader(){reads++;return <span>{useHIG().messages.close}</span>;}
  const readers=Array.from({length:50},(_,i)=><Reader key={i}/>);
  const host=(close:string)=><HIGProvider messages={inherited}><HIGProvider messages={{close}}>{readers}</HIGProvider></HIGProvider>;
  const view=render(host('Fermer'));
  reads=0;
  for(let i=0;i<5;i++)view.rerender(host('Fermer'));
  expect(reads).toBe(0);
  view.rerender(host('Schließen'));
  expect(reads).toBe(50);
  expect(view.getAllByText('Schließen')).toHaveLength(50);
 });
 it('keeps stable list rows idle during number-format changes',()=>{
  const renders=vi.spyOn(ListRow as unknown as {render:(...args:unknown[])=>React.ReactNode},'render');
  const rows=<>{Array.from({length:50},(_,i)=><ListRow key={i} label={String(i)} onSelect={()=>{}}/>)}</>;
  const view=render(<HIGProvider>{rows}</HIGProvider>);
  renders.mockClear();
  view.rerender(<HIGProvider numberFormat={{currencyDisplay:'code'}}>{rows}</HIGProvider>);
  expect(renders).not.toHaveBeenCalled();
  view.rerender(<HIGProvider messages={{busy:'Working'}}>{rows}</HIGProvider>);
  expect(renders).toHaveBeenCalledTimes(50);
  renders.mockRestore();
 });
 it('shares the OS motion listener and preserves nested overrides',()=>{
  const media=new EventTarget();
  const query=Object.assign(media,{matches:false});
  const match=vi.fn(()=>query);
  const subscribe=vi.spyOn(media,'addEventListener'),unsubscribe=vi.spyOn(media,'removeEventListener');
  vi.stubGlobal('matchMedia',match);
  function Probe(){return <span>{String(useHIG().reducedMotion)}</span>;}
  const view=render(<HIGProvider><HIGProvider><Probe/></HIGProvider><HIGProvider reducedMotion={false}><Probe/></HIGProvider></HIGProvider>);
  expect(match).toHaveBeenCalledTimes(1);expect(subscribe).toHaveBeenCalledTimes(1);
  act(()=>{query.matches=true;query.dispatchEvent(new Event('change'));});
  expect(view.container.textContent).toBe('truefalse');
  view.unmount();expect(unsubscribe).toHaveBeenCalledTimes(1);
 });
 it('keeps independent roots synchronized with one media query subscription',()=>{
  const query=Object.assign(new EventTarget(),{matches:true}),match=vi.fn(()=>query);
  const subscribe=vi.spyOn(query,'addEventListener'),remove=vi.spyOn(query,'removeEventListener');
  vi.stubGlobal('matchMedia',match);
  function Probe(){return <span>{String(useHIG().reducedMotion)}</span>;}
  const roots=Array.from({length:40},()=>render(<HIGProvider><Probe/></HIGProvider>));
  expect(match).toHaveBeenCalledOnce();expect(subscribe).toHaveBeenCalledOnce();
  roots[0].unmount();expect(remove).not.toHaveBeenCalled();
  act(()=>{query.matches=false;query.dispatchEvent(new Event('change'));});
  expect(roots.slice(1).every(root=>root.container.textContent==='false')).toBe(true);
  roots.slice(1).forEach(root=>root.unmount());expect(remove).toHaveBeenCalledOnce();
  render(<HIGProvider><Probe/></HIGProvider>);expect(match).toHaveBeenCalledTimes(2);
 });
 it('keeps one value while nothing in it changes, so a provider that renders again re-renders no reader',()=>{
  let reads=0,bump=()=>{},setLocale:(locale:string)=>void=()=>{};
  const seen:unknown[]=[];
  const Reader=memo(function Reader(){const value=useHIG();reads++;seen.push(value);return <span>{value.locale}</span>;});
  const messages={close:'Fermer'},format={currencyDisplay:'narrowSymbol'} as const;
  function Host(){const [,setTick]=useState(0),[locale,set]=useState('en-US');bump=()=>setTick(tick=>tick+1);setLocale=set;return <HIGProvider locale={locale} messages={messages} numberFormat={format}><Reader/></HIGProvider>;}
  render(<Host/>);
  const settled=reads;
  for(let turn=0;turn<5;turn++)act(()=>bump());
  // Five host renders, no reader render, and the very same object each time.
  expect(reads).toBe(settled);expect(new Set(seen.slice(settled-1)).size).toBe(1);
  // A value that does change still reaches the reader, once.
  act(()=>setLocale('fr-FR'));expect(reads).toBe(settled+1);expect((seen.at(-1) as {locale:string}).locale).toBe('fr-FR');
 });
 it('a nested provider keeps its value too while its parent provider renders again',()=>{
  let reads=0,bump=()=>{};
  const Reader=memo(function Reader(){useHIG();reads++;return null;});
  function Host(){const [,setTick]=useState(0);bump=()=>setTick(tick=>tick+1);return <HIGProvider locale='en-US'><HIGProvider density='compact'><Reader/></HIGProvider></HIGProvider>;}
  render(<Host/>);const settled=reads;act(()=>bump());act(()=>bump());expect(reads).toBe(settled);
 });
});
