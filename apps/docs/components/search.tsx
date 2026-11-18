'use client';

import { experimental_useSearch as useSearch } from 'fumadocs-core/search/client';
import type { SortedResult } from 'fumadocs-core/search';
import { useCallback, useEffect, useRef } from 'react';
import type { SearchReply, SearchRequest } from './search.worker';
import {
  SearchDialog, SearchDialogClose, SearchDialogContent, SearchDialogHeader,
  SearchDialogIcon, SearchDialogInput, SearchDialogList, SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import {loadSearchMarkup} from './search-result-markup';
import { asset } from '@/lib/site';

export default function StaticSearch(props: SharedProps) {
  const worker = useRef<Worker | null>(null);
  const requests = useRef(new Map<number, {resolve:(results:SortedResult[])=>void; reject:(error:Error)=>void}>());
  const sequence = useRef(0);
  const stop = useCallback((reason:string)=>{
    worker.current?.terminate();
    worker.current=null;
    for(const request of requests.current.values())request.reject(new Error(reason));
    requests.current.clear();
  },[]);
  useEffect(()=>()=>stop('Search closed'),[stop]);
  const run = useCallback((query:string)=>{
    if(!worker.current){
      const thread=new Worker(new URL('./search.worker.ts',import.meta.url));
      thread.onmessage=({data}:{data:SearchReply})=>{
        const request=requests.current.get(data.id);
        if(!request)return;
        requests.current.delete(data.id);
        if('results' in data)request.resolve(data.results);
        else {request.reject(new Error(data.error));stop(data.error);}
      };
      thread.onerror=()=>stop('Search worker failed');
      thread.onmessageerror=()=>stop('Search result could not be read');
      worker.current=thread;
    }
    const id=++sequence.current;
    const results=new Promise<SortedResult[]>((resolve,reject)=>{
      requests.current.set(id,{resolve,reject});
      worker.current!.postMessage({id,query,from:asset('/search.json')} satisfies SearchRequest);
    });
    return Promise.all([results,loadSearchMarkup()]).then(([items])=>items);
  },[stop]);
  const { search, onSearchChange, isLoading, data, error } = useSearch(run,{delayMs:150});
  return <SearchDialog search={search} onSearchChange={onSearchChange} isLoading={isLoading} {...props}>
    <SearchDialogOverlay />
    <SearchDialogContent>
      <SearchDialogHeader className="search-header"><SearchDialogIcon /><SearchDialogInput /><SearchDialogClose /></SearchDialogHeader>
      {error && <p role="alert">Search could not load. Edit your query to retry.</p>}
      <SearchDialogList items={data?.items ?? null} />
    </SearchDialogContent>
  </SearchDialog>;
}
