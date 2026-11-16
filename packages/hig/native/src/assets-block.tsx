import React,{useEffect,useMemo,useState} from 'react';
import {formatCountdown} from '@bloxwap/hig/contracts';
import {Image,Pressable,View,type ScrollViewProps,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {SearchInput} from './field.js';
import {Filter,SegmentedControl} from './radio-group.js';
import {ScreenHeader,HeaderClose} from './screen-header.js';
import {StickyHeaderLayout} from './sticky-header.js';
import {EyeIcon,TrendIcon} from './icons.js';
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
 testID?:string;
}
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
/** The current time, ticking each second while `active`. */
function useNow(active:boolean):number{
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{if(!active)return;setNow(Date.now());const tick=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(tick);},[active]);
 return now;
}
const opensAtTime=(category:AssetCategory)=>category.opensAt==null?null:+category.opensAt;
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const disc=44;
/**
 * Choose a market as one screen: a header, a search field, category capsules, the All / Positions / Trend views, then the
 * markets in sections by category, each with its icon, name, symbol and detail on one line each, and its signal disc. The host
 * owns the data and the scrolling, unless `stickyHeader` makes the block its own scroll view.
 */
export function AssetsBlock({title,onClose,assets,categories,onSelect,selectedId=null,view,defaultView='all',onViewChange,category,defaultCategory='',onCategoryChange,query,defaultQuery='',onQueryChange,categoryFilter,filterScrollComponent,loading,stickyHeader,stickyHeaderBackground,scrollComponent,headingId,testID}:AssetsBlockProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale}=useHIG();
 const now=useNow(categories.some(entry=>{const at=opensAtTime(entry);return at!=null&&at>Date.now();}));
 const id=(part:string)=>testID===undefined?undefined:`${testID}-${part}`;
 const [currentView,setView]=useHostState<AssetsView>(view,defaultView,onViewChange);
 const [currentCategory,setCategory]=useHostState(category,defaultCategory,onCategoryChange);
 const [currentQuery,setQuery]=useHostState(query,defaultQuery,onQueryChange);
 const sections=useMemo(()=>filterAssets(assets,categories,{view:currentView,category:currentCategory,query:currentQuery}),[assets,categories,currentView,currentCategory,currentQuery]);
 const signalName:Record<AssetSignal,string>={watch:t.signalWatch,up:t.signalUp,down:t.signalDown};
 const signalColor:Record<AssetSignal,string>={watch:colors.warning,up:colors.positive,down:colors.negative};
 const toneColor={positive:colors.positive,negative:colors.negative,warning:colors.warning,info:colors.info};
 const empty=loading?`${t.loading}…`:currentQuery.trim()!==''?t.noResults:currentView==='positions'?t.noPositions:currentView==='trend'?t.noTrend:t.noItems;
 const round:ViewStyle={width:disc,height:disc,borderRadius:disc/2,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const row=(asset:AssetItem)=>{
  const second=asset.detail?`${asset.symbol} · ${asset.detail}`:asset.symbol;
  const selected=asset.id===selectedId;
  const style=({pressed}:{pressed:boolean}):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:64,padding:8,borderRadius:32,backgroundColor:pressed||selected?fills.well:'transparent',opacity:asset.disabled?0.5:1});
  return <Pressable key={asset.id} testID={id(asset.id)} accessibilityRole='button' accessibilityLabel={[asset.name,second,asset.signal?signalName[asset.signal]:null].filter(Boolean).join(', ')} accessibilityState={{selected,disabled:!!asset.disabled}} disabled={asset.disabled} onPress={()=>onSelect(asset)} style={style}>
   <View {...hidden}>{typeof asset.icon==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:asset.icon}} style={round as object}/>:<View style={[round,{backgroundColor:fills.raised}]}>{asset.icon??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{asset.symbol.slice(0,4)}</Text>}</View>}</View>
   <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
    <Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{asset.name}</Text>
    <Text numberOfLines={1} style={{fontSize:14,lineHeight:20,color:colors.muted}}>{second}</Text>
   </View>
   {asset.signal===undefined?null:<View {...hidden} testID={id(`${asset.id}-signal`)} style={[round,{backgroundColor:asset.signal?`${signalColor[asset.signal]}26`:fills.well}]}>
    {asset.signal==='watch'?<EyeIcon color={colors.warning}/>:asset.signal?<TrendIcon color={signalColor[asset.signal]} direction={asset.signal}/>:null}
   </View>}
  </Pressable>;
 };
 const showFilter=(categoryFilter??true)&&categories.length>1;
 const header=<ScreenHeader title={title??t.assets} testID={id('header')} headingId={headingId} action={onClose?<HeaderClose onClose={onClose} label={t.close} testID={id('close')}/>:undefined}/>;
 const body=<>
  <SearchInput testID={id('search')} accessibilityLabel={t.searchMarkets} placeholder={`${t.searchMarkets}…`} value={currentQuery} onChangeText={setQuery} returnKeyType='search' autoCapitalize='none' autoCorrect={false} spellCheck={false}/>
  {showFilter?<Filter label={t.marketCategories} options={[{value:'',label:t.assetsAll},...categories.map(entry=>({value:entry.id,label:entry.label}))]} value={currentCategory} onValueChange={setCategory} scrollComponent={filterScrollComponent}/>:null}
  <SegmentedControl hideLabel testID={id('view')} label={t.assetsView} options={[{value:'all',label:t.assetsAll},{value:'positions',label:t.assetsPositions},{value:'trend',label:t.assetsTrend}]} value={currentView} onValueChange={next=>setView(next as AssetsView)}/>
  {sections.length===0?<Text testID={id('empty')} accessibilityLiveRegion='polite' style={{paddingVertical:32,textAlign:'center',fontSize:14,lineHeight:20,color:colors.muted}}>{empty}</Text>:
  <View testID={id('list')} style={{gap:16}}>
   {sections.map(section=>{const at=opensAtTime(section.category);const countdown=at!=null&&at>now?formatCountdown(at-now,locale):null;const status=countdown?{label:`${t.opensIn} ${countdown.visible}`,spoken:`${t.opensIn} ${countdown.spoken}`,color:colors.muted,fill:fills.well}:section.category.status?{label:section.category.status.label,spoken:section.category.status.label,color:toneColor[section.category.status.tone??'positive'],fill:`${toneColor[section.category.status.tone??'positive']}26`}:null;return <View key={section.category.id} testID={id(`section-${section.category.id}`)} style={{gap:4}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:32,paddingHorizontal:4}}>
     <Text accessibilityRole='header' accessibilityLabel={status?`${section.category.label}, ${status.spoken}`:undefined} style={{flexShrink:1,fontSize:14,lineHeight:20,fontWeight:'500',color:colors.muted}}>{section.category.label}</Text>
     {status?<View {...hidden} testID={id(`status-${section.category.id}`)} style={{borderRadius:9999,paddingVertical:2,paddingHorizontal:10,backgroundColor:status.fill}}><Text maxFontSizeMultiplier={1.4} style={{fontSize:12,lineHeight:16,fontWeight:'600',letterSpacing:countdown?0.25:1,fontVariant:['tabular-nums'],color:status.color}}>{status.label}</Text></View>:null}
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
