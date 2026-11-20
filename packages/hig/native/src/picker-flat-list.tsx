import React,{useState} from 'react';
import {Dimensions,FlatList,ScrollView,View,VirtualizedList,type FlatListProps,type ScrollViewProps} from 'react-native';
import {StickyHeaderSlot,useStickyHeaderScroll} from './sticky-header.js';

// Native ScrollView exposes the orientation of the nearest scroller. Keep inline scrolling for adapters that omit this context.
type ScrollParent={horizontal:boolean}|null;
const scrollParentContext=(ScrollView as typeof ScrollView & {Context?:React.Context<ScrollParent>}).Context??React.createContext<ScrollParent>({horizontal:false});

export function usePickerWindow(itemCount:number,sticky:boolean|undefined,hasHostList:boolean){
 const scrollParent=React.useContext(scrollParentContext);
 return hasHostList||(itemCount>50&&(!!sticky||scrollParent?.horizontal!==false));
}

// Section ends are exclusive. Index zero is reserved for the list introduction.
export const sectionCellCount=(sections:readonly {end:number}[])=>sections.length?sections[sections.length-1].end:1;
export function sectionForCell<T extends {end:number}>(sections:readonly T[],index:number):T{
 let low=0,high=sections.length-1;
 while(low<high){
  const mid=Math.floor((low+high)/2);
  if(index<sections[mid].end)high=mid;
  else low=mid+1;
 }
 return sections[low];
}

const itemAfterIntro=<T,>(items:readonly T[],index:number)=>index===0?null:items[index-1];
const countWithIntro=(items:readonly unknown[])=>items.length+1;
/** Index zero is the scrolling introduction. All subsequent indices address the original array. */
export function ListWithIntro<T>(props:FlatListProps<T|null>){
 return <VirtualizedList {...props} getItem={itemAfterIntro<T>} getItemCount={countWithIntro}/>;
}

export function PickerFlatList<T>({listComponent:List=FlatList,scrollComponent:Scroll,header,pinned,headerTestID,background,sticky,inset,direction,rowHeight,testID,...listProps}:
 Pick<FlatListProps<T>,'data'|'keyExtractor'|'renderItem'|'accessibilityRole'|'accessibilityLabel'|'ListFooterComponent'> & {
 listComponent?:React.ComponentType<FlatListProps<T>>;scrollComponent?:React.ComponentType<ScrollViewProps>;
 header:React.ReactElement|null;pinned?:React.ReactNode;headerTestID:string;background?:string;sticky?:boolean;inset:number;direction:'rtl'|'ltr';rowHeight:number;testID?:string;
}){
 const {scrolled,onScroll,scrollEventThrottle}=useStickyHeaderScroll();
 const [viewport,setViewport]=useState(0);
 const size=Math.max(rowHeight,viewport||Dimensions.get('window').height);
 return <List {...listProps} testID={testID} style={{flexGrow:1,flexShrink:1,minHeight:0}}
  showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom:16}}
  stickyHeaderIndices={sticky?[0]:undefined} onScroll={sticky?onScroll:undefined} scrollEventThrottle={scrollEventThrottle}
  onLayout={event=>setViewport(event.nativeEvent.layout.height)} initialNumToRender={Math.ceil(size/rowHeight)+4}
  windowSize={1+8*rowHeight/size} maxToRenderPerBatch={4}
  renderScrollComponent={Scroll?props=><Scroll {...props}/>:undefined}
  ListHeaderComponentStyle={{flexDirection:'row'}} ListHeaderComponent={!header?null:sticky?<StickyHeaderSlot header={header} pinned={pinned} headerTestID={headerTestID} horizontalInset={inset} background={background} scrolled={scrolled}/>:<View style={{flexGrow:1,direction,paddingHorizontal:inset,paddingTop:16}}>{header}</View>} />;
}
