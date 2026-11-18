import React from 'react';
import {Text,View} from 'react-native';
import {GestureSheet,type GestureSheetProps} from '../../packages/hig/native/src/gesture-sheet.js';

const common={open:true,onOpenChange:()=>{},title:'Size and leverage',children:null};
const fixed:GestureSheetProps={...common,snapPoints:['50%']};
const content:GestureSheetProps={...common,enableDynamicSizing:true,maxDynamicContentSize:480};
const title=React.createRef<React.ComponentRef<typeof Text>>(),trigger=React.createRef<React.ComponentRef<typeof View>>();
void <GestureSheet {...fixed}/>;
void <GestureSheet {...fixed} contentMode='custom' titleRef={title} returnFocusRef={trigger}/>;
void <GestureSheet {...fixed} initialIndex={0}/>;
void <GestureSheet {...fixed} presentation='inline'/>;
void <GestureSheet {...content}/>;
// @ts-expect-error HIG's own sheet has no backend to configure: the bottom sheet library's props went with it.
void <GestureSheet {...fixed} animationConfigs={{duration:250}}/>;
// @ts-expect-error No backend ref either; the sheet is driven by `open`.
void <GestureSheet {...fixed} modalRef={React.createRef()}/>;
// @ts-expect-error Content sizing must not add a competing fixed detent.
void <GestureSheet {...common} enableDynamicSizing snapPoints={['50%']}/>;
// @ts-expect-error The fixed default continues to require a snap point list.
void <GestureSheet {...common}/>;
// @ts-expect-error A dynamic content ceiling has no meaning for fixed detents.
void <GestureSheet {...common} snapPoints={['50%']} maxDynamicContentSize={480}/>;
// @ts-expect-error Content sizing has one measured detent, without a fixed initial index.
void <GestureSheet {...common} enableDynamicSizing initialIndex={1}/>;
