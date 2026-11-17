import {assertUniqueKeys,paginationValue} from '@bloxwap/hig/contracts';
import React,{useEffect,useRef,useState} from 'react';
import {Animated,Easing,Pressable,View} from 'react-native';
import {tokens} from '@bloxwap/hig/tokens';
import {ChevronIcon} from './icons.js';
import {formatNumber} from './number-format.js';
import * as en from '@bloxwap/hig/contracts/messages';
import {useColors,useControllable,useFills,useHIG} from './provider.js';
import {Button} from './button.js';
import {Text,Inline,Stack,Surface} from './surface.js';
import {Field,SearchInput} from './field.js';
/** Actions that sit side by side are 8dp apart; content keeps the 12dp gap. */
const actionRow={gap:tokens.space.sm};
export function Tabs({label,items,value,defaultValue,onValueChange}: {label:string;items:readonly {value:string;label:string;content:React.ReactNode;disabled?:boolean}[];value?:string;defaultValue?:string;onValueChange?:(v:string)=>void}){const colors=useColors();const fills=useFills();const {direction}=useHIG();const [stored,set]=useControllable(value,defaultValue??items.find(item=>!item.disabled)?.value??'',onValueChange);assertUniqueKeys(items,item=>item.value,'Tabs');const controlled=useRef(value!==undefined).current;const current=items.some(item=>item.value===stored&&!item.disabled)?stored:controlled?'':items.find(item=>!item.disabled)?.value??'';useEffect(()=>{if(!controlled&&stored!==current)set(current);},[controlled,stored,current]);return <View style={{direction,gap:12}}><Inline style={actionRow} accessibilityRole='tablist' accessibilityLabel={label}>{items.map(i=><Pressable key={i.value} accessibilityRole='tab' aria-selected={current===i.value} aria-disabled={!!i.disabled} accessibilityState={{selected:current===i.value,disabled:!!i.disabled}} disabled={i.disabled} onPress={()=>{if(!i.disabled)set(i.value);}} hitSlop={{top:2,bottom:2}} style={({pressed})=>({minHeight:44,paddingHorizontal:20,paddingVertical:10,borderRadius:9999,alignItems:'center',justifyContent:'center',backgroundColor:current===i.value?fills.raised:'transparent',opacity:i.disabled?.5:pressed?.85:1})}><Text style={{fontWeight:'600',color:current===i.value?colors.text:colors.muted}}>{i.label}</Text></Pressable>)}</Inline>{items.find(i=>i.value===current)?.content}</View>;}
/** A strokeless card. The outline chevron sits on the trailing edge and turns as the content expands or collapses; with reduced motion both change at once. */
export function Accordion({title,children,open,onOpenChange}:React.PropsWithChildren<{title:string;open?:boolean;onOpenChange?:(v:boolean)=>void}>){
 const [current,set]=useControllable(open,false,onOpenChange,'disclosure');const {reducedMotion,direction}=useHIG();const colors=useColors();
 const progress=useRef(new Animated.Value(current?1:0)).current;const [height,setHeight]=useState(0);const [mounted,setMounted]=useState(current);const [settled,setSettled]=useState(true);const first=useRef(true);
 useEffect(()=>{
  if(first.current){first.current=false;return;}
  if(reducedMotion){progress.stopAnimation();progress.setValue(current?1:0);setMounted(current);setSettled(true);return;}
  if(current)setMounted(true);setSettled(false);
  // Height cannot run on the native driver; the chevron shares the value so both stay in step.
  const animation=Animated.timing(progress,{toValue:current?1:0,duration:tokens.motion.base,easing:Easing.bezier(...tokens.easing.standard),useNativeDriver:false,isInteraction:false});
  animation.start(({finished})=>{if(finished){setSettled(true);if(!current)setMounted(false);}});return()=>animation.stop();
 },[current,reducedMotion,progress]);
 // Once open and at rest the content sizes itself again, so it can grow or shrink freely.
 const clip=settled&&current?undefined:{height:progress.interpolate({inputRange:[0,1],outputRange:[0,height]}),overflow:'hidden' as const};
 return <Surface style={{padding:0}}>
  <Pressable accessibilityRole='button' accessibilityState={{expanded:current}} aria-expanded={current} onPress={()=>set(!current)} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:tokens.space.md,minHeight:48,padding:tokens.space.xl,opacity:pressed?.85:1})}>
   <Text style={{flex:1,minWidth:0,fontWeight:'600'}}>{title}</Text>
   <Animated.View style={{transform:[{rotate:progress.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']})}]}}><ChevronIcon color={colors.muted}/></Animated.View>
  </Pressable>
  {mounted&&<Animated.View style={clip}><View onLayout={event=>setHeight(event.nativeEvent.layout.height)} style={{paddingHorizontal:tokens.space.xl,paddingBottom:tokens.space.xl}}>{children}</View></Animated.View>}
 </Surface>;
}
export function Navigation({label,items}: {label:string;items:readonly {label:string;id:string;active?:boolean;onNavigate:()=>void}[]}){const colors=useColors();return <Stack accessibilityLabel={label} style={{gap:4}}>{items.map(i=><Button key={i.id} fullWidth intent='ghost' accessibilityState={{selected:!!i.active}} onPress={i.onNavigate} style={{alignItems:'flex-start',backgroundColor:i.active?colors.nested:'transparent'}}>{i.label}</Button>)}</Stack>;}
export const BottomNavigation=Navigation;
export function Pagination({page,total,onPageChange}: {page:number;total:number;onPageChange:(p:number)=>void}){({page,total}=paginationValue(page,total));const {locale,messages}=useHIG();return <Inline style={actionRow}><Button intent='secondary' disabled={page<=1} onPress={()=>onPageChange(page-1)}>{messages.previous??en.previous}</Button><Text>{(messages.pageOf??en.pageOf)(formatNumber(page,locale),formatNumber(total,locale))}</Text><Button intent='secondary' disabled={page>=total} onPress={()=>onPageChange(page+1)}>{messages.next??en.next}</Button></Inline>;}
export function Search({query,onQueryChange,results,loading,error}: {query:string;onQueryChange:(s:string)=>void;results:readonly {id:string;label:string;onSelect:()=>void}[];loading?:boolean;error?:string}){const {locale,messages}=useHIG();return <Stack><Field label={messages.search??en.search}><SearchInput value={query} onChangeText={onQueryChange}/></Field><Text accessibilityLiveRegion='polite'>{loading?messages.searching??en.searching:error??(results.length?(messages.resultCount??en.resultCount)(results.length,locale):messages.noResults??en.noResults)}</Text>{!loading&&!error&&results.map(r=><Button intent='ghost' key={r.id} onPress={r.onSelect}>{r.label}</Button>)}</Stack>;}
export function BackButton({onBack}: {onBack:()=>void}){const {messages}=useHIG();return <Button intent='secondary' onPress={onBack}>{messages.back??en.back}</Button>;}
