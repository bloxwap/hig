import React,{useEffect,useMemo,useState} from 'react';
import type {ChoicesProps} from './selection.js';

import {rowMeasurements} from './row-measurements.js';

const overscan=4;
const estimate=48;

/** Keep the active descendant mounted even when a keyboard jump or manual scroll takes it outside the window. */
export function SelectWindow({options,active,list,renderOption}:{
 options:ChoicesProps['options'];active:number;list:React.RefObject<HTMLDivElement|null>;
 renderOption:(option:ChoicesProps['options'][number],index:number)=>React.ReactElement;
}){
 const [viewport,setViewport]=useState({top:0,height:320});
 const [,refresh]=useState(0);
 const rows=useMemo(()=>rowMeasurements(options.length,estimate),[options]);
 const start=Math.max(0,rows.rowAt(viewport.top)-overscan);
 const end=Math.min(options.length,rows.rowAt(viewport.top+viewport.height)+1+overscan);
 useEffect(()=>{
  const popup=list.current;
  if(!popup)return;
  let frame=0;
  const sample=()=>{
   frame=0;
   const top=Math.max(0,popup.scrollTop-popup.clientTop),height=popup.clientHeight;
   setViewport(previous=>previous.top===top&&previous.height===height?previous:{top,height});
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(sample);};
  popup.addEventListener('scroll',schedule,{passive:true});
  const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(schedule);
  observer?.observe(popup);schedule();
  return ()=>{cancelAnimationFrame(frame);observer?.disconnect();popup.removeEventListener('scroll',schedule);};
 },[list]);
 const pinned=active>=0&&active<options.length&&(active<start||active>=end)?active:-1;
 useEffect(()=>{
  if(!list.current||typeof ResizeObserver==='undefined')return;
  const observer=new ResizeObserver(entries=>{
   let changed=false;
   for(const entry of entries){
    const index=Number(entry.target.getAttribute('aria-posinset'))-1;
    const height=entry.borderBoxSize[0]?.blockSize;
    if(height>0&&options[index]&&rows.measure(index,height))changed=true;
   }
   if(changed)refresh(value=>value+1);
  });
  list.current.querySelectorAll('[role="option"]').forEach(row=>observer.observe(row));
  return ()=>observer.disconnect();
 },[list,options,rows,start,end,pinned]);
 const indices=Array.from({length:end-start},(_,index)=>start+index);
 if(pinned>=0&&pinned<start)indices.unshift(pinned);
 if(pinned>=end)indices.push(pinned);
 const children:React.ReactNode[]=[];
 let previous=0;
 for(const index of indices){
  if(index>previous)children.push(<div key={'gap-'+index} aria-hidden style={{height:rows.offset(index)-rows.offset(previous)}}/>);
  children.push(<React.Fragment key={'option-'+options[index].value}>{renderOption(options[index],index)}</React.Fragment>);
  previous=index+1;
 }
 if(previous<options.length)children.push(<div key='last-gap' aria-hidden style={{height:rows.offset(options.length)-rows.offset(previous)}}/>);
 return <>{children}</>;
}
