import {assertUniqueKeys} from '@bloxwap/hig/contracts';
import React,{useState,useRef,useEffect,useMemo} from 'react';
import {FlatList,View,Text as RNText,useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as en from '@bloxwap/hig/contracts/messages';
import {useControllable,useColors,useMessageOverrides,useTextEnvironment} from './provider.js';
import {Button} from './button.js';
import {Dialog} from './overlay.js';
import {RadioGroup} from './radio-group.js';
import {RadioOption} from './radio-option.js';
import {Heading,Text} from './surface.js';
import {capsuleRadius} from './modal-radius.js';
import type {Choice,ChoicesProps} from './selection-types.js';

const keyFor=(option:Choice)=>option.value;
type LongSelectProps=ChoicesProps&{onValueChange:(value:string)=>void;setOpen:(open:boolean)=>void};
function LongSelectList({label,options,disabled,value,onValueChange,setOpen,title,muted}:LongSelectProps&{
 title:React.RefObject<React.ComponentRef<typeof RNText>|null>;muted:string;
}){
 const {locale}=useTextEnvironment(),messages=useMessageOverrides();
 const {height,fontScale}=useWindowDimensions();
 const listHeight=Math.max(48,height*.85);
 // Header spacing and top padding occupy 48dp before the first row. Each
 // description contributes another line beneath its label.
 const initialRows=useMemo(()=>{
  let filled=48,index=0;
  while(filled<listHeight&&index<options.length){
   filled+=options[index].description&&fontScale>=1?68:48;
   index++;
  }
  return Math.min(options.length,index+4);
 },[listHeight,options,fontScale]);
 return <FlatList data={options} keyExtractor={keyFor} style={{maxHeight:listHeight}} contentContainerStyle={{padding:24}}
   accessibilityLabel={label} accessibilityRole='radiogroup' keyboardShouldPersistTaps='handled'
   initialNumToRender={initialRows} maxToRenderPerBatch={4} windowSize={1+384/listHeight}
   ListHeaderComponent={<View style={{gap:12,marginBottom:12}}><Heading ref={title}>{label}</Heading><Text>{messages.chooseOne??en.chooseOne}</Text></View>}
   renderItem={({item})=><RadioOption option={item} checked={value===item.value} blocked={!!disabled||!!item.disabled} muted={muted} locale={locale} onSelect={onValueChange}/>}
   ListFooterComponent={<Button intent='secondary' suppressFeedback style={{marginTop:16}} onPress={()=>setOpen(false)}>{messages.close??en.close}</Button>}/>;
}

function LongSelect({open,trigger,...props}:LongSelectProps&{
 open:boolean;trigger:React.RefObject<React.ComponentRef<typeof View>|null>;
}){
 const colors=useColors(),title=useRef<React.ComponentRef<typeof RNText>>(null);
 return <Dialog open={open} onOpenChange={props.setOpen} title={props.label} contentMode='custom' stageComponent={SafeAreaView} titleRef={title} returnFocusRef={trigger}
  contentStyle={{maxHeight:'90%',backgroundColor:colors.overlay,borderRadius:24+capsuleRadius,overflow:'hidden'}}>
  {open&&<LongSelectList {...props} title={title} muted={colors.muted}/>}
 </Dialog>;
}

export function Select(props:ChoicesProps){
 const messages=useMessageOverrides();
 // Keep the dialog mounted after its first open so dismissal can restore focus.
 const [open,setOpen]=useState<boolean|null>(null);
 const trigger=useRef<React.ComponentRef<typeof View>>(null);
 const {choices,first}=useMemo(()=>{
  const choices=new Map<string,Choice>();
  let first:string|undefined;
  for(const option of props.options){
   const value=option.value;
   choices.set(value,option);
   if(first===undefined&&!option.disabled)first=value;
  }
  if(choices.size!==props.options.length)assertUniqueKeys(props.options,option=>option.value,'Select');
  return {choices,first:first??''};
 },[props.options]);
 const controlled=useRef(props.value!==undefined).current;
 const [stored,set]=useControllable(props.value,props.defaultValue??first,props.onValueChange);
 const storedOption=choices.get(stored);
 const current=storedOption&&!storedOption.disabled?stored:controlled?'':first;
 useEffect(()=>{if(!controlled&&stored!==current)set(current);},[controlled,stored,current]);
 const choose=(value:string)=>{if(value!==current){set(value);setOpen(false);}};
 return <View>
  <Button ref={trigger} disabled={props.disabled} intent='secondary' onPress={()=>setOpen(true)}>{props.label}: {choices.get(current)?.label??messages.choose??en.choose}</Button>
  {open===null?null:props.options.length>50?<LongSelect {...props} value={current} onValueChange={choose} open={open} setOpen={setOpen} trigger={trigger}/>:
   <Dialog title={props.label} description={messages.chooseOne??en.chooseOne} open={open} onOpenChange={setOpen} returnFocusRef={trigger}>
    <RadioGroup {...props} value={current} onValueChange={choose}/>
   </Dialog>}
 </View>;
}
