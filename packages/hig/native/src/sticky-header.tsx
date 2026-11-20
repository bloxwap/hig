import {GestureSheetHeaderContext,GestureSheetSurfaceContext,SheetHeaderScrim} from './sheet-header-glow.js';
import React,{useCallback,useRef,useState} from 'react';
import Svg,{Defs,LinearGradient,Rect,Stop} from 'react-native-svg';
import {ScrollView,StyleSheet,View,type NativeScrollEvent,type NativeSyntheticEvent,type ScrollViewProps,type StyleProp,type ViewStyle} from 'react-native';
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
 /** Controls pinned 16dp under the header, such as a search field and filters, so only the content under them scrolls. They take the sheet's fill (or `background`) once content scrolls under them, so rows never show through. */
 pinned?:React.ReactNode;
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
/** The header's sheet scrim stretched over a header with pinned controls: the same translucency (96% at the top to 92%) behind the
 * title and every control, fading out over the last 16dp, so the fade stays under the controls whatever their height. */
function PinnedScrim({backdrop}:{backdrop:string}){
 return <View pointerEvents='none' accessibilityElementsHidden importantForAccessibility='no-hide-descendants' style={StyleSheet.absoluteFill}>
  <Svg style={{flex:1}} width='100%' viewBox='0 0 1 1' preserveAspectRatio='none'>
   <Defs><LinearGradient id='pinnedScrim' x1='0' y1='0' x2='0' y2='1'><Stop offset={0} stopColor={backdrop} stopOpacity={0.96}/><Stop offset={1} stopColor={backdrop} stopOpacity={0.92}/></LinearGradient></Defs>
   <Rect width={1} height={1} fill='url(#pinnedScrim)'/>
  </Svg>
  <Svg width='100%' height={16} viewBox='0 0 1 1' preserveAspectRatio='none'>
   <Defs><LinearGradient id='pinnedScrimEdge' x1='0' y1='0' x2='0' y2='1'><Stop offset={0} stopColor={backdrop} stopOpacity={0.92}/><Stop offset={1} stopColor={backdrop} stopOpacity={0}/></LinearGradient></Defs>
   <Rect width={1} height={1} fill='url(#pinnedScrimEdge)'/>
  </Svg>
 </View>;
}
export function StickyHeaderSlot({header,pinned,headerTestID,horizontalInset=16,background,scrolled}:Pick<StickyHeaderLayoutProps,'header'|'pinned'|'headerTestID'|'horizontalInset'|'background'>&{scrolled:boolean}){
 const inSheet=React.useContext(GestureSheetHeaderContext),sheetSurface=React.useContext(GestureSheetSurfaceContext),colors=useColors();
 // In a sheet, pinned controls share the header's scrim: one translucent layer behind the title and the controls, fading out over the
 // 16dp under the last control.
 return <View testID={headerTestID} style={[{flexGrow:1,paddingHorizontal:horizontalInset,paddingTop:16},stickyHeaderFill(scrolled&&!inSheet,background??colors.background)]}>
  {scrolled&&inSheet?pinned!=null?<PinnedScrim backdrop={sheetSurface??background??colors.background}/>:<SheetHeaderScrim backdrop={sheetSurface??background??colors.background}/>:null}
  {header}
  {pinned!=null?<>
   <View style={{paddingTop:16,gap:16}}>{pinned}</View>
   <View pointerEvents='none' style={{height:16}}/>
  </>:null}
 </View>;
}
/** A block as its own scroll view with its header pinned: 16dp around the content as the block draws it, the header transparent until content scrolls under it. Place it in a bounded container, such as a sheet body. */
export function StickyHeaderLayout({header,pinned,children,background,scrollComponent:Scroll=ScrollView,testID,headerTestID,horizontalInset=16,bodyStyle}:StickyHeaderLayoutProps){
 const {scrolled,onScroll,scrollEventThrottle}=useStickyHeaderScroll();
 // React Native's sticky slot moves the pinned child's style onto its own wrapper and gives the child flex:1, which measures 0 tall in a column.
 // So the pinned child carries only a row direction (the wrapper lays out as a row, where flex:1 fills the width and the height follows content),
 // and the inset and fill sit on the inner view, which keeps its full height whether or not the scroller pins it.
 // The scroller fills a bounded parent and may shrink below its content, whatever scroll component the host passes, so the
 // content scrolls inside it. It cannot bound itself: in a parent whose height follows its content (a View with no flex or
 // height, a content-sized sheet) it grows to its content and nothing scrolls.
 return <Scroll showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} testID={testID} style={stickyScrollStyle} stickyHeaderIndices={[0]} onScroll={onScroll} scrollEventThrottle={scrollEventThrottle} contentContainerStyle={{paddingBottom:16}}>
  <View style={stickySlotStyle}><StickyHeaderSlot header={header} pinned={pinned} headerTestID={headerTestID} horizontalInset={horizontalInset} background={background} scrolled={scrolled}/></View>
  <View style={[{paddingHorizontal:horizontalInset},bodyStyle]}>{children}</View>
 </Scroll>;
}
