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
 description:string;
 children:React.ReactNode;
 /** Sorted increasing detents; percentages resolve against current container geometry. */
 snapPoints:readonly (number|`${number}%`)[];
 initialIndex?:number;
 dismissible?:boolean;
 returnFocusRef?:React.RefObject<View|null>;
 /** Close button text and accessible name; defaults to HIGProvider `messages.close`. */
 closeLabel?:string;
}
/** Optional backend: host supplies GestureHandlerRootView, SafeAreaProvider and BottomSheetModalProvider. */
export function GestureSheet({open,onOpenChange,title,description,children,snapPoints,initialIndex=0,dismissible=true,returnFocusRef,closeLabel}:GestureSheetProps){
 const sheet=useRef<BottomSheetModal>(null),heading=useRef<RNText>(null),requested=useRef(false),focused=useRef(false),frame=useRef<number|null>(null);
 const latest=useRef({open,onOpenChange,returnFocusRef});latest.current={open,onOpenChange,returnFocusRef};
 const env=useHIG(),colors=useColors(),insets=useSafeAreaInsets();
 const focus=useCallback((node:View|RNText|null)=>{if(!node)return;try{const handle=findNodeHandle(node);if(handle!==null){AccessibilityInfo.setAccessibilityFocus(handle);if(Platform.OS==='android')AccessibilityInfo.sendAccessibilityEvent(node,'viewHoverEnter');}}catch{/* Detached focus targets cannot prevent dismissal. */}},[]);
 const requestClose=useCallback(()=>{if(requested.current||!latest.current.open)return;requested.current=true;latest.current.onOpenChange(false);},[]);
 // Gorhom 5 marks a never-presented modal DISMISSING on dismiss() and then skips its portal render, so the sheet
 // never appeared on the iOS Simulator or Android emulator. Only dismiss what this component presented.
 const presented=useRef(false);
 useEffect(()=>{requested.current=false;focused.current=false;if(open){presented.current=true;sheet.current?.present();}else if(presented.current){presented.current=false;sheet.current?.dismiss();}},[open]);
 useEffect(()=>{if(!open)return;const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{if(dismissible)requestClose();return true;});return()=>subscription.remove();},[open,dismissible,requestClose]);
 useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);},[]);
 const backdrop=useCallback((props:BottomSheetBackdropProps)=><BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior={dismissible?'close':'none'}/>,[dismissible]);
  // Gorhom defaults the sheet container to one accessible "Bottom Sheet" adjustable element, which on the iOS Simulator
 // hid the title, input and Close button inside it from XCUITest/VoiceOver; expose the children instead.
 return <BottomSheetModal ref={sheet} accessible={false} accessibilityLabel={title} index={initialIndex} snapPoints={[...snapPoints]} enableDynamicSizing={false} enableDismissOnClose stackBehavior='push' enablePanDownToClose={dismissible} topInset={insets.top} bottomInset={insets.bottom} keyboardBehavior='interactive' keyboardBlurBehavior='restore' android_keyboardInputMode='adjustResize' overrideReduceMotion={env.reducedMotion?ReduceMotion.Always:ReduceMotion.System} backdropComponent={backdrop} backgroundStyle={{backgroundColor:colors.surface,borderRadius:tokens.radius.xl}} handleIndicatorStyle={{backgroundColor:colors.muted}} onChange={index=>{if(index>=0){if(!focused.current){focused.current=true;focus(heading.current);}}else requestClose();}} onDismiss={()=>{requestClose();if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>{frame.current=null;if(latest.current.open){requested.current=false;focused.current=false;sheet.current?.present();}else focus(latest.current.returnFocusRef?.current??null);});}}><BottomSheetScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={{padding:tokens.space.xl,paddingBottom:tokens.space.xl+insets.bottom}}><Stack><Heading ref={heading}>{title}</Heading><Text>{description}</Text>{children}<Button intent='secondary' onPress={requestClose}>{closeLabel??env.messages.close??en.close}</Button></Stack></BottomSheetScrollView></BottomSheetModal>;
}
