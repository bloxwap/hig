import React from 'react';
import type BottomSheet from '@gorhom/bottom-sheet';
import {GestureSheet,type GestureSheetProps} from '../../packages/native/src/gesture-sheet.js';

const common={open:true,onOpenChange:()=>{},title:'Size and leverage',children:null};
const fixed:GestureSheetProps={...common,snapPoints:['50%']};
const content:GestureSheetProps={...common,enableDynamicSizing:true,maxDynamicContentSize:480};
void <GestureSheet {...fixed}/>;
void <GestureSheet {...content} enableContentPanningGesture={false} keyboardBlurBehavior='none' android_keyboardInputMode='adjustPan'/>;
void <GestureSheet {...common} snapPoints={['50%']} presentation='inline' sheetRef={React.createRef<BottomSheet>()}/>;
// @ts-expect-error Inline has the actual persistent sheet ref, without modal present/dismiss methods.
void <GestureSheet {...common} snapPoints={['50%']} presentation='inline' modalRef={React.createRef()}/>;
// @ts-expect-error Modal callers use modalRef.
void <GestureSheet {...common} snapPoints={['50%']} sheetRef={React.createRef<BottomSheet>()}/>;
// @ts-expect-error Content sizing must not add a competing fixed detent.
void <GestureSheet {...common} enableDynamicSizing snapPoints={['50%']}/>;
// @ts-expect-error The fixed default continues to require a snap point list.
void <GestureSheet {...common}/>;
