import React,{useState,useRef} from 'react';
import {View} from 'react-native';
import * as en from '@bloxwap/hig-contracts/messages';
import {useControllable,useHIG} from './provider.js';
import {Button} from './button.js';
import {Dialog} from './overlay.js';
import {RadioGroup} from './radio-group.js';
import type {ChoicesProps} from './selection-types.js';
export function Select(props:ChoicesProps){const {messages}=useHIG();const [open,setOpen]=useState(false);const trigger=useRef<View>(null);const [current,set]=useControllable(props.value,props.defaultValue??'',props.onValueChange);return <View><Button ref={trigger} disabled={props.disabled} intent='secondary' onPress={()=>setOpen(true)}>{props.label}: {props.options.find(o=>o.value===current)?.label??messages.choose??en.choose}</Button><Dialog title={props.label} description={messages.chooseOne??en.chooseOne} open={open} onOpenChange={setOpen} returnFocusRef={trigger}><RadioGroup {...props} value={current} onValueChange={v=>{set(v);setOpen(false);}}/></Dialog></View>;}
