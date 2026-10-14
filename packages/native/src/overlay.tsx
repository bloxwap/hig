import React,{useEffect,useRef} from 'react';
import {Modal,KeyboardAvoidingView,Platform,ScrollView,AccessibilityInfo,findNodeHandle,Text as RNText,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {nativeSrgb as colors} from '@bloxwap/hig-tokens';
import {Heading,Text,Stack} from './surface.js';
import {Button} from './button.js';
export interface DialogProps {open:boolean;onOpenChange:(open:boolean)=>void;title:string;description:string;children:React.ReactNode;initialFocusRef?:React.RefObject<View|null>;returnFocusRef?:React.RefObject<View|null>}
/** Native focus requests remain best effort; host supplies a live trigger ref for restoration. */
function focusNative(target:View|RNText|null){if(Platform.OS==='web'||!target)return;const handle=findNodeHandle(target);if(handle!==null)AccessibilityInfo.setAccessibilityFocus(handle);}
export function Dialog({open,onOpenChange,title,description,children,initialFocusRef,returnFocusRef}:DialogProps){const heading=useRef<RNText>(null);const previous=useRef(open);useEffect(()=>{const wasOpen=previous.current;previous.current=open;if(wasOpen&&!open){const frame=requestAnimationFrame(()=>focusNative(returnFocusRef?.current??null));return()=>cancelAnimationFrame(frame);}},[open,returnFocusRef]);return <Modal visible={open} transparent animationType='none' onShow={()=>focusNative(initialFocusRef?.current??heading.current)} onRequestClose={()=>onOpenChange(false)} accessibilityViewIsModal><SafeAreaView style={{flex:1,backgroundColor:'#000b',justifyContent:'center'}}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{maxHeight:'90%'}}><ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={{padding:24,backgroundColor:colors.surface,borderRadius:14}}><Stack><Heading ref={heading}>{title}</Heading><Text>{description}</Text>{children}<Button intent='secondary' onPress={()=>onOpenChange(false)}>Close</Button></Stack></ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;}
export const Sheet=Dialog;
export const AlertDialog=Dialog;
export function Menu({label,items}: {label:string;items:readonly {label:string;disabled?:boolean;onSelect:()=>void}[]}){const [open,setOpen]=React.useState(false);return <><Button intent='secondary' onPress={()=>setOpen(true)}>{label}</Button><Dialog open={open} onOpenChange={setOpen} title={label} description='Available actions'>{items.map((item,i)=><Button key={i} disabled={item.disabled} intent='secondary' onPress={()=>{item.onSelect();setOpen(false);}}>{item.label}</Button>)}</Dialog></>;}
/** Touch alternative to popover/hover tooltip: persistent help text. */
export function HelpText({children}:React.PropsWithChildren){return <Text>{children}</Text>;}
