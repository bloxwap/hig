import {useBlockHorizontalInset} from './sheet-header-glow.js';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {formatCountdown} from '@bloxwap/hig/contracts';
import {Image,Pressable,View,VirtualizedList,type FlatListProps,type ScrollViewProps,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {SearchInput} from './field.js';
import {Filter,SegmentedControl} from './radio-group.js';
import {ScreenHeader,HeaderClose} from './screen-header.js';
import {PickerFlatList,sectionCellCount,sectionForCell,usePickerWindow} from './picker-flat-list.js';
import {StickyHeaderLayout} from './sticky-header.js';
import {EyeIcon,TrendIcon} from './icons.js';
import {Button} from './button.js';
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
 /** Host content on the trailing edge, before the signal disc, such as the live result of the viewer's open position. It is drawn only (inside the row button, hidden from assistive technology); the row reads `trailingLabel` for it. Test ID `<testID>-<id>-trailing`. */
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
export interface AssetsBlockProps {
 /** Shows a clear button in the search field while it holds text: it empties the query and returns focus to the field. Named by `messages.clearSearch`; test ID `<testID>-search-clear`. */
 clearable?:boolean;
 /** Heading. Defaults to the built-in “Assets”. */
 title?:string;
 /** Shows Close on the trailing edge of the header. */
 onClose?:()=>void;
 assets:readonly AssetItem[];
 /** Sections and filter capsules, in order. A market whose category is not listed is not shown. */
 categories:readonly AssetCategory[];
 onSelect:(asset:AssetItem)=>void;
 /** `id` of the market in use: its row is marked selected. */
 selectedId?:string|null;
 view?:AssetsView;defaultView?:AssetsView;onViewChange?:(view:AssetsView)=>void;
 /** `id` of the chosen category; `''` is All. */
 category?:string;defaultCategory?:string;onCategoryChange?:(category:string)=>void;
 query?:string;defaultQuery?:string;onQueryChange?:(query:string)=>void;
 /** `false` leaves out the category filter. Defaults to `true` when there is more than one category. */
 categoryFilter?:boolean;
 /** The horizontal scroll view the category capsules sit in, such as a sheet library's ScrollView. Forwarded to `Filter`. */
 filterScrollComponent?:React.ComponentType<ScrollViewProps>;
 /** Shows the loading text in place of the empty text while the list is empty. */
 loading?:boolean;
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it (test ID `<testID>-sticky-header`, `assets-sticky-header` without one). Place it in a bounded container, such as a sheet body. */
 stickyHeader?:boolean;
 /** With `stickyHeader`: the header's fill once content is under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. Defaults to React Native's ScrollView. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 /** Supply the screen or sheet’s FlatList as the single vertical scroller in a bounded container. */
 listComponent?:React.ComponentType<FlatListProps<AssetsListCell>>;
 /** `nativeID` of the title, so a sheet around the block can name itself with `accessibilityLabelledBy` (Android), as `GestureSheet labelledBy` does. */
 headingId?:string;
 /** Freezes the opening countdown at the text it last showed, stops its timer and its digits rolling, for example while the sheet is closed or the app is in the background. */
 paused?:boolean;
 /** The host's clock in epoch milliseconds, read for the opening countdown. Defaults to `Date.now`. */
 now?:()=>number;
 /** A button under the empty text, drawn only while the list is empty and not `loading`, such as Browse all markets on an empty Positions view. Test ID `testID`, else `<testID>-empty-action`. */
 emptyAction?:AssetsEmptyAction;
 /** Focuses the search field on mount, raising the keyboard, so typing filters at once. */
 autoFocusSearch?:boolean;
 /** While the search field holds a query, the keyboard's Search key chooses the first enabled match, as a search box's top hit. By default it only closes the keyboard. */
 enterChoosesFirst?:boolean;
 testID?:string;
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
/** Controlled when `value` is set, otherwise local. No feedback: the filter and segmented control emit their own, and typing emits none. */
function useHostState<T>(value:T|undefined,initial:T,onChange?:(value:T)=>void):[T,(next:T)=>void]{
 const [local,setLocal]=useState(initial);const current=value===undefined?local:value;
 const set=React.useCallback((next:T)=>{if(Object.is(next,current))return;if(value===undefined)setLocal(next);onChange?.(next);},[current,value,onChange]);
 return [current,set];
}
const OpeningTime=React.createContext<number|null>(null);
function OpeningHeading({at,children}:{at:number;children:(remaining:number|null)=>React.ReactElement}){
 const now=React.useContext(OpeningTime);
 const remaining=now!=null&&at>now?at-now:null;
 return useMemo(()=>children(remaining),[children,remaining]);
}
/** The host clock, ticking each second while the latest opening is still ahead and not `paused`; paused keeps the last reading (or takes one) and judges "ahead" against it, so a host re-render after an opening passes keeps the frozen text. */
function OpeningClock({latestOpening,paused,clock,children}:{latestOpening:number;paused:boolean;clock:()=>number;children:React.ReactNode}){
 const [now,setNow]=useState<number|null>(()=>{if(latestOpening===-Infinity)return null;const first=clock();return latestOpening>first?first:null;});const read=useRef(clock);read.current=clock;
 const reading=paused&&now!=null?now:latestOpening>-Infinity?clock():0;const active=latestOpening>reading;
 useEffect(()=>{if(!active){setNow(null);return;}if(paused){setNow(last=>last??read.current());return;}setNow(read.current());const tick=setInterval(()=>setNow(read.current()),1000);return()=>clearInterval(tick);},[active,paused]);
 return <OpeningTime.Provider value={active?now:null}>{children}</OpeningTime.Provider>;
}
const opensAtTime=(category:AssetCategory)=>category.opensAt==null?null:+category.opensAt;
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const disc=44;
const round:ViewStyle={width:disc,height:disc,borderRadius:disc/2,alignItems:'center',justifyContent:'center',overflow:'hidden'};
const MarketRow=React.memo(function MarketRow({asset,selected,signalLabel,onSelect,rowTestID}:{
 asset:AssetItem;selected:boolean;signalLabel?:string;onSelect:AssetsBlockProps['onSelect'];rowTestID?:string;
}){
 const colors=useColors(),fills=useFills();
 const signalColor=asset.signal==='up'?colors.positive:asset.signal==='down'?colors.negative:colors.warning;
 const second=asset.detail?`${asset.symbol} · ${asset.detail}`:asset.symbol;
 const style=({pressed}:{pressed:boolean}):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:64,padding:8,borderRadius:32,backgroundColor:pressed||selected?fills.well:'transparent',opacity:asset.disabled?0.5:1});
 return <Pressable testID={rowTestID} accessibilityRole='button' accessibilityLabel={[asset.name,second,asset.trailingLabel,signalLabel].filter(Boolean).join(', ')} accessibilityState={{selected,disabled:!!asset.disabled}} disabled={asset.disabled} onPress={()=>onSelect(asset)} style={style}>{({pressed})=><>
  <View {...hidden}>{typeof asset.icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:asset.icon}} style={round as object}/>:<View style={[round,{backgroundColor:fills.raised}]}>{asset.icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{asset.symbol.slice(0,4)}</Text>}</View>}</View>
  <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
   <Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{asset.name}</Text>
   <Text numberOfLines={1} style={{fontSize:14,lineHeight:20,color:colors.muted}}>{second}</Text>
  </View>
  {asset.trailing!=null&&asset.trailing!==false?<View {...hidden} testID={rowTestID===undefined?undefined:`${rowTestID}-trailing`} style={{flexShrink:0,alignItems:'flex-end'}}>{asset.trailing}</View>:null}
  {/* The empty disc sits on the row's well once the row fills, so it steps up to the raised fill. */}
  {asset.signal===undefined?null:<View {...hidden} testID={rowTestID===undefined?undefined:`${rowTestID}-signal`} style={[round,{backgroundColor:asset.signal?`${signalColor}26`:pressed||selected?fills.raised:fills.well}]}>
   {asset.signal==='watch'?<EyeIcon color={colors.warning}/>:asset.signal?<TrendIcon color={signalColor} direction={asset.signal}/>:null}
  </View>}
 </>}</Pressable>;
});

