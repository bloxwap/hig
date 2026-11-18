'use client';

import {useLayoutEffect,useRef} from 'react';

export function GuideContainment(){
  const marker=useRef<HTMLSpanElement>(null);
  useLayoutEffect(()=>{
    const guide=marker.current?.parentElement;
    // Leave deep-link placement and restored scroll positions to the browser on entry.
    if(!guide||location.hash||window.scrollY>0||typeof ResizeObserver==='undefined')return;
    const blocks=guide.querySelectorAll<HTMLElement>(':scope > :is(figure,.docs-table-scroll)');
    const widths=new WeakMap<Element,number>();
    const observer=new ResizeObserver(entries=>{
      for(const entry of entries){
        const block=entry.target as HTMLElement;
        const {width,height}=entry.contentRect;
        const previous=widths.get(block);
        widths.set(block,width);
        if(previous!==undefined&&width!==previous){
          // Wrapping may change the natural height. Measure with the contents visible.
          block.style.removeProperty('--guide-block-height');
          observer.unobserve(block);
          observer.observe(block);
        }else if(height>0){
          block.style.setProperty('--guide-block-height',height+'px');
        }
      }
    });
    for(const block of blocks)observer.observe(block);
    return ()=>{
      observer.disconnect();
      for(const block of blocks)block.style.removeProperty('--guide-block-height');
    };
  },[]);
  return <span ref={marker} hidden/>;
}
