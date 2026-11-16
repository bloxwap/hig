"use client";
import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import {formatCountdown} from '@bloxwap/hig/contracts';
import {PressDecoration,useHIG,useMessages} from '../provider.js';
import {SearchInput} from '../field.js';
import {Filter,SegmentedControl} from '../selection.js';
import {Badge} from '../status.js';
import {Button} from '../button.js';
import {ScreenHeader,HeaderClose} from './screen-header.js';
/** A market's live heat signal: `watch` while it is being watched, `up` or `down` once it trends. */
export type AssetSignal='watch'|'up'|'down';
/** The three views of the list: every market, the markets with an open position, and the markets with a signal. */
export type AssetsView='all'|'positions'|'trend';
/** One market the host offers. Every word is host text. */
export interface AssetItem {
 /** Stable id the host switches on. */
 id:string;
 /** Bitcoin. */
 name:string;
 /** BTC. */
 symbol:string;
 /** `id` of the `AssetCategory` whose section the market sits in. */
 category:string;
 /** Short host text after the symbol on the second line, such as the maximum leverage: `40×`. */
 detail?:string;
 /** Round artwork: an image URL or a host element. Without it the row shows the first letters of the symbol. */
 icon?:string|React.ReactElement;
 /** The trailing signal disc. `null` draws an empty disc, for a market with no signal yet; leave it out to draw no disc. */
 signal?:AssetSignal|null;
 /** The viewer holds an open position in this market, so it shows under Positions. */
 position?:boolean;
 /** Host content on the trailing edge, before the signal disc, such as the live result of the viewer's open position. It is drawn only (it sits inside the row button, hidden from assistive technology); the row reads `trailingLabel` for it. */
 trailing?:React.ReactNode;
 /** Words the row reads after its symbol line, such as `open position`, for what `trailing` shows. */
 trailingLabel?:string;
 /** More text the search matches, such as an alias or a ticker on another venue. */
 keywords?:string;
 disabled?:boolean;
}
/** A market type: a section of the list and a capsule in the category filter. */
export interface AssetCategory {
 id:string;
 /** Crypto. */
 label:string;
 /** A badge on the section heading's trailing edge, such as OPEN. Bloxwap trades around the clock, so there is no closed badge: use `opensAt` for a legacy market that is shut. */
 status?:{label:string;tone?:'positive'|'negative'|'warning'|'info'};
 /** When the legacy market behind this category next opens, as epoch milliseconds or a `Date`. While it is ahead, the badge counts down to it (“Opens in 2:14:33”) in place of `status`, and the heading reads it in words. Once it passes, `status` shows again. */
 opensAt?:number|Date;
}
export interface AssetsBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'|'onSelect'> {
 /** Shows a clear button in the search field while it holds text: it empties the query and returns focus to the field. Named by `messages.clearSearch`. */
 clearable?:boolean;
 /** Heading. Defaults to the built-in “Assets”. */
 title?:string;
 /** Shows Close on the trailing edge of the header. */
 onClose?:()=>void;
 assets:readonly AssetItem[];
 /** Sections and filter capsules, in order. A market whose category is not listed is not shown. */
 categories:readonly AssetCategory[];
 onSelect:(asset:AssetItem)=>void;
 /** `id` of the market in use: its row is marked current. */
 selectedId?:string|null;
 view?:AssetsView;defaultView?:AssetsView;onViewChange?:(view:AssetsView)=>void;
 /** `id` of the chosen category; `''` is All. */
 category?:string;defaultCategory?:string;onCategoryChange?:(category:string)=>void;
 query?:string;defaultQuery?:string;onQueryChange?:(query:string)=>void;
 /** `false` leaves out the category filter. Defaults to `true` when there is more than one category. */
 categoryFilter?:boolean;
 /** Shows the loading text in place of the empty text while the list is empty. */
 loading?:boolean;
 /** Pins the header (title and Close) to the top of the nearest scroller while the rest scrolls, as `ScreenHeader stickyHeader` does: transparent at rest, filled once content scrolls under it. */
 stickyHeader?:boolean;
 /** `id` of the heading, so a dialog or sheet around the block can name itself by it (`aria-labelledby`, `GestureSheet labelledBy`). */
 headingId?:string;
 /** Freezes the opening countdown at the text it last showed and stops its timer, for example while the block is off screen. */
 paused?:boolean;
 /** The host's clock in epoch milliseconds, read for the opening countdown. Defaults to `Date.now`. */
 now?:()=>number;
 /** A button under the empty text, drawn only while the list is empty and not `loading`, such as Browse all markets on an empty Positions view. `testID` becomes its `data-testid`. */
 emptyAction?:AssetsEmptyAction;
 /** With a hardware pointer, focus the search field on mount so typing filters at once. */
 autoFocusSearch?:boolean;
 /** While the search field holds a query and the arrows have not moved, Enter chooses the first enabled match, as a search box's top hit. By default Enter then chooses only a lone match. */
 enterChoosesFirst?:boolean;
}
/** The empty list's action. */
export interface AssetsEmptyAction {label:string;onPress:()=>void;testID?:string}
const fold=(text:string)=>text.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
/** The markets a view, category and query leave, grouped by category in the host's order. Empty sections are dropped. */
export function filterAssets(assets:readonly AssetItem[],categories:readonly AssetCategory[],{view='all',category='',query=''}:{view?:AssetsView;category?:string;query?:string}={}):{category:AssetCategory;assets:AssetItem[]}[]{
 const needle=fold(query.trim());
 const keep=(asset:AssetItem)=>(view==='all'||(view==='positions'?!!asset.position:asset.signal!=null))&&(needle===''||fold(`${asset.name} ${asset.symbol} ${asset.keywords??''}`).includes(needle));
 return categories.filter(entry=>category===''||entry.id===category).map(entry=>({category:entry,assets:assets.filter(asset=>asset.category===entry.id&&keep(asset))})).filter(section=>section.assets.length>0);
}
const stroke={fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
const signalIcons:Record<AssetSignal,React.ReactNode>={
 watch:<svg aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' {...stroke}><path d='M1.8 10s3-5.8 8.2-5.8 8.2 5.8 8.2 5.8-3 5.8-8.2 5.8S1.8 10 1.8 10Z'/><circle cx='10' cy='10' r='2.6'/></svg>,
 up:<svg aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' {...stroke}><path d='m2.5 14.5 5-5 3.5 3.5 6.5-6.5M12.5 6.5h5v5'/></svg>,
 down:<svg aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' {...stroke}><path d='m2.5 5.5 5 5 3.5-3.5 6.5 6.5M12.5 13.5h5v-5'/></svg>,
};
/** Controlled when `value` is set, otherwise local. No feedback: the filter and segmented control emit their own, and typing emits none. */
function useHostState<T>(value:T|undefined,initial:T,onChange?:(value:T)=>void):[T,(next:T)=>void]{
 const [local,setLocal]=useState(initial);const current=value===undefined?local:value;
 return [current,next=>{if(Object.is(next,current))return;if(value===undefined)setLocal(next);onChange?.(next);}];
}
/** The host clock, ticking each second while one of `openings` is still ahead and not `paused`; paused keeps the last reading (or takes one) and judges "ahead" against it, so a host re-render after an opening passes keeps the frozen text. `null` until mounted, so server HTML never carries a clock that hydration would contradict. */
function useNow(openings:number[],paused:boolean,clock:()=>number):number|null{
 const [now,setNow]=useState<number|null>(null);const read=useRef(clock);read.current=clock;
 const reading=paused&&now!=null?now:openings.length?clock():0;const active=openings.some(at=>at>reading);
 useEffect(()=>{if(!active){setNow(null);return;}if(paused){setNow(last=>last??read.current());return;}setNow(read.current());const tick=setInterval(()=>setNow(read.current()),1000);return()=>clearInterval(tick);},[active,paused]);
 return active?now:null;
}
const opensAtTime=(category:AssetCategory)=>category.opensAt==null?null:+category.opensAt;
/**
 * Choose a market as one screen: a header, a search field, category capsules, the All / Positions / Trend views, then the
 * markets in sections by category, each with its icon, name, symbol and detail, and its signal disc. The host owns the data.
 */
export function AssetsBlock({title,onClose,assets,categories,onSelect,selectedId=null,view,defaultView='all',onViewChange,category,defaultCategory='',onCategoryChange,query,defaultQuery='',onQueryChange,categoryFilter,loading,stickyHeader,headingId,clearable,paused=false,now:clock=Date.now,emptyAction,autoFocusSearch,enterChoosesFirst,className,...rest}:AssetsBlockProps){
 const t=useMessages();const {locale}=useHIG();const id=useId();
 const [currentView,setView]=useHostState<AssetsView>(view,defaultView,onViewChange);
 const [currentCategory,setCategory]=useHostState(category,defaultCategory,onCategoryChange);
 const [currentQuery,setQuery]=useHostState(query,defaultQuery,onQueryChange);
 const sections=useMemo(()=>filterAssets(assets,categories,{view:currentView,category:currentCategory,query:currentQuery}),[assets,categories,currentView,currentCategory,currentQuery]);
 // The clock runs only while a section on screen has an opening still ahead.
 const now=useNow(sections.flatMap(section=>{const at=opensAtTime(section.category);return at==null?[]:[at];}),paused,clock);
 const rows=useMemo(()=>sections.flatMap(section=>section.assets),[sections]);
 // The cursor follows an asset, not a position, so a live update that reorders or drops rows never moves it onto another market.
 const [activeId,setActiveId]=useState<string|null>(null);const active=activeId==null?-1:rows.findIndex(asset=>asset.id===activeId);
 const field=useRef<HTMLInputElement>(null),list=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(autoFocusSearch&&window.matchMedia?.('(pointer: fine)').matches)field.current?.focus();},[]);
 useEffect(()=>{setActiveId(null);},[currentQuery,currentCategory,currentView]);
 useEffect(()=>{if(active>=0)list.current?.querySelector('[data-active]')?.scrollIntoView?.({block:'nearest'});},[active]);
 // From the search field the arrow keys move through the enabled rows and Enter chooses one: the one the arrows reached, or, if they have not moved, the only row (or with `enterChoosesFirst` and a query, the first enabled one).
 const step=(from:number,by:number)=>{for(let index=from+by;index>=0&&index<rows.length;index+=by)if(!rows[index].disabled)return index;return from;};
 const onKeyDown=(event:React.KeyboardEvent<HTMLInputElement>)=>{
  if(event.nativeEvent.isComposing||event.keyCode===229)return;// An IME commit is not a choice.
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const next=step(active,event.key==='ArrowDown'?1:-1);setActiveId(rows[next]?.id??null);}
  else if(event.key==='Enter'){const choice=activeId!=null?rows[active]:enterChoosesFirst&&currentQuery.trim()!==''?rows.find(asset=>!asset.disabled):rows.length===1?rows[0]:undefined;if(choice&&!choice.disabled){event.preventDefault();onSelect(choice);}}
 };
 // With a row focused (by Tab or a click) the arrow keys move focus to the next or previous enabled row; Up from the first returns to the search field. Focus is then the cursor, so the field's highlight steps aside.
 const onListKeyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{
  if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
  const current=(event.target as Element).closest?.('.hig-assets-row');if(!current||!list.current)return;
  const buttons=[...list.current.querySelectorAll<HTMLButtonElement>('.hig-assets-row:not(:disabled)')];const index=buttons.indexOf(current as HTMLButtonElement);
  event.preventDefault();setActiveId(null);
  if(event.key==='ArrowUp'&&index<=0){field.current?.focus();return;}
  buttons[event.key==='ArrowDown'?Math.min(buttons.length-1,index+1):index-1]?.focus();
 };
 const heading=title??t.assets;const signalName:Record<AssetSignal,string>={watch:t.signalWatch,up:t.signalUp,down:t.signalDown};
 const empty=loading?`${t.loading}…`:currentQuery.trim()!==''?t.noResults:currentView==='positions'?t.noPositions:currentView==='trend'?t.noTrend:t.noItems;
 const secondLine=(asset:AssetItem)=>asset.detail?`${asset.symbol} · ${asset.detail}`:asset.symbol;
 const rowName=(asset:AssetItem)=>[asset.name,secondLine(asset),asset.trailingLabel,asset.signal?signalName[asset.signal]:null].filter(Boolean).join(', ');
 const row=(asset:AssetItem,index:number)=>{
  const second=secondLine(asset);
  const signal=asset.signal===undefined?null:<span className='hig-assets-signal' data-signal={asset.signal??undefined}>{asset.signal?signalIcons[asset.signal]:null}</span>;
  const name=rowName(asset);
  return <li key={asset.id}><button type='button' className='hig-assets-row' data-asset-id={asset.id} data-active={index===active||undefined} aria-label={name} aria-current={asset.id===selectedId||undefined} disabled={asset.disabled} onClick={()=>onSelect(asset)}>
   <span className='hig-assets-icon' aria-hidden='true'>{typeof asset.icon==='string'?<img src={asset.icon} alt=''/>:asset.icon??asset.symbol.slice(0,4)}</span>
   <span className='hig-assets-text' aria-hidden='true'><strong>{asset.name}</strong><span>{second}</span></span>
   {asset.trailing!=null&&asset.trailing!==false?<span className='hig-assets-trailing' aria-hidden='true'>{asset.trailing}</span>:null}
   {signal}
   <PressDecoration kind='row' disabled={!!asset.disabled}/>
  </button></li>;
 };
 const showFilter=(categoryFilter??true)&&categories.length>1;
 const sectionHeader=(entry:AssetCategory)=>{
  const at=opensAtTime(entry);const countdown=now!=null&&at!=null&&at>now?formatCountdown(at-now,locale):null;
  const badge=countdown?{visible:`${t.opensIn} ${countdown.visible}`,spoken:`${t.opensIn} ${countdown.spoken}`,tone:'neutral' as const}:entry.status?{visible:entry.status.label,spoken:entry.status.label,tone:entry.status.tone??'positive'}:null;
  return <div className='hig-assets-section-header'><h3 id={`${id}-${entry.id}`} aria-label={badge?`${entry.label}, ${badge.spoken}`:undefined}>{entry.label}</h3>{badge&&<Badge aria-hidden='true' className='hig-assets-status' data-countdown={countdown?'':undefined} tone={badge.tone}>{badge.visible}</Badge>}</div>;
 };
 return <section {...rest} className={`hig-assets-block${className?` ${className}`:''}`}>
  <ScreenHeader title={heading} headingId={headingId} stickyHeader={stickyHeader} action={onClose?<HeaderClose onClose={onClose} label={t.close}/>:undefined}/>
  <SearchInput ref={field} aria-label={t.searchMarkets} placeholder={`${t.searchMarkets}…`} value={currentQuery} onChange={event=>setQuery(event.target.value)} onKeyDown={onKeyDown} onClear={clearable?()=>setQuery(''):undefined} enterKeyHint='search' autoComplete='off' autoCapitalize='none' autoCorrect='off' spellCheck={false}/>
  {showFilter&&<Filter label={t.marketCategories} options={[{value:'',label:t.assetsAll},...categories.map(entry=>({value:entry.id,label:entry.label}))]} value={currentCategory} onValueChange={setCategory}/>}
  <SegmentedControl hideLabel label={t.assetsView} options={[{value:'all',label:t.assetsAll},{value:'positions',label:t.assetsPositions},{value:'trend',label:t.assetsTrend}]} value={currentView} onValueChange={next=>setView(next as AssetsView)}/>
  {/* Focus stays in the field, so the row the arrows reach is spoken here: the rows are buttons, not options a searchbox could own through aria-activedescendant. */}
  <span className='hig-sr-only hig-assets-cursor' aria-live='polite' aria-atomic='true'>{rows[active]?rowName(rows[active]):''}</span>
  <div ref={list} className='hig-assets-list' aria-busy={loading||undefined} onKeyDown={onListKeyDown}>
   {sections.length===0&&<p className='hig-assets-empty' role='status'>{empty}</p>}
   {sections.length===0&&!loading&&emptyAction&&<Button intent='secondary' data-testid={emptyAction.testID} onClick={emptyAction.onPress}>{emptyAction.label}</Button>}
   {sections.map(section=>{const first=rows.indexOf(section.assets[0]);return <section key={section.category.id} className='hig-assets-section' aria-labelledby={`${id}-${section.category.id}`}>
    {sectionHeader(section.category)}
    <ul>{section.assets.map((asset,offset)=>row(asset,first+offset))}</ul>
   </section>;})}
  </div>
 </section>;
}
