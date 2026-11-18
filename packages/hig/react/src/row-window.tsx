import React,{useEffect,useMemo,useRef,useState} from 'react';
import {rowMeasurements} from './row-measurements.js';

export const initialWindowRows=16;
const overscan=4;
const observerMargin=overscan*68;

// Categories in the same scrolling container share one visibility observer.
type ClipBounds=Map<Element,{top:number;bottom:number}>;
type VisibilityUpdate=(near:boolean,bounds:ClipBounds)=>void;
const observers=new Map<Element|null,{observer:IntersectionObserver;listeners:Map<Element,VisibilityUpdate>}>();
function watchList(element:Element,root:Element|null,update:VisibilityUpdate){
 if(typeof IntersectionObserver==='undefined'){update(true,new Map());return ()=>{};}
 let group=observers.get(root);
 if(!group){
  const listeners=new Map<Element,VisibilityUpdate>();
  const observer=new IntersectionObserver(entries=>{
   const bounds:ClipBounds=new Map();
   for(const entry of entries)listeners.get(entry.target)?.(entry.isIntersecting,bounds);
  },{root,rootMargin:`${observerMargin}px 0px`});
  group={observer,listeners};observers.set(root,group);
 }
 const {observer,listeners}=group;
 listeners.set(element,update);observer.observe(element);
 return ()=>{
  observer.unobserve(element);listeners.delete(element);
  if(listeners.size===0){observer.disconnect();observers.delete(root);}
 };
}

type SampleViewport=(bounds:ClipBounds)=>void;
const visibleWindows=new Map<SampleViewport,Element>(),pendingWindows=new Set<SampleViewport>();
const scrolledElements=new Set<Element>();
let pendingFrame:number|null=null,viewportChanged=false;

function flushViewports(){
 pendingFrame=null;
 if(!viewportChanged){
  for(const target of scrolledElements){
   const root=target.getRootNode();
   for(const [sample,element] of visibleWindows){
    if(target.contains(element)||root!==element.getRootNode())pendingWindows.add(sample);
   }
  }
 }
 const samples=Array.from(viewportChanged?visibleWindows.keys():pendingWindows);
 scrolledElements.clear();
 viewportChanged=false;
 pendingWindows.clear();
 const bounds:ClipBounds=new Map();
 for(const sample of samples)if(visibleWindows.has(sample))sample(bounds);
}
function scheduleFrame(){pendingFrame??=requestAnimationFrame(flushViewports);}
function viewportChange(){viewportChanged=true;scheduleFrame();}
function viewportScroll(event:Event){
 const target=event.target;
 if(!(target instanceof Element)||target===document.scrollingElement){viewportChange();return;}
 scrolledElements.add(target);
 scheduleFrame();
}
function observeViewport(element:Element,sample:SampleViewport){
 if(!visibleWindows.size){
  window.addEventListener('scroll',viewportScroll,{capture:true,passive:true});
  window.addEventListener('resize',viewportChange);
 }
 visibleWindows.set(sample,element);
 return {
  resize(){if(visibleWindows.has(sample)){pendingWindows.add(sample);scheduleFrame();}},
  stop(){
   visibleWindows.delete(sample);
   pendingWindows.delete(sample);
   if(visibleWindows.size)return;
   window.removeEventListener('scroll',viewportScroll,true);
   window.removeEventListener('resize',viewportChange);
   if(pendingFrame!==null)cancelAnimationFrame(pendingFrame);
   pendingFrame=null;
   scrolledElements.clear();
   viewportChanged=false;
  },
 };
}

