import React,{createContext,useContext,forwardRef,useId} from 'react';
import {TextInput,type TextInputProps,View} from 'react-native';
import {Text} from './surface.js';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from './provider.js';
const Context=createContext<{label:string;hint?:string;disabled?:boolean}>({label:''});
export function Field({label,description,error,required,disabled,children}:React.PropsWithChildren<{label:string;description?:string;error?:string;required?:boolean;disabled?:boolean}>){const id=useId();const {messages,colors}=useHIG();const marked=required?`${label} ${messages.required??en.required}`:label;return <Context.Provider value={{label:marked,hint:[description,error].filter(Boolean).join('. '),disabled}}><View style={{gap:8}}><Text nativeID={id}>{marked}</Text>{children}{description&&<Text>{description}</Text>}{error&&<Text accessibilityLiveRegion='polite' style={{color:colors.negative}}>{error}</Text>}</View></Context.Provider>;}
export const Label=Text;
export const Input=forwardRef<TextInput,TextInputProps>(function Input({style,...props},ref){const field=useContext(Context);const {colors}=useHIG();return <TextInput {...props} ref={ref} accessibilityLabel={props.accessibilityLabel??field.label} accessibilityHint={props.accessibilityHint??field.hint} accessibilityState={{...props.accessibilityState,disabled:!!field.disabled||!!props.accessibilityState?.disabled}} editable={field.disabled?false:props.editable} onChangeText={field.disabled?undefined:props.onChangeText} onChange={field.disabled?undefined:props.onChange} placeholderTextColor={colors.muted} style={[{color:colors.text,backgroundColor:colors.surface,minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:props.multiline?14:9999,paddingVertical:12,paddingHorizontal:20,fontSize:16},style]}/>;});
export const TextArea=forwardRef<TextInput,TextInputProps>(function TextArea(props,ref){return <Input {...props} ref={ref} multiline textAlignVertical='top'/>;});
export const AmountInput=forwardRef<TextInput,TextInputProps>(function AmountInput(props,ref){return <Input {...props} ref={ref} keyboardType={props.keyboardType??'decimal-pad'}/>;});
export const SearchInput=forwardRef<TextInput,TextInputProps>(function SearchInput(props,ref){return <Input {...props} ref={ref} returnKeyType={props.returnKeyType??'search'}/>;});
