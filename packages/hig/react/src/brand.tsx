import React from 'react';
/** Exact approved geometry from pinned Font docs mark; metadata lives in SVG asset. */
export function BrandMark({size=32,label}: {size?:number;label?:string}){return <svg width={size} height={size} viewBox='0 0 100 100' role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true}><rect width='100' height='100' rx='22.37' fill='#00ff3f'/><g fill='none' stroke='#0a0a0a' strokeWidth='16' strokeLinecap='round'><path d='M25 75L75 25'/><path d='M24 24L35 35'/><path d='M65 65L76 76'/></g></svg>;}
export function CheckIcon(){return <svg width='20' height='20' viewBox='0 0 24 24' aria-hidden='true'><path d='m5 12 4 4 10-10' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></svg>;}
