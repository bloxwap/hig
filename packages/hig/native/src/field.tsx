import React,{createContext,useContext,forwardRef,useEffect,useId,useRef,useState} from 'react';
import {AccessibilityInfo,Platform,Pressable,TextInput,type TextInputProps,View} from 'react-native';
import {CloseIcon,SearchIcon} from './icons.js';
import {Text} from './surface.js';
import * as en from '@bloxwap/hig/contracts/messages';
import {useColors,useFills,useHIG} from './provider.js';
const Context=createContext<{label:string;hint?:string;disabled?:boolean;invalid?:boolean}>({label:''});
export interface FieldProps {label:string;description?:string;/** `positive` draws the description as a success line, such as a name that is available, and announces it when it changes. The words carry the meaning; the colour repeats it. */descriptionTone?:'muted'|'positive';error?:string;required?:boolean;disabled?:boolean}
export function Field({label,description,descriptionTone,error,required,disabled,children}:React.PropsWithChildren<FieldProps>){const id=useId();const {messages}=useHIG();const colors=useColors();const marked=required?`${label} ${messages.required??en.required}`:label;const positive=descriptionTone==='positive';
 // iOS has no live regions: a changed success line is spoken explicitly, as an Alert is. Android reads the live region.
 const spoken=useRef(description);useEffect(()=>{if(spoken.current===description)return;spoken.current=description;if(positive&&description&&Platform.OS==='ios'){try{AccessibilityInfo.announceForAccessibility(description);}catch{/* The visible line remains. */}}},[description,positive]);
 return <Context.Provider value={{label:marked,hint:[description,error].filter(Boolean).join('. '),disabled,invalid:!!error}}><View style={{gap:8}}><Text nativeID={id}>{marked}</Text>{children}{description&&<Text {...(positive?{accessibilityLiveRegion:'polite' as const}:{})} style={{color:positive?colors.positive:colors.muted}}>{description}</Text>}{error&&<Text accessibilityLiveRegion='polite' style={{color:colors.negative}}>{error}</Text>}</View></Context.Provider>;}
export const Label:typeof Text=Text;
/** No resting stroke: the fill separates the field (one step lighter inside a Surface, Dialog or sheet). The ring appears only for focus and for an invalid value. */
export const Input:React.ForwardRefExoticComponent<TextInputProps&React.RefAttributes<React.ComponentRef<typeof TextInput>>>=forwardRef<React.ComponentRef<typeof TextInput>,TextInputProps>(function Input({style,onFocus,onBlur,...props},ref){const field=useContext(Context);const colors=useColors();const fills=useFills();const env=useHIG();const [focused,setFocused]=useState(false);return <TextInput {...props} ref={ref} accessibilityLabel={props.accessibilityLabel??field.label} accessibilityHint={props.accessibilityHint??field.hint} accessibilityState={{...props.accessibilityState,disabled:!!field.disabled||!!props.accessibilityState?.disabled}} editable={field.disabled?false:props.editable} onChangeText={field.disabled?undefined:props.onChangeText} onChange={field.disabled?undefined:props.onChange} onFocus={event=>{setFocused(true);onFocus?.(event);}} onBlur={event=>{setFocused(false);onBlur?.(event);}} placeholderTextColor={props.placeholderTextColor??colors.muted} style={[{color:colors.text,backgroundColor:fills.well,minHeight:48,borderWidth:1.5,borderColor:field.invalid?colors.negative:focused?colors.faint:'transparent',borderRadius:props.multiline?14:9999,paddingVertical:12,paddingHorizontal:20,fontSize:16,fontFamily:env.fontFamilies?.[400]??env.fontFamily,opacity:field.disabled?0.5:1},style]}/>;});
export const TextArea:React.ForwardRefExoticComponent<TextInputProps&React.RefAttributes<React.ComponentRef<typeof TextInput>>>=forwardRef<React.ComponentRef<typeof TextInput>,TextInputProps>(function TextArea(props,ref){return <Input {...props} ref={ref} multiline textAlignVertical='top'/>;});
/** The magnifying glass sits inset on the leading edge and the text starts past it. */
/** A search box is as tall as a button, 44dp, not a 48dp form field. */
const searchSize={minHeight:44,paddingVertical:10};
export interface SearchInputProps extends TextInputProps {
 /** Host content on the trailing edge inside the field, such as a filter button. The text stops 48dp short of the edge; wider content sets the input's end padding through `style`. */
 trailing?:React.ReactNode;
 /** Shows a clear button (44dp, reaching 48dp through `hitSlop`) on the trailing edge while the controlled `value` is not empty. It calls this and returns focus to the field. */
 onClear?:()=>void;
 /** Accessible name of the clear button; defaults to HIGProvider `messages.clearSearch`. */
 clearLabel?:string;
}
export const SearchInput:React.ForwardRefExoticComponent<SearchInputProps&React.RefAttributes<React.ComponentRef<typeof TextInput>>>=forwardRef<React.ComponentRef<typeof TextInput>,SearchInputProps>(function SearchInput({style,trailing,onClear,clearLabel,...props},ref){const colors=useColors();const {direction,messages}=useHIG();const inner=useRef<React.ComponentRef<typeof TextInput>|null>(null);
 // RN Web resolves `start` through its own locale context rather than this View's direction.
 const rtl=direction==='rtl',web=Platform.OS==='web';const edge=web?(rtl?{right:18}:{left:18}):{start:18};const inset=web?(rtl?{paddingRight:46}:{paddingLeft:46}):{paddingStart:46};
 const extra=trailing!=null&&trailing!==false,reserve=extra||onClear!=null;
 const end=web?(rtl?{left:0}:{right:0}):{end:0};const endInset=reserve?(web?(rtl?{paddingLeft:48}:{paddingRight:48}):{paddingEnd:48}):null;
 const attach=(node:React.ComponentRef<typeof TextInput>|null)=>{inner.current=node;if(typeof ref==='function')ref(node);else if(ref)ref.current=node;};
 const clear=onClear&&props.value!=null&&props.value!==''?<Pressable testID={props.testID?`${props.testID}-clear`:undefined} accessibilityRole='button' accessibilityLabel={clearLabel??messages.clearSearch??en.clearSearch} disabled={props.editable===false} hitSlop={2} onPress={()=>{onClear();inner.current?.focus();}} style={({pressed})=>({width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',opacity:pressed?0.6:1})}><CloseIcon color={colors.muted}/></Pressable>:null;
 return <View style={{direction,justifyContent:'center'}}><Input {...props} ref={onClear?attach:ref} returnKeyType={props.returnKeyType??'search'} style={[searchSize,inset,endInset,style]}/><View pointerEvents='none' style={{position:'absolute',...edge}}><SearchIcon color={colors.muted}/></View>{extra||clear?<View style={{position:'absolute',top:0,bottom:0,...end,flexDirection:'row',alignItems:'center',gap:4}}>{trailing}{clear}</View>:null}</View>;});
