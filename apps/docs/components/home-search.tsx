'use client';

import {useSearchContext} from 'fumadocs-ui/contexts/search';

export function HomeSearch({full=false}:{full?:boolean}){
  const {setOpenSearch,hotKey}=useSearchContext();
  return <button type="button" data-search="" data-search-full={full?'':undefined}
    aria-label={full?undefined:'Open Search'} onClick={()=>setOpenSearch(true)}>
    <span className="home-search-icon" aria-hidden="true"/>
    {full&&<>Search <span className="home-shortcut">{hotKey.map((key,index)=><kbd key={index}>{key.display}</kbd>)}</span></>}
  </button>;
}
