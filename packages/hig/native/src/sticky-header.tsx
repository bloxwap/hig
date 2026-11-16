import React,{useCallback,useState} from 'react';
import {ScrollView,View,type NativeScrollEvent,type NativeSyntheticEvent,type ScrollViewProps,type StyleProp,type ViewStyle} from 'react-native';
import {useColors} from './provider.js';
/** What a scroller needs so a pinned header knows when content is under it. Spread `onScroll` and `scrollEventThrottle` on the scroll view and pass `scrolled` to the header. */
export interface StickyHeaderScroll {
 /** True once the scroll view has moved, so content sits under the pinned header. */
 scrolled:boolean;
 onScroll:(event:NativeSyntheticEvent<NativeScrollEvent>)=>void;
 scrollEventThrottle:number;
}
/** Tracks a scroll view's offset for a pinned header: `scrolled` turns true once it has moved and false again at the top. It re-renders only when that changes. */
export function useStickyHeaderScroll(onScroll?:(event:NativeSyntheticEvent<NativeScrollEvent>)=>void):StickyHeaderScroll{
 const [scrolled,setScrolled]=useState(false);
 const handle=useCallback((event:NativeSyntheticEvent<NativeScrollEvent>)=>{
  const next=(event.nativeEvent?.contentOffset?.y??0)>0.5;
  setScrolled(current=>current===next?current:next);
  onScroll?.(event);
 },[onScroll]);
 return {scrolled,onScroll:handle,scrollEventThrottle:16};
}
/** The fill of a pinned header: transparent at rest so what the host draws behind it shows through, `background` once content has scrolled under it. */
export function stickyHeaderFill(scrolled:boolean,background:string):ViewStyle{return {backgroundColor:scrolled?background:'transparent'};}
export interface StickyHeaderLayoutProps {
 /** The header, pinned as the scroll view's first child. */
 header:React.ReactNode;
 children:React.ReactNode;
 /** Fill once content scrolls under the header. Defaults to the background role. */
 background?:string;
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 testID?:string;
 /** Test ID of the header's container. */
 headerTestID?:string;
 /** Layout of the content under the header, such as its gap. Side padding is 16dp. */
 bodyStyle?:StyleProp<ViewStyle>;
}
/** A block as its own scroll view with its header pinned: 16dp around the content as the block draws it, the header transparent until content scrolls under it. Place it in a bounded container, such as a sheet body. */
export function StickyHeaderLayout({header,children,background,scrollComponent:Scroll=ScrollView,testID,headerTestID,bodyStyle}:StickyHeaderLayoutProps){
 const colors=useColors(),{scrolled,onScroll,scrollEventThrottle}=useStickyHeaderScroll();
 return <Scroll testID={testID} stickyHeaderIndices={[0]} onScroll={onScroll} scrollEventThrottle={scrollEventThrottle} contentContainerStyle={{paddingBottom:16}}>
  <View testID={headerTestID} style={[{paddingHorizontal:16,paddingTop:16},stickyHeaderFill(scrolled,background??colors.background)]}>{header}</View>
  <View style={[{paddingHorizontal:16},bodyStyle]}>{children}</View>
 </Scroll>;
}
