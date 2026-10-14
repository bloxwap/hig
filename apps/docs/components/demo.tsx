'use client';
import dynamic from 'next/dynamic';
const Interactive=dynamic(()=>import('../src/demo').then(m=>m.Demo),{ssr:false,loading:()=> <p role='status'>Loading interactive examples…</p>});
export function Demo({route}:{route:string}){return <Interactive route={route}/>;}
