'use client';

import { FrameworkProvider, type Framework } from 'fumadocs-core/framework';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import { SearchProvider, useSearchContext } from 'fumadocs-ui/contexts/search';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { lazy, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { DocsLink } from './docs-link';

type SearchComponent = typeof import('./search').default;

let preparedDialog:SearchComponent|null=null;
function loadDialog(){
  return import('./search').then(({default:Dialog})=>{
    preparedDialog=Dialog;
    return Dialog;
  });
}

function StaticSearch(props: SharedProps) {
  const [Dialog, setDialog] = useState<SearchComponent | null>(()=>preparedDialog);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if(Dialog)return;
    let mounted = true;
    loadDialog().then(
      component => {
        if (mounted) setDialog(() => component);
      },
      reason => {
        if (mounted) setError(reason instanceof Error ? reason : new Error(String(reason)));
      },
    );
    return () => { mounted = false; };
  }, [Dialog]);

  if (error) throw error;
  return Dialog ? <Dialog {...props} /> : null;
}

const DocsImage = lazy(() => import('next/image')) as Framework['Image'];

function InitialSearch(){
  const {setOpenSearch}=useSearchContext();
  useLayoutEffect(()=>{
    const startup=window as Window & {higTakeInitialSearch?:()=>boolean};
    if(startup.higTakeInitialSearch?.())setOpenSearch(true);
  },[setOpenSearch]);
  useEffect(()=>{
    if(preparedDialog)return;
    function stop(){
      document.removeEventListener('pointerover',prepare);
      document.removeEventListener('focusin',prepare);
    }
    function prepare(event:Event){
      if(!(event.target instanceof Element)||!event.target.closest('button[data-search]'))return;
      stop();
      // A failed speculative load is retried by the dialog on open.
      void loadDialog().catch(()=>{});
    }
    document.addEventListener('pointerover',prepare);
    document.addEventListener('focusin',prepare);
    return stop;
  },[]);
  return null;
}

export function Provider({ children }: { children: ReactNode }) {
  return (
    <FrameworkProvider useParams={useParams} usePathname={usePathname} useRouter={useRouter} Link={DocsLink} Image={DocsImage}>
      <SearchProvider SearchDialog={StaticSearch} preload={false}>
        <InitialSearch/>
        {children}
      </SearchProvider>
    </FrameworkProvider>
  );
}
