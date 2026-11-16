import React, {useRef} from 'react';
import {View, Text as NativeText, TextInput} from 'react-native';
import {Button, Link} from '@bloxwap/hig/native/button';
import {Text, Heading} from '@bloxwap/hig/native/surface';
import {Input, TextArea} from '@bloxwap/hig/native/field';
import {Dialog} from '@bloxwap/hig/native/overlay';
import {GestureSheet} from '@bloxwap/hig/native/gesture-sheet';
import {ListRow} from '@bloxwap/hig/native/list-group';
import {SwitchRow} from '@bloxwap/hig/native/switch';

// Compiled against independently installed tarballs and each supported RN minor.
// This catches declaration emit that accidentally freezes RN 0.81's class refs.
export function NativeConsumerRefs() {
  const trigger = useRef<React.ComponentRef<typeof View>>(null);
  const heading = useRef<React.ComponentRef<typeof NativeText>>(null);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  const incompatible = useRef<{unrelated: true}>(null);
  // @ts-expect-error Focus targets must be actual native host components.
  const invalid = <Dialog open title="Invalid" onOpenChange={() => {}} returnFocusRef={incompatible}>Content</Dialog>;
  void invalid;
  return <>
    <Button ref={trigger}>Open</Button>
    <Link href="/account" ref={trigger}>Account</Link>
    <Text ref={heading}>Text</Text>
    <Heading ref={heading}>Heading</Heading>
    <Input ref={input} />
    <TextArea ref={input} />
    <ListRow ref={trigger} label="Signals" android_disableSound onSelect={() => {}} />
    <SwitchRow ref={trigger} label="Live Mode"><Text>Live Mode</Text></SwitchRow>
    <Dialog open title="Account" onOpenChange={() => {}} initialFocusRef={input} titleRef={heading} returnFocusRef={trigger}><Text>Dialog</Text></Dialog>
    <GestureSheet presentation="modal" snapPoints={['50%']} open title="Account" onOpenChange={() => {}} titleRef={heading} returnFocusRef={trigger}><Text>Sheet</Text></GestureSheet>
  </>;
}
