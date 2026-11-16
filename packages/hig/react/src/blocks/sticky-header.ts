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
/** The custom properties the stylesheet reads for the pinned inset and the fill above it. */
const insetProperty='--hig-sticky-inset',coverProperty='--hig-sticky-cover';
const length=(value:number)=>`${value}px`;
const px=(value:string|null|undefined)=>{const number=parseFloat(value??'');return Number.isFinite(number)?number:0;};
/** True when something that takes space in the flow comes before `node`; hidden and out-of-flow siblings do not count. */
function follows(node:HTMLElement){
 for(let sibling=node.previousElementSibling;sibling;sibling=sibling.previousElementSibling){
  const style=getComputedStyle(sibling);
  if(style.display==='none'||style.position==='absolute'||style.position==='fixed')continue;
  if(sibling.getBoundingClientRect().height>0)return true;
 }
 return false;
}
/**
 * How far the header rests below the edge it sticks to: the scroller's content edge (browsers stick inside the scroller's own
 * padding) or the viewport. When the header leads every box between it and the scroller, that distance is the top margins,
 * borders and padding of those boxes, such as a pane's padding; sticking at it keeps the header where it rests. A header that
 * follows other content returns `null`: it scrolls up to the edge before it pins, as before.
 */
export function stickyRestingInset(header:HTMLElement,root:HTMLElement|null):number|null{
 let inset=px(getComputedStyle(header).marginTop);
 for(let node:HTMLElement=header,parent=header.parentElement;parent&&parent!==root;node=parent,parent=parent.parentElement){
  if(follows(node))return null;
  const style=getComputedStyle(parent);
  inset+=px(style.borderTopWidth)+px(style.paddingTop);
  if(parent===document.documentElement)break;
  inset+=px(style.marginTop);
 }
 return inset;
}
/**
 * Marks a pinned header `data-scrolled` once content has scrolled under it, so its fill appears only then and it stays
 * transparent at rest, and pins it where it rests so it does not move when it starts to stick, whatever padding sits between
 * it and the scroller. The header's parent is the content: the header is scrolled once the parent has moved up past the point
 * where the header pins (or the scroller is the parent and has moved). The pinned inset is `--hig-sticky-inset`, and
 * `--hig-sticky-cover` is how far above the header the fill reaches to the scroller's edge, so content does not show through
 * the gap; `data-sticky-inset` marks a header with such a gap. Where the browser supports scroll-driven animations the
 * stylesheet fades the fill in on the same rule for a header that pins at the scroller's very edge; this keeps every other
 * browser, a header with a gap and reduced motion in step with it.
 */
export function useStickyHeader(header:RefObject<HTMLElement|null>,enabled:boolean){
 useEffect(()=>{
  const element=header.current;if(!enabled||!element)return;
  const content=element.parentElement;if(!content)return;
  const root=scroller(content);const target:HTMLElement|Window=root??window;
  // When the parent is the scroller itself a view timeline on it tracks an outer scroller, never its own scrolling, so the
  // stylesheet leaves the scroll-driven fill off (data-sticky-own) and this script alone marks the moment.
  const own=root===content;element.toggleAttribute('data-sticky-own',own);
  let inset=0,leading=false;
  const measure=()=>{
   const resting=stickyRestingInset(element,root);leading=resting!==null;inset=Math.max(0,resting??0);
   const pad=root?px(getComputedStyle(root).paddingTop):0;
   // Any gap above the pinned header (its own inset or the scroller's padding) hands the fill to the script, which marks the
   // moment it pins; a scroll-driven fill would wait for the parent to reach the scroller's outer edge.
   element.toggleAttribute('data-sticky-inset',inset+pad>0.5);
   element.style.setProperty(insetProperty,length(inset));
   element.style.setProperty(coverProperty,length(inset+pad));
  };
  const update=()=>{
   let scrolled:boolean;
   if(own)scrolled=content.scrollTop>0;
   else if(leading){
    // The line the header pins to, and where the header would sit without sticking: the parent's content edge.
    const edge=root?root.getBoundingClientRect().top+root.clientTop+px(getComputedStyle(root).paddingTop):0;
    const parent=getComputedStyle(content),natural=content.getBoundingClientRect().top+px(parent.borderTopWidth)+px(parent.paddingTop)+px(getComputedStyle(element).marginTop);
    scrolled=natural<edge+inset-0.5;
   }else scrolled=content.getBoundingClientRect().top<(root?root.getBoundingClientRect().top:0)-0.5;
   if(element.hasAttribute('data-scrolled')!==scrolled)element.toggleAttribute('data-scrolled',scrolled);
  };
  const resize=()=>{measure();update();};
  resize();
  target.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  return()=>{target.removeEventListener('scroll',update);window.removeEventListener('resize',resize);element.removeAttribute('data-scrolled');element.removeAttribute('data-sticky-own');element.removeAttribute('data-sticky-inset');element.style.removeProperty(insetProperty);element.style.removeProperty(coverProperty);};
 },[header,enabled]);
}