/** Preserve the host scroller and reserve the measured space of unmounted list items. */
export function RowWindow<K extends string,T extends Record<K,string>>({items,itemKey,as:Container='ul',columnCount=1,className,label,labelledBy,role,first=0,active=-1,rowHeight,gap=0,tabThrough=false,enabled=true,renderRow}:{
 items:readonly T[];itemKey:K;as?:'ul'|'ol'|'div'|'tbody'|'nav';columnCount?:number;className?:string;label?:string;labelledBy?:string;role?:React.AriaRole;first?:number;active?:number;rowHeight:number;gap?:number;tabThrough?:boolean|((item:T)=>boolean);enabled?:boolean;
 renderRow:(item:T,index:number)=>React.ReactElement;
}){
 const indexAttribute=Container==='tbody'?'data-hig-window-index':'data-index';
 const estimate=rowHeight+gap;
 const list=useRef<HTMLElement|null>(null);
 const attachList=React.useCallback((element:HTMLElement|null)=>{list.current=element;},[]);
 const count=items.length;
 const committed=useRef<{items:readonly T[];itemKey:K;estimate:number;metrics:ReturnType<typeof rowMeasurements>}|null>(null);
 const metrics=useMemo(()=>{
  const previous=committed.current;
  if(!previous||previous.estimate!==estimate||previous.itemKey!==itemKey)return rowMeasurements(count,estimate);
  // Only measured deviations have an identity to preserve when the order changes.
  if(previous.items.length===count){
   let samePositions=true;
   for(const [index] of previous.metrics.measured()){
    if(items[index][itemKey]!==previous.items[index][itemKey]){samePositions=false;break;}
   }
   if(samePositions)return previous.metrics;
  }
  // A sort or page append moves rows. Keep known heights with their keys.
  const next=rowMeasurements(count,estimate);
  const heights=new Map<string,number>();
  for(const [index,height] of previous.metrics.measured())heights.set(previous.items[index][itemKey],height);
  if(heights.size)items.forEach((item,index)=>{
   const height=heights.get(item[itemKey]);
   if(height!==undefined)next.measure(index,height);
  });
  return next;
 },[items,itemKey,estimate,count]);
 React.useLayoutEffect(()=>{committed.current={items,itemKey,estimate,metrics};},[items,itemKey,estimate,metrics]);
 const [range,setRange]=useState(()=>({start:0,end:Math.max(0,initialWindowRows-first)}));
 const [focused,setFocused]=useState<{key:string;index:number}|null>(null);
 useEffect(()=>{
  const element=list.current;
  if(!enabled||!element)return;
  const clips:Element[]=[];
  for(let parent=element.parentElement;parent;parent=parent.parentElement){
   if(/auto|scroll|hidden|clip/.test(getComputedStyle(parent).overflowY))clips.push(parent);
  }
  function sample(shared:ClipBounds){
   const bounds=element!.getBoundingClientRect();
   let top=0,bottom=window.innerHeight;
   for(const clip of clips){
    let bounds=shared.get(clip);
    if(!bounds){
     const edge=clip.getBoundingClientRect().top+clip.clientTop;
     bounds={top:edge,bottom:edge+clip.clientHeight};
     shared.set(clip,bounds);
    }
    top=Math.max(top,bounds.top);
    bottom=Math.min(bottom,bounds.bottom);
   }
   const start=Math.max(0,metrics.rowAt(top-bounds.top)-overscan);
   const end=bounds.bottom<top-estimate*overscan||bounds.top>bottom+estimate*overscan?start:Math.min(count,metrics.rowAt(bottom-bounds.top)+1+overscan);
   setRange(previous=>previous.start===start&&previous.end===end?previous:{start,end});
  }
  let subscription:ReturnType<typeof observeViewport>|undefined;
  let resize:ResizeObserver|undefined;
  function stop(){
   resize?.disconnect();
   subscription?.stop();
   subscription=undefined;
  }
  const unwatch=watchList(element,clips[0]??null,(near,bounds)=>{
   if(!near){
    stop();
    setRange(previous=>previous.end===previous.start?previous:{start:0,end:0});
   }else if(!subscription){
    subscription=observeViewport(element,sample);
    if(typeof ResizeObserver!=='undefined')resize??=new ResizeObserver(()=>subscription?.resize());
    resize?.observe(element);
    for(const clip of clips)resize?.observe(clip);
    sample(bounds);
   }
  });
  return ()=>{unwatch();stop();};
 },[Container,enabled,count,metrics,estimate]);

 const pinned=useMemo(()=>{
  if(!focused)return -1;
  if(items[focused.index]?.[itemKey]===focused.key)return focused.index;
  return items.findIndex(item=>item[itemKey]===focused.key);
 },[focused,items,itemKey]);
 const localActive=active>=first&&active<first+items.length?active-first:-1;
 const [,refresh]=useState(0);
 useEffect(()=>{
  const container=list.current;
  if(!enabled||!container||typeof ResizeObserver==='undefined')return;
  const resize=new ResizeObserver(entries=>{
   let changed=false;
   for(const entry of entries){
    if(entry.target.parentElement!==container)continue;
    const value=entry.target.getAttribute(indexAttribute);
    if(value===null)continue;
    const index=Number(value);
    const height=entry.borderBoxSize?.[0]?.blockSize??entry.contentRect.height;
    if(height>0&&metrics.measure(index,height+gap))changed=true;
   }
   if(changed)refresh(value=>value+1);
  });
  const children=new MutationObserver(records=>{
   for(const record of records){
    for(const node of record.removedNodes)if(node instanceof Element)resize.unobserve(node);
    for(const node of record.addedNodes)if(node instanceof Element)resize.observe(node);
   }
  });
  children.observe(container,{childList:true});
  for(const row of container.children)resize.observe(row);
  return ()=>{children.disconnect();resize.disconnect();};
 },[Container,enabled,metrics,gap,indexAttribute]);
 const end=Math.min(range.end,items.length),indices=new Set<number>();
 for(let i=range.start;i<end;i++)indices.add(i);
 for(const i of [localActive,pinned])if(i>=0&&i<items.length)indices.add(i);
 // Boundary buttons remain available when Tab enters from either end of the list.
 const findTabStop=React.useCallback((start:number,step:1|-1)=>{
  for(let index=start;index>=0 && index<items.length;index+=step){
   if(typeof tabThrough!=='function' || tabThrough(items[index]))return index;
  }
  return -1;
 },[items,tabThrough]);
 const boundaries=useMemo(()=>{
  if(!tabThrough)return [];
  const first=findTabStop(0,1);
  if(first<0)return [];
  return [first,findTabStop(items.length-1,-1)];
 },[tabThrough,findTabStop,items.length]);
 const neighbors=useMemo(()=>tabThrough && pinned>=0?
  [findTabStop(pinned-1,-1),findTabStop(pinned+1,1)]:[],[tabThrough,pinned,findTabStop]);
 for(const index of boundaries)indices.add(index);
 for(const index of neighbors)if(index>=0)indices.add(index);
 function trackFocus(event:React.FocusEvent<HTMLElement>){
  let row:Element|null=event.target;
  while(row&&row.parentElement!==event.currentTarget)row=row.parentElement;
  const value=row?.getAttribute(indexAttribute);
  const index=value==null?-1:Number(value);
  const key=items[index]?.[itemKey];
  setFocused(previous=>key===undefined?null:previous?.index===index&&previous.key===key?previous:{index,key});
 }
 function clearFocus(event:React.FocusEvent<HTMLElement>){
  const container=event.currentTarget;
  if(container.contains(event.relatedTarget))return;
  // WebKit can deliver blur before the neighboring radio receives focus.
  queueMicrotask(()=>{if(list.current===container&&!container.contains(document.activeElement))setFocused(null);});
 }
 // Keep layout props stable for memoized cells. Retain only positions in the committed window.
 const previousStyles=useRef<ReadonlyMap<number,React.CSSProperties>|null>(null);
 const styles=enabled&&Container!=='tbody'?new Map<number,React.CSSProperties>():null;
 React.useLayoutEffect(()=>{previousStyles.current=styles;});
 if(Container==='tbody'){
  const children:React.ReactNode[]=[];
  let next=0;
  function addSpacer(until:number){
   if(until<=next)return;
   children.push(<tr key={'spacer:'+next} aria-hidden="true"><td colSpan={columnCount} style={{height:metrics.offset(until)-metrics.offset(next),padding:0,border:0}}/></tr>);
  }
  for(const index of Array.from(indices).sort((a,b)=>a-b)){
   addSpacer(index);
   children.push(renderRow(items[index],first+index));
   next=index+1;
  }
  addSpacer(items.length);
  return <tbody ref={attachList} onFocus={trackFocus} onBlur={clearFocus}>{children}</tbody>;
 }
 return <Container className={className} role={role} aria-label={label} aria-labelledby={labelledBy} ref={attachList} onFocus={trackFocus} onBlur={clearFocus}
  style={enabled?{position:'relative',display:tabThrough?'grid':undefined,gridTemplateColumns:tabThrough?'minmax(0,1fr)':undefined,height:metrics.offset(items.length)-gap}:undefined}>
  {/* Individual list items keep their native semantics and their position in the complete list. */}
  {!enabled?items.map((item,index)=>React.cloneElement(renderRow(item,first+index),{'data-index':index} as React.HTMLAttributes<HTMLElement>)):Array.from(indices).sort((a,b)=>a-b).map(index=>{
   const item=renderRow(items[index],first+index) as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
   const top=metrics.offset(index),gridColumn=tabThrough?'1 / 2':undefined;
   const previous=previousStyles.current?.get(index);
   const style:React.CSSProperties=previous?.top===top&&previous.gridColumn===gridColumn
    ?previous:{position:'absolute',gridColumn,insetInline:0,top};
   styles!.set(index,style);
   return React.cloneElement(item,{...{'data-index':index},...(Container==='nav'?{}:{'aria-posinset':index+1,'aria-setsize':items.length}),style});
  })}
 </Container>;
}
