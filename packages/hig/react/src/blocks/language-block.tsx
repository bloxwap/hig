"use client";
import { Check } from '@bloxwap/icons/react/check';
import {RowWindow} from '../row-window.js';
import {filterLanguages as matchLanguages} from '@bloxwap/hig/contracts';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useMessageOverrides} from '../provider.js';
import {SearchInput} from '../field.js';
import {ScreenHeader} from './screen-header.js';
/** One language the host offers. */
export interface LanguageOption {
 /** Stable id the host switches on, usually a BCP 47 tag such as `pt-BR`. */
 code:string;
 /** The language in its own words: `Français`. */
 name:string;
 /** The language in the reader's words, shown under the name: `French`. Omit it where it would repeat the name. */
 description?:string;
 /** Round artwork, usually a flag: an image URL or a host element. Without it the row shows the first letters of the code. */
 flag?:string|React.ReactElement;
}
export interface LanguageBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'|'onSelect'> {
 /** Heading. Defaults to the built-in “Language”. */
 title?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton` that closes the sheet. */
 headerAction?:React.ReactNode;
 /** Pins the header to the top of the nearest scroller: transparent at rest, filled once content scrolls under it, and still when it starts to stick. See Pinned headers. */
 stickyHeader?:boolean;
 /** `id` of the header's heading, so a host dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
 languages:readonly LanguageOption[];
 /** `code` of the language in use. */
 value?:string|null;
 onSelect:(language:LanguageOption)=>void;
 /** Dims the rows and ignores presses, for example while a change is being applied. */
 disabled?:boolean;
 /** A muted line under the header that explains the screen: Choose the language used throughout the app. */
 description?:string;
 /** Set false to leave out the search field, for a short list. Default `true`. */
 search?:boolean;
 /** With a hardware pointer, focus the search field on mount so typing filters at once. */
 autoFocus?:boolean;
}
export const filterLanguages:(languages:readonly LanguageOption[],query:string)=>LanguageOption[]=matchLanguages;
const check=<Check size={20} className='hig-language-check'/>;
const LanguageRow=React.memo(function LanguageRow({language,name,description,flag,selected,active,disabled,onSelect,...windowProps}:Pick<React.HTMLAttributes<HTMLButtonElement>,'style'|'aria-posinset'|'aria-setsize'>&{
 name:LanguageOption['name'];description:LanguageOption['description'];flag:LanguageOption['flag'];
 language:LanguageOption;selected:boolean;disabled?:boolean;onSelect:LanguageBlockProps['onSelect'];active:boolean;
}){
 return <button {...windowProps} type='button' role='radio' aria-checked={selected} lang={language.code} className='hig-language-row' data-active={active||undefined} disabled={disabled} onClick={()=>onSelect(language)}>
   <span className='hig-language-flag' aria-hidden='true'>{typeof flag==='string'?<img src={flag} alt=''/>:flag??language.code.slice(0,2).toUpperCase()}</span>
   <span className='hig-language-text'><strong>{name}</strong>{description&&<span lang=''>{description}</span>}</span>
   {selected&&check}
   <PressDecoration kind='row' disabled={!!disabled}/>
  </button>;
});
/** Choose the app's language: a header, a search field, then each language as a row with its flag, its own name over the reader's name for it, and a check on the one in use. */
export function LanguageBlock({title,onBack,headerAction,languages,value=null,onSelect,search=true,autoFocus,disabled,description,stickyHeader,headingId,className,...rest}:LanguageBlockProps){
 const messages=useMessageOverrides();const heading=title??messages.language??en.language;
 const [query,setQuery]=useState('');const [active,setActive]=useState(-1);
 const field=useRef<HTMLInputElement>(null),list=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(autoFocus&&window.matchMedia?.('(pointer: fine)').matches)field.current?.focus();},[]);
 const [applied,setApplied]=useState('');
 const filterQuery=languages.length>50&&query.trim()?applied:query;
 function editQuery(next:string){
  setQuery(next);
  if(languages.length<=50||!next.trim())setApplied(next);
 }
 useEffect(()=>{
  if(filterQuery===query)return;
  const timer=setTimeout(()=>setApplied(query),150);
  return ()=>clearTimeout(timer);
 },[filterQuery,query]);
 const rowsFor=useMemo(()=>{
  let previousQuery='',matches=languages;
  return (input:string)=>{
   const needle=input.trim();
   if(needle!==previousQuery){
    matches=needle?filterLanguages(languages,needle):languages;
    previousQuery=needle;
   }
   return matches;
  };
 },[languages]);
 const rows=rowsFor(filterQuery);
 useEffect(()=>{setActive(-1);},[query]);
 useEffect(()=>{if(active>=0)list.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({block:'nearest'});},[active]);
 // From the search field, the arrow keys move through the matches and Enter chooses one: the only match, or the one the arrows reached.
 const onKeyDown=(event:React.KeyboardEvent)=>{
  if(!['ArrowDown','ArrowUp','Enter'].includes(event.key))return;
  const matches=rowsFor(query);
  if(filterQuery!==query)setApplied(query);
  if(event.key==='ArrowDown'){event.preventDefault();setActive(index=>Math.min(index+1,matches.length-1));}
  else if(event.key==='ArrowUp'){event.preventDefault();setActive(index=>Math.max(index-1,0));}
  else if(event.key==='Enter'){const choice=matches[active]??(matches.length===1?matches[0]:undefined);if(choice){event.preventDefault();if(!disabled)onSelect(choice);}}
 };
 const label=messages.searchLanguages??en.searchLanguages;
 const renderRow=(language:LanguageOption,index:number)=><LanguageRow key={language.code} language={language} name={language.name} description={language.description} flag={language.flag} selected={language.code===value} active={index===active} disabled={disabled} onSelect={onSelect}/>;
 return <section {...rest} className={`hig-language-block${className?` ${className}`:''}`}>
  <ScreenHeader title={heading} onBack={onBack} action={headerAction} headingId={headingId} stickyHeader={stickyHeader}/>
  {description&&<p className='hig-settings-description'>{description}</p>}
  {search&&<SearchInput ref={field} aria-label={label} placeholder={label} value={query} onChange={event=>editQuery(event.target.value)} onKeyDown={onKeyDown} enterKeyHint='search' autoComplete='off' autoCapitalize='none' autoCorrect='off' spellCheck={false}/>}
  {rows.length===0&&<p className='hig-swap-empty' role='status'>{messages.noResults??en.noResults}</p>}
  {rows.length>0&&<div ref={list} className='hig-language-list' role='radiogroup' aria-label={heading} aria-disabled={disabled||undefined}>{rows.length>50?<RowWindow items={rows} itemKey='code' as='div' rowHeight={56} gap={4} active={active} tabThrough renderRow={renderRow}/>:rows.map(renderRow)}</div>}
 </section>;
}
