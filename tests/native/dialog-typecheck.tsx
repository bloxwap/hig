import React,{useRef} from 'react';
import {Text,View,ScrollView} from 'react-native';
import {Dialog} from '../../packages/native/src/overlay.js';
export function NativeCallerDialog(){const title=useRef<Text>(null),trigger=useRef<View>(null);return <Dialog open title='Review' contentMode='custom' onOpenChange={()=>{}} titleRef={title} returnFocusRef={trigger} stageComponent={View} stageStyle={{flex:1}} contentStyle={{maxHeight:'92%'}} testID='surface' animationType='fade'><ScrollView><Text ref={title} accessibilityRole='header'>Review</Text></ScrollView></Dialog>;}
// @ts-expect-error a custom dialog still needs its accessible name
const unnamed=<Dialog open contentMode='custom' onOpenChange={()=>{}}>Body</Dialog>;
// @ts-expect-error native modal animations are a closed public union
const invalidAnimation=<Dialog open title='Review' onOpenChange={()=>{}} animationType='zoom'>Body</Dialog>;
void unnamed;void invalidAnimation;
