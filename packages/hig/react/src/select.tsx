"use client";
import React,{useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {useControllable,useHIG} from './provider.js';
import type {ChoicesProps} from './selection.js';

/** A select-only combobox. DOM focus stays on the trigger while its active option is announced. */
export function Select({label,options,value,defaultValue,disabled,onValueChange}:ChoicesProps){
 const id=useId();const {direction,locale}=useHIG();
 const [current,setCurrent]=useControllable(value,defaultValue??options.find(option=>!option.disabled)?.value??'',onValueChange);
 const [open,setOpen]=useState(false);const [active,setActive]=useState(-1);
 const trigger=useRef<HTMLButtonElement>(null);const list=useRef<HTMLDivElement>(null);
 const search=useRef({text:'',time:0});
 const match=options.findIndex(option=>option.value===current);
 const selected=match>=0?match:options.findIndex(option=>!option.disabled);
 const expanded=open&&!disabled&&options.length>0;
 const activeOption=active>=0&&!options[active]?.disabled?options[active]:undefined;
 const optionId=(index:number)=>`${id}-option-${index}`;

 function show(edge?:'first'|'last'){
  if(disabled||!options.length)return;
  // Safari does not focus buttons on pointer activation; the combobox owns keyboard navigation.
  trigger.current?.focus();
  const enabled=options.flatMap((option,index)=>option.disabled?[]:[index]);
  setActive(edge==='last'?(enabled.at(-1)??-1):edge==='first'?(enabled[0]??-1):selected>=0&&!options[selected].disabled?selected:enabled[0]??-1);
  setOpen(true);search.current={text:'',time:0};
 }
 function choose(index:number){
  const option=options[index];if(disabled||!option||option.disabled)return;
  setCurrent(option.value);setOpen(false);trigger.current?.focus();
 }
 function move(delta:number){
  const enabled=options.flatMap((option,index)=>option.disabled?[]:[index]);
  if(!enabled.length)return;
  const position=enabled.indexOf(active);
  setActive(enabled[Math.min(enabled.length-1,Math.max(0,position+delta))]);
 }
 function onKeyDown(event:React.KeyboardEvent<HTMLButtonElement>){
  if(disabled)return;
  if(event.key==='Escape'&&expanded){event.preventDefault();event.stopPropagation();setOpen(false);return;}
  if(event.key==='Tab'){setOpen(false);return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();
   if(!expanded)show();else move(event.key==='ArrowDown'?1:-1);
   return;
  }
  if(event.key==='Home'||event.key==='End'){
   event.preventDefault();show(event.key==='Home'?'first':'last');return;
  }
  if(event.key==='Enter'||(event.key===' '&&(!search.current.text||Date.now()-search.current.time>=700))){
   event.preventDefault();if(expanded)choose(active);else show();return;
  }
  if(event.key.length!==1||event.ctrlKey||event.metaKey||event.altKey)return;
  event.preventDefault();
  const now=Date.now();const previous=now-search.current.time<700?search.current.text:'';
  const text=(previous+event.key).toLocaleLowerCase(locale);
  search.current={text,time:now};
  const query=[...text].every(character=>character===text[0])?text[0]:text;
  const start=expanded?active:selected;
  // Multi-character typeahead also considers the active option; repeated letters cycle matches.
  const offset=query.length>1?0:1;
  for(let step=0;step<options.length;step++){
   const index=(Math.max(start,0)+step+offset)%options.length;const option=options[index];
   if(!option.disabled&&option.label.toLocaleLowerCase(locale).startsWith(query)){
    if(expanded)setActive(index);else setCurrent(option.value);
    break;
   }
  }
 }

 useLayoutEffect(()=>{
  if(!expanded||!trigger.current||!list.current)return;
  const popup=list.current;const button=trigger.current;
  // The top layer escapes overflow clipping without a portal, preserving host theme and modal ownership.
  popup.showPopover?.();
  const position=()=>{
   const rect=button.getBoundingClientRect();const gap=6;const inset=8;
   const viewport=window.visualViewport;
   const width=viewport?.width??window.innerWidth;const height=viewport?.height??window.innerHeight;
   const left=viewport?.offsetLeft??0;const top=viewport?.offsetTop??0;
   const below=top+height-rect.bottom-gap-inset;const above=rect.top-top-gap-inset;
   const desired=Math.min(320,popup.scrollHeight||320);const upwards=below<desired&&above>below;
   const maxHeight=Math.max(0,Math.min(320,upwards?above:below));
   const popupWidth=Math.min(rect.width,Math.max(0,width-inset*2));
   popup.style.width=`${popupWidth}px`;popup.style.maxHeight=`${maxHeight}px`;
   popup.style.left=`${Math.max(left+inset,Math.min(direction==='rtl'?rect.right-popupWidth:rect.left,left+width-popupWidth-inset))}px`;
   popup.style.top=`${upwards?Math.max(top+inset,rect.top-gap-Math.min(popup.scrollHeight,maxHeight)):rect.bottom+gap}px`;
  };
  position();
  const resize=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(position);resize?.observe(button);
  window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
  window.visualViewport?.addEventListener('resize',position);window.visualViewport?.addEventListener('scroll',position);
  return()=>{resize?.disconnect();window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);window.visualViewport?.removeEventListener('resize',position);window.visualViewport?.removeEventListener('scroll',position);};
 },[expanded,direction,options.length]);

 useEffect(()=>{
  if(disabled||!options.length)setOpen(false);
 },[disabled,options.length]);
 useEffect(()=>{
  if(!expanded)return;
  const outside=(event:PointerEvent)=>{const target=event.target as Node;if(!trigger.current?.contains(target)&&!list.current?.contains(target))setOpen(false);};
  // Consume Escape before an enclosing modal's document capture listener can dismiss it too.
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);}};
  document.addEventListener('pointerdown',outside);
  window.addEventListener('keydown',escape,true);
  return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('keydown',escape,true);};
 },[expanded]);
 useEffect(()=>{
  if(!expanded||!activeOption)return;
  const option=document.getElementById(optionId(active));const popup=list.current;
  if(!option||!popup)return;
  // Scroll only the option list: scrollIntoView can unexpectedly move the surrounding page.
  if(option.offsetTop<popup.scrollTop)popup.scrollTop=option.offsetTop;
  else if(option.offsetTop+option.offsetHeight>popup.scrollTop+popup.clientHeight)popup.scrollTop=option.offsetTop+option.offsetHeight-popup.clientHeight;
 },[expanded,active,activeOption,id]);

 return <div className='hig-field'><label id={`${id}-label`} htmlFor={id}>{label}</label><div className='hig-select'>
  <button ref={trigger} id={id} type='button' role='combobox' className='hig-input hig-select-trigger' disabled={disabled} aria-labelledby={`${id}-label`} aria-haspopup='listbox' aria-expanded={expanded} aria-controls={expanded?`${id}-list`:undefined} aria-activedescendant={expanded&&activeOption?optionId(active):undefined} onClick={()=>expanded?setOpen(false):show()} onKeyDown={onKeyDown} onBlur={()=>setOpen(false)}>
   <span className='hig-select-value'>{options[selected]?.label??''}</span><svg className='hig-select-chevron' aria-hidden='true' viewBox='0 0 20 20'><path d='m5 7.5 5 5 5-5'/></svg>
  </button>
  {expanded&&<div ref={list} id={`${id}-list`} className='hig-select-list' role='listbox' aria-labelledby={`${id}-label`} popover='manual' onPointerDown={event=>event.preventDefault()}>
   {options.map((option,index)=><div key={option.value} id={optionId(index)} role='option' className='hig-select-option' aria-selected={index===selected} aria-disabled={option.disabled||undefined} data-active={index===active||undefined} onPointerMove={()=>{if(!option.disabled)setActive(index);}} onClick={()=>choose(index)}>
    <span>{option.label}</span><svg className='hig-select-check' aria-hidden='true' viewBox='0 0 20 20'><path d='m4 10 4 4 8-8'/></svg>
   </div>)}
  </div>}
 </div></div>;
}
