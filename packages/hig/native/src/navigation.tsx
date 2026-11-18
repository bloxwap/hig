import {usePickerWindow} from './picker-flat-list.js';
import {memoizedRenderer} from './flat-list-options.js';
import {assertUniqueKeys,paginationValue} from '@bloxwap/hig/contracts';
import React,{useEffect,useRef,useState} from 'react';
import {Animated,Easing,FlatList,Platform,Pressable,View,useWindowDimensions} from 'react-native';
import {tokens} from '@bloxwap/hig/tokens';
import {ChevronIcon} from './icons.js';
import {formatNumber} from './number-format.js';
import * as en from '@bloxwap/hig/contracts/messages';
import {useColors,useControllable,useFills,useHIG,useLayoutDirection,useMessageOverrides,useTextEnvironment} from './provider.js';
import {Button} from './button.js';
import {Text,Inline,Stack,Surface} from './surface.js';
import {Field,SearchInput} from './field.js';
/** Actions that sit side by side are 8dp apart; content keeps the 12dp gap. */
const actionRow={gap:tokens.space.sm};
export function Tabs({label,items,value,defaultValue,onValueChange}: {label:string;items:readonly {value:string;label:string;content:React.ReactNode;disabled?:boolean}[];value?:string;defaultValue?:string;onValueChange?:(v:string)=>void}){const colors=useColors();const fills=useFills();const direction=useLayoutDirection();const [stored,set]=useControllable(value,defaultValue??items.find(item=>!item.disabled)?.value??'',onValueChange);assertUniqueKeys(items,item=>item.value,'Tabs');const controlled=useRef(value!==undefined).current;const current=items.some(item=>item.value===stored&&!item.disabled)?stored:controlled?'':items.find(item=>!item.disabled)?.value??'';useEffect(()=>{if(!controlled&&stored!==current)set(current);},[controlled,stored,current]);return <View style={{direction,gap:12}}><Inline style={actionRow} accessibilityRole='tablist' accessibilityLabel={label}>{items.map(i=><Pressable key={i.value} accessibilityRole='tab' aria-selected={current===i.value} aria-disabled={!!i.disabled} accessibilityState={{selected:current===i.value,disabled:!!i.disabled}} disabled={i.disabled} onPress={()=>{if(!i.disabled)set(i.value);}} hitSlop={{top:2,bottom:2}} style={({pressed})=>({minHeight:44,paddingHorizontal:20,paddingVertical:10,borderRadius:9999,alignItems:'center',justifyContent:'center',backgroundColor:current===i.value?fills.raised:'transparent',opacity:i.disabled?.5:pressed?.85:1})}><Text style={{fontWeight:'600',color:current===i.value?colors.text:colors.muted}}>{i.label}</Text></Pressable>)}</Inline>{items.find(i=>i.value===current)?.content}</View>;}
/** A strokeless card. The outline chevron sits on the trailing edge and turns as the content expands or collapses; with reduced motion both change at once. */
export function Accordion({title,children,open,onOpenChange}:React.PropsWithChildren<{title:string;open?:boolean;onOpenChange?:(v:boolean)=>void}>){
 const [current,set]=useControllable(open,false,onOpenChange,'disclosure');const {reducedMotion,direction}=useHIG();const colors=useColors();
 const [progress]=useState(()=>new Animated.Value(current?1:0));const first=useRef(true);
 useEffect(()=>{
  if(first.current){first.current=false;return;}
  if(reducedMotion){progress.setValue(current?1:0);return;}
  const animation=Animated.timing(progress,{toValue:current?1:0,duration:tokens.motion.base,easing:Easing.bezier(...tokens.easing.standard),useNativeDriver:Platform.OS!=='web',isInteraction:false});
  animation.start();
  return ()=>animation.stop();
 },[current,reducedMotion,progress]);
 return <Surface style={{padding:0}}>
  <Pressable accessibilityRole='button' accessibilityState={{expanded:current}} aria-expanded={current} onPress={()=>set(!current)} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:tokens.space.md,minHeight:48,padding:tokens.space.xl,opacity:pressed?.85:1})}>
   <Text style={{flex:1,minWidth:0,fontWeight:'600'}}>{title}</Text>
   <Animated.View style={{transform:[{rotate:progress.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']})}]}}><ChevronIcon color={colors.muted}/></Animated.View>
  </Pressable>
  {current&&<Animated.View style={{opacity:reducedMotion?1:progress,paddingHorizontal:tokens.space.xl,paddingBottom:tokens.space.xl}}>{children}</Animated.View>}
 </Surface>;
}
type NavigationItem={label:string;id:string;active?:boolean;onNavigate:()=>void};
const navigationKey=(item:NavigationItem)=>item.id;
const NavigationButton=React.memo(function NavigationButton({label,active,onNavigate,background}:{label:string;active:boolean;onNavigate:()=>void;background:string}){
 return <Button fullWidth intent='ghost' accessibilityState={{selected:active}} onPress={onNavigate} style={{alignItems:'flex-start',backgroundColor:background}}>{label}</Button>;
});
function navigationButton(item:NavigationItem,activeBackground:string){
 return <NavigationButton key={item.id} label={item.label} active={!!item.active} onNavigate={item.onNavigate} background={item.active?activeBackground:'transparent'}/>;
}
function WindowedNavigation({items,activeBackground}:{items:readonly NavigationItem[];activeBackground:string}){
 const renderItem=React.useCallback(({item}:{item:NavigationItem})=>navigationButton(item,activeBackground),[activeBackground]);
 const {height}=useWindowDimensions(),[measured,setMeasured]=useState(0);
 const rowHeight=48,viewport=Math.max(rowHeight,measured||height);
 return <FlatList {...memoizedRenderer} data={items} keyExtractor={navigationKey} renderItem={renderItem}
  style={{maxHeight:height,flexShrink:1}} contentContainerStyle={{gap:4}} onLayout={event=>setMeasured(event.nativeEvent.layout.height)}
  initialNumToRender={Math.ceil(viewport/rowHeight)+4} maxToRenderPerBatch={4} windowSize={1+8*rowHeight/viewport}/>;
}
export function Navigation({label,items}: {label:string;items:readonly NavigationItem[]}){
 const colors=useColors(),windowed=usePickerWindow(items.length,false,false);
 return <Stack accessibilityLabel={label} style={windowed?{gap:4,flexShrink:1}:{gap:4}}>{windowed?<WindowedNavigation items={items} activeBackground={colors.nested}/>:items.map(item=>navigationButton(item,colors.nested))}</Stack>;
}
export const BottomNavigation=Navigation;
export function Pagination({page,total,onPageChange}: {page:number;total:number;onPageChange:(p:number)=>void}){
 ({page,total}=paginationValue(page,total));
 const {locale}=useTextEnvironment();
 const messages=useMessageOverrides();
 const describe=messages.pageOf??en.pageOf;
 const totalText=React.useMemo(()=>formatNumber(total,locale),[total,locale]);
 const reading=React.useMemo(()=>describe(formatNumber(page,locale),totalText),[page,locale,totalText,describe]);
 const previous=messages.previous??en.previous,next=messages.next??en.next;
 return React.useMemo(()=><Inline style={actionRow}>
  <Button intent='secondary' disabled={page<=1} onPress={()=>onPageChange(page-1)}>{previous}</Button>
  <Text>{reading}</Text>
  <Button intent='secondary' disabled={page>=total} onPress={()=>onPageChange(page+1)}>{next}</Button>
 </Inline>,[page,total,onPageChange,reading,previous,next]);
}
type SearchResult={id:string;label:string;onSelect:()=>void};
const SearchButton=React.memo(Button);
const ResultButton=React.memo(function ResultButton({result}:{result:SearchResult}){
 return <SearchButton intent='ghost' onPress={result.onSelect}>{result.label}</SearchButton>;
});
const resultKey=(result:SearchResult)=>result.id;
const resultButton=(result:SearchResult)=><ResultButton key={result.id} result={result}/>;
const renderResult=({item}:{item:SearchResult})=>resultButton(item);
const SearchResults=React.memo(function SearchResults({results}:{results:readonly SearchResult[]}){
 const {height}=useWindowDimensions();
 const viewport=Math.max(56,height*.6);
 return <FlatList {...memoizedRenderer} data={results} keyExtractor={resultKey} renderItem={renderResult}
  style={{maxHeight:viewport}} contentContainerStyle={{gap:12}} keyboardShouldPersistTaps='handled' nestedScrollEnabled
  initialNumToRender={Math.ceil(viewport/56)+4} maxToRenderPerBatch={4} windowSize={1+448/viewport}/>;
});
export function Search({query,onQueryChange,results,loading,error}: {query:string;onQueryChange:(s:string)=>void;results:readonly {id:string;label:string;onSelect:()=>void}[];loading?:boolean;error?:string}){
 const {locale}=useTextEnvironment();
 const messages=useMessageOverrides();
 const count=results.length;
 const announcement=React.useMemo(()=>loading?messages.searching??en.searching:error??(count?(messages.resultCount??en.resultCount)(count,locale):messages.noResults??en.noResults),[loading,error,count,locale,messages]);
 const rows=React.useMemo(()=>loading||error?null:results.length>50?<SearchResults results={results}/>:results.map(resultButton),[results,loading,error]);
 return <Stack>
  <Field label={messages.search??en.search}><SearchInput value={query} onChangeText={onQueryChange}/></Field>
  <Text accessibilityLiveRegion='polite'>{announcement}</Text>
  {rows}
 </Stack>;
}
export function BackButton({onBack}: {onBack:()=>void}){const messages=useMessageOverrides();return <Button intent='secondary' onPress={onBack}>{messages.back??en.back}</Button>;}
