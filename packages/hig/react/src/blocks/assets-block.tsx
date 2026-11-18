"use client";
import { Eye } from '@bloxwap/icons/react/eye';
import { TrendingDown } from '@bloxwap/icons/react/trending-down';
import { TrendingUp } from '@bloxwap/icons/react/trending-up';
import {RowWindow} from '../row-window.js';
import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import {formatCountdown} from '@bloxwap/hig/contracts/format';
import {PressDecoration,useHIG,useMessages} from '../provider.js';
import {SearchInput} from '../field.js';
import {Filter,SegmentedControl} from '../selection.js';
import {Badge} from '../status.js';
import {Button} from '../button.js';
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
 /** Freezes the opening countdown at the text it last showed, stops its timer and its digits rolling, for example while the block is off screen. */
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
const searchText=new WeakMap<AssetItem,{name:string;symbol:string;keywords:AssetItem['keywords'];folded:string}>();
function foldedAsset(asset:AssetItem){
 const {name,symbol,keywords}=asset;
 const saved=searchText.get(asset);
 if(saved&&saved.name===name&&saved.symbol===symbol&&saved.keywords===keywords)return saved.folded;
 const folded=fold(`${name} ${symbol} ${keywords??''}`);
 searchText.set(asset,{name,symbol,keywords,folded});
 return folded;
}
/** The markets a view, category and query leave, grouped by category in the host's order. Empty sections are dropped. */
export function filterAssets(assets:readonly AssetItem[],categories:readonly AssetCategory[],{view='all',category='',query=''}:{view?:AssetsView;category?:string;query?:string}={}):{category:AssetCategory;assets:AssetItem[]}[]{
 const needle=fold(query.trim());
 const keep=(asset:AssetItem)=>(view==='all'||(view==='positions'?!!asset.position:asset.signal!=null))&&(needle===''||foldedAsset(asset).includes(needle));
 const selected=category===''?categories:categories.filter(entry=>entry.id===category);
 if(selected.length===1){
  const entry=selected[0];
  const matches:AssetItem[]=[];
  for(const asset of assets)if(asset.category===entry.id&&keep(asset))matches.push(asset);
  return matches.length?[{category:entry,assets:matches}]:[];
 }
 const sections=selected.map(entry=>({category:entry,assets:[] as AssetItem[]}));
 if(sections.length===0)return sections;
 // Preserve the host's category order, including repeated IDs with distinct sections.
 const byCategory=new Map<string,typeof sections>();
 for(const section of sections){
  const group=byCategory.get(section.category.id);
  if(group)group.push(section);
  else byCategory.set(section.category.id,[section]);
 }
 for(const asset of assets){
  const group=byCategory.get(asset.category);
  if(group&&keep(asset))for(const section of group)section.assets.push(asset);
 }
 return sections.filter(section=>section.assets.length>0);
}
const signalIcons:Record<AssetSignal,React.ReactNode>={
 watch:<Eye size={20}/>,
 up:<TrendingUp size={20}/>,
 down:<TrendingDown size={20}/>,
};
/** Controlled when `value` is set, otherwise local. No feedback: the filter and segmented control emit their own, and typing emits none. */
function useHostState<T>(value:T|undefined,initial:T,onChange?:(value:T)=>void):[T,(next:T)=>void]{
 const [local,setLocal]=useState(initial);const current=value===undefined?local:value;
 const set=React.useCallback((next:T)=>{if(Object.is(next,current))return;if(value===undefined)setLocal(next);onChange?.(next);},[current,value,onChange]);
 return [current,set];
}
const secondLine=(asset:AssetItem)=>asset.detail?`${asset.symbol} · ${asset.detail}`:asset.symbol;
const rowName=(asset:AssetItem,second:string,signalLabel:string|undefined)=>[asset.name,second,asset.trailingLabel,signalLabel].filter(Boolean).join(', ');
const MarketRow=React.memo(function MarketRow({asset,selected,active,signalLabel,onSelect}:{
 asset:AssetItem;selected:boolean;active:boolean;signalLabel?:string;onSelect:AssetsBlockProps['onSelect'];
}){
 const second=secondLine(asset);
 const signal=asset.signal===undefined?null:<span className='hig-assets-signal' data-signal={asset.signal??undefined}>{asset.signal?signalIcons[asset.signal]:null}</span>;
 const name=rowName(asset,second,signalLabel);
 return <button type='button' className='hig-assets-row' data-asset-id={asset.id} data-active={active||undefined} aria-label={name} aria-current={selected||undefined} disabled={asset.disabled} onClick={()=>onSelect(asset)}>
  <span className='hig-assets-icon' aria-hidden='true'>{typeof asset.icon==='string'?<img src={asset.icon} alt=''/>:asset.icon??asset.symbol.slice(0,4)}</span>
  <span className='hig-assets-text' aria-hidden='true'><strong>{asset.name}</strong><span>{second}</span></span>
  {asset.trailing!=null&&asset.trailing!==false?<span className='hig-assets-trailing' aria-hidden='true'>{asset.trailing}</span>:null}
  {signal}
  <PressDecoration kind='row' disabled={!!asset.disabled}/>
 </button>;
});

