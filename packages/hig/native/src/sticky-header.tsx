import {GestureSheetHeaderContext,SheetHeaderGlow} from './sheet-header-glow.js';
import React,{useCallback,useRef,useState} from 'react';
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
 const lastScrolled=useRef(false);
 const handle=useCallback((event:NativeSyntheticEvent<NativeScrollEvent>)=>{
  const next=(event.nativeEvent?.contentOffset?.y??0)>0.5;
  if(next!==lastScrolled.current){
   lastScrolled.current=next;
   setScrolled(next);
  }
  onScroll?.(event);
 },[onScroll]);
 return {scrolled,onScroll:handle,scrollEventThrottle:16};
}
/** The fill of a pinned header: transparent at rest so what the host draws behind it shows through, `background` once content has scrolled under it. */
export function stickyHeaderFill(scrolled:boolean,background:string):ViewStyle{return {backgroundColor:scrolled?background:'transparent'};}
const stickySlotStyle:ViewStyle={flexDirection:'row'};
const stickyScrollStyle:ViewStyle={flexGrow:1,flexShrink:1,minHeight:0};
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
 /** Layout of the content under the header, such as its gap. Side padding follows horizontalInset. */
 horizontalInset?:number;
 bodyStyle?:StyleProp<ViewStyle>;
}
/** A block as its own scroll view with its header pinned: 16dp around the content as the block draws it, the header transparent until content scrolls under it. Place it in a bounded container, such as a sheet body. */
export function StickyHeaderLayout({header,children,background,scrollComponent:Scroll=ScrollView,testID,headerTestID,horizontalInset=16,bodyStyle}:StickyHeaderLayoutProps){
 const inSheet=React.useContext(GestureSheetHeaderContext);
 const colors=useColors(),{scrolled,onScroll,scrollEventThrottle}=useStickyHeaderScroll();
 // React Native's sticky slot moves the pinned child's style onto its own wrapper and gives the child flex:1, which measures 0 tall in a column.
 // So the pinned child carries only a row direction (the wrapper lays out as a row, where flex:1 fills the width and the height follows content),
 // and the inset and fill sit on the inner view, which keeps its full height whether or not the scroller pins it.
 // The scroller fills a bounded parent and may shrink below its content, whatever scroll component the host passes, so the
 // content scrolls inside it. It cannot bound itself: in a parent whose height follows its content (a View with no flex or
 // height, a content-sized sheet) it grows to its content and nothing scrolls.
 return <Scroll showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} testID={testID} style={stickyScrollStyle} stickyHeaderIndices={[0]} onScroll={onScroll} scrollEventThrottle={scrollEventThrottle} contentContainerStyle={{paddingBottom:16}}>
  <View style={stickySlotStyle}><View testID={headerTestID} style={[{flexGrow:1,paddingHorizontal:horizontalInset,paddingTop:16},stickyHeaderFill(scrolled&&!inSheet,background??colors.background)]}>{scrolled&&inSheet?<SheetHeaderGlow backdrop={background??colors.background}/>:null}{header}</View></View>
  <View style={[{paddingHorizontal:horizontalInset},bodyStyle]}>{children}</View>
 </Scroll>;
}
