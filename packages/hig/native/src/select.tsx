import {assertUniqueKeys} from '@bloxwap/hig/contracts';
import React,{useState,useRef,useEffect} from 'react';
import {View} from 'react-native';
import * as en from '@bloxwap/hig/contracts/messages';
import {useControllable,useHIG} from './provider.js';
import {Button} from './button.js';
import {Dialog} from './overlay.js';
import {RadioGroup} from './radio-group.js';
import type {ChoicesProps} from './selection-types.js';
export function Select(props:ChoicesProps){const {messages}=useHIG();const [open,setOpen]=useState(false);const trigger=useRef<React.ComponentRef<typeof View>>(null);assertUniqueKeys(props.options,o=>o.value,'Select');const controlled=useRef(props.value!==undefined).current;const [stored,set]=useControllable(props.value,props.defaultValue??props.options.find(o=>!o.disabled)?.value??'',props.onValueChange);const current=props.options.some(o=>o.value===stored&&!o.disabled)?stored:controlled?'':props.options.find(o=>!o.disabled)?.value??'';useEffect(()=>{if(!controlled&&stored!==current)set(current);},[controlled,stored,current]);return <View><Button ref={trigger} disabled={props.disabled} intent='secondary' onPress={()=>setOpen(true)}>{props.label}: {props.options.find(o=>o.value===current)?.label??messages.choose??en.choose}</Button><Dialog title={props.label} description={messages.chooseOne??en.chooseOne} open={open} onOpenChange={setOpen} returnFocusRef={trigger}><RadioGroup {...props} value={current} onValueChange={v=>{set(v);setOpen(false);}}/></Dialog></View>;}
