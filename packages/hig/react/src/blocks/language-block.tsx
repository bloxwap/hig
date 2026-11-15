"use client";
import React,{useEffect,useMemo,useRef,useState} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
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
 languages:readonly LanguageOption[];
 /** `code` of the language in use. */
 value?:string|null;
 onSelect:(language:LanguageOption)=>void;
 /** Set false to leave out the search field, for a short list. Default `true`. */
 search?:boolean;
 /** With a hardware pointer, focus the search field on mount so typing filters at once. */
 autoFocus?:boolean;
}
const fold=(text:string)=>text.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
/** The languages whose name, description or code contains the query, ignoring case and accents. An empty query keeps every language, in the host's order. */
export function filterLanguages(languages:readonly LanguageOption[],query:string):LanguageOption[]{
 const needle=fold(query.trim());
 return needle===''?[...languages]:languages.filter(language=>fold(`${language.name} ${language.description??''} ${language.code}`).includes(needle));
}
const check=<svg className='hig-language-check' aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='m4.5 10.5 3.5 3.5 7.5-8'/></svg>;
/** Choose the app's language: a header, a search field, then each language as a row with its flag, its own name over the reader's name for it, and a check on the one in use. */
export function LanguageBlock({title,onBack,headerAction,languages,value=null,onSelect,search=true,autoFocus,className,...rest}:LanguageBlockProps){
 const {messages}=useHIG();const heading=title??messages.language??en.language;
 const [query,setQuery]=useState('');const [active,setActive]=useState(-1);
 const field=useRef<HTMLInputElement>(null),list=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(autoFocus&&window.matchMedia?.('(pointer: fine)').matches)field.current?.focus();},[]);
 const rows=useMemo(()=>filterLanguages(languages,query),[languages,query]);
 useEffect(()=>{setActive(-1);},[query]);
 useEffect(()=>{if(active>=0)list.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({block:'nearest'});},[active]);
 // From the search field, the arrow keys move through the matches and Enter chooses one: the only match, or the one the arrows reached.
 const onKeyDown=(event:React.KeyboardEvent)=>{
  if(event.key==='ArrowDown'){event.preventDefault();setActive(index=>Math.min(index+1,rows.length-1));}
  else if(event.key==='ArrowUp'){event.preventDefault();setActive(index=>Math.max(index-1,0));}
  else if(event.key==='Enter'){const choice=rows[active]??(rows.length===1?rows[0]:undefined);if(choice){event.preventDefault();onSelect(choice);}}
 };
 const label=messages.searchLanguages??en.searchLanguages;
 return <section {...rest} className={`hig-language-block${className?` ${className}`:''}`}>
  <ScreenHeader title={heading} onBack={onBack} action={headerAction}/>
  {search&&<SearchInput ref={field} aria-label={label} placeholder={label} value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={onKeyDown} enterKeyHint='search' autoComplete='off' autoCapitalize='none' autoCorrect='off' spellCheck={false}/>}
  {rows.length===0&&<p className='hig-swap-empty' role='status'>{messages.noResults??en.noResults}</p>}
  {rows.length>0&&<div ref={list} className='hig-language-list' role='radiogroup' aria-label={heading}>{rows.map((language,index)=>{const selected=language.code===value;return <button key={language.code} type='button' role='radio' aria-checked={selected} lang={language.code} className='hig-language-row' data-active={index===active||undefined} onClick={()=>onSelect(language)}>
   <span className='hig-language-flag' aria-hidden='true'>{typeof language.flag==='string'?<img src={language.flag} alt=''/>:language.flag??language.code.slice(0,2).toUpperCase()}</span>
   <span className='hig-language-text'><strong>{language.name}</strong>{language.description&&<span lang=''>{language.description}</span>}</span>
   {selected&&check}
  </button>;})}</div>}
 </section>;
}
