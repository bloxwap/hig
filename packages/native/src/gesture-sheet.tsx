import React,{useEffect,useRef,useCallback} from 'react';
import {AccessibilityInfo,BackHandler,findNodeHandle,Platform,Text as RNText,View} from 'react-native';
import {BottomSheetModal,BottomSheetScrollView,BottomSheetBackdrop,type BottomSheetBackdropProps} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ReduceMotion} from 'react-native-reanimated';
import {nativeMetrics as tokens} from '@bloxwap/hig-tokens';
import * as en from '@bloxwap/hig-contracts/messages';
import {useColors,useHIG} from './provider.js';
import {Heading,Text,Stack} from './surface.js';
import {Button} from './button.js';

export interface GestureSheetProps {
 open:boolean;
 onOpenChange:(open:boolean)=>void;
 title:string;
 description?:string;
 children:React.ReactNode;
 /** Default anatomy scrolls the title, description, content and Close action. Custom content owns layout, scrolling and dismissal actions. */
 contentMode?:'default'|'custom';
 /** In custom mode, attach to the caller-rendered accessible title. Without it, a visually hidden title receives open focus. */
 titleRef?:React.RefObject<View|RNText|null>;
 /** Sorted increasing detents; may change while open. The current index is retained, or clamped when a detent is removed. */
 snapPoints:readonly (number|`${number}%`)[];
 initialIndex?:number;
 dismissible?:boolean;
 returnFocusRef?:React.RefObject<View|null>;
 /** Close button text and accessible name; defaults to HIGProvider `messages.close`. */
 closeLabel?:string;
}
/** Optional backend: host supplies GestureHandlerRootView, SafeAreaProvider and BottomSheetModalProvider. */
export function GestureSheet({open,onOpenChange,title,description,children,contentMode='default',titleRef,snapPoints,initialIndex=0,dismissible=true,returnFocusRef,closeLabel}:GestureSheetProps){
 if(snapPoints.length===0)throw new Error('GestureSheet requires at least one snap point.');
 const sheet=useRef<BottomSheetModal>(null),heading=useRef<RNText>(null),requested=useRef(false),focused=useRef(false),frame=useRef<number|null>(null);
 const startingIndex=Math.max(0,Math.min(initialIndex,snapPoints.length-1));
 const activeIndex=useRef(startingIndex),detentFrame=useRef<number|null>(null),pendingSnap=useRef(false);
 const detentKey=JSON.stringify(snapPoints);
 const latest=useRef({open,onOpenChange,returnFocusRef});latest.current={open,onOpenChange,returnFocusRef};
 const env=useHIG(),colors=useColors(),insets=useSafeAreaInsets();
 const focus=useCallback((node:View|RNText|null)=>{if(!node)return;try{const handle=findNodeHandle(node);if(handle!==null){AccessibilityInfo.setAccessibilityFocus(handle);if(Platform.OS==='android')AccessibilityInfo.sendAccessibilityEvent(node,'viewHoverEnter');}}catch{/* Detached focus targets cannot prevent dismissal. */}},[]);
 const requestClose=useCallback(()=>{if(requested.current||!latest.current.open)return;requested.current=true;latest.current.onOpenChange(false);},[]);
 // Gorhom 5 marks a never-presented modal DISMISSING on dismiss() and then skips its portal render, so the sheet
 // never appeared on the iOS Simulator or Android emulator. Only dismiss what this component presented.
 const presented=useRef(false);
 useEffect(()=>{requested.current=false;focused.current=false;pendingSnap.current=false;if(open){activeIndex.current=startingIndex;presented.current=true;sheet.current?.present();}else if(presented.current){presented.current=false;sheet.current?.dismiss();}},[open]);
 useEffect(()=>{
  if(!open)return;
  // Gorhom reacts to changed detent positions itself. Removing the active detent also needs a valid index;
  // wait until the new geometry has reached the backend before requesting it.
  if(activeIndex.current>=snapPoints.length||pendingSnap.current){
   activeIndex.current=Math.min(activeIndex.current,snapPoints.length-1);
   pendingSnap.current=true;
   const index=activeIndex.current;
   detentFrame.current=requestAnimationFrame(()=>{detentFrame.current=null;pendingSnap.current=false;if(latest.current.open){activeIndex.current=index;sheet.current?.snapToIndex(index);}});
  }
  return()=>{if(detentFrame.current!==null){cancelAnimationFrame(detentFrame.current);detentFrame.current=null;}};
 },[open,detentKey]);
 useEffect(()=>{if(!open)return;const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{if(dismissible)requestClose();return true;});return()=>subscription.remove();},[open,dismissible,requestClose]);
 useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);if(detentFrame.current!==null)cancelAnimationFrame(detentFrame.current);},[]);
 const backdrop=useCallback((props:BottomSheetBackdropProps)=><BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior={dismissible?'close':'none'}/>,[dismissible]);
  // Gorhom defaults the sheet container to one accessible "Bottom Sheet" adjustable element, which on the iOS Simulator
 // hid the title, input and Close button inside it from XCUITest/VoiceOver; expose the children instead.
 return <BottomSheetModal ref={sheet} accessible={false} accessibilityLabel={title} index={presented.current?Math.max(0,Math.min(activeIndex.current,snapPoints.length-1)):startingIndex} snapPoints={[...snapPoints]} enableDynamicSizing={false} enableDismissOnClose stackBehavior='push' enablePanDownToClose={dismissible} topInset={insets.top} bottomInset={insets.bottom} keyboardBehavior='interactive' keyboardBlurBehavior='restore' android_keyboardInputMode='adjustResize' overrideReduceMotion={env.reducedMotion?ReduceMotion.Always:ReduceMotion.System} backdropComponent={backdrop} backgroundStyle={{backgroundColor:colors.surface,borderRadius:tokens.radius.xl}} handleIndicatorStyle={{backgroundColor:colors.muted}} onChange={index=>{if(index>=0){activeIndex.current=index;if(!focused.current){focused.current=true;focus(contentMode==='custom'?(titleRef?.current??heading.current):heading.current);}}else requestClose();}} onDismiss={()=>{requestClose();if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>{frame.current=null;if(latest.current.open){requested.current=false;focused.current=false;sheet.current?.present();}else focus(latest.current.returnFocusRef?.current??null);});}}>{contentMode==='custom'?<View style={{flex:1,direction:env.direction}}>{!titleRef&&<Heading ref={heading} accessible accessibilityLabel={title} style={{position:'absolute',width:1,height:1,overflow:'hidden'}}>{title}</Heading>}{children}</View>:<BottomSheetScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={{padding:tokens.space.xl,paddingBottom:tokens.space.xl+insets.bottom}}><Stack><Heading ref={heading}>{title}</Heading>{description&&<Text>{description}</Text>}{children}<Button intent='secondary' onPress={requestClose}>{closeLabel??env.messages.close??en.close}</Button></Stack></BottomSheetScrollView>}</BottomSheetModal>;
}
