import React,{useEffect,useRef,useCallback,useImperativeHandle} from 'react';
import {AccessibilityInfo,BackHandler,findNodeHandle,Platform,Text as RNText,View} from 'react-native';
import BottomSheet,{BottomSheetModal,BottomSheetScrollView,BottomSheetBackdrop,BottomSheetView,type BottomSheetBackdropProps,type BottomSheetModalProps} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ReduceMotion} from 'react-native-reanimated';
import {nativeMetrics as tokens} from '@bloxwap/hig-tokens';
import * as en from '@bloxwap/hig-contracts/messages';
import {useColors,useHIG} from './provider.js';
import {Heading,Text,Stack} from './surface.js';
import {Button} from './button.js';

interface GestureSheetCommonProps {
 open:boolean;
 onOpenChange:(open:boolean)=>void;
 title:string;
 description?:string;
 children:React.ReactNode;
 /** Default anatomy scrolls the title, description, content and Close action. Custom content owns layout, scrolling and dismissal actions. */
 contentMode?:'default'|'custom';
 /** In custom mode, attach to the caller-rendered accessible title. Without it, a visually hidden title receives open focus. */
 titleRef?:React.RefObject<View|RNText|null>;
 /** A finite positive ceiling for content sizing, in points; defaults to the backend container height. */
 maxDynamicContentSize?:BottomSheetModalProps['maxDynamicContentSize'];
 /** Content-heavy hosts may disable content panning while retaining their own scrollable gestures. */
 enableContentPanningGesture?:BottomSheetModalProps['enableContentPanningGesture'];
 /** Host keyboard policies; defaults retain HIG interactive/restore/adjustResize behavior. */
 keyboardBehavior?:BottomSheetModalProps['keyboardBehavior'];
 keyboardBlurBehavior?:BottomSheetModalProps['keyboardBlurBehavior'];
 android_keyboardInputMode?:BottomSheetModalProps['android_keyboardInputMode'];
 initialIndex?:number;
 dismissible?:boolean;
 returnFocusRef?:React.RefObject<View|null>;
 /** Close button text and accessible name; defaults to HIGProvider `messages.close`. */
 closeLabel?:string;
 /** Called once after an accepted dismissal settles. Rejected or interrupted closes do not clear host card state. */
 onDismiss?:()=>void;
 /** Observe backend detent changes after HIG updates its focus and controlled close state. */
 onChange?:BottomSheetModalProps['onChange'];
 /** Return true to consume Android Back, or false to defer to another host BackHandler. Omit for default sheet dismissal. */
 onHardwareBackPress?:()=>boolean;
 /** Host geometry overrides; defaults to the real safe-area insets. Zero supports flush card stacks. */
 topInset?:number;
 bottomInset?:number;
 /** Host-drawn handle and background slots. Use useColors() for host surfaces. */
 handleComponent?:BottomSheetModalProps['handleComponent'];
 handleStyle?:BottomSheetModalProps['handleStyle'];
 handleIndicatorStyle?:BottomSheetModalProps['handleIndicatorStyle'];
 backgroundComponent?:BottomSheetModalProps['backgroundComponent'];
 backgroundStyle?:BottomSheetModalProps['backgroundStyle'];
 /** Screen-level inline hosts may retain their existing sibling overlay order. */
 containerStyle?:BottomSheetModalProps['containerStyle'];
 /** Optional host animation and backdrop policies; HIG reduced-motion mapping remains applied. */
 animateOnMount?:BottomSheetModalProps['animateOnMount'];
 animationConfigs?:BottomSheetModalProps['animationConfigs'];
 backdropComponent?:BottomSheetModalProps['backdropComponent'];
}
export type GestureSheetProps=GestureSheetCommonProps&(
 /** Modal is the default. Inline retains the screen-level backend and its child state while closed. */
 {presentation?:'modal';modalRef?:React.Ref<BottomSheetModal>;sheetRef?:never}
 |{presentation:'inline';sheetRef?:React.Ref<BottomSheet>;modalRef?:never}
)&(
 /** Fixed sizing keeps sorted increasing detents. Changes retain the current index or clamp a removed detent. */
 {enableDynamicSizing?:false;snapPoints:readonly (number|`${number}%`)[]}
 /** Content sizing uses one backend-measured detent, without competing fixed snap points. */
 |{enableDynamicSizing:true;snapPoints?:never}
);
/** Optional backend: host supplies GestureHandlerRootView, SafeAreaProvider and BottomSheetModalProvider. */
export function GestureSheet({open,onOpenChange,title,description,children,contentMode='default',titleRef,presentation='modal',sheetRef,snapPoints,enableDynamicSizing=false,maxDynamicContentSize,enableContentPanningGesture,keyboardBehavior='interactive',keyboardBlurBehavior='restore',android_keyboardInputMode='adjustResize',initialIndex=0,dismissible=true,returnFocusRef,closeLabel,onDismiss,onChange,onHardwareBackPress,topInset,bottomInset,modalRef,handleComponent,handleStyle,handleIndicatorStyle,backgroundComponent,backgroundStyle,containerStyle,animateOnMount,animationConfigs,backdropComponent}:GestureSheetProps){
 if(enableDynamicSizing&&snapPoints!==undefined)throw new Error('Content-sized GestureSheet does not accept fixed snapPoints.');
 const fixedSnapPoints=snapPoints??[];
 if(!enableDynamicSizing&&fixedSnapPoints.length===0)throw new Error('GestureSheet requires at least one snap point.');
 if(maxDynamicContentSize!==undefined&&(!Number.isFinite(maxDynamicContentSize)||maxDynamicContentSize<=0))throw new Error('GestureSheet maxDynamicContentSize must be finite and greater than zero.');
 const detentCount=enableDynamicSizing?1:fixedSnapPoints.length;
 const sheet=useRef<BottomSheetModal>(null),inline=useRef<BottomSheet>(null),heading=useRef<RNText>(null),requested=useRef(false),focused=useRef(false),frame=useRef<number|null>(null);
 useImperativeHandle(modalRef,()=>sheet.current!);
 useImperativeHandle(sheetRef,()=>inline.current!);
 const dismissed=useRef(true);
 const startingIndex=Math.max(0,Math.min(initialIndex,detentCount-1));
 const activeIndex=useRef(startingIndex),detentFrame=useRef<number|null>(null),pendingSnap=useRef(false);
 const detentKey=JSON.stringify(fixedSnapPoints);
 const latest=useRef({open,onOpenChange,returnFocusRef,onDismiss,onHardwareBackPress});latest.current={open,onOpenChange,returnFocusRef,onDismiss,onHardwareBackPress};
 const env=useHIG(),colors=useColors(),insets=useSafeAreaInsets();
 const focus=useCallback((node:View|RNText|null)=>{if(!node)return;try{const handle=findNodeHandle(node);if(handle!==null){AccessibilityInfo.setAccessibilityFocus(handle);if(Platform.OS==='android')AccessibilityInfo.sendAccessibilityEvent(node,'viewHoverEnter');}}catch{/* Detached focus targets cannot prevent dismissal. */}},[]);
 const requestClose=useCallback(()=>{if(requested.current||!latest.current.open)return;requested.current=true;latest.current.onOpenChange(false);},[]);
 // Gorhom 5 marks a never-presented modal DISMISSING on dismiss() and then skips its portal render, so the sheet
 // never appeared on the iOS Simulator or Android emulator. Only dismiss what this component presented.
 const presented=useRef(false);
 useEffect(()=>{requested.current=false;focused.current=false;pendingSnap.current=false;if(open){dismissed.current=false;activeIndex.current=startingIndex;presented.current=true;if(presentation==='inline')inline.current?.snapToIndex(startingIndex);else sheet.current?.present();}else if(presented.current){presented.current=false;if(presentation==='inline')inline.current?.close();else sheet.current?.dismiss();}},[open,presentation]);
 useEffect(()=>{
  if(!open)return;
  if(enableDynamicSizing){activeIndex.current=0;pendingSnap.current=false;return;}
  // Gorhom reacts to changed detent positions itself. Removing the active detent also needs a valid index;
  // wait until the new geometry has reached the backend before requesting it.
  if(activeIndex.current>=fixedSnapPoints.length||pendingSnap.current){
   activeIndex.current=Math.min(activeIndex.current,fixedSnapPoints.length-1);
   pendingSnap.current=true;
   const index=activeIndex.current;
   detentFrame.current=requestAnimationFrame(()=>{detentFrame.current=null;pendingSnap.current=false;if(latest.current.open){activeIndex.current=index;(presentation==='inline'?inline.current:sheet.current)?.snapToIndex(index);}});
  }
  return()=>{if(detentFrame.current!==null){cancelAnimationFrame(detentFrame.current);detentFrame.current=null;}};
 },[open,detentKey,enableDynamicSizing,presentation]);
 useEffect(()=>{if(!open)return;const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{if(latest.current.onHardwareBackPress)return latest.current.onHardwareBackPress();if(dismissible)requestClose();return true;});return()=>subscription.remove();},[open,dismissible,requestClose]);
 useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);if(detentFrame.current!==null)cancelAnimationFrame(detentFrame.current);},[]);
 const backdrop=useCallback((props:BottomSheetBackdropProps)=><BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior={dismissible?'close':'none'}/>,[dismissible]);
 // BottomSheetView reports intrinsic layout to Gorhom's dynamic sizing. Fixed custom content
 // keeps a plain View so it does not replace the caller's nested scrollable registration.
 const CustomContent=enableDynamicSizing?BottomSheetView:View;
 const handleChange=useCallback<NonNullable<BottomSheetModalProps['onChange']>>((index,position,type)=>{if(index>=0){activeIndex.current=index;if(latest.current.open&&!focused.current){focused.current=true;focus(contentMode==='custom'?(titleRef?.current??heading.current):heading.current);}}else requestClose();onChange?.(index,position,type);},[contentMode,titleRef,focus,requestClose,onChange]);
 const handleSettledClose=useCallback(()=>{
  // An inline sheet initially mounts closed to prepare its children. That is not a dismissal.
  if(dismissed.current&&!latest.current.open)return;
  requestClose();if(frame.current!==null)cancelAnimationFrame(frame.current);
  frame.current=requestAnimationFrame(()=>{frame.current=null;if(latest.current.open){requested.current=false;if(presentation==='inline')inline.current?.snapToIndex(activeIndex.current);else{focused.current=false;sheet.current?.present();}}else if(!dismissed.current){dismissed.current=true;focus(latest.current.returnFocusRef?.current??null);latest.current.onDismiss?.();}});
 },[focus,presentation,requestClose]);
 const inlineAccessibility=presentation==='inline'?{accessibilityElementsHidden:!open,importantForAccessibility:open?'auto' as const:'no-hide-descendants' as const,pointerEvents:open?'auto' as const:'none' as const}:{};
 const content=contentMode==='custom'?<CustomContent {...inlineAccessibility} collapsable={false} style={{...(!enableDynamicSizing&&{flex:1,flexShrink:1,minHeight:0}),direction:env.direction}}>{!titleRef&&<Heading ref={heading} accessible accessibilityLabel={title} style={{position:'absolute',width:1,height:1,overflow:'hidden'}}>{title}</Heading>}{children}</CustomContent>:<BottomSheetScrollView {...inlineAccessibility} keyboardShouldPersistTaps='handled' contentContainerStyle={{padding:tokens.space.xl,paddingBottom:tokens.space.xl+(bottomInset??insets.bottom)}}><Stack><Heading ref={heading}>{title}</Heading>{description&&<Text>{description}</Text>}{children}<Button intent='secondary' onPress={requestClose}>{closeLabel??env.messages.close??en.close}</Button></Stack></BottomSheetScrollView>;
 // Expose individual children instead of grouping the sheet as one adjustable element. Inline
 // content keeps its native state while closed, with all descendants hidden from accessibility.
 const backendProps={accessible:false,accessibilityLabel:title,index:presentation==='inline'&&!open?-1:presented.current?Math.max(0,Math.min(activeIndex.current,detentCount-1)):startingIndex,snapPoints:enableDynamicSizing?undefined:[...fixedSnapPoints],enableDynamicSizing,maxDynamicContentSize:enableDynamicSizing?maxDynamicContentSize:undefined,enableContentPanningGesture,enablePanDownToClose:dismissible,topInset:topInset??insets.top,bottomInset:bottomInset??insets.bottom,keyboardBehavior,keyboardBlurBehavior,android_keyboardInputMode,overrideReduceMotion:env.reducedMotion?ReduceMotion.Always:ReduceMotion.System,animateOnMount,animationConfigs,backdropComponent:backdropComponent===undefined?backdrop:backdropComponent,handleComponent,handleStyle,backgroundComponent,containerStyle,backgroundStyle:backgroundStyle?[{backgroundColor:colors.surface,borderRadius:tokens.radius.xl},backgroundStyle]:{backgroundColor:colors.surface,borderRadius:tokens.radius.xl},handleIndicatorStyle:handleIndicatorStyle?[{backgroundColor:colors.muted},handleIndicatorStyle]:{backgroundColor:colors.muted},onChange:handleChange};
 return presentation==='inline'?<BottomSheet {...backendProps} ref={inline} accessibilityElementsHidden={!open} importantForAccessibility={open?'auto':'no-hide-descendants'} onClose={handleSettledClose}>{content}</BottomSheet>:<BottomSheetModal {...backendProps} ref={sheet} enableDismissOnClose stackBehavior='push' onDismiss={handleSettledClose}>{content}</BottomSheetModal>;
}
