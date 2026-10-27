import React,{useRef} from 'react';
import {Text,TextInput,View,ScrollView} from 'react-native';
import {Dialog} from '../../packages/native/src/overlay.js';
import {Input} from '../../packages/native/src/field.js';
export function NativeCallerDialog(){const title=useRef<React.ComponentRef<typeof Text>>(null),trigger=useRef<React.ComponentRef<typeof View>>(null),input=useRef<React.ComponentRef<typeof TextInput>>(null);return <Dialog open title='Review' contentMode='custom' onOpenChange={()=>{}} initialFocusRef={input} titleRef={title} returnFocusRef={trigger} stageComponent={View} stageStyle={{flex:1}} contentStyle={{maxHeight:'92%'}} testID='surface' animationType='fade'><ScrollView><Text ref={title} accessibilityRole='header'>Review</Text><Input ref={input} accessibilityLabel='Review note'/></ScrollView></Dialog>;}
// @ts-expect-error a custom dialog still needs its accessible name
const unnamed=<Dialog open contentMode='custom' onOpenChange={()=>{}}>Body</Dialog>;
// @ts-expect-error native modal animations are a closed public union
const invalidAnimation=<Dialog open title='Review' onOpenChange={()=>{}} animationType='zoom'>Body</Dialog>;
void unnamed;void invalidAnimation;
