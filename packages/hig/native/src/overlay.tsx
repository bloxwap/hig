import {BackdropBlur} from './backdrop-blur.js';
import type {GestureResponderEvent,ModalProps,StyleProp,ViewProps,ViewStyle} from 'react-native';
import * as en from '@bloxwap/hig/contracts/messages';
import {Raised,useColors,useHIG} from './provider.js';
import React,{useEffect,useRef,useId,useCallback} from 'react';
import {Modal,KeyboardAvoidingView,Platform,ScrollView,AccessibilityInfo,findNodeHandle,Text as RNText,TextInput,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Heading,Text,Stack} from './surface.js';
import {Button} from './button.js';
import {capsuleRadius} from './modal-radius.js';
export interface DialogProps {
 open:boolean;onOpenChange:(open:boolean)=>void;title:string;description?:string;children:React.ReactNode;
 initialFocusRef?:React.RefObject<React.ComponentRef<typeof View>|React.ComponentRef<typeof RNText>|React.ComponentRef<typeof TextInput>|null>;returnFocusRef?:React.RefObject<React.ComponentRef<typeof View>|React.ComponentRef<typeof RNText>|React.ComponentRef<typeof TextInput>|null>;
 /** Close button text and accessible name; defaults to HIGProvider `messages.close`. */closeLabel?:string;
 /** Custom content owns its visible heading, actions, padding and scrolling. The native Modal remains HIG-owned. */contentMode?:'default'|'custom';
 /** Accessible caller heading used when custom content renders the title. Otherwise HIG keeps a visually hidden title. */titleRef?:React.RefObject<React.ComponentRef<typeof View>|React.ComponentRef<typeof RNText>|React.ComponentRef<typeof TextInput>|null>;
 /** Custom-mode stage inside the Modal, for example GestureHandlerRootView on Android. */stageComponent?:React.ComponentType<ViewProps>;
 /** Layout inside the modal safe area, or on the custom stage. */stageStyle?:StyleProp<ViewStyle>;stageTestID?:string;
 /** Custom-mode backdrop, including the host's dismissal policy and decoration. */backdrop?:React.ReactNode;
 /** Align the standard modal surface with its inset 44dp capsule controls. Defaults to true. */
 concentric?:boolean;
 /** Accent label above the standard title. */accentEyebrow?:string;
 /** Size and placement of the standard scrollable dialog inside the safe area. */frameStyle?:StyleProp<ViewStyle>;
 /** Custom-mode surface layout; no implicit padding or scroll view is added. */contentStyle?:StyleProp<ViewStyle>;
 /** Identifies the actual modal content surface in either mode. */testID?:string;
 /** Native Modal animation. Reduced motion always selects `none`; the default stays `none`. */animationType?:ModalProps['animationType'];
}
/** The panel has no stroke: it uses the overlay fill, darker than a card, lifted by a soft shadow. Native focus requests remain best effort; host supplies a live trigger ref for restoration. */
/** Android TalkBack ignores the TYPE_VIEW_FOCUSED event behind setAccessibilityFocus in RN 0.81 Fabric (emulator: focus fell back to the first screen element); a hover-enter event moves its focus. */
function focusNative(target:React.ComponentRef<typeof View>|React.ComponentRef<typeof RNText>|React.ComponentRef<typeof TextInput>|null){if(Platform.OS==='web'||!target)return;const handle=findNodeHandle(target);if(handle==null)return;AccessibilityInfo.setAccessibilityFocus(handle);if(Platform.OS==='android')AccessibilityInfo.sendAccessibilityEvent(target,'viewHoverEnter');}
const dialogPadding=24;
/** React Native's iOS Modal defaults to portrait only; opening an overlay must not rotate a landscape host. */
const overlayOrientations:NonNullable<React.ComponentProps<typeof Modal>['supportedOrientations']>=['portrait','portrait-upside-down','landscape','landscape-left','landscape-right'];
export function Dialog({open,onOpenChange,title,description,children,initialFocusRef,returnFocusRef,closeLabel,contentMode='default',concentric=true,accentEyebrow,titleRef,stageComponent:Stage=View,stageStyle,stageTestID,backdrop,contentStyle,frameStyle,testID,animationType='none'}:DialogProps){
 const {messages,reducedMotion,direction}=useHIG();const colors=useColors();const heading=useRef<React.ComponentRef<typeof RNText>>(null);const previous=useRef(open);
 const latest=useRef({open,returnFocusRef});latest.current={open,returnFocusRef};
 const returnPending=useRef(false),frame=useRef<number|undefined>(undefined);
 const resolvedAnimation=reducedMotion?'none':animationType;
 const restoreFocus=useCallback(()=>{
  if(latest.current.open||!returnPending.current||frame.current!==undefined)return;
  frame.current=requestAnimationFrame(()=>{frame.current=undefined;if(!latest.current.open&&returnPending.current){returnPending.current=false;focusNative(latest.current.returnFocusRef?.current??null);}});
 },[]);
 useEffect(()=>{
  const wasOpen=previous.current;previous.current=open;
  if(frame.current!==undefined){cancelAnimationFrame(frame.current);frame.current=undefined;}
  if(open)returnPending.current=false;
  else{if(wasOpen)returnPending.current=true;if(Platform.OS!=='ios'||resolvedAnimation==='none')restoreFocus();}
 },[open,resolvedAnimation,restoreFocus]);
 useEffect(()=>()=>{if(frame.current!==undefined)cancelAnimationFrame(frame.current);returnPending.current=false;},[]);
 return <Modal visible={open} transparent animationType={resolvedAnimation} supportedOrientations={overlayOrientations}
  onShow={()=>{if(latest.current.open)focusNative(initialFocusRef?.current??(contentMode==='custom'?titleRef?.current:null)??heading.current);}}
  onDismiss={restoreFocus} onRequestClose={()=>onOpenChange(false)} accessibilityViewIsModal>
  {open&&(contentMode!=='custom'||backdrop===undefined)&&<BackdropBlur/>}
  {contentMode==='custom'?<Stage style={[{flex:1,backgroundColor:'#000b',justifyContent:'center',direction,paddingHorizontal:8},stageStyle]} testID={stageTestID}>
   {backdrop}
   <View accessible={false} accessibilityLabel={title} accessibilityViewIsModal onAccessibilityEscape={()=>onOpenChange(false)} collapsable={false} style={[{direction},contentStyle]} testID={testID}>
    {!titleRef&&<Heading ref={heading} accessible accessibilityLabel={title} style={{position:'absolute',width:1,height:1,overflow:'hidden'}}>{title}</Heading>}
    <Raised>{children}</Raised>
   </View>
  </Stage>:<SafeAreaView style={[{flex:1,backgroundColor:'#000b',justifyContent:'center',paddingHorizontal:8},stageStyle]}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={[{maxHeight:'90%'},frameStyle]}><ScrollView testID={testID} keyboardShouldPersistTaps='handled' contentContainerStyle={{padding:dialogPadding,backgroundColor:colors.overlay,borderRadius:concentric?dialogPadding+capsuleRadius:14,boxShadow:'0 16px 48px #0008'}}><Raised><Stack>{accentEyebrow&&<Text style={{color:colors.action,fontSize:11,lineHeight:16,fontWeight:"800",letterSpacing:1.1,textTransform:"uppercase"}}>{accentEyebrow}</Text>}<Heading ref={heading}>{title}</Heading>{description!==undefined&&<Text>{description}</Text>}{children}{/* The closing action sits a double step, 16dp, below the content (the Stack gap is 12). */}<Button intent='secondary' suppressFeedback style={{marginTop:4}} onPress={()=>onOpenChange(false)}>{closeLabel??messages.close??en.close}</Button></Stack></Raised></ScrollView></KeyboardAvoidingView></SafeAreaView>}
 </Modal>;
}
export const Sheet=Dialog;
export const AlertDialog=Dialog;
export function Menu({label,items,closeLabel}: {label:string;items:readonly {label:string;disabled?:boolean;onSelect:(event:GestureResponderEvent)=>void}[];/** Close button text and accessible name; defaults to HIGProvider `messages.close`. */closeLabel?:string}){const [open,setOpen]=React.useState(false);const {feedback,messages}=useHIG();const id=useId();const sequence=useRef(0);const trigger=useRef<React.ComponentRef<typeof View>>(null);return <><Button ref={trigger} intent='secondary' suppressFeedback onPress={()=>setOpen(true)}>{label}</Button><Dialog open={open} onOpenChange={setOpen} title={label} description={messages.menuDescription??en.menuDescription} closeLabel={closeLabel} returnFocusRef={trigger}>{items.map((item,i)=><Button key={i} disabled={item.disabled} suppressFeedback intent='secondary' onPress={event=>{if(item.disabled)return;item.onSelect(event);if(event.isDefaultPrevented())return;setOpen(false);try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent:'selection',origin:'native'});}catch{/* Optional feedback cannot alter the action. */}}}>{item.label}</Button>)}</Dialog></>;}
/** Touch alternative to popover/hover tooltip: persistent help text. */
export function HelpText({children}:React.PropsWithChildren){return <Text>{children}</Text>;}
