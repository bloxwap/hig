'use client';

import {lazy,Suspense,useEffect,useState} from 'react';

const Controls=lazy(()=>import('../src/playground'));

export function Playground(){
  // Read shared configuration from the browser URL on the first render of Controls.
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  const loading=<p role="status">Loading interactive examples…</p>;
  return mounted?<Suspense fallback={loading}><Controls/></Suspense>:loading;
}