export type AssetsListCell={kind:'controls';key:string}|{kind:'heading';key:string;category:AssetCategory}|{kind:'row';key:string;asset:AssetItem};

type MarketHeading=Extract<AssetsListCell,{kind:'heading'}>&{start:number;end:number;row:(offset:number)=>AssetsListCell};
const marketControls:AssetsListCell={kind:'controls',key:'controls'};
function marketCell(headings:readonly MarketHeading[],index:number):AssetsListCell{
 if(index===0)return marketControls;
 const heading=sectionForCell(headings,index);
 return index===heading.start?heading:heading.row(index-heading.start-1);
}
function SectionedMarketList(props:FlatListProps<AssetsListCell>){
 return <VirtualizedList {...props} getItem={marketCell} getItemCount={sectionCellCount}/>;
}
function MarketList({listComponent,sticky,sections,header,controls,empty,renderHeading,renderRow,inset,background,scrollComponent,testID,direction}:{
 listComponent?:AssetsBlockProps['listComponent'];sticky?:boolean;sections:ReturnType<typeof filterAssets>;header:React.ReactElement;controls:React.ReactElement;empty:React.ReactNode;
 renderHeading:(category:AssetCategory)=>React.ReactNode;renderRow:(asset:AssetItem)=>React.ReactElement;
 inset:number;background?:string;scrollComponent?:React.ComponentType<ScrollViewProps>;testID?:string;direction:'ltr'|'rtl';
}){
 const cells=useMemo(()=>{
  if(listComponent){
   const result:AssetsListCell[]=[marketControls];
   for(const {category,assets} of sections){
    result.push({kind:'heading',key:`heading:${category.id}`,category});
    for(const asset of assets)result.push({kind:'row',key:`row:${category.id}:${asset.id}`,asset});
   }
   return result;
  }
  let end=1;
  return sections.map(({category,assets}):MarketHeading=>{
   const start=end;
   end+=1+assets.length;
   const rows=new Map<number,AssetsListCell>();
   function row(offset:number){
    let cell=rows.get(offset);
    if(!cell){
     const asset=assets[offset];
     cell={kind:'row',key:`row:${category.id}:${asset.id}`,asset};
     rows.set(offset,cell);
    }
    return cell;
   }
   return {kind:'heading',key:`heading:${category.id}`,category,start,end,row};
  });
 },[sections,listComponent]);
 return <PickerFlatList listComponent={listComponent??SectionedMarketList} scrollComponent={scrollComponent} header={header} headerTestID={testID===undefined?'assets-sticky-header':`${testID}-sticky-header`}
  testID={testID} data={cells} keyExtractor={cell=>cell.key} rowHeight={68} sticky={sticky} inset={inset} direction={direction} background={background}
  renderItem={({item})=><View style={{direction,paddingHorizontal:inset,paddingTop:item.kind==='row'?4:16,gap:16}}>
   {item.kind==='controls'?<>{controls}{sections.length===0?empty:null}</>:item.kind==='heading'?renderHeading(item.category):renderRow(item.asset)}
  </View>}/>;
}
/**
 * Choose a market as one screen: a header, a search field, category capsules, the All / Positions / Trend views, then the
 * markets in sections by category, each with its icon, name, symbol and detail on one line each, and its signal disc. The host
 * supplies the data. Standalone catalogs above 50 markets use a virtualized list in a bounded viewport.
 */