const OpeningTime=React.createContext<number|null>(null);
function OpeningHeading({at,children}:{at:number;children:(remaining:number|null)=>React.ReactElement}){
 const now=React.useContext(OpeningTime);
 const remaining=now!=null&&at>now?at-now:null;
 return useMemo(()=>children(remaining),[children,remaining]);
}
/** The host clock, ticking each second while the latest opening is still ahead and not `paused`; paused keeps the last reading (or takes one) and judges "ahead" against it, so a host re-render after an opening passes keeps the frozen text. `null` until mounted, so server HTML never carries a clock that hydration would contradict. */
function OpeningClock({latestOpening,paused,clock,children}:{latestOpening:number;paused:boolean;clock:()=>number;children:React.ReactNode}){
 const [now,setNow]=useState<number|null>(null);const read=useRef(clock);read.current=clock;
 const reading=paused&&now!=null?now:latestOpening>-Infinity?clock():0;const active=latestOpening>reading;
 useEffect(()=>{if(!active){setNow(null);return;}if(paused){setNow(last=>last??read.current());return;}setNow(read.current());const tick=setInterval(()=>setNow(read.current()),1000);return()=>clearInterval(tick);},[active,paused]);
 return <OpeningTime.Provider value={active?now:null}>{children}</OpeningTime.Provider>;
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
 // Only typed edits wait. Host-driven query changes and clearing the field apply immediately.
 const [pending,setPending]=useState<{input:string;previous:string;category:string;view:AssetsView}|null>(null);
 const waiting=assets.length>50&&pending?.input===currentQuery&&pending.category===currentCategory&&pending.view===currentView;
 const filterQuery=waiting?pending.previous:currentQuery;
 function editQuery(next:string){
  if(next===currentQuery)return;
  setPending(assets.length>50&&next.trim()!==''?{input:next,previous:filterQuery,category:currentCategory,view:currentView}:null);
  setQuery(next);
 }
 useEffect(()=>{
  if(!pending)return;
  if(!waiting){setPending(null);return;}
  const timer=setTimeout(()=>setPending(current=>current===pending?null:current),150);
  return ()=>clearTimeout(timer);
 },[pending,waiting]);
 const viewOptions=useMemo(()=>[{value:'all',label:t.assetsAll},{value:'positions',label:t.assetsPositions},{value:'trend',label:t.assetsTrend}],[t.assetsAll,t.assetsPositions,t.assetsTrend]);
 // Keyboard submission can flush an edit before its timer. Reuse that result on the ensuing render.
 const sectionsFor=useMemo(()=>{
  let cached:{query:string;sections:ReturnType<typeof filterAssets>}|undefined;
  return (query:string)=>{
   if(cached?.query===query)return cached.sections;
   const sections=filterAssets(assets,categories,{view:currentView,category:currentCategory,query});
   cached={query,sections};
   return sections;
  };
 },[assets,categories,currentView,currentCategory]);
 const sections=sectionsFor(filterQuery);
 function currentSections(){
  if(waiting)setPending(null);
  return sectionsFor(currentQuery);
 }
 // The clock runs only while a section on screen has an opening still ahead.
 const latestOpening=useMemo(()=>sections.reduce((latest,section)=>{
  const at=opensAtTime(section.category);
  return at!=null&&at>latest?at:latest;
 },-Infinity),[sections]);
 const rowCount=useMemo(()=>sections.reduce((count,section)=>count+section.assets.length,0),[sections]);
 const keyboardRows=useMemo(()=>{
  let rows:AssetItem[]|undefined;
  return ()=>rows??=(sections.length===1?sections[0].assets:sections.flatMap(section=>section.assets));
 },[sections]);
 // The cursor follows an asset, not a position, so a live update that reorders or drops rows never moves it onto another market.
 const [highlight,setHighlight]=useState<{id:string;index:number}|null>(null);
 const active=useMemo(()=>{
  if(!highlight)return -1;
  const rows=keyboardRows();
  return rows[highlight.index]?.id===highlight.id?highlight.index:rows.findIndex(asset=>asset.id===highlight.id);
 },[keyboardRows,highlight]);
 const activeAsset=active>=0?keyboardRows()[active]:undefined;
 const focusCursor=useRef(false);
 const field=useRef<HTMLInputElement>(null),list=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(autoFocusSearch&&window.matchMedia?.('(pointer: fine)').matches)field.current?.focus();},[]);
 useEffect(()=>{setHighlight(null);},[currentQuery,currentCategory,currentView]);
 useEffect(()=>{
  if(active<0)return;
  const button=list.current?.querySelector<HTMLButtonElement>('[data-active]');
  button?.scrollIntoView?.({block:'nearest'});
  if(focusCursor.current){focusCursor.current=false;button?.focus();setHighlight(null);}
 },[active]);
 // From the search field the arrow keys move through the enabled rows and Enter chooses one: the one the arrows reached, or, if they have not moved, the only row (or with `enterChoosesFirst` and a query, the first enabled one).
 const step=(from:number,by:number,candidates:AssetItem[])=>{for(let index=from+by;index>=0&&index<candidates.length;index+=by)if(!candidates[index].disabled)return index;return from;};
 const onKeyDown=(event:React.KeyboardEvent<HTMLInputElement>)=>{
  if(event.nativeEvent.isComposing||event.keyCode===229)return;// An IME commit is not a choice.
  if(event.key!=='ArrowDown'&&event.key!=='ArrowUp'&&event.key!=='Enter')return;
  const candidates=waiting?currentSections().flatMap(section=>section.assets):keyboardRows();
  const cursor=waiting?-1:active;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const next=step(cursor,event.key==='ArrowDown'?1:-1,candidates);setHighlight(candidates[next]?{id:candidates[next].id,index:next}:null);}
  else {const choice=highlight!=null&&!waiting?candidates[cursor]:enterChoosesFirst&&currentQuery.trim()!==''?candidates.find(asset=>!asset.disabled):candidates.length===1?candidates[0]:undefined;if(choice&&!choice.disabled){event.preventDefault();onSelect(choice);}}
 };
 // With a row focused (by Tab or a click) the arrow keys move focus to the next or previous enabled row; Up from the first returns to the search field. Focus is then the cursor, so the field's highlight steps aside.
 const onListKeyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{
  const tab=event.key==='Tab'&&rowCount>50;
  if(!tab&&event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
  const current=(event.target as Element).closest?.('.hig-assets-row');if(!current||!list.current)return;
  if(rowCount>50){
   const position=current.parentElement?.getAttribute('data-market-index');
   if(position==null)return;
   const index=Number(position);
   const backward=event.key==='ArrowUp'||(tab&&event.shiftKey);
   const rows=keyboardRows();
   const next=step(index,backward?-1:1,rows);
   if(tab&&next===index)return;
   event.preventDefault();
   if(next!==index){focusCursor.current=true;setHighlight({id:rows[next].id,index:next});}
   else if(backward)field.current?.focus();
   return;
  }
  const buttons=[...list.current.querySelectorAll<HTMLButtonElement>('.hig-assets-row:not(:disabled)')];const index=buttons.indexOf(current as HTMLButtonElement);
  event.preventDefault();setHighlight(null);
  if(event.key==='ArrowUp'&&index<=0){field.current?.focus();return;}
  buttons[event.key==='ArrowDown'?Math.min(buttons.length-1,index+1):index-1]?.focus();
 };
 const heading=title??t.assets;const signalName:Record<AssetSignal,string>={watch:t.signalWatch,up:t.signalUp,down:t.signalDown};
 const empty=loading?`${t.loading}…`:filterQuery.trim()!==''?t.noResults:currentView==='positions'?t.noPositions:currentView==='trend'?t.noTrend:t.noItems;
 const signalLabel=(asset:AssetItem)=>asset.signal?signalName[asset.signal]:undefined;
 const row=(asset:AssetItem,index:number)=><li key={asset.id} data-market-index={rowCount>50?index:undefined}><MarketRow asset={asset} selected={asset.id===selectedId} active={index===active} signalLabel={signalLabel(asset)} onSelect={onSelect}/></li>;
 const showFilter=(categoryFilter??true)&&categories.length>1;
 const categoryOptions=useMemo(()=>showFilter?[{value:'',label:t.assetsAll},...categories.map(entry=>({value:entry.id,label:entry.label}))]:[],[categories,showFilter,t.assetsAll]);
 const categoryControl=useMemo(()=>showFilter?<Filter label={t.marketCategories} options={categoryOptions} value={currentCategory} onValueChange={setCategory}/>:null,
  [showFilter,t.marketCategories,categoryOptions,currentCategory,setCategory]);
 const sectionHeader=(entry:AssetCategory,remaining:number|null)=>{
  const countdown=remaining!=null?formatCountdown(remaining,locale):null;
  const badge=countdown?{visible:`${t.opensIn} ${countdown.visible}`,spoken:`${t.opensIn} ${countdown.spoken}`,tone:'neutral' as const}:entry.status?{visible:entry.status.label,spoken:entry.status.label,tone:entry.status.tone??'positive'}:null;
  return <div className='hig-assets-section-header'><h3 id={`${id}-${entry.id}`} aria-label={badge?`${entry.label}, ${badge.spoken}`:undefined}>{entry.label}</h3>{badge&&<Badge aria-hidden='true' className='hig-assets-status' data-countdown={countdown?'':undefined} tone={badge.tone}>{countdown&&remaining!=null?<AnimatedNumberReadout value={Math.ceil(remaining/1000)} formattedValue={countdown.visible} animateFormatted duration={paused?0:undefined} prefix={`${t.opensIn} `}/>:badge.visible}</Badge>}</div>;
 };
 const renderHeading=(entry:AssetCategory)=>{
  const at=opensAtTime(entry);
  return at==null?sectionHeader(entry,null):<OpeningHeading at={at}>{remaining=>sectionHeader(entry,remaining)}</OpeningHeading>;
 };
 let sectionStart=0;
 return <section {...rest} className={`hig-assets-block${className?` ${className}`:''}`}>
  <ScreenHeader title={heading} headingId={headingId} stickyHeader={stickyHeader} action={onClose?<HeaderClose onClose={onClose} label={t.close}/>:undefined}/>
  <SearchInput ref={field} aria-label={t.searchMarkets} placeholder={`${t.searchMarkets}…`} value={currentQuery} onChange={event=>editQuery(event.target.value)} onKeyDown={onKeyDown} onClear={clearable?()=>editQuery(''):undefined} enterKeyHint='search' autoComplete='off' autoCapitalize='none' autoCorrect='off' spellCheck={false}/>
  {categoryControl}
  <SegmentedControl hideLabel label={t.assetsView} options={viewOptions} value={currentView} onValueChange={next=>setView(next as AssetsView)}/>
  {/* Focus stays in the field, so the row the arrows reach is spoken here: the rows are buttons, not options a searchbox could own through aria-activedescendant. */}
  <span className='hig-sr-only hig-assets-cursor' aria-live='polite' aria-atomic='true'>{activeAsset?rowName(activeAsset,secondLine(activeAsset),signalLabel(activeAsset)):''}</span>
  <div ref={list} className='hig-assets-list' aria-busy={loading||undefined} onKeyDown={onListKeyDown}>
   {sections.length===0&&<p className='hig-assets-empty' role='status'>{empty}</p>}
   {sections.length===0&&!loading&&emptyAction&&<Button intent='secondary' data-testid={emptyAction.testID} onClick={emptyAction.onPress}>{emptyAction.label}</Button>}
   <OpeningClock latestOpening={latestOpening} paused={paused} clock={clock}>{sections.map(section=>{const first=sectionStart;sectionStart+=section.assets.length;return <section key={section.category.id} className='hig-assets-section' aria-labelledby={`${id}-${section.category.id}`}>
    {renderHeading(section.category)}
    {rowCount>50?<RowWindow itemKey="id" items={section.assets} rowHeight={64} gap={4} first={first} active={active} renderRow={row}/>:<ul>{section.assets.map((asset,offset)=>row(asset,first+offset))}</ul>}
   </section>;})}</OpeningClock>
  </div>
 </section>;
}
