"use client";
import {useEffect,type RefObject} from 'react';
const scrolls=/(auto|scroll|overlay)/;
/** The nearest ancestor of `node` (itself included) that scrolls vertically, or `null` for the document. */
function scroller(node:HTMLElement|null):HTMLElement|null{
 for(let current=node;current&&current!==document.body&&current!==document.documentElement;current=current.parentElement){
  if(scrolls.test(getComputedStyle(current).overflowY))return current;
 }
 return null;
}
/**
 * Marks a pinned header `data-scrolled` once content has scrolled under it, so its fill appears only then and it stays
 * transparent at rest. The header's parent is the content: the header is scrolled once the parent's top edge has passed
 * the top of the nearest scroller (or the scroller is the parent and has moved). Where the browser supports scroll-driven
 * animations the stylesheet already fades the fill in on the same rule; this keeps every other browser, and reduced
 * motion, in step with it.
 */
export function useStickyHeader(header:RefObject<HTMLElement|null>,enabled:boolean){
 useEffect(()=>{
  const element=header.current;if(!enabled||!element)return;
  const content=element.parentElement;if(!content)return;
  const root=scroller(content);const target:HTMLElement|Window=root??window;
  // When the parent is the scroller itself a view timeline on it tracks an outer scroller, never its own scrolling, so the
  // stylesheet leaves the scroll-driven fill off (data-sticky-own) and this script alone marks the moment.
  const own=root===content;element.toggleAttribute('data-sticky-own',own);
  const update=()=>{
   const scrolled=own?content.scrollTop>0:content.getBoundingClientRect().top<(root?root.getBoundingClientRect().top:0)-0.5;
   if(element.hasAttribute('data-scrolled')!==scrolled)element.toggleAttribute('data-scrolled',scrolled);
  };
  update();
  target.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update,{passive:true});
  return()=>{target.removeEventListener('scroll',update);window.removeEventListener('resize',update);element.removeAttribute('data-scrolled');element.removeAttribute('data-sticky-own');};
 },[header,enabled]);
}
