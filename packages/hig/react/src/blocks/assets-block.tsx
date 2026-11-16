"use client";
import React,{useEffect,useId,useMemo,useState} from 'react';
import {formatCountdown} from '@bloxwap/hig/contracts';
import {PressDecoration,useHIG,useMessages} from '../provider.js';
import {SearchInput} from '../field.js';
import {Filter,SegmentedControl} from '../selection.js';
import {Badge} from '../status.js';
import {AnimatedNumberReadout} from '../animated-number.js';
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
}
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
/** The current time, ticking each second while `active`. `null` until mounted, so server HTML never carries a clock that hydration would contradict. */
function useNow(active:boolean):number|null{
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{if(!active)return;setNow(Date.now());const tick=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(tick);},[active]);
 return active?now:null;
}
const opensAtTime=(category:AssetCategory)=>category.opensAt==null?null:+category.opensAt;
/**
 * Choose a market as one screen: a header, a search field, category capsules, the All / Positions / Trend views, then the
 * markets in sections by category, each with its icon, name, symbol and detail, and its signal disc. The host owns the data.
 */
export function AssetsBlock({title,onClose,assets,categories,onSelect,selectedId=null,view,defaultView='all',onViewChange,category,defaultCategory='',onCategoryChange,query,defaultQuery='',onQueryChange,categoryFilter,loading,stickyHeader,headingId,clearable,className,...rest}:AssetsBlockProps){
 const t=useMessages();const {locale}=useHIG();const id=useId();
 const now=useNow(categories.some(entry=>{const at=opensAtTime(entry);return at!=null&&at>Date.now();}));
 const [currentView,setView]=useHostState<AssetsView>(view,defaultView,onViewChange);
 const [currentCategory,setCategory]=useHostState(category,defaultCategory,onCategoryChange);
 const [currentQuery,setQuery]=useHostState(query,defaultQuery,onQueryChange);
 const sections=useMemo(()=>filterAssets(assets,categories,{view:currentView,category:currentCategory,query:currentQuery}),[assets,categories,currentView,currentCategory,currentQuery]);
 const heading=title??t.assets;const signalName:Record<AssetSignal,string>={watch:t.signalWatch,up:t.signalUp,down:t.signalDown};
 const empty=loading?`${t.loading}…`:currentQuery.trim()!==''?t.noResults:currentView==='positions'?t.noPositions:currentView==='trend'?t.noTrend:t.noItems;
 const row=(asset:AssetItem)=>{
  const second=asset.detail?`${asset.symbol} · ${asset.detail}`:asset.symbol;
  const signal=asset.signal===undefined?null:<span className='hig-assets-signal' data-signal={asset.signal??undefined}>{asset.signal?signalIcons[asset.signal]:null}</span>;
  const name=[asset.name,second,asset.trailingLabel,asset.signal?signalName[asset.signal]:null].filter(Boolean).join(', ');
  return <li key={asset.id}><button type='button' className='hig-assets-row' aria-label={name} aria-current={asset.id===selectedId||undefined} disabled={asset.disabled} onClick={()=>onSelect(asset)}>
   <span className='hig-assets-icon' aria-hidden='true'>{typeof asset.icon==='string'?<img src={asset.icon} alt=''/>:asset.icon??asset.symbol.slice(0,4)}</span>
   <span className='hig-assets-text' aria-hidden='true'><strong>{asset.name}</strong><span>{second}</span></span>
   {asset.trailing!=null&&asset.trailing!==false?<span className='hig-assets-trailing' aria-hidden='true'>{asset.trailing}</span>:null}
   {signal}
   <PressDecoration kind='row' disabled={!!asset.disabled}/>
  </button></li>;
 };
 const showFilter=(categoryFilter??true)&&categories.length>1;
 const sectionHeader=(entry:AssetCategory)=>{
  const at=opensAtTime(entry);const remaining=now!=null&&at!=null&&at>now?at-now:null,countdown=remaining!=null?formatCountdown(remaining,locale):null;
  const badge=countdown?{visible:`${t.opensIn} ${countdown.visible}`,spoken:`${t.opensIn} ${countdown.spoken}`,tone:'neutral' as const}:entry.status?{visible:entry.status.label,spoken:entry.status.label,tone:entry.status.tone??'positive'}:null;
  return <div className='hig-assets-section-header'><h3 id={`${id}-${entry.id}`} aria-label={badge?`${entry.label}, ${badge.spoken}`:undefined}>{entry.label}</h3>{badge&&<Badge aria-hidden='true' className='hig-assets-status' data-countdown={countdown?'':undefined} tone={badge.tone}>{countdown&&remaining!=null?<AnimatedNumberReadout value={Math.ceil(remaining/1000)} formattedValue={countdown.visible} animateFormatted prefix={`${t.opensIn} `}/>:badge.visible}</Badge>}</div>;
 };
 return <section {...rest} className={`hig-assets-block${className?` ${className}`:''}`}>
  <ScreenHeader title={heading} headingId={headingId} stickyHeader={stickyHeader} action={onClose?<HeaderClose onClose={onClose} label={t.close}/>:undefined}/>
  <SearchInput aria-label={t.searchMarkets} placeholder={`${t.searchMarkets}…`} value={currentQuery} onChange={event=>setQuery(event.target.value)} onClear={clearable?()=>setQuery(''):undefined} enterKeyHint='search' autoComplete='off' autoCapitalize='none' autoCorrect='off' spellCheck={false}/>
  {showFilter&&<Filter label={t.marketCategories} options={[{value:'',label:t.assetsAll},...categories.map(entry=>({value:entry.id,label:entry.label}))]} value={currentCategory} onValueChange={setCategory}/>}
  <SegmentedControl hideLabel label={t.assetsView} options={[{value:'all',label:t.assetsAll},{value:'positions',label:t.assetsPositions},{value:'trend',label:t.assetsTrend}]} value={currentView} onValueChange={next=>setView(next as AssetsView)}/>
  <div className='hig-assets-list' aria-busy={loading||undefined}>
   {sections.length===0&&<p className='hig-assets-empty' role='status'>{empty}</p>}
   {sections.map(section=><section key={section.category.id} className='hig-assets-section' aria-labelledby={`${id}-${section.category.id}`}>
    {sectionHeader(section.category)}
    <ul>{section.assets.map(row)}</ul>
   </section>)}
  </div>
 </section>;
}
