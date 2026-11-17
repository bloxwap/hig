import React,{useEffect,useMemo,useRef,useState} from 'react';
import {formatCountdown} from '@bloxwap/hig/contracts';
import {Image,Pressable,View,type ScrollViewProps,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {SearchInput} from './field.js';
import {Filter,SegmentedControl} from './radio-group.js';
import {ScreenHeader,HeaderClose} from './screen-header.js';
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
/** The markets a view, category and query leave, grouped by category in the host's order. Empty sections are dropped. */
export function filterAssets(assets:readonly AssetItem[],categories:readonly AssetCategory[],{view='all',category='',query=''}:{view?:AssetsView;category?:string;query?:string}={}):{category:AssetCategory;assets:AssetItem[]}[]{
 const needle=fold(query.trim());
 const keep=(asset:AssetItem)=>(view==='all'||(view==='positions'?!!asset.position:asset.signal!=null))&&(needle===''||fold(`${asset.name} ${asset.symbol} ${asset.keywords??''}`).includes(needle));
 return categories.filter(entry=>category===''||entry.id===category).map(entry=>({category:entry,assets:assets.filter(asset=>asset.category===entry.id&&keep(asset))})).filter(section=>section.assets.length>0);
}
/** Controlled when `value` is set, otherwise local. No feedback: the filter and segmented control emit their own, and typing emits none. */
function useHostState<T>(value:T|undefined,initial:T,onChange?:(value:T)=>void):[T,(next:T)=>void]{
 const [local,setLocal]=useState(initial);const current=value===undefined?local:value;
 return [current,next=>{if(Object.is(next,current))return;if(value===undefined)setLocal(next);onChange?.(next);}];
}
/** The host clock, ticking each second while one of `openings` is still ahead and not `paused`; paused keeps the last reading (or takes one) and judges "ahead" against it, so a host re-render after an opening passes keeps the frozen text. */
function useNow(openings:number[],paused:boolean,clock:()=>number):number|null{
 const [now,setNow]=useState<number|null>(()=>{const first=clock();return openings.some(at=>at>first)?first:null;});const read=useRef(clock);read.current=clock;
 const reading=paused&&now!=null?now:openings.length?clock():0;const active=openings.some(at=>at>reading);
 useEffect(()=>{if(!active){setNow(null);return;}if(paused){setNow(last=>last??read.current());return;}setNow(read.current());const tick=setInterval(()=>setNow(read.current()),1000);return()=>clearInterval(tick);},[active,paused]);
 return active?now:null;
}
const opensAtTime=(category:AssetCategory)=>category.opensAt==null?null:+category.opensAt;
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const disc=44;
/**
 * Choose a market as one screen: a header, a search field, category capsules, the All / Positions / Trend views, then the
 * markets in sections by category, each with its icon, name, symbol and detail on one line each, and its signal disc. The host
 * owns the data and the scrolling, unless `stickyHeader` makes the block its own scroll view.
 */
export function AssetsBlock({title,onClose,assets,categories,onSelect,selectedId=null,view,defaultView='all',onViewChange,category,defaultCategory='',onCategoryChange,query,defaultQuery='',onQueryChange,categoryFilter,filterScrollComponent,loading,stickyHeader,stickyHeaderBackground,scrollComponent,headingId,clearable,paused=false,now:clock=Date.now,emptyAction,autoFocusSearch,enterChoosesFirst,testID}:AssetsBlockProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale}=useHIG();
 const id=(part:string)=>testID===undefined?undefined:`${testID}-${part}`;
 const [currentView,setView]=useHostState<AssetsView>(view,defaultView,onViewChange);
 const [currentCategory,setCategory]=useHostState(category,defaultCategory,onCategoryChange);
 const [currentQuery,setQuery]=useHostState(query,defaultQuery,onQueryChange);
 const sections=useMemo(()=>filterAssets(assets,categories,{view:currentView,category:currentCategory,query:currentQuery}),[assets,categories,currentView,currentCategory,currentQuery]);
 // The clock runs only while a section on screen has an opening still ahead.
 const now=useNow(sections.flatMap(section=>{const at=opensAtTime(section.category);return at==null?[]:[at];}),paused,clock);
 const signalName:Record<AssetSignal,string>={watch:t.signalWatch,up:t.signalUp,down:t.signalDown};
 const signalColor:Record<AssetSignal,string>={watch:colors.warning,up:colors.positive,down:colors.negative};
 const toneColor={positive:colors.positive,negative:colors.negative,warning:colors.warning,info:colors.info};
 const empty=loading?`${t.loading}…`:currentQuery.trim()!==''?t.noResults:currentView==='positions'?t.noPositions:currentView==='trend'?t.noTrend:t.noItems;
 const round:ViewStyle={width:disc,height:disc,borderRadius:disc/2,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const row=(asset:AssetItem)=>{
  const second=asset.detail?`${asset.symbol} · ${asset.detail}`:asset.symbol;
  const selected=asset.id===selectedId;
  const style=({pressed}:{pressed:boolean}):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:64,padding:8,borderRadius:32,backgroundColor:pressed||selected?fills.well:'transparent',opacity:asset.disabled?0.5:1});
  return <Pressable key={asset.id} testID={id(asset.id)} accessibilityRole='button' accessibilityLabel={[asset.name,second,asset.trailingLabel,asset.signal?signalName[asset.signal]:null].filter(Boolean).join(', ')} accessibilityState={{selected,disabled:!!asset.disabled}} disabled={asset.disabled} onPress={()=>onSelect(asset)} style={style}>{({pressed})=><>
   <View {...hidden}>{typeof asset.icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:asset.icon}} style={round as object}/>:<View style={[round,{backgroundColor:fills.raised}]}>{asset.icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{asset.symbol.slice(0,4)}</Text>}</View>}</View>
   <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
    <Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{asset.name}</Text>
    <Text numberOfLines={1} style={{fontSize:14,lineHeight:20,color:colors.muted}}>{second}</Text>
   </View>
   {asset.trailing!=null&&asset.trailing!==false?<View {...hidden} testID={id(`${asset.id}-trailing`)} style={{flexShrink:0,alignItems:'flex-end'}}>{asset.trailing}</View>:null}
   {/* The empty disc sits on the row's well once the row fills, so it steps up to the raised fill. */}
   {asset.signal===undefined?null:<View {...hidden} testID={id(`${asset.id}-signal`)} style={[round,{backgroundColor:asset.signal?`${signalColor[asset.signal]}26`:pressed||selected?fills.raised:fills.well}]}>
    {asset.signal==='watch'?<EyeIcon color={colors.warning}/>:asset.signal?<TrendIcon color={signalColor[asset.signal]} direction={asset.signal}/>:null}
   </View>}
  </>}</Pressable>;
 };
 const showFilter=(categoryFilter??true)&&categories.length>1;
 const header=<ScreenHeader title={title??t.assets} testID={id('header')} headingId={headingId} action={onClose?<HeaderClose onClose={onClose} label={t.close} testID={id('close')}/>:undefined}/>;
 const body=<>
  <SearchInput testID={id('search')} accessibilityLabel={t.searchMarkets} placeholder={`${t.searchMarkets}…`} value={currentQuery} onChangeText={setQuery} onClear={clearable?()=>setQuery(''):undefined} autoFocus={autoFocusSearch} returnKeyType='search' onSubmitEditing={enterChoosesFirst?()=>{const first=currentQuery.trim()===''?undefined:sections.flatMap(section=>section.assets).find(asset=>!asset.disabled);if(first)onSelect(first);}:undefined} autoCapitalize='none' autoCorrect={false} spellCheck={false}/>
  {showFilter?<Filter label={t.marketCategories} options={[{value:'',label:t.assetsAll},...categories.map(entry=>({value:entry.id,label:entry.label}))]} value={currentCategory} onValueChange={setCategory} scrollComponent={filterScrollComponent} bleed={16}/>:null}
  <SegmentedControl hideLabel testID={id('view')} label={t.assetsView} options={[{value:'all',label:t.assetsAll},{value:'positions',label:t.assetsPositions},{value:'trend',label:t.assetsTrend}]} value={currentView} onValueChange={next=>setView(next as AssetsView)}/>
  {sections.length===0?<View style={{gap:16,alignItems:'center'}}>
   <Text testID={id('empty')} accessibilityLiveRegion='polite' style={{alignSelf:'stretch',paddingVertical:32,textAlign:'center',fontSize:14,lineHeight:20,color:colors.muted}}>{empty}</Text>
   {!loading&&emptyAction?<Button intent='secondary' testID={emptyAction.testID??id('empty-action')} onPress={emptyAction.onPress}>{emptyAction.label}</Button>:null}
  </View>:
  <View testID={id('list')} style={{gap:16}}>
   {sections.map(section=>{const at=opensAtTime(section.category);const remaining=now!=null&&at!=null&&at>now?at-now:null,countdown=remaining!=null?formatCountdown(remaining,locale):null;const status=countdown?{label:`${t.opensIn} ${countdown.visible}`,spoken:`${t.opensIn} ${countdown.spoken}`,color:colors.muted,fill:fills.well}:section.category.status?{label:section.category.status.label,spoken:section.category.status.label,color:toneColor[section.category.status.tone??'positive'],fill:`${toneColor[section.category.status.tone??'positive']}26`}:null;return <View key={section.category.id} testID={id(`section-${section.category.id}`)} style={{gap:4}}>
    {/* The heading and its badge line up with the row content (the icon's leading edge, the disc's trailing edge), as the token pickers' sections do. */}
    <View testID={id(`section-${section.category.id}-header`)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:32,paddingHorizontal:8}}>
     <Text accessibilityRole='header' accessibilityLabel={status?`${section.category.label}, ${status.spoken}`:undefined} style={{flexShrink:1,fontSize:14,lineHeight:20,fontWeight:'500',color:colors.muted}}>{section.category.label}</Text>
     {status?<View {...hidden} testID={id(`status-${section.category.id}`)} style={{borderRadius:9999,paddingVertical:2,paddingHorizontal:10,backgroundColor:status.fill}}>{countdown&&remaining!=null?<AnimatedNumberReadout value={Math.ceil(remaining/1000)} formattedValue={countdown.visible} animateFormatted duration={paused?0:undefined} prefix={`${t.opensIn} `} testID={id(`countdown-${section.category.id}`)} tone='muted' maxFontSizeMultiplier={1.4} style={{fontSize:12,lineHeight:16,fontWeight:'600',letterSpacing:0.25}}/>:<Text maxFontSizeMultiplier={1.4} style={{fontSize:12,lineHeight:16,fontWeight:'600',letterSpacing:1,fontVariant:['tabular-nums'],color:status.color}}>{status.label}</Text>}</View>:null}
    </View>
    <View style={{gap:4}}>{section.assets.map(row)}</View>
   </View>;})}
  </View>}
 </>;
 // The sticky layout puts the header and the body in separate views, so the body's first gap is its top padding.
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID={id('sticky-header')??'assets-sticky-header'} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{direction,gap:16,paddingTop:16}}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{direction,padding:16,gap:16}}>
  {header}
  {body}
 </View>;
}