export function AssetsBlock({title,onClose,assets,categories,onSelect,selectedId=null,view,defaultView='all',onViewChange,category,defaultCategory='',onCategoryChange,query,defaultQuery='',onQueryChange,categoryFilter,filterScrollComponent,loading,stickyHeader,stickyHeaderBackground,scrollComponent,listComponent,headingId,clearable,paused=false,now:clock=Date.now,emptyAction,autoFocusSearch,enterChoosesFirst,testID}:AssetsBlockProps){
 const horizontalInset=useBlockHorizontalInset();
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale}=useHIG();
 const id=(part:string)=>testID===undefined?undefined:`${testID}-${part}`;
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
 const signalName:Record<AssetSignal,string>={watch:t.signalWatch,up:t.signalUp,down:t.signalDown};
 const toneColor={positive:colors.positive,negative:colors.negative,warning:colors.warning,info:colors.info};
 const empty=loading?`${t.loading}…`:filterQuery.trim()!==''?t.noResults:currentView==='positions'?t.noPositions:currentView==='trend'?t.noTrend:t.noItems;
 const row=(asset:AssetItem)=><MarketRow key={asset.id} asset={asset} selected={asset.id===selectedId} signalLabel={asset.signal?signalName[asset.signal]:undefined} onSelect={onSelect} rowTestID={id(asset.id)}/>;
 const showFilter=(categoryFilter??true)&&categories.length>1;
 const categoryOptions=useMemo(()=>showFilter?[{value:'',label:t.assetsAll},...categories.map(entry=>({value:entry.id,label:entry.label}))]:[],[categories,showFilter,t.assetsAll]);
 const categoryControl=useMemo(()=>showFilter?<Filter label={t.marketCategories} options={categoryOptions} value={currentCategory} onValueChange={setCategory} scrollComponent={filterScrollComponent} bleed={8}/>:null,
  [showFilter,t.marketCategories,categoryOptions,currentCategory,setCategory,filterScrollComponent]);
 const header=<ScreenHeader title={title??t.assets} testID={id('header')} headingId={headingId} action={onClose?<HeaderClose onClose={onClose} label={t.close} testID={id('close')}/>:undefined}/>;
 const sectionHeader=(entry:AssetCategory,remaining:number|null)=>{
  const countdown=remaining!=null?formatCountdown(remaining,locale):null;
  const status=countdown?{label:`${t.opensIn} ${countdown.visible}`,spoken:`${t.opensIn} ${countdown.spoken}`,color:colors.muted,fill:fills.well}:entry.status?{label:entry.status.label,spoken:entry.status.label,color:toneColor[entry.status.tone??'positive'],fill:`${toneColor[entry.status.tone??'positive']}26`}:null;
  // Align the heading and badge with the leading icon and trailing signal disc.
  return <View testID={id(`section-${entry.id}-header`)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:32,paddingHorizontal:8}}>
     <Text accessibilityRole='header' accessibilityLabel={status?`${entry.label}, ${status.spoken}`:undefined} style={{flexShrink:1,fontSize:14,lineHeight:20,fontWeight:'500',color:colors.muted}}>{entry.label}</Text>
     {status?<View {...hidden} testID={id(`status-${entry.id}`)} style={{borderRadius:9999,paddingVertical:2,paddingHorizontal:10,backgroundColor:status.fill}}>{countdown&&remaining!=null?<AnimatedNumberReadout value={Math.ceil(remaining/1000)} formattedValue={countdown.visible} animateFormatted duration={paused?0:undefined} prefix={`${t.opensIn} `} testID={id(`countdown-${entry.id}`)} tone='muted' maxFontSizeMultiplier={1.4} style={{fontSize:12,lineHeight:16,fontWeight:'600',letterSpacing:0.25}}/>:<Text maxFontSizeMultiplier={1.4} style={{fontSize:12,lineHeight:16,fontWeight:'600',letterSpacing:1,fontVariant:['tabular-nums'],color:status.color}}>{status.label}</Text>}</View>:null}
    </View>;
 };
 function chooseFirstMatch(){
  if(currentQuery.trim()==='')return;
  for(const section of currentSections()){
   const first=section.assets.find(asset=>!asset.disabled);
   if(first){onSelect(first);return;}
  }
 }
 const controls=<>
  <SearchInput testID={id('search')} accessibilityLabel={t.searchMarkets} placeholder={`${t.searchMarkets}…`} value={currentQuery} onChangeText={editQuery} onClear={clearable?()=>editQuery(''):undefined} autoFocus={autoFocusSearch} returnKeyType='search' onSubmitEditing={enterChoosesFirst?chooseFirstMatch:undefined} autoCapitalize='none' autoCorrect={false} spellCheck={false}/>
  {categoryControl}
  <SegmentedControl hideLabel testID={id('view')} label={t.assetsView} options={viewOptions} value={currentView} onValueChange={next=>setView(next as AssetsView)}/>
 </>;
 const emptyContent=<View style={{gap:16,alignItems:'center'}}>
   <Text testID={id('empty')} accessibilityLiveRegion='polite' style={{alignSelf:'stretch',paddingVertical:32,textAlign:'center',fontSize:14,lineHeight:20,color:colors.muted}}>{empty}</Text>
   {/* Centred under the empty text, as on web: Button's own alignSelf (flex-start) would otherwise win over the column's alignItems. */}
   {!loading&&emptyAction?<Button intent='secondary' testID={emptyAction.testID??id('empty-action')} onPress={emptyAction.onPress} style={{alignSelf:'center'}}>{emptyAction.label}</Button>:null}
  </View>;
 const renderHeading=(entry:AssetCategory)=>{
  const at=opensAtTime(entry);
  return at==null?sectionHeader(entry,null):<OpeningHeading at={at}>{remaining=>sectionHeader(entry,remaining)}</OpeningHeading>;
 };
 const windowed=usePickerWindow(assets.length,stickyHeader,!!listComponent);
 let content:React.ReactElement;
 if(windowed){
  content=<MarketList sticky={stickyHeader} listComponent={listComponent} sections={sections} header={header} controls={controls} empty={emptyContent} renderHeading={renderHeading} renderRow={row} inset={horizontalInset} background={stickyHeaderBackground} scrollComponent={stickyHeader||listComponent?scrollComponent:undefined} testID={testID} direction={direction}/>;
 }else{
  const body=<>{controls}{sections.length===0?emptyContent:
   <View testID={id('list')} style={{gap:16}}>
    {sections.map(section=><View key={section.category.id} testID={id(`section-${section.category.id}`)} style={{gap:4}}>
     {renderHeading(section.category)}
     <View style={{gap:4}}>{section.assets.map(row)}</View>
    </View>)}
   </View>}
  </>;
  // The sticky layout puts the header and the body in separate views, so the body's first gap is its top padding.
  content=stickyHeader?<StickyHeaderLayout horizontalInset={horizontalInset} testID={testID} headerTestID={id('sticky-header')??'assets-sticky-header'} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{direction,gap:16,paddingTop:16}}>{body}</StickyHeaderLayout>:<View testID={testID} style={{direction,paddingVertical:16,paddingHorizontal:horizontalInset,gap:16}}>
   {header}
   {body}
  </View>;
 }
 return <OpeningClock latestOpening={latestOpening} paused={paused} clock={clock}>{content}</OpeningClock>;
}
