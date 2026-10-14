"use client";
import React,{useEffect,useRef} from 'react';
import {NumberReadout,type NumberProps} from './data.js';
import {useHIG} from './provider.js';
/** Optional opacity motion of the final reading; never interpolates transaction values. */
export function AnimatedNumberReadout({duration=180,...props}:NumberProps & {duration?:number}){
 const {reducedMotion}=useHIG();const element=useRef<HTMLSpanElement>(null);const previous=useRef({value:props.value,changedAt:-Infinity});
 useEffect(()=>{if(Object.is(previous.current.value,props.value))return;const old=previous.current.value,now=Date.now(),elapsed=now-previous.current.changedAt;previous.current={value:props.value,changedAt:now};
  if(reducedMotion||elapsed<250||!Number.isFinite(old)||!Number.isFinite(props.value)||!Number.isFinite(duration)||duration<=0)return;
  const animation=element.current?.animate?.([{opacity:.6},{opacity:1}],{duration:Math.min(duration,600),easing:'ease-out'});return()=>animation?.cancel();
 },[props.value,reducedMotion,duration]);
 return <span ref={element}><NumberReadout {...props}/></span>;
}
