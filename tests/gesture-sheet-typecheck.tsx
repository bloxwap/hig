import React from 'react';
import {GestureSheet,type GestureSheetBackendProps,type GestureSheetDynamicBackendProps,type GestureSheetContentProps} from '../packages/hig/react/src/gesture-sheet';
const change=(open:boolean)=>{void open;};
const backend:GestureSheetBackendProps={snapPoints:[0.4,0.9],fadeFromIndex:1,activeSnapPoint:0.4,setActiveSnapPoint:()=>{},snapToSequentialPoint:true,handleOnly:false,repositionInputs:false,shouldScaleBackground:true,dismissible:false,autoFocus:false};
const dynamicBackend:GestureSheetDynamicBackendProps={direction:'bottom',handleOnly:false,repositionInputs:true,shouldScaleBackground:true,dismissible:false,autoFocus:false};
const content:GestureSheetContentProps={'data-host-card':'markets',className:'host-card',style:{bottom:12,maxHeight:'80dvh'},onOpenAutoFocus:event=>event.preventDefault(),onEscapeKeyDown:event=>event.preventDefault()};
<GestureSheet open onOpenChange={change} title='Markets' backendProps={backend} contentProps={content} contentRef={React.createRef<HTMLDivElement>()} contentMode='custom' handleProps={{style:{width:100},preventCycle:true}}><h2>Markets</h2></GestureSheet>;
<GestureSheet open onOpenChange={change} title='Markets' enableDynamicSizing maxDynamicContentSize={480} backendProps={dynamicBackend}><p>Content-sized markets</p></GestureSheet>;
<GestureSheet open onOpenChange={change} title='Markets' enableDynamicSizing backendProps={{direction:'right'}}><p>Fixed-width side sheet</p></GestureSheet>;
// @ts-expect-error HIG owns controlled open and the modal root.
const unsafeRoot:GestureSheetBackendProps={modal:false};
// @ts-expect-error HIG owns the generated id and accessible associations.
const unsafeContent:GestureSheetContentProps={id:'foreign'};
// @ts-expect-error A fade index requires explicit snap points in the backend union.
const missingPoints:GestureSheetBackendProps={fadeFromIndex:1};
// @ts-expect-error Dynamic content sizing excludes Vaul snap points.
<GestureSheet open onOpenChange={change} title='Markets' enableDynamicSizing backendProps={{snapPoints:[0.4,0.9]}}><p>Details</p></GestureSheet>;
// @ts-expect-error Dynamic content sizing excludes the active detent.
<GestureSheet open onOpenChange={change} title='Markets' enableDynamicSizing backendProps={{activeSnapPoint:0.4}}><p>Details</p></GestureSheet>;
// @ts-expect-error Dynamic content sizing excludes detent change callbacks.
<GestureSheet open onOpenChange={change} title='Markets' enableDynamicSizing backendProps={{setActiveSnapPoint:()=>{}}}><p>Details</p></GestureSheet>;
// @ts-expect-error Dynamic content sizing excludes detent overlay fading.
<GestureSheet open onOpenChange={change} title='Markets' enableDynamicSizing backendProps={{fadeFromIndex:1}}><p>Details</p></GestureSheet>;
// @ts-expect-error Dynamic content sizing excludes sequential detent gestures.
<GestureSheet open onOpenChange={change} title='Markets' enableDynamicSizing backendProps={{snapToSequentialPoint:true}}><p>Details</p></GestureSheet>;
// @ts-expect-error A fixed-mode backend remains incompatible when dynamic sizing is enabled.
<GestureSheet open onOpenChange={change} title='Markets' enableDynamicSizing backendProps={backend}><p>Details</p></GestureSheet>;
// @ts-expect-error The dynamic ceiling is a number of CSS pixels.
<GestureSheet open onOpenChange={change} title='Markets' enableDynamicSizing maxDynamicContentSize='80dvh'><p>Details</p></GestureSheet>;
// @ts-expect-error Fixed snap sizing does not accept a dynamic-only ceiling.
<GestureSheet open onOpenChange={change} title='Markets' backendProps={backend} maxDynamicContentSize={480}><p>Details</p></GestureSheet>;
void [unsafeRoot,unsafeContent,missingPoints];
