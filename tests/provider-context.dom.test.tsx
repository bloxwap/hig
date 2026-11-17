// @vitest-environment jsdom
import React,{memo,useState} from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {act,cleanup,render} from '@testing-library/react';
import {HIGProvider,useHIG} from '../packages/hig/react/src/provider';
afterEach(cleanup);
describe('HIGProvider context value',()=>{
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
