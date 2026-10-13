import React,{createContext,useContext,forwardRef,useId} from 'react';
import {TextInput,type TextInputProps,View} from 'react-native';
import {nativeColors as colors} from '@bloxwap/hig-tokens';
import {Text} from './surface.js';
const Context=createContext<{label:string;hint?:string;disabled?:boolean}>({label:''});
export function Field({label,description,error,required,disabled,children}:React.PropsWithChildren<{label:string;description?:string;error?:string;required?:boolean;disabled?:boolean}>){const id=useId();return <Context.Provider value={{label:label+(required?' (required)':''),hint:[description,error].filter(Boolean).join('. '),disabled}}><View style={{gap:8}}><Text nativeID={id}>{label}{required?' (required)':''}</Text>{children}{description&&<Text>{description}</Text>}{error&&<Text accessibilityLiveRegion='polite' style={{color:colors.android.negative}}>{error}</Text>}</View></Context.Provider>;}
export const Label=Text;
export const Input=forwardRef<TextInput,TextInputProps>(function Input({style,...props},ref){const field=useContext(Context);return <TextInput {...props} ref={ref} accessibilityLabel={props.accessibilityLabel??field.label} accessibilityHint={props.accessibilityHint??field.hint} accessibilityState={{disabled:field.disabled,...props.accessibilityState}} editable={props.editable??!field.disabled} placeholderTextColor={colors.android.muted} style={[{color:colors.android.text,backgroundColor:colors.android.nested,minHeight:48,borderWidth:1,borderColor:colors.android.muted,borderRadius:10,padding:12,fontSize:16},style]}/>;});
export const TextArea=forwardRef<TextInput,TextInputProps>(function TextArea(props,ref){return <Input {...props} ref={ref} multiline textAlignVertical='top'/>;});
export const AmountInput=forwardRef<TextInput,TextInputProps>(function AmountInput(props,ref){return <Input {...props} ref={ref} keyboardType='decimal-pad'/>;});
export const SearchInput=forwardRef<TextInput,TextInputProps>(function SearchInput(props,ref){return <Input {...props} ref={ref} returnKeyType='search'/>;});
