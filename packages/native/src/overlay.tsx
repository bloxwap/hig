import React from 'react';
import {Modal,KeyboardAvoidingView,Platform,ScrollView,SafeAreaView} from 'react-native';
import {nativeColors as colors} from '@bloxwap/hig-tokens';
import {Heading,Text,Stack} from './surface.js';
import {Button} from './button.js';
export interface DialogProps {open:boolean;onOpenChange:(open:boolean)=>void;title:string;description:string;children:React.ReactNode}
/** Modal handles native back; host owns safe-area integration and post-close focus restoration. */
export function Dialog({open,onOpenChange,title,description,children}:DialogProps){return <Modal visible={open} transparent animationType='none' onRequestClose={()=>onOpenChange(false)} accessibilityViewIsModal><SafeAreaView style={{flex:1,backgroundColor:'#000b',justifyContent:'center'}}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{maxHeight:'90%'}}><ScrollView contentContainerStyle={{padding:24,backgroundColor:colors.android.surface,borderRadius:14}}><Stack><Heading>{title}</Heading><Text>{description}</Text>{children}<Button intent='secondary' onPress={()=>onOpenChange(false)}>Close</Button></Stack></ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;}
export const Sheet=Dialog;
export const AlertDialog=Dialog;
export function Menu({label,items}: {label:string;items:readonly {label:string;disabled?:boolean;onSelect:()=>void}[]}){const [open,setOpen]=React.useState(false);return <><Button intent='secondary' onPress={()=>setOpen(true)}>{label}</Button><Dialog open={open} onOpenChange={setOpen} title={label} description='Available actions'>{items.map((item,i)=><Button key={i} disabled={item.disabled} intent='secondary' onPress={()=>{item.onSelect();setOpen(false);}}>{item.label}</Button>)}</Dialog></>;}
/** Touch alternative to popover/hover tooltip: persistent help text. */
export function HelpText({children}:React.PropsWithChildren){return <Text>{children}</Text>;}
