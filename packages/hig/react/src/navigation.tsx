"use client";
import { ChevronDown } from '@bloxwap/icons/react/chevron-down';
import {assertUniqueKeys,paginationValue} from '@bloxwap/hig/contracts/invariants';
import React,{useEffect,useId,useLayoutEffect,useRef} from 'react';
import {formatNumber} from '@bloxwap/hig/contracts/format';
import * as en from '@bloxwap/hig/contracts/messages';
import {useButtonEnvironment,useControllable,useLocale,useLayoutDirection,useMessageOverrides} from './provider.js';
import {Button,Link} from './button.js';
import {RowWindow} from './row-window.js';
import {SearchInput,Field} from './field.js';
const focusable='a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,audio[controls],video[controls],summary,[contenteditable]:not([contenteditable="false"]),[tabindex]:not([tabindex="-1"])';
const contentSelector='img,svg,canvas,video,picture,progress,meter,input,select,textarea';
/** True when the panel's first visible content is itself focusable (for example an InstallCommand `pre`), so the panel needs no tab stop of its own. */
function startsWithFocusable(panel:HTMLElement):boolean{
 const walker=panel.ownerDocument.createTreeWalker(panel,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:node=>{const el=node as Element;return node.nodeType===1&&(el.hasAttribute('hidden')||el.hasAttribute('inert')||el.getAttribute('aria-hidden')==='true')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
 for(let node=walker.nextNode();node;node=walker.nextNode()){if(node.nodeType===1){const el=node as Element;if(el.matches(focusable))return true;if(el.matches(contentSelector))return false;}else if(node.textContent?.trim())return false;}
 return false;
}
/** Runs before paint on the client; on the server, where effects never run, it falls back to useEffect so React does not warn. */
const useIsomorphicLayoutEffect=typeof document==='undefined'?useEffect:useLayoutEffect;
/** Applies the APG panel tab stop to the DOM: `tabindex=0` unless the panel's first visible content is already focusable. */
function syncPanelStop(panel:HTMLElement){const stop=!startsWithFocusable(panel);if(stop&&panel.getAttribute('tabindex')!=='0')panel.tabIndex=0;else if(!stop&&panel.hasAttribute('tabindex'))panel.removeAttribute('tabindex');}
export function Tabs({label,items,value,defaultValue,onValueChange}: {label:string;items:readonly {value:string;label:string;content:React.ReactNode;disabled?:boolean}[];value?:string;defaultValue?:string;onValueChange?:(v:string)=>void}){
 const direction=useLayoutDirection();const id=useId();const [stored,set]=useControllable(value,defaultValue??items.find(item=>!item.disabled)?.value??'',onValueChange);assertUniqueKeys(items,item=>item.value,'Tabs');const controlled=useRef(value!==undefined).current;const current=items.some(item=>item.value===stored&&!item.disabled)?stored:controlled?'':items.find(item=>!item.disabled)?.value??'';useEffect(()=>{if(!controlled&&stored!==current)set(current);},[controlled,stored,current]);
 const enabled=items.filter(item=>!item.disabled);const tabStop=(enabled.find(item=>item.value===current)??enabled[0])?.value;
 // APG: a panel is a tab stop only when its first content is not focusable; otherwise that control is the single stop after the tab list.
 // Every panel renders tabIndex=0 (so server and hydration markup are unchanged); a layout effect then corrects the shown panel in the same commit, before paint and before any passive effect, so it is never a tab stop for one commit (#97).
 const panel=useRef<HTMLDivElement>(null);
 useIsomorphicLayoutEffect(()=>{if(panel.current)syncPanelStop(panel.current);});
 useIsomorphicLayoutEffect(()=>{const node=panel.current;if(!node)return;let observer:MutationObserver|undefined;if(typeof MutationObserver!=='undefined'){observer=new MutationObserver(()=>syncPanelStop(node));observer.observe(node,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['tabindex','hidden','inert','aria-hidden','disabled','href','contenteditable','controls']});}return()=>{observer?.disconnect();node.tabIndex=0;};},[current]);
 return <div className='hig-tabs'><div role='tablist' aria-label={label} className='hig-inline hig-tab-list' onKeyDown={e=>{if(!enabled.length)return;const index=enabled.findIndex(item=>`${id}-tab-${item.value}`===(e.target as HTMLElement).id);let next=index;if(e.key===(direction==='rtl'?'ArrowLeft':'ArrowRight'))next=(index+1)%enabled.length;else if(e.key===(direction==='rtl'?'ArrowRight':'ArrowLeft'))next=index<0?enabled.length-1:(index-1+enabled.length)%enabled.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=enabled.length-1;else return;e.preventDefault();if(enabled[next]){set(enabled[next].value);document.getElementById(`${id}-tab-${enabled[next].value}`)?.focus();}}}>{items.map(item=><button type='button' className='hig-button hig-tab' role='tab' id={`${id}-tab-${item.value}`} aria-controls={`${id}-panel-${item.value}`} aria-selected={current===item.value} tabIndex={tabStop===item.value?0:-1} disabled={item.disabled} key={item.value} onClick={()=>set(item.value)}>{item.label}</button>)}</div>{items.map(item=><div key={item.value} ref={current===item.value?panel:undefined} hidden={current!==item.value} className='hig-tab-panel' role='tabpanel' id={`${id}-panel-${item.value}`} aria-labelledby={`${id}-tab-${item.value}`} tabIndex={0}>{item.content}</div>)}</div>;
}
export function Accordion({title,children,open,onOpenChange}:React.PropsWithChildren<{title:string;open?:boolean;onOpenChange?:(open:boolean)=>void}>){const [current,set]=useControllable(open,false,onOpenChange,'disclosure');return <details open={current} className='hig-surface hig-accordion' onToggle={e=>{if(e.currentTarget.open!==current)e.currentTarget.open=current;}}><summary className='hig-accordion-summary' onClick={e=>{e.preventDefault();set(!current);}}><span>{title}</span><ChevronDown size={20} className='hig-accordion-chevron'/></summary>{children}</details>;}
export function Breadcrumb({items}: {items:readonly {label:string;href?:string}[]}){const messages=useMessageOverrides();return <nav aria-label={messages.breadcrumb??en.breadcrumb}><ol role='list' className='hig-inline hig-breadcrumb'>{items.map((item,i)=><li key={i}>{i>0&&<span aria-hidden='true' className='hig-breadcrumb-separator'>/</span>}{item.href?<Link href={item.href} aria-current={i===items.length-1?'page':undefined}>{item.label}</Link>:<span aria-current={i===items.length-1?'page':undefined}>{item.label}</span>}</li>)}</ol></nav>;}
type NavigationItem={label:string;href:string;active?:boolean};
const NavigationLink=React.memo(Link);
const navigationLink=(item:NavigationItem)=><NavigationLink key={item.href} href={item.href} aria-current={item.active?'page':undefined}>{item.label}</NavigationLink>;
function WindowedNavigation({label,items}:{label:string;items:readonly NavigationItem[]}){
 const {density}=useButtonEnvironment();
 return <RowWindow as='nav' label={label} className='hig-stack hig-navigation' items={items} itemKey='href' rowHeight={density==='compact'?44:48} gap={4} tabThrough active={items.findIndex(item=>item.active)} renderRow={navigationLink}/>;
}
export function Navigation({label,items}: {label:string;items:readonly NavigationItem[]}){
 if(items.length>50)return <WindowedNavigation label={label} items={items}/>;
 return <nav aria-label={label} className='hig-stack hig-navigation'>{items.map(navigationLink)}</nav>;
}
export function Pagination({page,total,onPageChange}: {page:number;total:number;onPageChange:(p:number)=>void}){
 ({page,total}=paginationValue(page,total));
 const locale=useLocale();
 const messages=useMessageOverrides();
 const describe=messages.pageOf??en.pageOf;
 const totalText=React.useMemo(()=>formatNumber(total,locale),[total,locale]);
 const reading=React.useMemo(()=>describe(formatNumber(page,locale),totalText),[page,locale,totalText,describe]);
 const previous=messages.previous??en.previous,next=messages.next??en.next,label=messages.pagination??en.pagination;
 return React.useMemo(()=><nav aria-label={label} className='hig-inline hig-pagination'>
  <Button intent='secondary' disabled={page<=1} onClick={()=>onPageChange(page-1)}>{previous}</Button>
  <span>{reading}</span>
  <Button intent='secondary' disabled={page>=total} onClick={()=>onPageChange(page+1)}>{next}</Button>
 </nav>,[page,total,onPageChange,reading,previous,next,label]);
}
type SearchResult={id:string;label:string;onSelect:()=>void};
const SearchButton=React.memo(Button);
const ResultButton=React.memo(function ResultButton({result}:{result:SearchResult}){
 return <SearchButton intent='ghost' onClick={result.onSelect}>{result.label}</SearchButton>;
});
const resultRow=(result:SearchResult)=><li key={result.id}><ResultButton result={result}/></li>;
const SearchResults=React.memo(function SearchResults({results}:{results:readonly SearchResult[]}){
 return results.length>50?<RowWindow itemKey="id" items={results} rowHeight={44} tabThrough renderRow={resultRow}/>:<ul>{results.map(resultRow)}</ul>;
});
export function Search({query,onQueryChange,results,loading,error}: {query:string;onQueryChange:(s:string)=>void;results:readonly SearchResult[];loading?:boolean;error?:string}){const messages=useMessageOverrides();return <section><Field label={messages.search??en.search}><SearchInput value={query} onChange={e=>onQueryChange(e.target.value)}/></Field>{loading?<p role='status'>{messages.searching??en.searching}</p>:error?<p role='alert'>{error}</p>:results.length?<SearchResults results={results}/>:<p role='status'>{messages.noResults??en.noResults}</p>}</section>;}
